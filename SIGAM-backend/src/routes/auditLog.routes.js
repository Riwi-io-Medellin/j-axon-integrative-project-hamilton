import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import permit from '../middlewares/permit.middleware.js';
import AuditLogController from '../controllers/auditLog.controller.js';
import AuditLogService from '../services/auditLog.service.js';

// Audit log routes and controller wiring.
const router = express.Router();
const ctrl = new AuditLogController(new AuditLogService());

// List audit log entries.
router.get('/', authMiddleware, permit('audit', 'list'), ctrl.getAll);
// Fetch a single audit log entry by id.
router.get('/:id', authMiddleware, permit('audit', 'read'), ctrl.getById);

export default router;
