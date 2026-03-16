import BaseModel from './BaseModel.js';

// Assets model: DB access for assets and related history.
class AssetModel extends BaseModel {
    // List assets with view-based details.
    async findAll({ limit, offset } = {}) {
        if (this.useSupabase) {
            let query = this.supabase.from('vw_activos_detalle').select('*');
            query = query.order('id_activo', { ascending: true });
            if (limit !== undefined && offset !== undefined) {
                query = query.range(offset, offset + limit - 1);
            }
            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
        const params = [];
        let sql = 'SELECT * FROM vw_activos_detalle ORDER BY id_activo ASC';
        if (limit !== undefined && offset !== undefined) {
            params.push(limit, offset);
            sql += ' LIMIT $1 OFFSET $2';
        }
        const { rows } = await this.query(sql, params);
        return rows;
    }

    async findAllFiltered({ categoria, sede, piso, sala, limit, offset } = {}) {
        if (this.useSupabase) {
            let query = this.supabase.from('vw_activos_detalle').select('*');
            if (categoria) query = query.eq('nombre_categoria', categoria);
            if (sede) query = query.eq('sede', sede);
            if (piso) query = query.eq('piso', piso);
            if (sala) query = query.eq('sala', sala);
            query = query.order('id_activo', { ascending: true });
            if (limit !== undefined && offset !== undefined) {
                query = query.range(offset, offset + limit - 1);
            }
            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
        const filters = [];
        const params = [];
        if (categoria) {
            params.push(categoria);
            filters.push(`nombre_categoria = $${params.length}`);
        }
        if (sede) {
            params.push(sede);
            filters.push(`sede = $${params.length}`);
        }
        if (piso) {
            params.push(piso);
            filters.push(`piso = $${params.length}`);
        }
        if (sala) {
            params.push(sala);
            filters.push(`sala = $${params.length}`);
        }
        const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
        let sql = `SELECT * FROM vw_activos_detalle ${where} ORDER BY id_activo ASC`;
        if (limit !== undefined && offset !== undefined) {
            params.push(limit, offset);
            sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
        }
        const { rows } = await this.query(sql, params);
        return rows;
    }

    // Read asset detail by id.
    async findById(id) {
        return this.dbFindById('vw_activos_detalle', 'id_activo', id);
    }

    // Find asset by serial for uniqueness checks.
    async findBySerial(serial) {
        return this.dbFindById('activos', 'serial', serial, ['id_activo', 'serial']);
    }

    // Create asset and insert a history entry.
    async create(payload) {
        const {
            serial, modelo, fecha_compra, vida_util, codigo_qr,
            nivel_criticidad, especificaciones_electricas,
            id_ubicacion, id_categoria, id_proveedor,
            costo_compra
        } = payload;

        let activo;

        if (this.useSupabase) {
            const { data, error } = await this.supabase
                .from('activos')
                .insert({
                    serial, codigo_qr, modelo, fecha_compra, vida_util,
                    nivel_criticidad: nivel_criticidad || 'Media',
                    especificaciones_electricas, id_ubicacion, id_categoria, id_proveedor,
                    costo_compra
                })
                .select().single();
            if (error) throw error;
            activo = data;

            await this.supabase.from('historial_activos').insert({
                id_activo: activo.id_activo,
                tipo_evento: 'Registro',
                detalle: 'Activo creado en el sistema'
            });
        } else {
            const { rows } = await this.query(
                `INSERT INTO activos (serial, codigo_qr, modelo, fecha_compra, vida_util, nivel_criticidad,
                    especificaciones_electricas, id_ubicacion, id_categoria, id_proveedor, costo_compra)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
                [serial, codigo_qr, modelo, fecha_compra, vida_util, nivel_criticidad || 'Media',
                especificaciones_electricas, id_ubicacion, id_categoria, id_proveedor, costo_compra]
            );
            activo = rows[0];
            await this.query(
                `INSERT INTO historial_activos (id_activo, tipo_evento, detalle)
                 VALUES ($1, 'Registro', 'Activo creado en el sistema')`,
                [activo.id_activo]
            );
        }
        return activo;
    }

    // Update asset fields (Supabase and SQL paths supported).
    async update(id, payload) {
        const { modelo, vida_util, nivel_criticidad, especificaciones_electricas, estado_activo,
                id_ubicacion, id_categoria, id_proveedor, costo_compra } = payload;

        if (this.useSupabase) {
            const updateData = {};
            if (modelo !== undefined) updateData.modelo = modelo;
            if (vida_util !== undefined) updateData.vida_util = vida_util;
            if (nivel_criticidad !== undefined) updateData.nivel_criticidad = nivel_criticidad;
            if (especificaciones_electricas !== undefined) updateData.especificaciones_electricas = especificaciones_electricas;
            if (estado_activo !== undefined) updateData.estado_activo = estado_activo;
            if (id_ubicacion !== undefined) updateData.id_ubicacion = id_ubicacion;
            if (id_categoria !== undefined) updateData.id_categoria = id_categoria;
            if (id_proveedor !== undefined) updateData.id_proveedor = id_proveedor;
            if (costo_compra !== undefined) updateData.costo_compra = costo_compra;

            const { data, error } = await this.supabase
                .from('activos').update(updateData)
                .eq('id_activo', id).select().single();
            if (error) throw error;
            return data || null;
        }

        const { rows } = await this.query(
            `UPDATE activos SET
                modelo = COALESCE($1, modelo), vida_util = COALESCE($2, vida_util),
                nivel_criticidad = COALESCE($3, nivel_criticidad),
                especificaciones_electricas = COALESCE($4, especificaciones_electricas),
                estado_activo = COALESCE($5, estado_activo),
                id_ubicacion = COALESCE($6, id_ubicacion), id_categoria = COALESCE($7, id_categoria),
                id_proveedor = COALESCE($8, id_proveedor),
                costo_compra = COALESCE($9, costo_compra)
             WHERE id_activo = $10 RETURNING *`,
            [modelo, vida_util, nivel_criticidad, especificaciones_electricas, estado_activo,
            id_ubicacion, id_categoria, id_proveedor, costo_compra, id]
        );
        return rows[0] || null;
    }

    // Aggregate repair parts cost in a sliding window for IA-6.
    async getRepairPartsCostWindowByActivo({ windowDays = 365 } = {}) {
        const days = Number(windowDays);
        if (!Number.isInteger(days) || days <= 0 || days > 3650) {
            throw { status: 400, message: 'windowDays inválido' };
        }

        const { rows } = await this.query(
            `WITH min_price AS (
                SELECT id_repuesto, MIN(precio) AS precio_unit
                FROM catalogo_precios_proveedores
                GROUP BY id_repuesto
            ),
            consumo AS (
                SELECT
                    t.id_activo,
                    SUM(cr.cantidad_usada * COALESCE(mp.precio_unit, 0))::numeric AS costo_repuestos_window
                FROM consumo_repuestos cr
                JOIN ordenes_mantenimiento om ON om.id_orden = cr.id_orden
                JOIN tickets t ON t.id_ticket = om.id_ticket
                LEFT JOIN min_price mp ON mp.id_repuesto = cr.id_repuesto
                WHERE COALESCE(om.fecha_fin, om.fecha_inicio, t.fecha_creacion, NOW()) >= NOW() - ($1 * INTERVAL '1 day')
                GROUP BY t.id_activo
            )
            SELECT
                a.id_activo,
                a.serial,
                a.modelo,
                a.costo_compra,
                COALESCE(c.costo_repuestos_window, 0) AS costo_repuestos_window
            FROM activos a
            LEFT JOIN consumo c ON c.id_activo = a.id_activo
            ORDER BY a.id_activo ASC`,
            [days]
        );
        return rows || [];
    }

    // Find assets that exceed a given age in months.
    async findObsolescenceCandidates({ months = 48, limit = 50 } = {}) {
        const m = Number(months);
        const lim = Number(limit);
        if (!Number.isInteger(m) || m <= 0 || m > 2400) {
            throw { status: 400, message: 'months inválido' };
        }
        if (!Number.isInteger(lim) || lim <= 0 || lim > 500) {
            throw { status: 400, message: 'limit inválido' };
        }

        const { rows } = await this.query(
            `SELECT id_activo, serial, modelo, fecha_compra, vida_util
             FROM activos
             WHERE fecha_compra IS NOT NULL
               AND fecha_compra <= (CURRENT_DATE - ($1 * INTERVAL '1 month'))
             ORDER BY fecha_compra ASC
             LIMIT $2`,
            [m, lim]
        );
        return rows || [];
    }

    // Insert asset retirement record.
    async remove(id, motivoBaja, certificadoBorrado) {
        if (this.useSupabase) {
            const { data, error } = await this.supabase
                .from('bajas_activos')
                .insert({
                    id_activo: id,
                    fecha_baja: new Date().toISOString().split('T')[0],
                    motivo: motivoBaja,
                    borrado_seguro: certificadoBorrado
                }).select().single();
            if (error) throw error;
            await this.supabase
                .from('activos')
                .update({ estado_activo: false })
                .eq('id_activo', id);
            return data;
        }
        const { rows } = await this.query(
            `INSERT INTO bajas_activos (id_activo, fecha_baja, motivo, borrado_seguro)
             VALUES ($1, CURRENT_DATE, $2, $3) RETURNING *`,
            [id, motivoBaja, certificadoBorrado]
        );
        await this.query(
            `UPDATE activos SET estado_activo = FALSE WHERE id_activo = $1`,
            [id]
        );
        return rows[0];
    }

    // Read asset history ordered by newest first.
    async getHistory(id) {
        if (this.useSupabase) {
            const { data, error } = await this.supabase
                .from('historial_activos').select('*')
                .eq('id_activo', id).order('fecha_evento', { ascending: false });
            if (error) throw error;
            return data;
        }
        const { rows } = await this.query(
            `SELECT * FROM historial_activos WHERE id_activo = $1 ORDER BY fecha_evento DESC`, [id]
        );
        return rows;
    }

    // Add a history entry for an asset.
    async addHistory(id_activo, tipo_evento, detalle) {
        if (this.useSupabase) {
            const { data, error } = await this.supabase
                .from('historial_activos')
                .insert({ id_activo, tipo_evento, detalle })
                .select()
                .single();
            if (error) throw error;
            return data;
        }
        const { rows } = await this.query(
            `INSERT INTO historial_activos (id_activo, tipo_evento, detalle)
             VALUES ($1, $2, $3) RETURNING *`,
            [id_activo, tipo_evento, detalle]
        );
        return rows[0];
    }

    // Assign asset to user (close previous assignment).
    async assignToUser(id_activo, id_usuario) {
        if (this.useSupabase) {
            await this.supabase
                .from('asignacion_activos')
                .update({ activo: false, fecha_fin: new Date().toISOString().split('T')[0] })
                .eq('id_activo', id_activo)
                .eq('activo', true);
            const { data, error } = await this.supabase
                .from('asignacion_activos')
                .insert({ id_activo, id_usuario, activo: true })
                .select('*')
                .single();
            if (error) throw error;
            return data;
        }
        await this.query(
            `UPDATE asignacion_activos
             SET activo = FALSE, fecha_fin = CURRENT_DATE
             WHERE id_activo = $1 AND activo = TRUE`,
            [id_activo]
        );
        const { rows } = await this.query(
            `INSERT INTO asignacion_activos (id_activo, id_usuario, activo)
             VALUES ($1, $2, TRUE) RETURNING *`,
            [id_activo, id_usuario]
        );
        return rows[0];
    }

    async unassign(id_asignacion) {
        return this.dbUpdate('asignacion_activos', 'id_asignacion', id_asignacion, {
            activo: false,
            fecha_fin: new Date()
        });
    }

    async getAssignments(id_activo) {
        if (this.useSupabase) {
            const { data, error } = await this.supabase
                .from('asignacion_activos')
                .select('*, usuarios(nombre, email)')
                .eq('id_activo', id_activo)
                .order('fecha_asignacion', { ascending: false });
            if (error) throw error;
            return data;
        }
        const { rows } = await this.query(
            `SELECT aa.*, u.nombre AS usuario_nombre, u.email AS usuario_email
             FROM asignacion_activos aa
             LEFT JOIN usuarios u ON u.id_usuario = aa.id_usuario
             WHERE aa.id_activo = $1
             ORDER BY aa.fecha_asignacion DESC`,
            [id_activo]
        );
        return rows;
    }

    async addDocumento({ id_activo, nombre, tipo, url }) {
        return this.dbCreate('documentos_activo', { id_activo, nombre, tipo, url });
    }

    async getDocumentos(id_activo) {
        if (this.useSupabase) {
            const { data, error } = await this.supabase
                .from('documentos_activo')
                .select('*')
                .eq('id_activo', id_activo)
                .order('fecha_subida', { ascending: false });
            if (error) throw error;
            return data;
        }
        return this.dbFindAll('documentos_activo', 'fecha_subida', 'DESC', '*')
            .then((rows) => rows.filter((r) => Number(r.id_activo) === Number(id_activo)));
    }

    // Candidates for preventive maintenance based on interval.
    async findPreventiveMaintenanceCandidates({ intervalDays = 180, limit = 50 } = {}) {
        const interval = Number(intervalDays);
        const lim = Number(limit);
        const safeInterval = Number.isInteger(interval) && interval > 0 && interval <= 3650 ? interval : 180;
        const safeLimit = Number.isInteger(lim) && lim > 0 && lim <= 500 ? lim : 50;

        const { rows } = await this.query(
            `WITH last_maint AS (
                SELECT
                    a.id_activo,
                    MAX(COALESCE(om.fecha_fin, om.fecha_inicio, t.fecha_creacion)) AS last_event
                FROM activos a
                LEFT JOIN tickets t ON t.id_activo = a.id_activo
                LEFT JOIN ordenes_mantenimiento om ON om.id_ticket = t.id_ticket
                WHERE a.estado_activo = TRUE
                  AND (t.id_ticket IS NULL OR t.estado IN ('Resuelto', 'Cerrado'))
                GROUP BY a.id_activo
            )
            SELECT
                a.id_activo,
                a.serial,
                a.modelo,
                a.fecha_compra,
                a.nivel_criticidad,
                COALESCE(lm.last_event, a.fecha_compra::timestamp) AS last_event,
                (COALESCE(lm.last_event, a.fecha_compra::timestamp) + ($1 * INTERVAL '1 day')) AS next_due
            FROM activos a
            LEFT JOIN last_maint lm ON lm.id_activo = a.id_activo
            WHERE a.estado_activo = TRUE
              AND (COALESCE(lm.last_event, a.fecha_compra::timestamp) + ($1 * INTERVAL '1 day')) <= NOW()
            ORDER BY next_due ASC, a.id_activo ASC
            LIMIT $2`,
            [safeInterval, safeLimit]
        );
        return rows || [];
    }
}

export default AssetModel;
