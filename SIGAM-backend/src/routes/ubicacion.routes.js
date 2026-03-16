import express from 'express';
import UbicacionController from '../controllers/ubicacion.controller.js';
import UbicacionService from '../services/ubicacion.service.js';
import UbicacionModel from '../models/ubicacion.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import permit from '../middlewares/permit.middleware.js';
import { validateRequired } from '../middlewares/validate.middleware.js';

const router = express.Router();
const ctrl = new UbicacionController(new UbicacionService(new UbicacionModel()));

router.get('/', authMiddleware, permit('ubicaciones', 'list'), ctrl.getAll);
router.get('/:id', authMiddleware, permit('ubicaciones', 'read'), ctrl.getById);
router.post('/', authMiddleware, permit('ubicaciones', 'create'), validateRequired(['sede']), ctrl.create);
router.put('/:id', authMiddleware, permit('ubicaciones', 'update'), ctrl.update);
router.delete('/:id', authMiddleware, permit('ubicaciones', 'delete'), ctrl.remove);

export default router;
