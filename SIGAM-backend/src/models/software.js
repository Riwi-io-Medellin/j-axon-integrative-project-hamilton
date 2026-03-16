import BaseModel from './BaseModel.js';


// Data access for software catalog entries.
class SoftwareModel extends BaseModel {
    // List all software entries.
    async findAll() {
        return this.dbFindAll('software', 'id_software');
    }

    // Fetch a software entry by id.
    async findById(id) {
        return this.dbFindById('software', 'id_software', id);
    }

    // Create a new software entry.
    async create({ nombre, fabricante, version, proveedor, fecha_compra }) {
        return this.dbCreate('software', { nombre, fabricante, version, proveedor, fecha_compra });
    }

    // Update a software entry.
    async update(id, { nombre, fabricante, version, proveedor, fecha_compra }) {
        return this.dbUpdate('software', 'id_software', id, { nombre, fabricante, version, proveedor, fecha_compra });
    }

    // Delete a software entry.
    async remove(id) {
        return this.dbRemove('software', 'id_software', id);
    }

    // Assign software to asset.
    async assignToAsset({ id_software, id_activo, version_instalada }) {
        return this.dbCreate('software_activos', { id_software, id_activo, version_instalada });
    }

    async listByActivo(id_activo) {
        if (this.useSupabase) {
            const { data, error } = await this.supabase
                .from('software_activos')
                .select('*, software(nombre, fabricante, version, proveedor)')
                .eq('id_activo', id_activo);
            if (error) throw error;
            return data;
        }
        const { rows } = await this.query(
            `SELECT sa.*, s.nombre, s.fabricante, s.version, s.proveedor
             FROM software_activos sa
             LEFT JOIN software s ON s.id_software = sa.id_software
             WHERE sa.id_activo = $1`,
            [id_activo]
        );
        return rows;
    }

    async removeFromAsset(id_software, id_activo) {
        if (this.useSupabase) {
            const { data, error } = await this.supabase
                .from('software_activos')
                .delete()
                .eq('id_software', id_software)
                .eq('id_activo', id_activo)
                .select('*');
            if (error) throw error;
            return data?.[0] || null;
        }
        const { rows } = await this.query(
            `DELETE FROM software_activos
             WHERE id_software = $1 AND id_activo = $2
             RETURNING *`,
            [id_software, id_activo]
        );
        return rows[0] || null;
    }
}

export default SoftwareModel;
