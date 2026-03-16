import express from 'express';
import AuthController from '../controllers/auth.controller.js';
import AuthService from '../services/auth.service.js';
import UserModel from '../models/User.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import optionalAuth from '../middlewares/optionalAuth.middleware.js';
import permit from '../middlewares/permit.middleware.js';
import { validateRequired } from '../middlewares/validate.middleware.js';
import rateLimit from 'express-rate-limit';

// Auth module routes: public login/register and protected role-based endpoints.
const router = express.Router();

// Controller wiring with service + model dependencies.
const authController = new AuthController(new AuthService(new UserModel()));

// Rate limiter for login attempts to reduce brute-force risk.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false
});

// Public registration: required fields are validated before controller.
router.post('/register', validateRequired(['nombre', 'email', 'password']), authController.register);
// Public login: rate limited and required fields validated.
router.post('/login', loginLimiter, validateRequired(['email', 'password']), authController.login);
// Public password reset flow.
router.post('/forgot-password', validateRequired(['email']), authController.requestPasswordReset);
router.post('/reset-password', validateRequired(['token', 'password']), authController.resetPassword);

// Protected endpoints to validate role permissions.
router.get('/admin-panel', authMiddleware, permit('auth', 'admin_panel'), (req, res) => {
    res.json({ msg: 'Bienvenido, Gerente' });
});

router.get('/configuracion', authMiddleware, permit('auth', 'configuracion'), (req, res) => {
    res.json({ msg: 'Acceso a configuración técnica' });
});

router.get('/perfil', authMiddleware, permit('auth', 'perfil'), (req, res) => {
    res.json({ msg: 'Tu perfil de usuario' });
});

export default router;
