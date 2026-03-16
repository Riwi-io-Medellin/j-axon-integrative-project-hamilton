import buildAuditContext from '../utils/auditContext.js';

// Controller for spare parts routes.
class RepuestoController {
    constructor(service) {
        this.service = service;
        // Bind methods for Express handlers.
        ['getAll','getById','getBajoStock','create','update','remove']
            .forEach(m => this[m] = this[m].bind(this));
    }
    // List all spare parts.
    async getAll(req, res, next) {
        try { res.json(await this.service.findAll()); } catch (e) { next(e); }
    }
    // Fetch a spare part by id.
    async getById(req, res, next) {
        try { res.json(await this.service.findById(req.params.id)); } catch (e) { next(e); }
    }
    // List spare parts under the minimum stock level.
    async getBajoStock(req, res, next) {
        try { res.json(await this.service.findBajoStock()); } catch (e) { next(e); }
    }
    // Create a new spare part record.
    async create(req, res, next) {
        try { res.status(201).json(await this.service.create(req.body, req.user, buildAuditContext(req))); } catch (e) { next(e); }
    }
    // Update a spare part record.
    async update(req, res, next) {
        try { res.json(await this.service.update(req.params.id, req.body, req.user, buildAuditContext(req))); } catch (e) { next(e); }
    }
    // Delete a spare part record.
    async remove(req, res, next) {
        try {
            await this.service.remove(req.params.id, req.user, buildAuditContext(req));
            res.json({ message: 'Repuesto eliminado' });
        } catch (e) { next(e); }
    }
}
export default RepuestoController;
