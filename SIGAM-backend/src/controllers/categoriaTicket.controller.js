import buildAuditContext from '../utils/auditContext.js';

class CategoriaTicketController {
    constructor(service) {
        this.service = service;
        this.getAll = this.getAll.bind(this);
        this.create = this.create.bind(this);
        this.update = this.update.bind(this);
        this.remove = this.remove.bind(this);
    }

    async getAll(req, res, next) {
        try { res.json(await this.service.findAll()); } catch (e) { next(e); }
    }

    async create(req, res, next) {
        try { res.status(201).json(await this.service.create(req.body, req.user, buildAuditContext(req))); } catch (e) { next(e); }
    }

    async update(req, res, next) {
        try { res.json(await this.service.update(req.params.id, req.body, req.user, buildAuditContext(req))); } catch (e) { next(e); }
    }

    async remove(req, res, next) {
        try { await this.service.remove(req.params.id, req.user, buildAuditContext(req)); res.json({ message: 'Categoria eliminada' }); } catch (e) { next(e); }
    }
}

export default CategoriaTicketController;
