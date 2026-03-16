import AuditLogService from './auditLog.service.js';

class AlertaService {
    constructor(model, auditLogService = new AuditLogService()) {
        this.model = model;
        this.auditLogService = auditLogService;
    }

    findAll(filters) {
        return this.model.findAll(filters);
    }

    async updateEstado(id_alerta, estado, actor, auditContext) {
        if (!estado) throw { status: 400, message: 'estado es requerido' };
        const updated = await this.model.updateEstado(id_alerta, estado);
        if (!updated) throw { status: 404, message: `Alerta ${id_alerta} no encontrada` };
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'ALERTA',
                entidad_id: id_alerta,
                accion: 'ALERTA_UPDATE',
                payload_after: updated,
                metadata: { estado }
            })
        );
        return updated;
    }
}

export default AlertaService;
