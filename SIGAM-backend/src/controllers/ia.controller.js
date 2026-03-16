import { getIaConfig } from '../config/ia.js';
import DecisionEngine from '../services/ia/DecisionEngine.js';

class IaController {
    constructor() {
        this.engine = new DecisionEngine(getIaConfig());
        this.health = this.health.bind(this);
    }

    async health(req, res, next) {
        try {
            const result = await this.engine.healthCheck();
            res.status(result.ok ? 200 : 503).json(result);
        } catch (e) {
            next(e);
        }
    }
}

export default IaController;
