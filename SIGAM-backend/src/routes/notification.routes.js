import express from 'express';
import NotificationController from '../controllers/notification.controller.js';
import NotificationService from '../services/notification.service.js';
import NotificationModel from '../models/notification.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import permit from '../middlewares/permit.middleware.js';

const router = express.Router();
const controller = new NotificationController(new NotificationService(new NotificationModel()));

router.get('/', authMiddleware, permit('notificaciones', 'list'), controller.getAll);

export default router;
