import buildAuditContext from '../utils/auditContext.js';

class AlertaController {
    constructor(service) {
        this.service = service;
        this.getAll = this.getAll.bind(this);
        this.updateEstado = this.updateEstado.bind(this);
    }

    async getAll(req, res, next) {
        try {
            const { estado, tipo, id_activo, id_repuesto, limit, offset } = req.query || {};
            res.json(await this.service.findAll({ estado, tipo, id_activo, id_repuesto, limit, offset }));
        } catch (e) { next(e); }
    }

    async updateEstado(req, res, next) {
        try {
            const result = await this.service.updateEstado(
                req.params.id,
                req.body?.estado,
                req.user,
                buildAuditContext(req)
            );
            res.json(result);
        } catch (e) { next(e); }
    }
}

export default AlertaController;
