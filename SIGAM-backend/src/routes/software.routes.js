import express from 'express';
import SoftwareController from '../controllers/software.controller.js';
import SoftwareService from '../services/software.service.js';
import SoftwareModel from '../models/software.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import permit from '../middlewares/permit.middleware.js';
import { validateRequired } from '../middlewares/validate.middleware.js';

// Software catalog routes and controller wiring.
const router = express.Router();
const ctrl = new SoftwareController(new SoftwareService(new SoftwareModel()));

// List software entries.
router.get('/', authMiddleware, permit('software', 'list'), ctrl.getAll);
// Fetch software by id.
router.get('/:id', authMiddleware, permit('software', 'read'), ctrl.getById);
// Create a software entry.
router.post('/', authMiddleware, permit('software', 'create'), validateRequired(['nombre']), ctrl.create);
// Update a software entry.
router.put('/:id', authMiddleware, permit('software', 'update'), ctrl.update);
// Delete a software entry.
router.delete('/:id', authMiddleware, permit('software', 'delete'), ctrl.remove);
// Assign software to asset.
router.post('/:id/asignar', authMiddleware, permit('software', 'update'), validateRequired(['id_activo']), ctrl.assignToAsset);
// List software by asset.
router.get('/activo/:id_activo', authMiddleware, permit('software', 'read'), ctrl.listByActivo);
// Remove software from asset.
router.delete('/:id/activo/:id_activo', authMiddleware, permit('software', 'update'), ctrl.removeFromAsset);

export default router;
