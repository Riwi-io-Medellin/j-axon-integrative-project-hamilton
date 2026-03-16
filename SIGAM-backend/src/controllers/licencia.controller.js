import buildAuditContext from '../utils/auditContext.js';

// Controller for license routes.
class LicenciaController {
    constructor(service) {
        this.service = service;
        // Bind methods for Express handlers.
        ['getAll','getById','create','update','remove','asignar','getAsignaciones','revocarAsignacion','getAlertasVencimiento']
            .forEach(m => this[m] = this[m].bind(this));
    }
    // List all licenses.
    async getAll(req, res, next) {
        try { res.json(await this.service.findAll()); } catch (e) { next(e); }
    }
    // Fetch a license by id.
    async getById(req, res, next) {
        try { res.json(await this.service.findById(req.params.id)); } catch (e) { next(e); }
    }
    // Create a new license.
    async create(req, res, next) {
        try { res.status(201).json(await this.service.create(req.body, req.user, buildAuditContext(req))); } catch (e) { next(e); }
    }
    // Update an existing license.
    async update(req, res, next) {
        try { res.json(await this.service.update(req.params.id, req.body, req.user, buildAuditContext(req))); } catch (e) { next(e); }
    }
    // Delete a license.
    async remove(req, res, next) {
        try {
            await this.service.remove(req.params.id, req.user, buildAuditContext(req));
            res.json({ message: 'Licencia eliminada' });
        } catch (e) { next(e); }
    }
    // HU-03: Assign a license.
    async asignar(req, res, next) {
        try { res.status(201).json(await this.service.asignar(req.body, req.user, buildAuditContext(req))); } catch (e) { next(e); }
    }
    // List assignments for a license.
    async getAsignaciones(req, res, next) {
        try { res.json(await this.service.getAsignaciones(req.params.id)); } catch (e) { next(e); }
    }
    // Revoke an assignment by id.
    async revocarAsignacion(req, res, next) {
        try {
            await this.service.revocarAsignacion(req.params.id_asignacion, req.user, buildAuditContext(req));
            res.json({ message: 'Asignación revocada' });
        } catch (e) { next(e); }
    }

    async getAlertasVencimiento(req, res, next) {
        try {
            const dias = Number(req.query?.dias || 30);
            res.json(await this.service.generarAlertasVencimiento({ dias }));
        } catch (e) { next(e); }
    }
}
export default LicenciaController;
