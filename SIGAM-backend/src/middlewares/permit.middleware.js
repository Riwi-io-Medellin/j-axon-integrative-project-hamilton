import { PERMISSIONS, isRoleAllowed } from '../config/permissions.js';
import AuditLogService from '../services/auditLog.service.js';
import buildAuditContext from '../utils/auditContext.js';

// Authorization middleware based on centralized permissions.
const permit = (resource, action, auditLogService = new AuditLogService()) => {
    return (req, res, next) => {
        try {
            // Validate that the permission matrix includes this resource/action.
            const allowed = PERMISSIONS?.[resource]?.[action];
            if (!allowed) {
                throw { status: 500, message: `Permisos no configurados: ${resource}.${action}` };
            }

            // Enforce role-based access and log denials.
            const role = req.user?.role;
            if (!role || !isRoleAllowed(role, allowed)) {
                auditLogService.safeLog(
                    auditLogService.buildDomainEntry({
                        actor: req.user,
                        context: buildAuditContext(req),
                        entidad: 'AUTH',
                        accion: 'SECURITY_ACCESS_DENIED',
                        status: 'ERROR',
                        metadata: { resource, action, role: role ?? null }
                    })
                );
                return res.status(403).json({ message: 'Acceso denegado: No tienes el rol necesario' });
            }

            // Continue when permission is granted.
            next();
        } catch (e) {
            next(e);
        }
    };
};

export default permit;
