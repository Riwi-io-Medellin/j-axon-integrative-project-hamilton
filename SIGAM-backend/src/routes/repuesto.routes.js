import express from 'express';
import RepuestoController from '../controllers/repuesto.controller.js';
import RepuestoService from '../services/repuesto.service.js';
import RepuestoModel from '../models/repuesto.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import permit from '../middlewares/permit.middleware.js';
import { validateRequired } from '../middlewares/validate.middleware.js';

// Spare parts routes and controller wiring.
const router = express.Router();
const ctrl = new RepuestoController(new RepuestoService(new RepuestoModel()));

// List spare parts.
router.get('/', authMiddleware, permit('repuestos', 'list'), ctrl.getAll);
// List low-stock spare parts.
router.get('/bajo-stock', authMiddleware, permit('repuestos', 'bajo_stock'), ctrl.getBajoStock);
// Fetch a spare part by id.
router.get('/:id', authMiddleware, permit('repuestos', 'read'), ctrl.getById);
// Create a spare part record.
router.post('/', authMiddleware, permit('repuestos', 'create'), validateRequired(['nombre']), ctrl.create);
// Update a spare part record.
router.put('/:id', authMiddleware, permit('repuestos', 'update'), ctrl.update);
// Delete a spare part record.
router.delete('/:id', authMiddleware, permit('repuestos', 'delete'), ctrl.remove);

export default router;
