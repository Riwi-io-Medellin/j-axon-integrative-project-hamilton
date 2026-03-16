// Controller for IA batch jobs.
class IaJobsController {
    constructor(service) {
        this.service = service;
        // Bind methods for Express handlers.
        ['generatePurchaseSuggestions', 'generateDisposalSuggestions', 'generateObsolescenceAlerts', 'reprocessTicketsExternal', 'generatePreventiveMaintenance']
            .forEach((m) => (this[m] = this[m].bind(this)));
    }

    // Generate purchase suggestions based on consumption windows.
    async generatePurchaseSuggestions(req, res, next) {
        try {
            const windowDays = req.body?.windowDays ?? req.query?.windowDays;
            const horizonDays = req.body?.horizonDays ?? req.query?.horizonDays;
            res.json(await this.service.generatePurchaseSuggestions({ windowDays, horizonDays }));
        } catch (e) {
            next(e);
        }
    }

    // Generate disposal suggestions for underused assets.
    async generateDisposalSuggestions(req, res, next) {
        try {
            const windowDays = req.body?.windowDays ?? req.query?.windowDays;
            const thresholdPct = req.body?.thresholdPct ?? req.query?.thresholdPct;
            res.json(await this.service.generateDisposalSuggestions({ windowDays, thresholdPct }));
        } catch (e) {
            next(e);
        }
    }

    // Generate obsolescence alerts for assets.
    async generateObsolescenceAlerts(req, res, next) {
        try {
            const months = req.body?.months ?? req.query?.months;
            const limit = req.body?.limit ?? req.query?.limit;
            res.json(await this.service.generateObsolescenceAlerts({ months, limit }));
        } catch (e) {
            next(e);
        }
    }

    // Reprocess tickets using the IA decision engine.
    async reprocessTicketsExternal(req, res, next) {
        try {
            const limit = req.body?.limit ?? req.query?.limit;
            const sinceDays = req.body?.sinceDays ?? req.query?.sinceDays;
            res.json(await this.service.reprocessTicketsExternal({ limit, sinceDays }));
        } catch (e) {
            next(e);
        }
    }

    // Generate preventive maintenance tickets based on usage intervals.
    async generatePreventiveMaintenance(req, res, next) {
        try {
            const intervalDays = req.body?.intervalDays ?? req.query?.intervalDays;
            const scheduleOffsetDays = req.body?.scheduleOffsetDays ?? req.query?.scheduleOffsetDays;
            const limit = req.body?.limit ?? req.query?.limit;
            res.json(await this.service.generatePreventiveMaintenance({
                intervalDays,
                scheduleOffsetDays,
                limit,
                reporterUserId: req.user?.id
            }));
        } catch (e) {
            next(e);
        }
    }
}

export default IaJobsController;
