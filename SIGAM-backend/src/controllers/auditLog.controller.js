// Controller for audit log queries and filtering.
class AuditLogController {
    constructor(service) {
        this.service = service;
        // Bind methods for Express handlers.
        ['getAll', 'getById'].forEach((m) => (this[m] = this[m].bind(this)));
    }

    // List audit entries using query filters.
    async getAll(req, res, next) {
        try {
            const {
                limit,
                offset,
                from,
                to,
                entidad,
                entidad_id,
                accion,
                status,
                id_usuario_actor
            } = req.query || {};
            res.json(await this.service.findAll({
                limit,
                offset,
                from,
                to,
                entidad,
                entidad_id,
                accion,
                status,
                id_usuario_actor
            }));
        } catch (e) {
            next(e);
        }
    }

    // Fetch a single audit entry by id with validation.
    async getById(req, res, next) {
        try {
            const id = Number(req.params.id);
            if (!Number.isInteger(id) || id <= 0) throw { status: 400, message: 'id debe ser un entero positivo' };
            res.json(await this.service.findById(id));
        } catch (e) {
            next(e);
        }
    }
}

export default AuditLogController;
