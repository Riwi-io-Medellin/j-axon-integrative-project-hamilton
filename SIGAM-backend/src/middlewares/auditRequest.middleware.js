import AuditLogService from '../services/auditLog.service.js';

// Middleware that logs each request/response to the audit log.
const auditRequest = (auditLogService = new AuditLogService()) => {
    return (req, res, next) => {
        // Track request start time for latency calculation.
        const start = req?.context?.started_at_ms || Date.now();

        // Log once the response has finished.
        res.on('finish', () => {
            const durationMs = Date.now() - start;
            const statusCode = res.statusCode;
            const status = statusCode >= 400 ? 'ERROR' : 'OK';

            auditLogService.safeLog(
                auditLogService.buildRequestEntry({
                    req,
                    resStatusCode: statusCode,
                    durationMs,
                    status
                })
            );
        });

        // Continue the request pipeline.
        next();
    };
};

export default auditRequest;
