import express from 'express';
import ReportController from '../controllers/report.controller.js';
import ReportService from '../services/report.service.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import permit from '../middlewares/permit.middleware.js';

const router = express.Router();
const controller = new ReportController(new ReportService());

router.get('/activos', authMiddleware, permit('reportes', 'list'), controller.activos);
router.get('/tickets', authMiddleware, permit('reportes', 'list'), controller.tickets);
router.get('/mantenimientos', authMiddleware, permit('reportes', 'list'), controller.mantenimientos);
router.get('/licencias', authMiddleware, permit('reportes', 'list'), controller.licencias);
router.get('/inventario', authMiddleware, permit('reportes', 'list'), controller.inventario);
router.get('/consumo-repuestos', authMiddleware, permit('reportes', 'list'), controller.consumoRepuestos);

export default router;
