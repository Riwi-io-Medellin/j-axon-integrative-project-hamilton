import HashUtil from '../utils/hash.js';
import { ALLOWED_ROLES_SET } from '../config/roles.js';
import AuditLogService from './auditLog.service.js';
import PasswordResetModel from '../models/passwordReset.js';
import NotificationService from './notification.service.js';
import crypto from 'crypto';

// Auth service: domain rules for login and registration.
class AuthService {
    constructor(userModel, auditLogService = new AuditLogService(), passwordResetModel = new PasswordResetModel(), notificationService = new NotificationService()) {
        this.userModel = userModel;
        this.auditLogService = auditLogService;
        this.passwordResetModel = passwordResetModel;
        this.notificationService = notificationService;
    }

    // Validate credentials and return normalized user payload.
    // Logs success/failure events to audit trail.
    async login(email, password, auditContext) {
        try {
            const user = await this.userModel.findByEmail(email);
            if (!user) {
                throw new Error('Credenciales inválidas');
            }
            if (user.activo === false) {
                throw { status: 403, message: 'Usuario inactivo' };
            }
            if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) {
                throw { status: 403, message: 'Usuario bloqueado temporalmente' };
            }

            const ok = await HashUtil.comparePassword(password, user.password_hash);
            if (!ok) {
                await this.userModel.registerLoginFailure(user.id_usuario, 5, 15);
                throw { status: 401, message: 'Credenciales inválidas' };
            }

            await this.userModel.registerLoginSuccess(user.id_usuario);

            this.auditLogService.safeLog(
                this.auditLogService.buildDomainEntry({
                    actor: { id: user.id_usuario, role: user.rol, email: user.email },
                    context: auditContext,
                    entidad: 'AUTH',
                    entidad_id: user.id_usuario,
                    accion: 'AUTH_LOGIN_SUCCESS',
                    metadata: { email: user.email }
                })
            );

            return {
                id: user.id_usuario,
                nombre: user.nombre,
                email: user.email,
                role: user.rol
            };
        } catch (error) {
            this.auditLogService.safeLog(
                this.auditLogService.buildDomainEntry({
                    actor: null,
                    context: auditContext,
                    entidad: 'AUTH',
                    entidad_id: null,
                    accion: 'AUTH_LOGIN_FAIL',
                    status: 'ERROR',
                    error,
                    metadata: { email }
                })
            );
            throw error;
        }
    }

    // Request password reset token and send email.
    async requestPasswordReset(email, auditContext) {
        const user = await this.userModel.findByEmail(email);
        if (!user) {
            return { message: 'Si el usuario existe, se enviará un correo de recuperación' };
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

        await this.passwordResetModel.create({
            id_usuario: user.id_usuario,
            token_hash: tokenHash,
            expires_at: expiresAt
        });

        await this.notificationService.enqueueEmail({
            tipo: 'PASSWORD_RESET',
            destinatario: user.email,
            asunto: 'Recuperación de contraseña',
            cuerpo: `Usa este token para restablecer tu contraseña: ${rawToken}`
        });

        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor: { id: user.id_usuario, role: user.rol, email: user.email },
                context: auditContext,
                entidad: 'AUTH',
                entidad_id: user.id_usuario,
                accion: 'AUTH_PASSWORD_RESET_REQUEST'
            })
        );

        return { message: 'Si el usuario existe, se enviará un correo de recuperación' };
    }

    // Reset password using a valid token.
    async resetPassword(token, newPassword, auditContext) {
        if (!token) throw { status: 400, message: 'token es requerido' };
        if (!newPassword) throw { status: 400, message: 'password es requerido' };

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const reset = await this.passwordResetModel.findValidByTokenHash(tokenHash);
        if (!reset) throw { status: 400, message: 'Token inválido o expirado' };

        const passwordHash = await HashUtil.hashPassword(newPassword);
        const updated = await this.userModel.updatePassword(reset.id_usuario, passwordHash);
        await this.userModel.registerLoginSuccess(reset.id_usuario);
        await this.passwordResetModel.markUsed(reset.id_reset);

        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor: { id: reset.id_usuario },
                context: auditContext,
                entidad: 'AUTH',
                entidad_id: reset.id_usuario,
                accion: 'AUTH_PASSWORD_RESET'
            })
        );

        return updated;
    }

    // Register user; only a Manager can assign privileged roles.
    // Logs user creation and role assignment events.
    async register({ nombre, email, password, rol }, actor, auditContext) {
        const isGerente = actor?.role === 'Gerente';
        const desiredRole = rol || 'Usuario';

        const finalRole = isGerente ? desiredRole : 'Usuario';

        if (!ALLOWED_ROLES_SET.has(finalRole)) {
            throw { status: 400, message: `rol inválido: ${finalRole}` };
        }
        const passwordHash = await HashUtil.hashPassword(password);
        const created = await this.userModel.create({
            nombre,
            email,
            passwordHash,
            rol: finalRole
        });

        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor: actor || { id: created.id_usuario, role: created.rol, email: created.email },
                context: auditContext,
                entidad: 'USUARIO',
                entidad_id: created.id_usuario,
                accion: 'USUARIO_CREATE',
                payload_after: created,
                metadata: { creado_por: actor?.id ?? null }
            })
        );

        if (finalRole !== 'Usuario') {
            this.auditLogService.safeLog(
                this.auditLogService.buildDomainEntry({
                    actor: actor || { id: created.id_usuario, role: created.rol, email: created.email },
                    context: auditContext,
                    entidad: 'AUTH',
                    entidad_id: created.id_usuario,
                    accion: 'SECURITY_ROLE_ASSIGN',
                    metadata: { rol_asignado: finalRole, creado_por: actor?.id ?? null }
                })
            );
        }

        return {
            id: created.id_usuario,
            nombre: created.nombre,
            email: created.email,
            role: created.rol,
            fecha_creacion: created.fecha_creacion
        };
    }
}

export default AuthService;
