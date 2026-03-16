import BaseModel from './BaseModel.js';

// Ticket states considered "open" for workload calculations.
const OPEN_TICKET_STATES = ['Abierto', 'Asignado', 'En Proceso'];
// Roles allowed to receive automatic ticket assignments.
const SUPPORT_ROLES = new Set(['tecnico', 'soporte']);

// Normalize role strings to match case/diacritics across providers.
function normalizeRole(rol) {
    return String(rol || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

class TicketModel extends BaseModel {
    // Get cached suggestions for a ticket (if any).
    async getSuggestionsCache(id_ticket) {
        if (this.useSupabase) {
            const { data, error } = await this.supabase
                .from('ticket_sugerencias')
                .select('sugerencias, updated_at, created_at')
                .eq('id_ticket', id_ticket)
                .maybeSingle();
            if (error) throw error;
            return data || null;
        }
        const { rows } = await this.query(
            `SELECT sugerencias, updated_at, created_at
             FROM ticket_sugerencias
             WHERE id_ticket = $1
             LIMIT 1`,
            [id_ticket]
        );
        return rows?.[0] || null;
    }

    // Upsert suggestions cache for a ticket.
    async saveSuggestionsCache(id_ticket, sugerencias) {
        const payload = {
            id_ticket,
            sugerencias: JSON.stringify(sugerencias || []),
            updated_at: new Date().toISOString()
        };
        if (this.useSupabase) {
            const { data, error } = await this.supabase
                .from('ticket_sugerencias')
                .upsert(payload, { onConflict: 'id_ticket' })
                .select('id_ticket, sugerencias, updated_at')
                .single();
            if (error) throw error;
            return data || null;
        }
        const { rows } = await this.query(
            `INSERT INTO ticket_sugerencias (id_ticket, sugerencias, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (id_ticket)
             DO UPDATE SET sugerencias = EXCLUDED.sugerencias, updated_at = NOW()
             RETURNING id_ticket, sugerencias, updated_at`,
            [id_ticket, JSON.stringify(sugerencias || [])]
        );
        return rows?.[0] || null;
    }

    // List suggestion cache entries (useful for bulk reprocessing).
    async listSuggestionCaches({ limit = 50, offset = 0 } = {}) {
        if (this.useSupabase) {
            let query = this.supabase
                .from('ticket_sugerencias')
                .select('id_ticket, sugerencias, updated_at')
                .order('updated_at', { ascending: false });
            query = query.range(offset, offset + limit - 1);
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        }

        const params = [limit, offset];
        const { rows } = await this.query(
            `SELECT id_ticket, sugerencias, updated_at
             FROM ticket_sugerencias
             ORDER BY updated_at DESC
             LIMIT $1 OFFSET $2`,
            params
        );
        return rows || [];
    }

    // List tickets using the operational view for consistent joins.
    async findAll({ limit, offset } = {}) {
        if (this.useSupabase) {
            let query = this.supabase.from('vw_tickets_operacion').select('*');
            query = query.order('id_ticket', { ascending: false });
            if (limit !== undefined && offset !== undefined) {
                query = query.range(offset, offset + limit - 1);
            }
            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
        const params = [];
        let sql = 'SELECT * FROM vw_tickets_operacion ORDER BY id_ticket DESC';
        if (limit !== undefined && offset !== undefined) {
            params.push(limit, offset);
            sql += ' LIMIT $1 OFFSET $2';
        }
        const { rows } = await this.query(sql, params);
        return rows;
    }

    // Fetch a single ticket from the operational view.
    async findById(id) {
        return this.dbFindById('vw_tickets_operacion', 'id_ticket', id);
    }

    // Fetch a minimal ticket payload for IA processing.
    async findCoreById(id_ticket) {
        if (this.useSupabase) {
            const { data, error } = await this.supabase
                .from('tickets')
                .select('id_ticket, id_activo, id_usuario_reporta, descripcion, prioridad_ia, clasificacion_nlp, estado, fecha_creacion')
                .eq('id_ticket', id_ticket)
                .maybeSingle();
            if (error) throw error;
            return data || null;
        }
        const { rows } = await this.query(
            `SELECT id_ticket, id_activo, id_usuario_reporta, descripcion, prioridad_ia, clasificacion_nlp, estado, fecha_creacion
             FROM tickets
             WHERE id_ticket = $1`,
            [id_ticket]
        );
        return rows[0] || null;
    }

    // List tickets for a specific asset.
    async findByActivo(id_activo, { limit, offset } = {}) {
        if (this.useSupabase) {
            let query = this.supabase
                .from('vw_tickets_operacion')
                .select('*')
                .eq('id_activo', id_activo)
                .order('id_ticket', { ascending: false });
            if (limit !== undefined && offset !== undefined) {
                query = query.range(offset, offset + limit - 1);
            }
            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
        const params = [id_activo];
        let sql = 'SELECT * FROM vw_tickets_operacion WHERE id_activo = $1 ORDER BY id_ticket DESC';
        if (limit !== undefined && offset !== undefined) {
            params.push(limit, offset);
            sql += ' LIMIT $2 OFFSET $3';
        }
        const { rows } = await this.query(sql, params);
        return rows;
    }

    // Tickets assigned to a technician (via maintenance orders).
    async findAssignedByTecnico(id_tecnico, { limit, offset } = {}) {
        const params = [id_tecnico];
        let sql = `SELECT t.*
                   FROM vw_tickets_operacion t
                   JOIN ordenes_mantenimiento om ON om.id_ticket = t.id_ticket
                   WHERE om.id_usuario_tecnico = $1
                   ORDER BY t.id_ticket DESC`;
        if (limit !== undefined && offset !== undefined) {
            params.push(limit, offset);
            sql += ' LIMIT $2 OFFSET $3';
        }
        const { rows } = await this.query(sql, params);
        return rows || [];
    }

    // Get recent resolved tickets on the same asset for similarity checks.
    async findResolvedCandidatesByActivo({ id_activo, exclude_id_ticket, limit = 10 }) {
        const lim = Number.isInteger(limit) && limit > 0 ? limit : 10;
        const { rows } = await this.query(
            `SELECT
                t.id_ticket,
                t.fecha_creacion,
                t.estado,
                t.prioridad_ia,
                t.clasificacion_nlp,
                t.descripcion,
                om.diagnostico,
                om.acciones_realizadas
             FROM tickets t
             LEFT JOIN ordenes_mantenimiento om ON om.id_ticket = t.id_ticket
             WHERE t.id_activo = $1
               AND t.id_ticket <> $2
               AND t.estado IN ('Resuelto', 'Cerrado')
             ORDER BY t.fecha_creacion DESC
             LIMIT $3`,
            [id_activo, exclude_id_ticket, lim]
        );
        return rows || [];
    }

    // Detect if an asset already has an open preventive maintenance ticket.
    async hasOpenPreventiveTicket(id_activo) {
        const { rows } = await this.query(
            `SELECT 1
             FROM tickets
             WHERE id_activo = $1
               AND estado IN ('Abierto', 'Asignado', 'En Proceso')
               AND (tipo_ticket = 'Preventivo' OR descripcion ILIKE '%mantenimiento preventivo%')
             LIMIT 1`,
            [id_activo]
        );
        return rows.length > 0;
    }

    // Load recent tickets that need IA classification recalculation.
    async findTicketsForIaReprocess({ limit = 20, sinceDays = 30 } = {}) {
        const lim = Number(limit);
        const days = Number(sinceDays);
        const safeLimit = Number.isInteger(lim) && lim > 0 && lim <= 500 ? lim : 20;
        const safeDays = Number.isInteger(days) && days > 0 && days <= 3650 ? days : 30;

        const { rows } = await this.query(
            `SELECT
                id_ticket,
                id_activo,
                descripcion,
                clasificacion_nlp,
                prioridad_ia,
                clasificacion_metodo,
                prioridad_metodo,
                fecha_creacion
             FROM tickets
             WHERE fecha_creacion >= NOW() - ($1 * INTERVAL '1 day')
               AND (
                    clasificacion_metodo IS NULL
                    OR clasificacion_metodo = 'rules_v1'
                    OR prioridad_metodo IS NULL
                    OR prioridad_metodo = 'rules_v1'
               )
             ORDER BY fecha_creacion DESC
             LIMIT $2`,
            [safeDays, safeLimit]
        );
        return rows || [];
    }

    // Update IA fields with backward compatibility for older schemas.
    async updateIaFields(id_ticket, fields) {
        const {
            clasificacion_nlp,
            prioridad_ia,
            clasificacion_metodo,
            clasificacion_confidence,
            clasificacion_rationale,
            prioridad_metodo,
            prioridad_rationale
        } = fields || {};

        const baseUpdate = {
            clasificacion_nlp,
            prioridad_ia
        };

        const fullUpdate = {
            ...baseUpdate,
            clasificacion_metodo,
            clasificacion_confidence,
            clasificacion_rationale,
            prioridad_metodo,
            prioridad_rationale
        };

        if (this.useSupabase) {
            const attempt = async (payload) => {
                const { data, error } = await this.supabase
                    .from('tickets')
                    .update(payload)
                    .eq('id_ticket', id_ticket)
                    .select('*')
                    .single();
                if (error) throw error;
                return data || null;
            };

            try {
                return await attempt(fullUpdate);
            } catch (err) {
                const msg = String(err?.message || err?.details || err);
                const looksLikeMissingColumn =
                    msg.toLowerCase().includes('column') ||
                    msg.toLowerCase().includes('schema cache');
                if (!looksLikeMissingColumn) throw err;
                return attempt(baseUpdate);
            }
        }

        return this.dbUpdate('tickets', 'id_ticket', id_ticket, fullUpdate);
    }

    // Select the support technician with the lowest open-ticket load.
    async findSupportTechnicianWithLeastLoad() {
        if (this.useSupabase) {
            const { data: users, error: usersError } = await this.supabase
                .from('usuarios')
                .select('id_usuario, nombre, email, rol');
            if (usersError) throw usersError;

            const technicians = (users || []).filter((u) => SUPPORT_ROLES.has(normalizeRole(u.rol)));
            if (!technicians.length) return null;

            const techIds = technicians.map((t) => t.id_usuario);
            const { data: maintRows, error: maintError } = await this.supabase
                .from('ordenes_mantenimiento')
                .select('id_usuario_tecnico, tickets(estado)')
                .in('id_usuario_tecnico', techIds);
            if (maintError) throw maintError;

            const loadByTech = new Map(techIds.map((id) => [id, 0]));
            for (const row of maintRows || []) {
                const state = row?.tickets?.estado;
                if (OPEN_TICKET_STATES.includes(state)) {
                    const current = loadByTech.get(row.id_usuario_tecnico) || 0;
                    loadByTech.set(row.id_usuario_tecnico, current + 1);
                }
            }

            let selected = null;
            for (const tech of technicians) {
                const load = loadByTech.get(tech.id_usuario) || 0;
                if (!selected || load < selected.carga_abierta || (load === selected.carga_abierta && tech.id_usuario < selected.id_usuario)) {
                    selected = { id_usuario: tech.id_usuario, nombre: tech.nombre, email: tech.email, carga_abierta: load };
                }
            }
            return selected;
        }

        const { rows } = await this.query(
            `SELECT
                u.id_usuario,
                u.nombre,
                u.email,
                COUNT(t.id_ticket) AS carga_abierta
             FROM usuarios u
             LEFT JOIN ordenes_mantenimiento om ON om.id_usuario_tecnico = u.id_usuario
             LEFT JOIN tickets t
                ON t.id_ticket = om.id_ticket
               AND t.estado IN ('Abierto', 'Asignado', 'En Proceso')
             WHERE lower(translate(u.rol, 'ÃÃ‰ÃÃ“ÃšÃ¡Ã©Ã­Ã³Ãº', 'AEIOUaeiou')) IN ('tecnico', 'soporte')
             GROUP BY u.id_usuario, u.nombre, u.email
             ORDER BY COUNT(t.id_ticket) ASC, u.id_usuario ASC
             LIMIT 1`
        );
        const selected = rows?.[0];
        if (!selected) return null;
        return {
            id_usuario: selected.id_usuario,
            nombre: selected.nombre,
            email: selected.email,
            carga_abierta: Number(selected.carga_abierta) || 0
        };
    }

    // Create a ticket with optional IA metadata.
    async create({
        id_activo,
        id_usuario_reporta,
        descripcion,
        prioridad_ia,
        clasificacion_nlp,
        id_categoria_ticket,
        clasificacion_metodo,
        clasificacion_confidence,
        clasificacion_rationale,
        prioridad_metodo,
        prioridad_rationale,
        estado = 'Abierto',
        tipo_ticket = 'Correctivo',
        fecha_cierre = null
    }) {
        if (this.useSupabase) {
            const baseInsert = {
                id_activo,
                id_usuario_reporta,
                descripcion,
                prioridad_ia,
                clasificacion_nlp,
                estado,
                id_categoria_ticket,
                tipo_ticket,
                fecha_cierre
            };

            const fullInsert = {
                ...baseInsert,
                clasificacion_metodo,
                clasificacion_confidence,
                clasificacion_rationale,
                prioridad_metodo,
                prioridad_rationale
            };

            const attempt = async (payload) => {
                const { data, error } = await this.supabase
                    .from('tickets')
                    .insert(payload)
                    .select('*')
                    .single();
                if (error) throw error;
                return data;
            };

            try {
                return await attempt(fullInsert);
            } catch (err) {
                const msg = String(err?.message || err?.details || err);
                const looksLikeMissingColumn =
                    msg.toLowerCase().includes('column') ||
                    msg.toLowerCase().includes('schema cache');
                if (!looksLikeMissingColumn) throw err;
                return attempt(baseInsert);
            }
        }
        const { rows } = await this.query(
            `INSERT INTO tickets (
                id_activo,
                id_usuario_reporta,
                descripcion,
                prioridad_ia,
                clasificacion_nlp,
                id_categoria_ticket,
                clasificacion_metodo,
                clasificacion_confidence,
                clasificacion_rationale,
                prioridad_metodo,
                prioridad_rationale,
                estado,
                tipo_ticket,
                fecha_cierre
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
            [
                id_activo,
                id_usuario_reporta,
                descripcion,
                prioridad_ia,
                clasificacion_nlp,
                id_categoria_ticket,
                clasificacion_metodo,
                clasificacion_confidence,
                clasificacion_rationale,
                prioridad_metodo,
                prioridad_rationale,
                estado,
                tipo_ticket,
                fecha_cierre
            ]
        );
        return rows[0] || null;
    }

    // Assign a ticket to a technician and mark it as "Asignado".
    async assignToTechnician(id_ticket, id_usuario_tecnico) {
        if (this.useSupabase) {
            const { error: insertError } = await this.supabase
                .from('ordenes_mantenimiento')
                .insert({ id_ticket, id_usuario_tecnico });
            if (insertError) throw insertError;

            const { data: updated, error: updateError } = await this.supabase
                .from('tickets')
                .update({ estado: 'Asignado' })
                .eq('id_ticket', id_ticket)
                .select('*')
                .single();
            if (updateError) throw updateError;
            return updated || null;
        }

        await this.query(
            `INSERT INTO ordenes_mantenimiento (id_ticket, id_usuario_tecnico) VALUES ($1,$2)`,
            [id_ticket, id_usuario_tecnico]
        );
        const { rows } = await this.query(
            `UPDATE tickets SET estado = 'Asignado' WHERE id_ticket = $1 RETURNING *`,
            [id_ticket]
        );
        return rows[0] || null;
    }

    // Update core IA fields and ticket state.
    async update(id, { prioridad_ia, clasificacion_nlp, estado, id_categoria_ticket, tipo_ticket, fecha_cierre }) {
        return this.dbUpdate('tickets', 'id_ticket', id, { prioridad_ia, clasificacion_nlp, estado, id_categoria_ticket, tipo_ticket, fecha_cierre });
    }

    // Update only the ticket state.
    async updateEstado(id, estado, fecha_cierre = null) {
        return this.dbUpdate('tickets', 'id_ticket', id, { estado, fecha_cierre });
    }

    async addComment({ id_ticket, id_usuario, comentario }) {
        return this.dbCreate('ticket_comentarios', { id_ticket, id_usuario, comentario });
    }

    async listComments(id_ticket) {
        if (this.useSupabase) {
            const { data, error } = await this.supabase
                .from('ticket_comentarios')
                .select('*, usuarios(nombre)')
                .eq('id_ticket', id_ticket)
                .order('fecha_comentario', { ascending: false });
            if (error) throw error;
            return data;
        }
        const { rows } = await this.query(
            `SELECT tc.*, u.nombre AS usuario_nombre
             FROM ticket_comentarios tc
             LEFT JOIN usuarios u ON u.id_usuario = tc.id_usuario
             WHERE tc.id_ticket = $1
             ORDER BY tc.fecha_comentario DESC`,
            [id_ticket]
        );
        return rows;
    }

    async addHistory({ id_ticket, id_usuario, cambio, detalle }) {
        return this.dbCreate('ticket_historial', { id_ticket, id_usuario, cambio, detalle });
    }

    async listHistory(id_ticket) {
        if (this.useSupabase) {
            const { data, error } = await this.supabase
                .from('ticket_historial')
                .select('*, usuarios(nombre)')
                .eq('id_ticket', id_ticket)
                .order('fecha_evento', { ascending: false });
            if (error) throw error;
            return data;
        }
        const { rows } = await this.query(
            `SELECT th.*, u.nombre AS usuario_nombre
             FROM ticket_historial th
             LEFT JOIN usuarios u ON u.id_usuario = th.id_usuario
             WHERE th.id_ticket = $1
             ORDER BY th.fecha_evento DESC`,
            [id_ticket]
        );
        return rows;
    }

    // Check if a ticket was reported by a given user.
    async isReportedByUser(id_ticket, id_usuario) {
        if (this.useSupabase) {
            const { data, error } = await this.supabase
                .from('tickets')
                .select('id_ticket')
                .eq('id_ticket', id_ticket)
                .eq('id_usuario_reporta', id_usuario)
                .limit(1);
            if (error) throw error;
            return Array.isArray(data) && data.length > 0;
        }
        const { rows } = await this.query(
            `SELECT 1
             FROM tickets
             WHERE id_ticket = $1
               AND id_usuario_reporta = $2
             LIMIT 1`,
            [id_ticket, id_usuario]
        );
        return rows.length > 0;
    }

    // Close a ticket and register the consumed spare parts.
    async closeWithConsumos(id_ticket, consumos) {
        if (!Array.isArray(consumos) || consumos.length === 0) {
            throw { status: 400, message: 'consumos es requerido' };
        }

        if (this.useSupabase) {
            const values = [];
            const params = [id_ticket];
            consumos.forEach((item) => {
                values.push(`($${params.length + 1}, $${params.length + 2})`);
                params.push(item.id_repuesto, item.cantidad_usada);
            });

            const sql = `
                WITH orden AS (
                    SELECT id_orden FROM ordenes_mantenimiento WHERE id_ticket = $1
                ),
                ins AS (
                    INSERT INTO consumo_repuestos (id_orden, id_repuesto, cantidad_usada)
                    SELECT orden.id_orden, v.id_repuesto, v.cantidad_usada
                    FROM orden
                    JOIN (VALUES ${values.join(', ')}) AS v(id_repuesto, cantidad_usada) ON true
                    RETURNING 1
                ),
                upd AS (
                    UPDATE tickets
                    SET estado = 'Cerrado', fecha_cierre = NOW()
                    WHERE id_ticket = $1 AND EXISTS (SELECT 1 FROM orden)
                    RETURNING *
                )
                SELECT
                    (SELECT COUNT(*) FROM orden) AS orden_exists,
                    (SELECT COUNT(*) FROM ins) AS inserted,
                    (SELECT id_ticket FROM upd) AS id_ticket
            `;

            const { rows } = await this.query(sql, params);
            const meta = rows?.[0];
            if (!meta || Number(meta.orden_exists) === 0) {
                throw { status: 404, message: `Orden no encontrada para ticket ${id_ticket}` };
            }
            if (!meta.id_ticket) {
                throw { status: 404, message: `Ticket ${id_ticket} no encontrado` };
            }
            return this.findById(id_ticket);
        }

        if (typeof this.db.transaction !== 'function') {
            throw { status: 500, message: 'Transacciones no soportadas en el adaptador actual' };
        }

        return this.transaction(async (client) => {
            const order = await client.query(
                'SELECT id_orden FROM ordenes_mantenimiento WHERE id_ticket = $1',
                [id_ticket]
            );
            const id_orden = order.rows?.[0]?.id_orden;
            if (!id_orden) {
                throw { status: 404, message: `Orden no encontrada para ticket ${id_ticket}` };
            }

            for (const item of consumos) {
                await client.query(
                    `INSERT INTO consumo_repuestos (id_orden, id_repuesto, cantidad_usada)
                     VALUES ($1,$2,$3)`,
                    [id_orden, item.id_repuesto, item.cantidad_usada]
                );
            }

            const updated = await client.query(
                `UPDATE tickets SET estado = 'Cerrado', fecha_cierre = NOW() WHERE id_ticket = $1 RETURNING *`,
                [id_ticket]
            );
            if (!updated.rows?.length) {
                throw { status: 404, message: `Ticket ${id_ticket} no encontrado` };
            }
            return updated.rows[0];
        });
    }

    // Verify if a ticket is assigned to the given technician.
    async isAssignedToTecnico(id_ticket, id_tecnico) {
        if (this.useSupabase) {
            const { data, error } = await this.supabase
                .from('ordenes_mantenimiento')
                .select('id_orden')
                .eq('id_ticket', id_ticket)
                .eq('id_usuario_tecnico', id_tecnico)
                .limit(1);
            if (error) throw error;
            return Array.isArray(data) && data.length > 0;
        }
        const { rows } = await this.query(
            `SELECT 1
             FROM ordenes_mantenimiento
             WHERE id_ticket = $1
               AND id_usuario_tecnico = $2
             LIMIT 1`,
            [id_ticket, id_tecnico]
        );
        return rows.length > 0;
    }

    // Remove a ticket record.
    async remove(id) {
        return this.dbRemove('tickets', 'id_ticket', id);
    }

    // Compute MTTR/MTBF metrics optionally filtered by asset.
    async getMetrics({ id_activo } = {}) {
        const { rows } = await this.query(
            `WITH mttr AS (
                SELECT AVG(EXTRACT(EPOCH FROM (om.fecha_fin - om.fecha_inicio))) AS mttr_seconds,
                       COUNT(*) AS reparaciones
                FROM ordenes_mantenimiento om
                JOIN tickets t ON t.id_ticket = om.id_ticket
                WHERE om.fecha_inicio IS NOT NULL AND om.fecha_fin IS NOT NULL
                  AND t.estado IN ('Resuelto', 'Cerrado')
                  AND ($1::int IS NULL OR t.id_activo = $1::int)
             ),
             mtbf AS (
                SELECT AVG(EXTRACT(EPOCH FROM (fecha_creacion - prev_fecha))) AS mtbf_seconds,
                       COUNT(*) AS intervalos
                FROM (
                    SELECT id_activo, fecha_creacion,
                           LAG(fecha_creacion) OVER (PARTITION BY id_activo ORDER BY fecha_creacion) AS prev_fecha
                    FROM tickets
                    WHERE estado IN ('Resuelto', 'Cerrado')
                      AND ($1::int IS NULL OR id_activo = $1::int)
                ) x
                WHERE prev_fecha IS NOT NULL
             )
             SELECT
                COALESCE(mttr.mttr_seconds, 0) AS mttr_seconds,
                COALESCE(mtbf.mtbf_seconds, 0) AS mtbf_seconds,
                COALESCE(mttr.reparaciones, 0) AS reparaciones,
                COALESCE(mtbf.intervalos, 0) AS intervalos
             FROM mttr, mtbf`,
            [id_activo ?? null]
        );
        return rows[0] || {
            mttr_seconds: 0,
            mtbf_seconds: 0,
            reparaciones: 0,
            intervalos: 0
        };
    }
}

export default TicketModel;
