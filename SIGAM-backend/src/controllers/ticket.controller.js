import buildAuditContext from '../utils/auditContext.js';

// Tickets controller: HTTP layer for ticket operations.
class TicketController {
    constructor(service) {
        this.service = service;
        ['getAll','getById','getByActivo','getAssigned','getMetrics','getSuggestions','create','update','changeEstado','remove','addComment','getComments','getHistory','assign']
            .forEach(m => this[m] = this[m].bind(this));
    }
    // List tickets.
    async getAll(req, res, next) {
        try {
            const { limit, offset } = req.query || {};
            res.json(await this.service.findAll({ limit, offset }));
        } catch (e) { next(e); }
    }
    // Read ticket by id with access checks.
    async getById(req, res, next) {
        try {
            const ticket = await this.service.findById(req.params.id, req.user);
            const includeSuggestions = String(req.query?.suggestions || '').toLowerCase() === 'true';
            if (!includeSuggestions) {
                res.json(ticket);
                return;
            }
            const data = await this.service.getSuggestions(req.params.id, req.user);
            res.json({ ...ticket, suggestions: data?.suggestions || [] });
        } catch (e) { next(e); }
    }
    // Tickets for a given asset.
    async getByActivo(req, res, next) {
        try {
            const { limit, offset } = req.query || {};
            res.json(await this.service.findByActivo(req.params.id_activo, { limit, offset }));
        } catch (e) { next(e); }
    }
    // Tickets assigned to current technician.
    async getAssigned(req, res, next) {
        try {
            const { limit, offset } = req.query || {};
            res.json(await this.service.findAssignedByTecnico(req.user.id, { limit, offset }));
        } catch (e) { next(e); }
    }
    // MTTR/MTBF metrics (optional filter by asset id).
    async getMetrics(req, res, next) {
        try {
            const raw = req.query?.id_activo;
            let id_activo = undefined;
            if (raw !== undefined) {
                const parsed = Number(raw);
                if (!Number.isInteger(parsed) || parsed <= 0) {
                    throw { status: 400, message: 'id_activo debe ser un entero positivo' };
                }
                id_activo = parsed;
            }
            res.json(await this.service.getMetrics({ id_activo }));
        } catch (e) { next(e); }
    }
    // Suggestions based on similar tickets.
    async getSuggestions(req, res, next) {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id <= 0) throw { status: 400, message: 'id debe ser un entero positivo' };
            res.json(await this.service.getSuggestions(id, req.user));
        } catch (e) { next(e); }
    }
    // Create ticket with classification and optional auto-assign.
    async create(req, res, next) {
        try { res.status(201).json(await this.service.create(req.body, req.user, buildAuditContext(req))); } catch (e) { next(e); }
    }
    // Update ticket fields.
    async update(req, res, next) {
        try { res.json(await this.service.update(req.params.id, req.body, req.user, buildAuditContext(req))); } catch (e) { next(e); }
    }
    // Change ticket state (and optionally register consumos).
    async changeEstado(req, res, next) {
        try {
            res.json(
                await this.service.changeEstado(
                    req.params.id,
                    req.body?.estado,
                    req.user,
                    req.body?.consumos,
                    buildAuditContext(req),
                    {
                        diagnostico: req.body?.diagnostico,
                        acciones_realizadas: req.body?.acciones_realizadas
                    }
                )
            );
        } catch (e) { next(e); }
    }
    // Delete ticket.
    async remove(req, res, next) {
        try {
            await this.service.remove(req.params.id, req.user, buildAuditContext(req));
            res.json({ message: 'Ticket eliminado' });
        } catch (e) { next(e); }
    }

    // Add comment to ticket.
    async addComment(req, res, next) {
        try {
            const created = await this.service.addComment(req.params.id, req.body?.comentario, req.user, buildAuditContext(req));
            res.status(201).json(created);
        } catch (e) { next(e); }
    }

    // List ticket comments.
    async getComments(req, res, next) {
        try { res.json(await this.service.listComments(req.params.id, req.user)); } catch (e) { next(e); }
    }

    // List ticket history.
    async getHistory(req, res, next) {
        try { res.json(await this.service.listHistory(req.params.id, req.user)); } catch (e) { next(e); }
    }

    // Assign ticket to technician.
    async assign(req, res, next) {
        try {
            const assigned = await this.service.assignToTechnician(req.params.id, req.body?.id_usuario_tecnico, req.user, buildAuditContext(req));
            res.json(assigned);
        } catch (e) { next(e); }
    }
}
export default TicketController;
