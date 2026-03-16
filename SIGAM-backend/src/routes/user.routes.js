import express from 'express';
import UserController from '../controllers/user.controller.js';
import UserService from '../services/user.service.js';
import UserModel from '../models/User.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import permit from '../middlewares/permit.middleware.js';
import { validateRequired } from '../middlewares/validate.middleware.js';

// Users module routes: list, create, role changes, and password reset.
const router = express.Router();

// Controller wiring with service + model dependencies.
const userController = new UserController(new UserService(new UserModel()));

// List users (protected, role-based).
router.get('/', authMiddleware, permit('users', 'list'), userController.getAll);
// Create user (protected, role-based, requires fields).
router.post('/', authMiddleware, permit('users', 'create'), validateRequired(['nombre', 'email', 'password', 'rol']), userController.create);
// Update basic user data.
router.patch('/:id', authMiddleware, permit('users', 'update'), userController.update);
// Update role for a user (protected, Manager only).
router.patch('/:id/rol', authMiddleware, permit('users', 'update_role'), validateRequired(['rol']), userController.updateRole);
// Reset password for a user (protected, Manager only).
router.patch('/:id/password', authMiddleware, permit('users', 'reset_password'), validateRequired(['password']), userController.resetPassword);
// Delete user (soft/hard depending on model implementation).
router.delete('/:id', authMiddleware, permit('users', 'delete'), userController.remove);

export default router;
