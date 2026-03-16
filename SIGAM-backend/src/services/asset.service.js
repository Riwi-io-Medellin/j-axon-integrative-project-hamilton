import AuditLogService from './auditLog.service.js';
import UserModel from '../models/User.js';
import NotificationService from './notification.service.js';

// Assets service: business rules, normalization, and audit logging.
class AssetService {
    constructor(assetModel, auditLogService = new AuditLogService()) {
        this.assetModel = assetModel;
        this.auditLogService = auditLogService;
        this.userModel = new UserModel();
        this.notificationService = new NotificationService();
    }

    // Generate unique QR code for assets.
    static generateCodigoQR() {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
        return `ACT-${yyyy}${mm}${dd}-${rand}`;
    }

    // Compute obsolescence date from purchase date and lifespan.
    static computeFechaObsolescencia(fechaCompra, vidaUtil) {
        if (!fechaCompra || !vidaUtil) return null;
        const base = new Date(fechaCompra);
        if (Number.isNaN(base.getTime())) return null;
        const months = Number(vidaUtil);
        if (!Number.isFinite(months)) return null;
        const result = new Date(base);
        result.setMonth(result.getMonth() + months);
        return result.toISOString().slice(0, 10);
    }

    // Attach computed obsolescence date to asset output.
    static withObsolescence(asset) {
        if (!asset) return asset;
        const fecha_obsolescencia = AssetService.computeFechaObsolescencia(
            asset.fecha_compra,
            asset.vida_util
        );
        return { ...asset, fecha_obsolescencia };
    }

    static normalizePagination({ limit, offset } = {}) {
        const parsedLimit = limit === undefined ? 100 : Number(limit);
        const parsedOffset = offset === undefined ? 0 : Number(offset);

        if (!Number.isInteger(parsedLimit) || parsedLimit <= 0 || parsedLimit > 500) {
            throw { status: 400, message: 'limit debe ser entero entre 1 y 500' };
        }
        if (!Number.isInteger(parsedOffset) || parsedOffset < 0 || parsedOffset > 1000000) {
            throw { status: 400, message: 'offset debe ser entero >= 0' };
        }

        return { limit: parsedLimit, offset: parsedOffset };
    }

    async findAll(filters = {}) {
        const { limit, offset } = AssetService.normalizePagination(filters);
        const payload = { ...filters, limit, offset };
        const assets = (payload && (payload.categoria || payload.sede || payload.piso || payload.sala))
            ? await this.assetModel.findAllFiltered(payload)
            : await this.assetModel.findAll(payload);
        return Array.isArray(assets)
            ? assets.map((asset) => AssetService.withObsolescence(asset))
            : assets;
    }

    // Read one asset and compute obsolescence.
    async findById(id) {
        const asset = await this.assetModel.findById(id);
        if (!asset) throw { status: 404, message: `Activo con id ${id} no encontrado` };
        return AssetService.withObsolescence(asset);
    }

    // Create asset with required fields and audit log.
    async create(payload, actor, auditContext) {
        if (!payload?.serial) {
            throw { status: 400, message: 'serial es requerido' };
        }
        if (!payload?.id_categoria) {
            throw { status: 400, message: 'id_categoria es requerido' };
        }
        if (!payload?.id_proveedor) {
            throw { status: 400, message: 'id_proveedor es requerido' };
        }
        const existing = await this.assetModel.findBySerial(payload.serial);
        if (existing) {
            throw { status: 409, message: `serial duplicado: ${payload.serial}` };
        }

        const normalizedPayload = {
            ...payload,
            codigo_qr: payload.codigo_qr || AssetService.generateCodigoQR()
        };
        const asset = await this.assetModel.create(normalizedPayload);
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'ACTIVO',
                entidad_id: asset?.id_activo,
                accion: 'ACTIVO_CREATE',
                payload_after: asset
            })
        );
        return AssetService.withObsolescence(asset);
    }

    // Update asset, track state change, and log audit.
    async update(id, payload, actor, auditContext) {
        const before = await this.assetModel.findById(id);
        const asset = await this.assetModel.update(id, payload);
        if (!asset) throw { status: 404, message: `Activo con id ${id} no encontrado` };
        if (payload?.estado_activo !== undefined) {
            const estado = payload.estado_activo ? 'Activo' : 'Inactivo';
            await this.assetModel.addHistory(
                id,
                'Cambio de estado',
                `Estado actualizado a "${estado}"`
            );
        }
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'ACTIVO',
                entidad_id: asset?.id_activo ?? id,
                accion: 'ACTIVO_UPDATE',
                payload_before: before,
                payload_after: asset
            })
        );
        return AssetService.withObsolescence(asset);
    }

    // Retire asset and record ISO 27001 reason/certificate.
    async remove(id, motivoBaja, certificadoBorrado, actor, auditContext) {
        if (!motivoBaja || !certificadoBorrado) {
            throw { status: 400, message: 'motivo_baja y certificado_borrado son requeridos (ISO 27001)' };
        }
        const before = await this.assetModel.findById(id);
        const result = await this.assetModel.remove(id, motivoBaja, certificadoBorrado);
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'ACTIVO',
                entidad_id: id,
                accion: 'ACTIVO_DELETE',
                payload_before: before,
                payload_after: result,
                metadata: {
                    motivo_baja: motivoBaja,
                    certificado_borrado: certificadoBorrado
                }
            })
        );
        return result;
    }

    // Asset history entries.
    async getHistory(id) {
        return this.assetModel.getHistory(id);
    }

    async assignToUser(id_activo, id_usuario, actor, auditContext) {
        if (!id_usuario) throw { status: 400, message: 'id_usuario es requerido' };
        const result = await this.assetModel.assignToUser(id_activo, id_usuario);
        const user = await this.userModel.findById(id_usuario);
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'ACTIVO',
                entidad_id: id_activo,
                accion: 'ACTIVO_ASSIGN',
                payload_after: result,
                metadata: { id_usuario }
            })
        );
        if (user?.email) {
            await this.notificationService.enqueueEmail({
                tipo: 'ACTIVO_ASIGNADO',
                destinatario: user.email,
                asunto: `Activo asignado #${id_activo}`,
                cuerpo: `Se te asignó el activo ${id_activo}.`
            });
        }
        return result;
    }

    async unassign(id_asignacion, actor, auditContext) {
        const result = await this.assetModel.unassign(id_asignacion);
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'ACTIVO',
                entidad_id: id_asignacion,
                accion: 'ACTIVO_UNASSIGN',
                payload_after: result
            })
        );
        return result;
    }

    getAssignments(id_activo) {
        return this.assetModel.getAssignments(id_activo);
    }

    async addDocumento(payload, actor, auditContext) {
        const created = await this.assetModel.addDocumento(payload);
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'ACTIVO',
                entidad_id: payload?.id_activo,
                accion: 'ACTIVO_DOCUMENT',
                payload_after: created
            })
        );
        return created;
    }

    getDocumentos(id_activo) {
        return this.assetModel.getDocumentos(id_activo);
    }
}

export default AssetService;
