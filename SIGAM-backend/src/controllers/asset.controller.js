import buildAuditContext from '../utils/auditContext.js';

// Assets controller: HTTP layer for assets and history.
class AssetController {
    constructor(assetService, { ticketService, maintenanceService, licenciaService, repuestoService } = {}) {
        this.assetService = assetService;
        this.ticketService = ticketService;
        this.maintenanceService = maintenanceService;
        this.licenciaService = licenciaService;
        this.repuestoService = repuestoService;
        this.getAll = this.getAll.bind(this);
        this.getById = this.getById.bind(this);
        this.create = this.create.bind(this);
        this.update = this.update.bind(this);
        this.remove = this.remove.bind(this);
        this.getHistory = this.getHistory.bind(this);
        this.getTickets = this.getTickets.bind(this);
        this.getMantenimientos = this.getMantenimientos.bind(this);
        this.getPiezas = this.getPiezas.bind(this);
        this.getLicencias = this.getLicencias.bind(this);
        this.assign = this.assign.bind(this);
        this.unassign = this.unassign.bind(this);
        this.getAssignments = this.getAssignments.bind(this);
        this.addDocumento = this.addDocumento.bind(this);
        this.getDocumentos = this.getDocumentos.bind(this);
    }

    async getAll(req, res, next) {
        try {
            const { categoria, sede, piso, sala, limit, offset } = req.query || {};
            const assets = await this.assetService.findAll({ categoria, sede, piso, sala, limit, offset });
            res.json(assets);
        } catch (error) { next(error); }
    }

    // Read single asset by id.
    async getById(req, res, next) {
        try {
            const asset = await this.assetService.findById(req.params.id);
            res.json(asset);
        } catch (error) { next(error); }
    }

    // Create asset and return stored entity.
    async create(req, res, next) {
        try {
            const asset = await this.assetService.create(req.body, req.user, buildAuditContext(req));
            res.status(201).json(asset);
        } catch (error) { next(error); }
    }

    // Update asset fields.
    async update(req, res, next) {
        try {
            const asset = await this.assetService.update(req.params.id, req.body, req.user, buildAuditContext(req));
            res.json(asset);
        } catch (error) { next(error); }
    }

    // Retire asset with mandatory ISO 27001 fields.
    async remove(req, res, next) {
        try {
            const { motivo_baja, certificado_borrado } = req.body;
            const result = await this.assetService.remove(
                req.params.id,
                motivo_baja,
                certificado_borrado,
                req.user,
                buildAuditContext(req)
            );
            res.json({ message: 'Activo dado de baja correctamente (ISO 27001)', data: result });
        } catch (error) { next(error); }
    }

    // Fetch asset history entries.
    async getHistory(req, res, next) {
        try {
            const history = await this.assetService.getHistory(req.params.id);
            res.json(history);
        } catch (error) { next(error); }
    }

    // Tickets linked to asset.
    async getTickets(req, res, next) {
        try {
            const { limit, offset } = req.query || {};
            res.json(await this.ticketService.findByActivo(req.params.id, { limit, offset }));
        } catch (error) { next(error); }
    }

    // Maintenance orders linked to asset.
    async getMantenimientos(req, res, next) {
        try {
            const { limit, offset } = req.query || {};
            res.json(await this.maintenanceService.findByActivo(req.params.id, { limit, offset }));
        } catch (error) { next(error); }
    }

    // Spare parts consumed on asset-related maintenance.
    async getPiezas(req, res, next) {
        try {
            res.json(await this.repuestoService.findConsumosByActivo(req.params.id));
        } catch (error) { next(error); }
    }

    // Licenses assigned to the asset.
    async getLicencias(req, res, next) {
        try {
            res.json(await this.licenciaService.findByActivo(req.params.id));
        } catch (error) { next(error); }
    }

    // Assign asset to user.
    async assign(req, res, next) {
        try {
            const result = await this.assetService.assignToUser(
                req.params.id,
                req.body?.id_usuario,
                req.user,
                buildAuditContext(req)
            );
            res.json(result);
        } catch (error) { next(error); }
    }

    // Unassign asset.
    async unassign(req, res, next) {
        try {
            const result = await this.assetService.unassign(
                req.params.id_asignacion,
                req.user,
                buildAuditContext(req)
            );
            res.json(result);
        } catch (error) { next(error); }
    }

    async getAssignments(req, res, next) {
        try {
            res.json(await this.assetService.getAssignments(req.params.id));
        } catch (error) { next(error); }
    }

    async addDocumento(req, res, next) {
        try {
            const created = await this.assetService.addDocumento(
                { id_activo: req.params.id, nombre: req.body?.nombre, tipo: req.body?.tipo, url: req.body?.url },
                req.user,
                buildAuditContext(req)
            );
            res.status(201).json(created);
        } catch (error) { next(error); }
    }

    async getDocumentos(req, res, next) {
        try {
            res.json(await this.assetService.getDocumentos(req.params.id));
        } catch (error) { next(error); }
    }
}

export default AssetController;
