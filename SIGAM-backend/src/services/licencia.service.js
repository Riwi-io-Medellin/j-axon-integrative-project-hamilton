import AuditLogService from './auditLog.service.js';
import NotificationService from './notification.service.js';
import AlertaModel from '../models/alerta.js';

// Service layer for software licenses and assignments.
class LicenciaService {
    constructor(model, auditLogService = new AuditLogService(), notificationService = new NotificationService(), alertaModel = new AlertaModel()) {
        this.model = model;
        this.auditLogService = auditLogService;
        this.notificationService = notificationService;
        this.alertaModel = alertaModel;
    }
    // List all licenses.
    findAll() { return this.model.findAll(); }
    // Fetch a license by id and validate existence.
    async findById(id) {
        const r = await this.model.findById(id);
        if (!r) throw { status: 404, message: `Licencia ${id} no encontrada` };
        return r;
    }
    // Create a license and emit audit log entry.
    async create(payload, actor, auditContext) {
        if (!payload.clave_producto) throw { status: 400, message: 'clave_producto es requerido' };
        const created = await this.model.create(payload);
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'LICENCIA',
                entidad_id: created?.id_licencia,
                accion: 'LICENCIA_CREATE',
                payload_after: created
            })
        );
        return created;
    }
    // Update a license and log before/after states.
    async update(id, payload, actor, auditContext) {
        const before = await this.model.findById(id);
        const r = await this.model.update(id, payload);
        if (!r) throw { status: 404, message: `Licencia ${id} no encontrada` };
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'LICENCIA',
                entidad_id: id,
                accion: 'LICENCIA_UPDATE',
                payload_before: before,
                payload_after: r
            })
        );
        return r;
    }
    // Remove a license record and log deletion.
    async remove(id, actor, auditContext) {
        const before = await this.model.findById(id);
        const r = await this.model.remove(id);
        if (!r) throw { status: 404, message: `Licencia ${id} no encontrada` };
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'LICENCIA',
                entidad_id: id,
                accion: 'LICENCIA_DELETE',
                payload_before: before,
                payload_after: r
            })
        );
        return r;
    }
    // Assign a license to a user or asset and log the assignment.
    async asignar(payload, actor, auditContext) {
        const dup = await this.model.hasAssignment(payload);
        if (dup) throw { status: 409, message: 'La licencia ya está asignada al mismo destino' };
        const assigned = await this.model.asignar(payload);
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'LICENCIA',
                entidad_id: payload?.id_licencia,
                accion: 'LICENCIA_ASSIGN',
                payload_after: assigned,
                metadata: {
                    id_usuario: payload?.id_usuario ?? null,
                    id_activo: payload?.id_activo ?? null
                }
            })
        );
        return assigned;
    }
    // List assignments for a license.
    getAsignaciones(id) { return this.model.getAsignaciones(id); }
    // List license assignments for a specific asset.
    findByActivo(id_activo) { return this.model.findByActivo(id_activo); }
    // Revoke a license assignment and log the change.
    async revocarAsignacion(id, actor, auditContext) {
        const r = await this.model.revocarAsignacion(id);
        if (!r) throw { status: 404, message: `Asignación ${id} no encontrada` };
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'LICENCIA',
                entidad_id: id,
                accion: 'LICENCIA_REVOKE',
                payload_after: r
            })
        );
        return r;
    }

    // Alert and notify expiring licenses.
    async generarAlertasVencimiento({ dias = 30 } = {}) {
        const expiring = await this.model.findExpiring(dias);
        for (const lic of expiring) {
            await this.alertaModel.ensurePendingByTipoAndLicencia('Licencia próxima a vencer', lic.id_licencia);
        }
        // Email notification to admins (if configured)
        const adminEmail = process.env.NOTIFY_ADMIN_EMAIL;
        if (adminEmail && expiring.length) {
            await this.notificationService.enqueueEmail({
                tipo: 'LICENCIAS_VENCIMIENTO',
                destinatario: adminEmail,
                asunto: 'Licencias próximas a vencer',
                cuerpo: `Licencias próximas a vencer: ${expiring.map((l) => l.id_licencia).join(', ')}`
            });
        }
        return expiring;
    }
}
export default LicenciaService;
