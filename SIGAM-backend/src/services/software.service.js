import AuditLogService from './auditLog.service.js';

// Service layer for the software catalog.
class SoftwareService {
    constructor(model, auditLogService = new AuditLogService()) {
        this.model = model;
        this.auditLogService = auditLogService;
    }

    // List software entries.
    findAll() { return this.model.findAll(); }

    // Fetch software by id and validate existence.
    async findById(id) {
        const s = await this.model.findById(id);
        if (!s) throw { status: 404, message: `Software ${id} no encontrado` };
        return s;
    }

    // Create a software entry and log creation.
    create(payload, actor, auditContext) {
        if (!payload.nombre) throw { status: 400, message: 'nombre es requerido' };
        return this.model.create(payload).then((created) => {
            this.auditLogService.safeLog(
                this.auditLogService.buildDomainEntry({
                    actor,
                    context: auditContext,
                    entidad: 'SOFTWARE',
                    entidad_id: created?.id_software,
                    accion: 'SOFTWARE_CREATE',
                    payload_after: created
                })
            );
            return created;
        });
    }

    // Update a software entry and log before/after states.
    async update(id, payload, actor, auditContext) {
        const before = await this.model.findById(id);
        const s = await this.model.update(id, payload);
        if (!s) throw { status: 404, message: `Software ${id} no encontrado` };
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'SOFTWARE',
                entidad_id: id,
                accion: 'SOFTWARE_UPDATE',
                payload_before: before,
                payload_after: s
            })
        );
        return s;
    }

    // Remove a software entry and log deletion.
    async remove(id, actor, auditContext) {
        const before = await this.model.findById(id);
        const s = await this.model.remove(id);
        if (!s) throw { status: 404, message: `Software ${id} no encontrado` };
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'SOFTWARE',
                entidad_id: id,
                accion: 'SOFTWARE_DELETE',
                payload_before: before,
                payload_after: s
            })
        );
        return s;
    }

    async assignToAsset(payload, actor, auditContext) {
        if (!payload?.id_software || !payload?.id_activo) {
            throw { status: 400, message: 'id_software e id_activo son requeridos' };
        }
        const created = await this.model.assignToAsset(payload);
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'SOFTWARE',
                entidad_id: payload.id_software,
                accion: 'SOFTWARE_ASSIGN',
                payload_after: created,
                metadata: { id_activo: payload.id_activo }
            })
        );
        return created;
    }

    listByActivo(id_activo) {
        return this.model.listByActivo(id_activo);
    }

    async removeFromAsset(id_software, id_activo, actor, auditContext) {
        const removed = await this.model.removeFromAsset(id_software, id_activo);
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'SOFTWARE',
                entidad_id: id_software,
                accion: 'SOFTWARE_UNASSIGN',
                payload_after: removed,
                metadata: { id_activo }
            })
        );
        return removed;
    }
}

export default SoftwareService;
