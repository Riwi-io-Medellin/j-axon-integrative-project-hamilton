import express from 'express';
import authMiddleware from '../middlewares/auth.middleware.js';
import permit from '../middlewares/permit.middleware.js';
import IaJobsController from '../controllers/iaJobs.controller.js';
import IaJobsService from '../services/ia/jobs.service.js';

// IA jobs routes and controller wiring.
const router = express.Router();
const ctrl = new IaJobsController(new IaJobsService());

// Generate purchase suggestions for spare parts.
router.post(
    '/repuestos/sugerencias',
    authMiddleware,
    permit('ia_jobs', 'purchase_suggestions'),
    ctrl.generatePurchaseSuggestions
);

// Generate asset disposal suggestions.
router.post(
    '/activos/baja-sugerida',
    authMiddleware,
    permit('ia_jobs', 'disposal_suggestions'),
    ctrl.generateDisposalSuggestions
);

// Generate obsolescence alerts for assets.
router.post(
    '/activos/obsolescencia',
    authMiddleware,
    permit('ia_jobs', 'obsolescence_alerts'),
    ctrl.generateObsolescenceAlerts
);

// Reprocess tickets for IA classification and priority.
router.post(
    '/tickets/reprocess',
    authMiddleware,
    permit('ia_jobs', 'ticket_reprocess'),
    ctrl.reprocessTicketsExternal
);

// Generate preventive maintenance suggestions.
router.post(
    '/mantenimientos/preventivos',
    authMiddleware,
    permit('ia_jobs', 'preventive_maintenance'),
    ctrl.generatePreventiveMaintenance
);

export default router;
