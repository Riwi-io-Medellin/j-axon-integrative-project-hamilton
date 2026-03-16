import AuditLogModel from '../models/auditLog.js';

// Limits for stored text and JSON payloads.
const DEFAULT_MAX_TEXT = 2000;
const DEFAULT_MAX_JSON = 20000;

// Keys that must be redacted from audit payloads.
const SENSITIVE_KEYS = new Set([
    'password',
    'password_hash',
    'authorization',
    'token',
    'jwt',
    'api_ia',
    'supabase_anon_key',
    'jwt_secret'
]);

// Truncate long strings to avoid oversized logs.
function truncateText(value, maxLen = DEFAULT_MAX_TEXT) {
    const s = String(value ?? '');
    if (s.length <= maxLen) return s;
    return s.slice(0, maxLen) + '...';
}

// Normalize object keys for sensitive checks.
function sanitizeKey(key) {
    return String(key || '').toLowerCase().trim();
}

// Sanitize payloads while enforcing size limits and redacting secrets.
function sanitizeValue(value, budget) {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') {
        const t = truncateText(value, DEFAULT_MAX_TEXT);
        budget.count += t.length;
        return t;
    }
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    if (Array.isArray(value)) {
        return value.slice(0, 50).map((v) => sanitizeValue(v, budget));
    }
    if (typeof value === 'object') {
        const out = {};
        const entries = Object.entries(value).slice(0, 100);
        for (const [k, v] of entries) {
            const normalized = sanitizeKey(k);
            if (SENSITIVE_KEYS.has(normalized)) {
                out[k] = '[REDACTED]';
                continue;
            }
            out[k] = sanitizeValue(v, budget);
            if (budget.count > DEFAULT_MAX_JSON) break;
        }
        return out;
    }
    return String(value);
}

// Infer domain entity from the request path.
function inferEntidadFromRoute(path) {
    const p = String(path || '').split('?')[0];
    const parts = p.split('/').filter(Boolean);
    const apiIdx = parts.indexOf('api');
    const segment = apiIdx >= 0 ? parts[apiIdx + 1] : parts[0];
    return String(segment || 'unknown').toUpperCase();
}

// Service for recording and querying audit log entries.
class AuditLogService {
    constructor(model = new AuditLogModel()) {
        this.model = model;
    }

    // Safely store an audit entry without breaking the request flow.
    async safeLog(entry) {
        try {
            const budget = { count: 0 };
            const payload_before = entry?.payload_before ? sanitizeValue(entry.payload_before, budget) : null;
            const payload_after = entry?.payload_after ? sanitizeValue(entry.payload_after, budget) : null;
            const metadata = entry?.metadata ? sanitizeValue(entry.metadata, budget) : null;

            await this.model.create({
                fecha_evento: entry?.fecha_evento,
                id_usuario_actor: entry?.id_usuario_actor ?? null,
                rol_actor: entry?.rol_actor ?? null,
                actor_email: entry?.actor_email ?? null,
                source: entry?.source ?? 'api',
                request_id: entry?.request_id ?? null,
                ruta: entry?.ruta ?? null,
                metodo: entry?.metodo ?? null,
                ip: entry?.ip ?? null,
                user_agent: entry?.user_agent ?? null,
                duration_ms: entry?.duration_ms ?? null,
                entidad: entry?.entidad ?? null,
                entidad_id: entry?.entidad_id ?? null,
                accion: entry?.accion ?? null,
                status: entry?.status ?? 'OK',
                http_status: entry?.http_status ?? null,
                error_code: entry?.error_code ?? null,
                error_message: entry?.error_message ? truncateText(entry.error_message, DEFAULT_MAX_TEXT) : null,
                payload_before,
                payload_after,
                metadata
            });
        } catch {
            // Keep main flow running if audit logging fails.
        }
    }

    // Build an audit entry for a request/response cycle.
    buildRequestEntry({ req, resStatusCode, durationMs, status, error }) {
        const path = req?.originalUrl || req?.url;
        const entidad = inferEntidadFromRoute(path);
        const accion = `${String(req?.method || 'UNKNOWN').toUpperCase()}_REQUEST`;

        return {
            id_usuario_actor: req?.user?.id ?? null,
            rol_actor: req?.user?.role ?? null,
            source: 'api',
            request_id: req?.context?.request_id ?? null,
            ruta: path ?? null,
            metodo: req?.method ?? null,
            ip: req?.context?.ip ?? null,
            user_agent: req?.context?.user_agent ?? null,
            duration_ms: Number.isFinite(durationMs) ? durationMs : null,
            entidad,
            accion,
            status: status || 'OK',
            http_status: resStatusCode ?? null,
            error_message: error ? String(error?.message || error) : null,
            metadata: {
                params: req?.params,
                query: req?.query
            }
        };
    }

    // Build an audit entry for a domain action.
    buildDomainEntry({
        actor,
        context,
        entidad,
        entidad_id,
        accion,
        status,
        error,
        payload_before,
        payload_after,
        metadata
    }) {
        return {
            id_usuario_actor: actor?.id ?? null,
            rol_actor: actor?.role ?? null,
            actor_email: actor?.email ?? null,
            source: 'api',
            request_id: context?.request_id ?? null,
            ruta: context?.ruta ?? null,
            metodo: context?.metodo ?? null,
            ip: context?.ip ?? null,
            user_agent: context?.user_agent ?? null,
            entidad: entidad ?? null,
            entidad_id: entidad_id !== undefined && entidad_id !== null ? String(entidad_id) : null,
            accion: accion ?? null,
            status: status || (error ? 'ERROR' : 'OK'),
            error_message: error ? String(error?.message || error) : null,
            payload_before,
            payload_after,
            metadata
        };
    }

    // List audit entries with filters and pagination.
    findAll(filters) {
        return this.model.findAll(filters);
    }

    // Fetch a single audit entry by id.
    async findById(id) {
        const row = await this.model.findById(id);
        if (!row) throw { status: 404, message: `AuditLog ${id} no encontrado` };
        return row;
    }
}

export default AuditLogService;
