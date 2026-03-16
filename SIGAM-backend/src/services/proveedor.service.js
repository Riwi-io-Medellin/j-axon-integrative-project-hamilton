import AuditLogService from './auditLog.service.js';

class ProveedorService {
    constructor(model, auditLogService = new AuditLogService()) {
        this.model = model;
        this.auditLogService = auditLogService;
    }
    findAll() { return this.model.findAll(); }
    async findById(id) {
        const r = await this.model.findById(id);
        if (!r) throw { status: 404, message: `Proveedor ${id} no encontrado` };
        return r;
    }
    async create(payload, actor, auditContext) {
        const created = await this.model.create(payload);
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'PROVEEDOR',
                entidad_id: created?.id_proveedor,
                accion: 'PROVEEDOR_CREATE',
                payload_after: created
            })
        );
        return created;
    }
    async update(id, payload, actor, auditContext) {
        const before = await this.model.findById(id);
        const r = await this.model.update(id, payload);
        if (!r) throw { status: 404, message: `Proveedor ${id} no encontrado` };
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'PROVEEDOR',
                entidad_id: id,
                accion: 'PROVEEDOR_UPDATE',
                payload_before: before,
                payload_after: r
            })
        );
        return r;
    }
    async remove(id, actor, auditContext) {
        const before = await this.model.findById(id);
        const r = await this.model.remove(id);
        if (!r) throw { status: 404, message: `Proveedor ${id} no encontrado` };
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'PROVEEDOR',
                entidad_id: id,
                accion: 'PROVEEDOR_DELETE',
                payload_before: before,
                payload_after: r
            })
        );
        return r;
    }
}
export default ProveedorService;
