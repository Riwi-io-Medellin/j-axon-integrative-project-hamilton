import express from 'express';
import CategoriaTicketController from '../controllers/categoriaTicket.controller.js';
import CategoriaTicketService from '../services/categoriaTicket.service.js';
import CategoriaTicketModel from '../models/categoriaTicket.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import permit from '../middlewares/permit.middleware.js';
import { validateRequired } from '../middlewares/validate.middleware.js';

const router = express.Router();
const controller = new CategoriaTicketController(new CategoriaTicketService(new CategoriaTicketModel()));

router.get('/', authMiddleware, permit('categorias_ticket', 'list'), controller.getAll);
router.post('/', authMiddleware, permit('categorias_ticket', 'create'), validateRequired(['nombre']), controller.create);
router.put('/:id', authMiddleware, permit('categorias_ticket', 'update'), controller.update);
router.delete('/:id', authMiddleware, permit('categorias_ticket', 'delete'), controller.remove);

export default router;
