import express from 'express';
import ProveedorController from '../controllers/proveedor.controller.js';
import ProveedorService from '../services/proveedor.service.js';
import ProveedorModel from '../models/proveedor.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import permit from '../middlewares/permit.middleware.js';
import { validateRequired } from '../middlewares/validate.middleware.js';

const router = express.Router();
const ctrl = new ProveedorController(new ProveedorService(new ProveedorModel()));

router.get('/', authMiddleware, permit('proveedores', 'list'), ctrl.getAll);
router.get('/:id', authMiddleware, permit('proveedores', 'read'), ctrl.getById);
router.post('/', authMiddleware, permit('proveedores', 'create'), validateRequired(['nombre', 'identificacion_legal']), ctrl.create);
router.put('/:id', authMiddleware, permit('proveedores', 'update'), ctrl.update);
router.delete('/:id', authMiddleware, permit('proveedores', 'delete'), ctrl.remove);

export default router;
