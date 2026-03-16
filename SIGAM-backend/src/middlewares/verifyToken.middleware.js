import jwt from 'jsonwebtoken';
import AuditLogService from '../services/auditLog.service.js';
import buildAuditContext from '../utils/auditContext.js';

// Token verification middleware factory with audit logging.
const verifyToken = (auditLogService = new AuditLogService()) => {
    return (req, res, next) => {
        // Extract token from Authorization header.
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        // Missing token: log and reject.
        if (!token) {
            auditLogService.safeLog(
                auditLogService.buildDomainEntry({
                    actor: null,
                    context: buildAuditContext(req),
                    entidad: 'AUTH',
                    accion: 'AUTH_TOKEN_MISSING',
                    status: 'ERROR'
                })
            );
            return res.status(401).json({ message: 'Acceso denegado: Token no proporcionado' });
        }

        try {
            // Verify token signature and set req.user.
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            // Invalid token: log and reject.
            auditLogService.safeLog(
                auditLogService.buildDomainEntry({
                    actor: null,
                    context: buildAuditContext(req),
                    entidad: 'AUTH',
                    accion: 'AUTH_TOKEN_INVALID',
                    status: 'ERROR',
                    error
                })
            );
            return res.status(401).json({ message: 'Token no válido o expirado' });
        }
    };
};

export default verifyToken;
