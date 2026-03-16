import BaseModel from './BaseModel.js';

// Normalize query params to a safe positive integer range.
function normalizePositiveInt(value, { min = 1, max = 1000, defaultValue }) {
    if (value === undefined || value === null || value === '') return defaultValue;
    const n = Number.parseInt(String(value), 10);
    if (!Number.isInteger(n) || n < min || n > max) return defaultValue;
    return n;
}

// Data access for audit log records.
class AuditLogModel extends BaseModel {
    // Create an audit log entry.
    async create(payload) {
        return this.dbCreate('audit_log', payload);
    }

    // Fetch a single audit log entry by id.
    async findById(id) {
        return this.dbFindById('audit_log', 'id_audit', id);
    }

    // List audit log entries with optional filters and pagination.
    async findAll({
        limit = 50,
        offset = 0,
        from,
        to,
        entidad,
        entidad_id,
        accion,
        status,
        id_usuario_actor
    } = {}) {
        const lim = normalizePositiveInt(limit, { min: 1, max: 200, defaultValue: 50 });
        const off = normalizePositiveInt(offset, { min: 0, max: 1000000, defaultValue: 0 });

        const where = [];
        const params = [];

        if (from) {
            params.push(from);
            where.push(`fecha_evento >= $${params.length}`);
        }
        if (to) {
            params.push(to);
            where.push(`fecha_evento <= $${params.length}`);
        }
        if (entidad) {
            params.push(entidad);
            where.push(`entidad = $${params.length}`);
        }
        if (entidad_id) {
            params.push(entidad_id);
            where.push(`entidad_id = $${params.length}`);
        }
        if (accion) {
            params.push(accion);
            where.push(`accion = $${params.length}`);
        }
        if (status) {
            params.push(status);
            where.push(`status = $${params.length}`);
        }
        if (id_usuario_actor) {
            params.push(id_usuario_actor);
            where.push(`id_usuario_actor = $${params.length}`);
        }

        params.push(lim);
        params.push(off);

        const sql = `
            SELECT *
            FROM audit_log
            ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
            ORDER BY fecha_evento DESC, id_audit DESC
            LIMIT $${params.length - 1}
            OFFSET $${params.length}
        `;

        const { rows } = await this.query(sql, params);
        return rows || [];
    }
}

export default AuditLogModel;
