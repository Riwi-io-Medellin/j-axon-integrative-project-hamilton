import express from 'express';
import TicketController from '../controllers/ticket.controller.js';
import TicketService from '../services/ticket.service.js';
import TicketModel from '../models/Ticket.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import permit from '../middlewares/permit.middleware.js';

// Tickets module routes: CRUD, metrics, and suggestions.
const router = express.Router();
// Controller wiring with service + model dependencies.
const ctrl = new TicketController(new TicketService(new TicketModel()));

// List tickets.
router.get('/', authMiddleware, permit('tickets', 'list'), ctrl.getAll);

// Tickets for a specific asset.
router.get('/activo/:id_activo', authMiddleware, permit('tickets', 'by_activo'), ctrl.getByActivo);

// Tickets assigned to the authenticated technician.
router.get('/asignados/mis', authMiddleware, permit('tickets', 'assigned_mine'), ctrl.getAssigned);

// MTTR/MTBF metrics.
router.get('/metricas', authMiddleware, permit('tickets', 'metrics'), ctrl.getMetrics);

// Read ticket by id.
router.get('/:id', authMiddleware, permit('tickets', 'read'), ctrl.getById);

// Suggestions based on asset history.
router.get('/:id/suggestions', authMiddleware, permit('tickets', 'suggestions'), ctrl.getSuggestions);
// Ticket comments.
router.get('/:id/comentarios', authMiddleware, permit('tickets', 'read'), ctrl.getComments);
router.post('/:id/comentarios', authMiddleware, permit('tickets', 'update'), ctrl.addComment);
// Ticket history.
router.get('/:id/historial', authMiddleware, permit('tickets', 'read'), ctrl.getHistory);

// Create ticket (HU-05).
router.post('/', authMiddleware, permit('tickets', 'create'), ctrl.create);

// Update ticket fields (HU-06).
router.put('/:id', authMiddleware, permit('tickets', 'update'), ctrl.update);

// Change state with business validations.
router.patch('/:id/estado', authMiddleware, permit('tickets', 'change_estado'), ctrl.changeEstado);
// Assign ticket to technician.
router.post('/:id/asignar', authMiddleware, permit('tickets', 'assign'), ctrl.assign);

// Delete ticket.
router.delete('/:id', authMiddleware, permit('tickets', 'delete'), ctrl.remove);

export default router;
