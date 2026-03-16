import express from 'express';
import MaintenanceController from '../controllers/maintenance.controller.js';
import MaintenanceService from '../services/maintenance.service.js';
import MaintenanceModel from '../models/Maintenance.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import permit from '../middlewares/permit.middleware.js';
import { validateRequired } from '../middlewares/validate.middleware.js';

// Maintenance routes and controller wiring.
const router = express.Router();
const ctrl = new MaintenanceController(new MaintenanceService(new MaintenanceModel()));

// List maintenance orders.
router.get('/', authMiddleware, permit('maintenance', 'list'), ctrl.getAll);

// Fetch a maintenance order by id.
router.get('/:id', authMiddleware, permit('maintenance', 'read'), ctrl.getById);

// Technician calendar (HU-07).
router.get('/tecnico/:id_tecnico', authMiddleware, permit('maintenance', 'by_tecnico'), ctrl.getByTecnico);

// Spare parts used in a maintenance order.
router.get('/:id/consumos', authMiddleware, permit('maintenance', 'consumos'), ctrl.getConsumos);

// Create a maintenance order linked to a ticket.
router.post('/', authMiddleware, permit('maintenance', 'create'),
    validateRequired(['id_ticket', 'id_usuario_tecnico']), ctrl.create);

// Register used spare parts (HU-08).
router.post('/:id/consumos', authMiddleware, permit('maintenance', 'add_consumo'),
    validateRequired(['id_repuesto', 'cantidad_usada']), ctrl.registrarConsumo);

// Update diagnosis, dates, and checklist.
router.put('/:id', authMiddleware, permit('maintenance', 'update'), ctrl.update);

// Delete a maintenance order.
router.delete('/:id', authMiddleware, permit('maintenance', 'delete'), ctrl.remove);

export default router;
