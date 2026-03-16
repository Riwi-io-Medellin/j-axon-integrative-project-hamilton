import AuditLogService from './auditLog.service.js';
import AssetModel from '../models/Asset.js';
import TicketModel from '../models/Ticket.js';
import { normalizePagination } from '../utils/pagination.js';

// Service layer for maintenance orders and related domain logic.
class MaintenanceService {
    constructor(model, auditLogService = new AuditLogService(), assetModel = new AssetModel(), ticketModel = new TicketModel()) {
        this.model = model;
        this.auditLogService = auditLogService;
        this.assetModel = assetModel;
        this.ticketModel = ticketModel;
    }
    // Valid ticket states allowed when registering consumptions.
    static ESTADOS_VALIDOS = new Set(['Abierto', 'Asignado', 'En Proceso', 'Resuelto', 'Cerrado']);

    // List all maintenance orders.
    async findAll({ limit, offset } = {}) {
        const pagination = normalizePagination({ limit, offset, defaultLimit: 100, maxLimit: 500 });
        const rows = await this.model.findAll(pagination);
        return Array.isArray(rows) ? rows.map(this.#withDuration) : rows;
    }

    // Fetch a maintenance order by id and validate existence.
    async findById(id) {
        const m = await this.model.findById(id);
        if (!m) throw { status: 404, message: `Orden ${id} no encontrada` };
        return this.#withDuration(m);
    }

    // List maintenance orders by technician.
    async findByTecnico(id_tecnico, { limit, offset } = {}) {
        const pagination = normalizePagination({ limit, offset, defaultLimit: 100, maxLimit: 500 });
        const rows = await this.model.findByTecnico(id_tecnico, pagination);
        return Array.isArray(rows) ? rows.map(this.#withDuration) : rows;
    }

    // List maintenance orders by asset id.
    async findByActivo(id_activo, { limit, offset } = {}) {
        const pagination = normalizePagination({ limit, offset, defaultLimit: 100, maxLimit: 500 });
        const rows = await this.model.findByActivo(id_activo, pagination);
        return Array.isArray(rows) ? rows.map(this.#withDuration) : rows;
    }

    // Create a maintenance order and emit audit log entry.
    create(payload, actor, auditContext) {
        if (!payload.id_ticket) throw { status: 400, message: 'id_ticket es requerido' };
        if (!payload.id_usuario_tecnico) throw { status: 400, message: 'id_usuario_tecnico es requerido' };
        return this.model.create(payload).then((created) => {
            this.auditLogService.safeLog(
                this.auditLogService.buildDomainEntry({
                    actor,
                    context: auditContext,
                    entidad: 'ORDEN',
                    entidad_id: created?.id_orden,
                    accion: 'ORDEN_CREATE',
                    payload_after: created,
                    metadata: { id_ticket: payload.id_ticket }
                })
            );
            return created;
        });
    }

    // Update a maintenance order and log before/after states.
    async update(id, payload, actor, auditContext) {
        const before = await this.model.findById(id);
        const m = await this.model.update(id, payload);
        if (!m) throw { status: 404, message: `Orden ${id} no encontrada` };
        if (payload?.fecha_fin && !before?.fecha_fin) {
            const ticket = await this.ticketModel.findCoreById(m.id_ticket);
            if (ticket?.id_activo) {
                await this.assetModel.addHistory(
                    ticket.id_activo,
                    'Mantenimiento',
                    `Mantenimiento finalizado para ticket ${m.id_ticket}`
                );
            }
        }
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'ORDEN',
                entidad_id: id,
                accion: 'ORDEN_UPDATE',
                payload_before: before,
                payload_after: m
            })
        );
        return m;
    }

    // Remove a maintenance order and log the deletion.
    async remove(id, actor, auditContext) {
        const before = await this.model.findById(id);
        const m = await this.model.remove(id);
        if (!m) throw { status: 404, message: `Orden ${id} no encontrada` };
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'ORDEN',
                entidad_id: id,
                accion: 'ORDEN_DELETE',
                payload_before: before,
                payload_after: m
            })
        );
        return m;
    }

    // HU-08: Register spare parts consumption and update ticket state.
    registrarConsumo(id_orden, payload, actor, auditContext) {
        if (!payload.id_repuesto) throw { status: 400, message: 'id_repuesto es requerido' };
        if (!payload.cantidad_usada) throw { status: 400, message: 'cantidad_usada es requerida' };
        if (payload.cantidad_usada <= 0) throw { status: 400, message: 'cantidad_usada debe ser mayor que 0' };

        const estado_ticket = payload.estado_ticket || 'En Proceso';
        if (!MaintenanceService.ESTADOS_VALIDOS.has(estado_ticket)) {
            throw { status: 400, message: `estado_ticket inválido: ${estado_ticket}` };
        }

        return this.model.registrarConsumo(id_orden, { ...payload, estado_ticket }).then((result) => {
            this.auditLogService.safeLog(
                this.auditLogService.buildDomainEntry({
                    actor,
                    context: auditContext,
                    entidad: 'REPUESTO',
                    entidad_id: payload.id_repuesto,
                    accion: 'REPUESTO_CONSUME',
                    payload_after: result,
                    metadata: {
                        id_orden,
                        id_repuesto: payload.id_repuesto,
                        cantidad_usada: payload.cantidad_usada,
                        estado_ticket
                    }
                })
            );
            return result;
        });
    }

    // List all consumptions registered for a maintenance order.
    getConsumos(id_orden) { return this.model.getConsumos(id_orden); }

    #withDuration(m) {
        if (!m) return m;
        const inicio = m.fecha_inicio ? new Date(m.fecha_inicio).getTime() : null;
        const fin = m.fecha_fin ? new Date(m.fecha_fin).getTime() : null;
        const duration_minutes = inicio && fin && fin >= inicio ? Math.round((fin - inicio) / 60000) : null;
        return { ...m, duration_minutes };
    }
}

export default MaintenanceService;
