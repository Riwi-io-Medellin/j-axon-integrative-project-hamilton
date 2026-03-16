import BaseModel from './BaseModel.js';


// Data access for licenses and assignments.
class LicenciaModel extends BaseModel {
    // List license occupancy via view.
    async findAll() {
        return this.dbFindAll('vw_licencias_ocupacion', 'id_licencia');
    }

    // Fetch a license by id with occupancy details.
    async findById(id) {
        return this.dbFindById('vw_licencias_ocupacion', 'id_licencia', id);
    }

    // Create a license record.
    async create({ id_software, clave_producto, fecha_expiracion, asientos_totales }) {
        return this.dbCreate('licencias', {
            id_software,
            clave_producto,
            fecha_expiracion,
            asientos_totales: asientos_totales ?? 1
        });
    }

    // Update expiration date or seat count.
    async update(id, { fecha_expiracion, asientos_totales }) {
        return this.dbUpdate('licencias', 'id_licencia', id, {
            fecha_expiracion,
            asientos_totales
        });
    }

    // Delete a license record.
    async remove(id) {
        return this.dbRemove('licencias', 'id_licencia', id);
    }

    // Create a license assignment to user or asset.
    async asignar({ id_licencia, id_usuario, id_activo }) {
        return this.dbCreate('asignacion_licencias', {
            id_licencia,
            id_usuario: id_usuario || null,
            id_activo: id_activo || null
        });
    }

    // List assignments for a license.
    async getAsignaciones(id_licencia) {
        if (this.useSupabase) {
            const { data, error } = await this.supabase
                .from('asignacion_licencias')
                .select('*, usuarios(nombre), activos(serial)')
                .eq('id_licencia', id_licencia);
            if (error) throw error;
            return data;
        }
        const { rows } = await this.query(
            `SELECT al.*, u.nombre as usuario, a.serial as activo
             FROM asignacion_licencias al
             LEFT JOIN usuarios u ON u.id_usuario = al.id_usuario
             LEFT JOIN activos a ON a.id_activo = al.id_activo
             WHERE al.id_licencia = $1`,
            [id_licencia]
        );
        return rows;
    }

    // Revoke a license assignment.
    async revocarAsignacion(id_asignacion) {
        return this.dbRemove('asignacion_licencias', 'id_asignacion', id_asignacion);
    }

    async findExpiring(days = 30) {
        const d = Number(days);
        const safeDays = Number.isInteger(d) && d > 0 ? d : 30;
        if (this.useSupabase) {
            const limitDate = new Date();
            limitDate.setDate(limitDate.getDate() + safeDays);
            const { data, error } = await this.supabase
                .from('licencias')
                .select('*')
                .lte('fecha_expiracion', limitDate.toISOString().split('T')[0]);
            if (error) throw error;
            return data || [];
        }
        const { rows } = await this.query(
            `SELECT * FROM licencias
             WHERE fecha_expiracion IS NOT NULL
              AND fecha_expiracion <= (CURRENT_DATE + ($1 * INTERVAL '1 day'))`,
            [safeDays]
        );
        return rows || [];
    }

    async hasAssignment({ id_licencia, id_usuario, id_activo }) {
        if (this.useSupabase) {
            let q = this.supabase.from('asignacion_licencias').select('id_asignacion').eq('id_licencia', id_licencia);
            if (id_usuario) q = q.eq('id_usuario', id_usuario);
            if (id_activo) q = q.eq('id_activo', id_activo);
            const { data, error } = await q.limit(1);
            if (error) throw error;
            return Array.isArray(data) && data.length > 0;
        }
        const { rows } = await this.query(
            `SELECT 1 FROM asignacion_licencias
             WHERE id_licencia = $1
               AND (($2::int IS NOT NULL AND id_usuario = $2::int) OR ($3::int IS NOT NULL AND id_activo = $3::int))
             LIMIT 1`,
            [id_licencia, id_usuario ?? null, id_activo ?? null]
        );
        return rows.length > 0;
    }

    // List license assignments for a specific asset.
    async findByActivo(id_activo) {
        const { rows } = await this.query(
            `SELECT al.*,
                    l.id_licencia AS licencia_id,
                    l.id_software,
                    l.clave_producto,
                    l.fecha_expiracion,
                    l.asientos_totales,
                    s.nombre AS software_nombre,
                    s.fabricante AS software_fabricante,
                    s.version AS software_version,
                    s.proveedor AS software_proveedor
             FROM asignacion_licencias al
             LEFT JOIN licencias l ON l.id_licencia = al.id_licencia
             LEFT JOIN software s ON s.id_software = l.id_software
             WHERE al.id_activo = $1
             ORDER BY al.id_asignacion DESC`,
            [id_activo]
        );
        return rows || [];
    }
}

export default LicenciaModel;
