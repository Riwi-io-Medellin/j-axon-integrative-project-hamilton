import AuditLogService from './auditLog.service.js';

class CategoriaTicketService {
    constructor(model, auditLogService = new AuditLogService()) {
        this.model = model;
        this.auditLogService = auditLogService;
    }

    findAll() { return this.model.findAll(); }

    async create(payload, actor, auditContext) {
        const created = await this.model.create(payload);
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'CATEGORIA_TICKET',
                entidad_id: created?.id_categoria_ticket,
                accion: 'CATEGORIA_TICKET_CREATE',
                payload_after: created
            })
        );
        return created;
    }

    async update(id, payload, actor, auditContext) {
        const before = await this.model.findById(id);
        const updated = await this.model.update(id, payload);
        if (!updated) throw { status: 404, message: `CategoriaTicket ${id} no encontrada` };
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'CATEGORIA_TICKET',
                entidad_id: id,
                accion: 'CATEGORIA_TICKET_UPDATE',
                payload_before: before,
                payload_after: updated
            })
        );
        return updated;
    }

    async remove(id, actor, auditContext) {
        const before = await this.model.findById(id);
        const removed = await this.model.remove(id);
        if (!removed) throw { status: 404, message: `CategoriaTicket ${id} no encontrada` };
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'CATEGORIA_TICKET',
                entidad_id: id,
                accion: 'CATEGORIA_TICKET_DELETE',
                payload_before: before,
                payload_after: removed
            })
        );
        return removed;
    }
}

export default CategoriaTicketService;
