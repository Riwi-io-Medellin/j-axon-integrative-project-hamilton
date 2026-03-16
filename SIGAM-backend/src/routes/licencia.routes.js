import express from 'express';
import LicenciaController from '../controllers/licencia.controller.js';
import LicenciaService from '../services/licencia.service.js';
import LicenciaModel from '../models/licencia.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import permit from '../middlewares/permit.middleware.js';
import { validateRequired } from '../middlewares/validate.middleware.js';

// License routes and controller wiring.
const router = express.Router();
const ctrl = new LicenciaController(new LicenciaService(new LicenciaModel()));

// List licenses.
router.get('/', authMiddleware, permit('licencias', 'list'), ctrl.getAll);
router.get('/alertas/vencimiento', authMiddleware, permit('licencias', 'list'), ctrl.getAlertasVencimiento);
// Fetch a license by id.
router.get('/:id', authMiddleware, permit('licencias', 'read'), ctrl.getById);
// List assignments for a license.
router.get('/:id/asignaciones', authMiddleware, permit('licencias', 'asignaciones'), ctrl.getAsignaciones);
// Create a license record.
router.post('/', authMiddleware, permit('licencias', 'create'), validateRequired(['id_software', 'clave_producto']), ctrl.create);
// Assign a license to a user or asset.
router.post('/asignar', authMiddleware, permit('licencias', 'asignar'), validateRequired(['id_licencia']), ctrl.asignar);
// Update a license record.
router.put('/:id', authMiddleware, permit('licencias', 'update'), ctrl.update);
// Delete a license record.
router.delete('/:id', authMiddleware, permit('licencias', 'delete'), ctrl.remove);
// Revoke a license assignment.
router.delete('/asignacion/:id_asignacion', authMiddleware, permit('licencias', 'revocar'), ctrl.revocarAsignacion);

export default router;
