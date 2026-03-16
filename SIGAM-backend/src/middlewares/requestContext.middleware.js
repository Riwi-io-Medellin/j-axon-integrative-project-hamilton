import { randomUUID } from 'node:crypto';

// Resolve client IP from headers or connection info.
function getIp(req) {
    const xff = req.headers?.['x-forwarded-for'];
    if (xff) return String(xff).split(',')[0].trim();
    return req.ip || req.connection?.remoteAddress || null;
}

// Attach request-scoped metadata used by auditing and tracing.
const requestContext = (req, _res, next) => {
    req.context = {
        request_id: randomUUID(),
        started_at_ms: Date.now(),
        ip: getIp(req),
        user_agent: req.headers?.['user-agent'] || null
    };
    next();
};

export default requestContext;
