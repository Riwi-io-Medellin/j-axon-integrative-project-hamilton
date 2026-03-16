import AuditLogService from './auditLog.service.js';

class UbicacionService {
    constructor(model, auditLogService = new AuditLogService()) {
        this.model = model;
        this.auditLogService = auditLogService;
    }
    findAll() { return this.model.findAll(); }
    async findById(id) {
        const r = await this.model.findById(id);
        if (!r) throw { status: 404, message: `Ubicacion ${id} no encontrada` };
        return r;
    }
    async create(payload, actor, auditContext) {
        if (!payload.sede) throw { status: 400, message: 'sede es requerido' };
        const created = await this.model.create(payload);
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'UBICACION',
                entidad_id: created?.id_ubicacion,
                accion: 'UBICACION_CREATE',
                payload_after: created
            })
        );
        return created;
    }
    async update(id, payload, actor, auditContext) {
        const before = await this.model.findById(id);
        const r = await this.model.update(id, payload);
        if (!r) throw { status: 404, message: `Ubicacion ${id} no encontrada` };
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'UBICACION',
                entidad_id: id,
                accion: 'UBICACION_UPDATE',
                payload_before: before,
                payload_after: r
            })
        );
        return r;
    }
    async remove(id, actor, auditContext) {
        const before = await this.model.findById(id);
        const r = await this.model.remove(id);
        if (!r) throw { status: 404, message: `Ubicacion ${id} no encontrada` };
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'UBICACION',
                entidad_id: id,
                accion: 'UBICACION_DELETE',
                payload_before: before,
                payload_after: r
            })
        );
        return r;
    }
}
export default UbicacionService;
