import AssetModel from '../models/Asset.js';
import TicketModel from '../models/Ticket.js';
import MaintenanceModel from '../models/Maintenance.js';
import LicenciaModel from '../models/licencia.js';
import RepuestoModel from '../models/repuesto.js';

class ReportService {
    constructor({ assetModel, ticketModel, maintenanceModel, licenciaModel, repuestoModel } = {}) {
        this.assetModel = assetModel || new AssetModel();
        this.ticketModel = ticketModel || new TicketModel();
        this.maintenanceModel = maintenanceModel || new MaintenanceModel();
        this.licenciaModel = licenciaModel || new LicenciaModel();
        this.repuestoModel = repuestoModel || new RepuestoModel();
    }

    activos(filters) { return this.assetModel.findAllFiltered(filters); }
    tickets() { return this.ticketModel.findAll(); }
    mantenimientos() { return this.maintenanceModel.findAll(); }
    licencias() { return this.licenciaModel.findAll(); }
    inventario() { return this.repuestoModel.findAll(); }

    async consumoRepuestos() {
        const { rows } = await this.repuestoModel.query(
            `SELECT r.id_repuesto, r.nombre, COALESCE(SUM(cr.cantidad_usada),0) AS total_consumido
             FROM repuestos r
             LEFT JOIN consumo_repuestos cr ON cr.id_repuesto = r.id_repuesto
             GROUP BY r.id_repuesto, r.nombre
             ORDER BY total_consumido DESC`
        );
        return rows;
    }
}

export default ReportService;
