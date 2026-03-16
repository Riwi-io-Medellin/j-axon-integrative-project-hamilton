import BaseModel from './BaseModel.js';


function toMillis(value) {
    if (!value) return null;
    const t = new Date(value).getTime();
    return Number.isNaN(t) ? null : t;
}

function averageHours(durationsMs) {
    if (!durationsMs.length) return null;
    const sum = durationsMs.reduce((acc, v) => acc + v, 0);
    return sum / durationsMs.length / 3600000;
}

function buildMetrics(rows) {
    const mttrSamples = [];
    const ticketsByActivo = new Map();

    for (const row of rows) {
        const inicio = toMillis(row.fecha_inicio);
        const fin = toMillis(row.fecha_fin);
        if (inicio !== null && fin !== null && fin >= inicio) {
            mttrSamples.push(fin - inicio);
        }

        const creado = toMillis(row.fecha_creacion);
        if (creado !== null && row.id_activo !== null && row.id_activo !== undefined) {
            const list = ticketsByActivo.get(row.id_activo) || [];
            list.push(creado);
            ticketsByActivo.set(row.id_activo, list);
        }
    }

    const mtbfSamples = [];
    for (const times of ticketsByActivo.values()) {
        if (times.length < 2) continue;
        times.sort((a, b) => a - b);
        for (let i = 1; i < times.length; i += 1) {
            const diff = times[i] - times[i - 1];
            if (diff >= 0) mtbfSamples.push(diff);
        }
    }

    return {
        mttr_hours: averageHours(mttrSamples),
        mtbf_hours: averageHours(mtbfSamples),
        mttr_samples: mttrSamples.length,
        mtbf_samples: mtbfSamples.length
    };
}

class MetricsModel extends BaseModel {
    async getDbLatency() {
        const start = process.hrtime.bigint();

        if (this.useSupabase) {
            const { error } = await this.supabase
                .from('activos')
                .select('id_activo', { head: true, count: 'exact' })
                .limit(1);
            if (error) throw error;
        } else {
            await this.query('SELECT 1');
        }

        const end = process.hrtime.bigint();
        const latencyMs = Number(end - start) / 1e6;
        return { latency_ms: Number(latencyMs.toFixed(2)) };
    }

    async getOperationalMetrics() {
        if (this.useSupabase) {
            const { data, error } = await this.supabase
                .from('tickets')
                .select('id_activo, fecha_creacion, ordenes_mantenimiento(fecha_inicio, fecha_fin)');
            if (error) throw error;

            const rows = (data || []).map((row) => ({
                id_activo: row.id_activo,
                fecha_creacion: row.fecha_creacion,
                fecha_inicio: row.ordenes_mantenimiento?.fecha_inicio || null,
                fecha_fin: row.ordenes_mantenimiento?.fecha_fin || null
            }));

            return buildMetrics(rows);
        }

        const { rows } = await this.query(
            `SELECT
                t.id_activo,
                t.fecha_creacion,
                om.fecha_inicio,
                om.fecha_fin
             FROM tickets t
             LEFT JOIN ordenes_mantenimiento om ON om.id_ticket = t.id_ticket`
        );

        return buildMetrics(rows);
    }

    async getSummaryMetrics() {
        const { rows } = await this.query(
            `SELECT
                (SELECT COUNT(*) FROM activos) AS total_activos,
                (SELECT COUNT(*) FROM ordenes_mantenimiento WHERE fecha_fin IS NULL) AS activos_en_mantenimiento,
                (SELECT COUNT(*) FROM tickets WHERE estado IN ('Abierto','Asignado','En Proceso')) AS tickets_abiertos,
                (SELECT COUNT(*) FROM tickets WHERE estado IN ('Resuelto','Cerrado')) AS tickets_cerrados,
                (SELECT COALESCE(SUM(cantidad_usada),0) FROM consumo_repuestos) AS consumo_repuestos`
        );
        return rows[0];
    }
}

export default MetricsModel;
