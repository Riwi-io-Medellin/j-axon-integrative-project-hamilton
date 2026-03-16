import { generateToken } from '../utils/jwt.js';
import buildAuditContext from '../utils/auditContext.js';

// Auth controller: HTTP layer for login and registration flows.
class AuthController {
    constructor(authService) {
        this.authService = authService;
        this.login = this.login.bind(this);
        this.register = this.register.bind(this);
        this.requestPasswordReset = this.requestPasswordReset.bind(this);
        this.resetPassword = this.resetPassword.bind(this);
    }

    // Authenticate credentials, issue JWT, and return user profile.
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const user = await this.authService.login(email, password, buildAuditContext(req));
            const token = generateToken({ id: user.id, role: user.role });
            res.status(200).json({ token, user });
        } catch (error) {
            if (!error.status) error.status = 401;
            next(error);
        }
    }

    // Register a new user (role assignment enforced in the service).
    async register(req, res, next) {
        try {
            const user = await this.authService.register(req.body, req.user, buildAuditContext(req));
            res.status(201).json(user);
        } catch (error) {
            next(error);
        }
    }

    // Request a password reset token.
    async requestPasswordReset(req, res, next) {
        try {
            const { email } = req.body;
            const result = await this.authService.requestPasswordReset(email, buildAuditContext(req));
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    // Reset password with token.
    async resetPassword(req, res, next) {
        try {
            const { token, password } = req.body;
            const result = await this.authService.resetPassword(token, password, buildAuditContext(req));
            res.json({ message: 'Password actualizado', user: result });
        } catch (error) {
            next(error);
        }
    }
}

export default AuthController;
