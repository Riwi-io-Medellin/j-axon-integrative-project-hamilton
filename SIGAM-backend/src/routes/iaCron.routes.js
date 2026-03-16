import express from 'express';
import IaJobsService from '../services/ia/jobs.service.js';
import cronAuth from '../middlewares/cronAuth.middleware.js';

const router = express.Router();
const service = new IaJobsService();

router.post('/repuestos/sugerencias', cronAuth, async (req, res, next) => {
    try {
        res.json(await service.generatePurchaseSuggestions(req.body || {}));
    } catch (error) { next(error); }
});

router.post('/activos/baja-sugerida', cronAuth, async (req, res, next) => {
    try {
        res.json(await service.generateDisposalSuggestions(req.body || {}));
    } catch (error) { next(error); }
});

router.post('/activos/obsolescencia', cronAuth, async (req, res, next) => {
    try {
        res.json(await service.generateObsolescenceAlerts(req.body || {}));
    } catch (error) { next(error); }
});

router.post('/tickets/reprocess', cronAuth, async (req, res, next) => {
    try {
        res.json(await service.reprocessTicketsExternal(req.body || {}));
    } catch (error) { next(error); }
});

router.post('/mantenimientos/preventivos', cronAuth, async (req, res, next) => {
    try {
        res.json(await service.generatePreventiveMaintenance(req.body || {}));
    } catch (error) { next(error); }
});

export default router;
