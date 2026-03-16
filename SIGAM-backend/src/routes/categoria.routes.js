import express from 'express';
import CategoriaController from '../controllers/categoria.controller.js';
import CategoriaService from '../services/categoria.service.js';
import CategoriaModel from '../models/categoria.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import permit from '../middlewares/permit.middleware.js';

const router = express.Router();
const ctrl = new CategoriaController(new CategoriaService(new CategoriaModel()));

// GET /categorias
router.get('/', authMiddleware, permit('categorias', 'list'), ctrl.getAll);

export default router;
