class ReportController {
    constructor(service) {
        this.service = service;
        ['activos','tickets','mantenimientos','licencias','inventario','consumoRepuestos']
            .forEach(m => this[m] = this[m].bind(this));
    }

    async activos(req, res, next) {
        try {
            const { categoria, sede, piso, sala } = req.query || {};
            res.json(await this.service.activos({ categoria, sede, piso, sala }));
        } catch (e) { next(e); }
    }

    async tickets(req, res, next) { try { res.json(await this.service.tickets()); } catch (e) { next(e); } }
    async mantenimientos(req, res, next) { try { res.json(await this.service.mantenimientos()); } catch (e) { next(e); } }
    async licencias(req, res, next) { try { res.json(await this.service.licencias()); } catch (e) { next(e); } }
    async inventario(req, res, next) { try { res.json(await this.service.inventario()); } catch (e) { next(e); } }
    async consumoRepuestos(req, res, next) { try { res.json(await this.service.consumoRepuestos()); } catch (e) { next(e); } }
}

export default ReportController;
