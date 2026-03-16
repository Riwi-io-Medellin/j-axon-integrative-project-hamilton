import BaseModel from './BaseModel.js';

class AlertaModel extends BaseModel {
    async findPendingByTipoAndRepuesto(tipo, id_repuesto) {
        if (this.useSupabase) {
            const { data, error } = await this.supabase
                .from('alertas')
                .select('id_alerta')
                .eq('tipo', tipo)
                .eq('id_repuesto', id_repuesto)
                .eq('estado', 'Pendiente')
                .limit(1);
            if (error) throw error;
            return Array.isArray(data) && data.length ? data[0] : null;
        }
        const { rows } = await this.query(
            `SELECT id_alerta
             FROM alertas
             WHERE tipo = $1 AND id_repuesto = $2 AND estado = 'Pendiente'
             LIMIT 1`,
            [tipo, id_repuesto]
        );
        return rows?.[0] || null;
    }

    async create({ tipo, id_activo = null, id_repuesto = null, estado = 'Pendiente' }) {
        return this.dbCreate('alertas', { tipo, id_activo, id_repuesto, estado });
    }

    async ensurePendingByTipoAndRepuesto(tipo, id_repuesto) {
        const existing = await this.findPendingByTipoAndRepuesto(tipo, id_repuesto);
        if (existing) return { created: false, id_alerta: existing.id_alerta };
        const created = await this.create({ tipo, id_repuesto, estado: 'Pendiente' });
        return { created: true, id_alerta: created?.id_alerta || null };
    }

    async findPendingByTipoAndActivo(tipo, id_activo) {
        if (this.useSupabase) {
            const { data, error } = await this.supabase
                .from('alertas')
                .select('id_alerta')
                .eq('tipo', tipo)
                .eq('id_activo', id_activo)
                .eq('estado', 'Pendiente')
                .limit(1);
            if (error) throw error;
            return Array.isArray(data) && data.length ? data[0] : null;
        }
        const { rows } = await this.query(
            `SELECT id_alerta
             FROM alertas
             WHERE tipo = $1 AND id_activo = $2 AND estado = 'Pendiente'
             LIMIT 1`,
            [tipo, id_activo]
        );
        return rows?.[0] || null;
    }

    async ensurePendingByTipoAndActivo(tipo, id_activo) {
        const existing = await this.findPendingByTipoAndActivo(tipo, id_activo);
        if (existing) return { created: false, id_alerta: existing.id_alerta };
        const created = await this.create({ tipo, id_activo, estado: 'Pendiente' });
        return { created: true, id_alerta: created?.id_alerta || null };
    }

    async findAll({ estado, tipo, id_activo, id_repuesto, limit = 100, offset = 0 } = {}) {
        const lim = Number(limit);
        const off = Number(offset);
        const limSafe = Number.isInteger(lim) && lim > 0 && lim <= 500 ? lim : 100;
        const offSafe = Number.isInteger(off) && off >= 0 ? off : 0;

        if (this.useSupabase) {
            let query = this.supabase.from('alertas').select('*');
            if (estado) query = query.eq('estado', estado);
            if (tipo) query = query.eq('tipo', tipo);
            if (id_activo) query = query.eq('id_activo', id_activo);
            if (id_repuesto) query = query.eq('id_repuesto', id_repuesto);
            query = query.order('fecha_generacion', { ascending: false }).range(offSafe, offSafe + limSafe - 1);
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        }

        const filters = [];
        const params = [];
        if (estado) {
            params.push(estado);
            filters.push(`estado = $${params.length}`);
        }
        if (tipo) {
            params.push(tipo);
            filters.push(`tipo = $${params.length}`);
        }
        if (id_activo) {
            params.push(id_activo);
            filters.push(`id_activo = $${params.length}`);
        }
        if (id_repuesto) {
            params.push(id_repuesto);
            filters.push(`id_repuesto = $${params.length}`);
        }
        params.push(limSafe);
        const limIdx = params.length;
        params.push(offSafe);
        const offIdx = params.length;

        const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
        const { rows } = await this.query(
            `SELECT * FROM alertas
             ${whereClause}
             ORDER BY fecha_generacion DESC
             LIMIT $${limIdx} OFFSET $${offIdx}`,
            params
        );
        return rows || [];
    }

    async updateEstado(id_alerta, estado) {
        return this.dbUpdate('alertas', 'id_alerta', id_alerta, { estado });
    }
}

export default AlertaModel;
