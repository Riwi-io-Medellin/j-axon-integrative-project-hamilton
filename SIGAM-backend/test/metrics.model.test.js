import test from 'node:test';
import assert from 'node:assert/strict';
import MetricsModel from '../src/models/metrics.js';
import db from '../src/config/db.js';

test('MetricsModel.getOperationalMetrics calcula MTTR y MTBF en horas', async () => {
    const model = new MetricsModel();
    const originalQuery = db.query.bind(db);

    db.query = async () => ({
        rows: [
            {
                id_activo: 1,
                fecha_creacion: '2026-01-01T00:00:00Z',
                fecha_inicio: '2026-01-01T01:00:00Z',
                fecha_fin: '2026-01-01T05:00:00Z'
            },
            {
                id_activo: 1,
                fecha_creacion: '2026-01-03T00:00:00Z',
                fecha_inicio: '2026-01-03T02:00:00Z',
                fecha_fin: '2026-01-03T03:00:00Z'
            },
            {
                id_activo: 2,
                fecha_creacion: '2026-01-02T00:00:00Z',
                fecha_inicio: null,
                fecha_fin: null
            }
        ]
    });

    try {
        const metrics = await model.getOperationalMetrics();
        assert.equal(metrics.mttr_samples, 2);
        assert.equal(metrics.mtbf_samples, 1);
        assert.equal(metrics.mttr_hours, 2.5);
        assert.equal(metrics.mtbf_hours, 48);
    } finally {
        db.query = originalQuery;
    }
});
