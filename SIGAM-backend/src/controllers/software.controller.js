import buildAuditContext from '../utils/auditContext.js';

// Controller for software catalog routes.
class SoftwareController {
    constructor(service) {
        this.service = service;
        // Bind methods for Express handlers.
        ['getAll','getById','create','update','remove','assignToAsset','listByActivo','removeFromAsset']
            .forEach(m => this[m] = this[m].bind(this));
    }

    // List all software entries.
    async getAll(req, res, next) {
        try { res.json(await this.service.findAll()); } catch (e) { next(e); }
    }

    // Fetch software by id.
    async getById(req, res, next) {
        try { res.json(await this.service.findById(req.params.id)); } catch (e) { next(e); }
    }

    // Create a new software entry.
    async create(req, res, next) {
        try { res.status(201).json(await this.service.create(req.body, req.user, buildAuditContext(req))); } catch (e) { next(e); }
    }

    // Update a software entry.
    async update(req, res, next) {
        try { res.json(await this.service.update(req.params.id, req.body, req.user, buildAuditContext(req))); } catch (e) { next(e); }
    }

    // Delete a software entry.
    async remove(req, res, next) {
        try {
            await this.service.remove(req.params.id, req.user, buildAuditContext(req));
            res.json({ message: 'Software eliminado' });
        } catch (e) { next(e); }
    }

    // Assign software to asset.
    async assignToAsset(req, res, next) {
        try {
            const payload = {
                id_software: req.params.id,
                id_activo: req.body?.id_activo,
                version_instalada: req.body?.version_instalada
            };
            res.status(201).json(await this.service.assignToAsset(payload, req.user, buildAuditContext(req)));
        } catch (e) { next(e); }
    }

    // List software by asset id.
    async listByActivo(req, res, next) {
        try { res.json(await this.service.listByActivo(req.params.id_activo)); } catch (e) { next(e); }
    }

    // Remove software from asset.
    async removeFromAsset(req, res, next) {
        try { res.json(await this.service.removeFromAsset(req.params.id, req.params.id_activo, req.user, buildAuditContext(req))); } catch (e) { next(e); }
    }
}

export default SoftwareController;
