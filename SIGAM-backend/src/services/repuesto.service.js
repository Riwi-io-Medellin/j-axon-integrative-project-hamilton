import AuditLogService from './auditLog.service.js';
import NotificationService from './notification.service.js';

// Service layer for spare parts and inventory adjustments.
class RepuestoService {
    constructor(model, auditLogService = new AuditLogService()) {
        this.model = model;
        this.auditLogService = auditLogService;
        this.notificationService = new NotificationService();
    }
    // List all spare parts.
    findAll() { return this.model.findAll(); }
    // List spare parts below minimum stock.
    async findBajoStock() {
        const rows = await this.model.findBajoStock();
        const adminEmail = process.env.NOTIFY_ADMIN_EMAIL;
        if (adminEmail && rows?.length) {
            await this.notificationService.enqueueEmail({
                tipo: 'INVENTARIO_BAJO',
                destinatario: adminEmail,
                asunto: 'Repuestos en bajo stock',
                cuerpo: `Repuestos bajo stock: ${rows.map((r) => r.nombre).join(', ')}`
            });
        }
        return rows;
    }
    // List spare parts consumption by asset.
    findConsumosByActivo(id_activo) {
        return this.model.findConsumosByActivo(id_activo);
    }
    // Fetch a spare part by id and validate existence.
    async findById(id) {
        const r = await this.model.findById(id);
        if (!r) throw { status: 404, message: `Repuesto ${id} no encontrado` };
        return r;
    }
    // Create a spare part and emit audit log entry.
    async create(payload, actor, auditContext) {
        const created = await this.model.create(payload);
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'REPUESTO',
                entidad_id: created?.id_repuesto,
                accion: 'REPUESTO_CREATE',
                payload_after: created
            })
        );
        return created;
    }
    // Update a spare part and log stock adjustments separately.
    async update(id, payload, actor, auditContext) {
        const before = await this.model.findById(id);
        const r = await this.model.update(id, payload);
        if (!r) throw { status: 404, message: `Repuesto ${id} no encontrado` };
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'REPUESTO',
                entidad_id: id,
                accion: 'REPUESTO_UPDATE',
                payload_before: before,
                payload_after: r
            })
        );
        const stockChanged = payload?.stock !== undefined && Number(before?.stock) !== Number(r?.stock);
        const stockMinChanged = payload?.stock_minimo !== undefined && Number(before?.stock_minimo) !== Number(r?.stock_minimo);
        if (stockChanged || stockMinChanged) {
            this.auditLogService.safeLog(
                this.auditLogService.buildDomainEntry({
                    actor,
                    context: auditContext,
                    entidad: 'REPUESTO',
                    entidad_id: id,
                    accion: 'REPUESTO_ADJUST',
                    payload_before: before,
                    payload_after: r,
                    metadata: {
                        stock_before: before?.stock ?? null,
                        stock_after: r?.stock ?? null,
                        stock_minimo_before: before?.stock_minimo ?? null,
                        stock_minimo_after: r?.stock_minimo ?? null
                    }
                })
            );
        }
        return r;
    }
    // Remove a spare part record and log deletion.
    async remove(id, actor, auditContext) {
        const before = await this.model.findById(id);
        const r = await this.model.remove(id);
        if (!r) throw { status: 404, message: `Repuesto ${id} no encontrado` };
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'REPUESTO',
                entidad_id: id,
                accion: 'REPUESTO_DELETE',
                payload_before: before,
                payload_after: r
            })
        );
        return r;
    }
}
export default RepuestoService;
