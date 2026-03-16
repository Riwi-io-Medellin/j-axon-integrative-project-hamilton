class MetricsService {
    constructor(model) {
        this.model = model;
    }

    getOperationalMetrics() {
        return this.model.getOperationalMetrics();
    }

    getSummaryMetrics() {
        return this.model.getSummaryMetrics();
    }

    getDbLatency() {
        return this.model.getDbLatency();
    }
}

export default MetricsService;
