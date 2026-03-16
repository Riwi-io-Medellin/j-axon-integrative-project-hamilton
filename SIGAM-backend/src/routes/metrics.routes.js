import express from 'express';
import MetricsController from '../controllers/metrics.controller.js';
import MetricsService from '../services/metrics.service.js';
import MetricsModel from '../models/metrics.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import permit from '../middlewares/permit.middleware.js';

const router = express.Router();
const ctrl = new MetricsController(new MetricsService(new MetricsModel()));

// GET /metricas/operacion
router.get('/operacion', authMiddleware, permit('metrics', 'operacion'), ctrl.getOperational);
router.get('/resumen', authMiddleware, permit('metrics', 'resumen'), ctrl.getSummary);
router.get('/latencia', authMiddleware, permit('metrics', 'latencia'), ctrl.getDbLatency);

export default router;
