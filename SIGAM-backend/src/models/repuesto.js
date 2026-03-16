import BaseModel from './BaseModel.js';


// Data access for spare parts inventory.
class RepuestoModel extends BaseModel {
    // List all spare parts.
    async findAll() {
        return this.dbFindAll('repuestos', 'id_repuesto');
    }

    // Fetch a spare part by id.
    async findById(id) {
        return this.dbFindById('repuestos', 'id_repuesto', id);
    }

    // List spare parts below minimum stock via view.
    async findBajoStock() {
        return this.dbFindAll('vw_repuestos_bajo_stock');
    }

    // Create a spare part with default stock values.
    async create({ nombre, stock, stock_minimo }) {
        return this.dbCreate('repuestos', {
            nombre,
            stock: stock ?? 0,
            stock_minimo: stock_minimo ?? 5
        });
    }

    // Update a spare part record.
    async update(id, { nombre, stock, stock_minimo }) {
        return this.dbUpdate('repuestos', 'id_repuesto', id, {
            nombre,
            stock,
            stock_minimo
        });
    }

    // Remove a spare part record.
    async remove(id) {
        return this.dbRemove('repuestos', 'id_repuesto', id);
    }

    // Aggregate consumption window to support forecasting.
    async getConsumptionWindowByRepuesto({ windowDays = 60 } = {}) {
        const days = Number(windowDays);
        if (!Number.isInteger(days) || days <= 0 || days > 3650) {
            throw { status: 400, message: 'windowDays inválido' };
        }

        const { rows } = await this.query(
            `WITH consumo AS (
                SELECT
                    cr.id_repuesto,
                    SUM(cr.cantidad_usada)::numeric AS consumido_window
                FROM consumo_repuestos cr
                JOIN ordenes_mantenimiento om ON om.id_orden = cr.id_orden
                LEFT JOIN tickets t ON t.id_ticket = om.id_ticket
                WHERE COALESCE(om.fecha_fin, om.fecha_inicio, t.fecha_creacion, NOW()) >= NOW() - ($1 * INTERVAL '1 day')
                GROUP BY cr.id_repuesto
            )
            SELECT
                r.id_repuesto,
                r.nombre,
                r.stock,
                r.stock_minimo,
                COALESCE(c.consumido_window, 0) AS consumido_window
            FROM repuestos r
            LEFT JOIN consumo c ON c.id_repuesto = r.id_repuesto
            ORDER BY r.id_repuesto ASC`,
            [days]
        );
        return rows || [];
    }

    // List spare parts consumption for a specific asset.
    async findConsumosByActivo(id_activo) {
        const { rows } = await this.query(
            `SELECT cr.*, r.nombre AS repuesto_nombre,
                    om.id_ticket, t.descripcion AS ticket_descripcion, t.estado AS ticket_estado
             FROM consumo_repuestos cr
             LEFT JOIN repuestos r ON r.id_repuesto = cr.id_repuesto
             LEFT JOIN ordenes_mantenimiento om ON om.id_orden = cr.id_orden
             LEFT JOIN tickets t ON t.id_ticket = om.id_ticket
             WHERE t.id_activo = $1
             ORDER BY cr.id_orden DESC, cr.id_repuesto ASC`,
            [id_activo]
        );
        return rows || [];
    }
}

export default RepuestoModel;
