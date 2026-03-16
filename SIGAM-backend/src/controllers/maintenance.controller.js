import buildAuditContext from '../utils/auditContext.js';

// Controller for maintenance routes; delegates to the service layer.
class MaintenanceController {
    constructor(service) {
        this.service = service;
        // Bind methods for use as Express handlers.
        ['getAll', 'getById', 'getByTecnico', 'getConsumos', 'create', 'registrarConsumo', 'update', 'remove']
            .forEach(m => this[m] = this[m].bind(this));
    }

    // List all maintenance orders.
    async getAll(req, res, next) {
        try {
            const { limit, offset } = req.query || {};
            res.json(await this.service.findAll({ limit, offset }));
        } catch (e) { next(e); }
    }

    // Get a maintenance order by id.
    async getById(req, res, next) {
        try { res.json(await this.service.findById(req.params.id)); } catch (e) { next(e); }
    }

    // Get the technician calendar.
    async getByTecnico(req, res, next) {
        try {
            const { limit, offset } = req.query || {};
            res.json(await this.service.findByTecnico(req.params.id_tecnico, { limit, offset }));
        } catch (e) { next(e); }
    }

    // Get spare parts consumption for a maintenance order.
    async getConsumos(req, res, next) {
        try { res.json(await this.service.getConsumos(req.params.id)); } catch (e) { next(e); }
    }

    // Create a new maintenance order.
    async create(req, res, next) {
        try { res.status(201).json(await this.service.create(req.body, req.user, buildAuditContext(req))); } catch (e) { next(e); }
    }

    // Register consumed spare parts.
    async registrarConsumo(req, res, next) {
        try { res.status(201).json(await this.service.registrarConsumo(req.params.id, req.body, req.user, buildAuditContext(req))); } catch (e) { next(e); }
    }

    // Update diagnosis, dates, and checklist.
    async update(req, res, next) {
        try { res.json(await this.service.update(req.params.id, req.body, req.user, buildAuditContext(req))); } catch (e) { next(e); }
    }

    // Remove a maintenance order.
    async remove(req, res, next) {
        try {
            await this.service.remove(req.params.id, req.user, buildAuditContext(req));
            res.json({ message: 'Mantenimiento eliminado' });
        } catch (e) { next(e); }
    }
}

export default MaintenanceController;
