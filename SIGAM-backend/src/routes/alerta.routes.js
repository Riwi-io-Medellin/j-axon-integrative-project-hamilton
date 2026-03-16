import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import permit from '../middlewares/permit.middleware.js';
import { validateRequired } from '../middlewares/validate.middleware.js';
import AlertaController from '../controllers/alerta.controller.js';
import AlertaService from '../services/alerta.service.js';
import AlertaModel from '../models/alerta.js';

const router = express.Router();
const controller = new AlertaController(new AlertaService(new AlertaModel()));

router.get('/', authMiddleware, permit('alertas', 'list'), controller.getAll);
router.patch('/:id/estado', authMiddleware, permit('alertas', 'update'), validateRequired(['estado']), controller.updateEstado);

export default router;
