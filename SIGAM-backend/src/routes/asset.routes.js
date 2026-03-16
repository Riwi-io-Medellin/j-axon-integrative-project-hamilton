import express from 'express';
import AssetController from '../controllers/asset.controller.js';
import AssetService from '../services/asset.service.js';
import AssetModel from '../models/Asset.js';
import TicketService from '../services/ticket.service.js';
import TicketModel from '../models/Ticket.js';
import MaintenanceService from '../services/maintenance.service.js';
import MaintenanceModel from '../models/Maintenance.js';
import LicenciaService from '../services/licencia.service.js';
import LicenciaModel from '../models/licencia.js';
import RepuestoService from '../services/repuesto.service.js';
import RepuestoModel from '../models/repuesto.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import permit from '../middlewares/permit.middleware.js';
import { validateRequired } from '../middlewares/validate.middleware.js';

// Assets module routes: CRUD + history.
const router = express.Router();
// Controller wiring with service + model dependencies.
const assetController = new AssetController(new AssetService(new AssetModel()), {
    ticketService: new TicketService(new TicketModel()),
    maintenanceService: new MaintenanceService(new MaintenanceModel()),
    licenciaService: new LicenciaService(new LicenciaModel()),
    repuestoService: new RepuestoService(new RepuestoModel())
});

// GET /activos — listar todos (con detalle de vista)
// List assets (view includes joined detail data).
router.get('/',
    authMiddleware,
    permit('assets', 'list'),
    assetController.getAll
);

// GET /activos/:id — obtener uno
// Read a single asset by id.
router.get('/:id',
    authMiddleware,
    permit('assets', 'read'),
    assetController.getById
);

// GET /activos/:id/historial — hoja de vida del activo
// Asset history entries.
router.get('/:id/historial',
    authMiddleware,
    permit('assets', 'history'),
    assetController.getHistory
);

// GET /activos/:id/hoja-vida â€” alias de historial
router.get('/:id/hoja-vida',
    authMiddleware,
    permit('assets', 'history'),
    assetController.getHistory
);

// GET /activos/:id/tickets â€” tickets del activo
router.get('/:id/tickets',
    authMiddleware,
    permit('tickets', 'by_activo'),
    assetController.getTickets
);

// GET /activos/:id/mantenimientos â€” ordenes de mantenimiento del activo
router.get('/:id/mantenimientos',
    authMiddleware,
    permit('maintenance', 'list'),
    assetController.getMantenimientos
);

// GET /activos/:id/piezas â€” repuestos consumidos por el activo
router.get('/:id/piezas',
    authMiddleware,
    permit('maintenance', 'consumos'),
    assetController.getPiezas
);

// GET /activos/:id/licencias â€” licencias asignadas al activo
router.get('/:id/licencias',
    authMiddleware,
    permit('licencias', 'list'),
    assetController.getLicencias
);

// GET /activos/:id/asignaciones — historial de asignaciones
router.get('/:id/asignaciones',
    authMiddleware,
    permit('assets', 'read'),
    assetController.getAssignments
);

// POST /activos/:id/asignar — asignar activo a usuario
router.post('/:id/asignar',
    authMiddleware,
    permit('assets', 'assign'),
    validateRequired(['id_usuario']),
    assetController.assign
);

// PATCH /activos/asignaciones/:id_asignacion/fin — desasignar
router.patch('/asignaciones/:id_asignacion/fin',
    authMiddleware,
    permit('assets', 'assign'),
    assetController.unassign
);

// GET /activos/:id/documentos — documentos adjuntos
router.get('/:id/documentos',
    authMiddleware,
    permit('assets', 'read'),
    assetController.getDocumentos
);

// POST /activos/:id/documentos — agregar documento
router.post('/:id/documentos',
    authMiddleware,
    permit('assets', 'update'),
    validateRequired(['nombre', 'url']),
    assetController.addDocumento
);

// POST /activos — crear activo
// Create asset (required fields validated).
router.post('/',
    authMiddleware,
    permit('assets', 'create'),
    validateRequired(['serial', 'fecha_compra', 'vida_util']),
    assetController.create
);

// PUT /activos/:id — actualizar activo
// Update asset fields.
router.put('/:id',
    authMiddleware,
    permit('assets', 'update'),
    assetController.update
);

// DELETE /activos/:id — baja segura (ISO 27001)
// Secure asset retirement (requires reason and wipe certificate).
router.delete('/:id',
    authMiddleware,
    permit('assets', 'delete'),
    validateRequired(['motivo_baja', 'certificado_borrado']),
    assetController.remove
);

export default router;
