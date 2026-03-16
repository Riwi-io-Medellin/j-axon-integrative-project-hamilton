import test from 'node:test';
import assert from 'node:assert/strict';
import IaJobsService from '../src/services/ia/jobs.service.js';

function createAssetModelStub(rows) {
    return {
        async getRepairPartsCostWindowByActivo() {
            return rows;
        }
    };
}

function createAlertaModelStub() {
    return {
        ensured: [],
        async ensurePendingByTipoAndActivo(tipo, id_activo) {
            this.ensured.push({ tipo, id_activo });
            return { created: true, id_alerta: 1 };
        }
    };
}

test('IA-6 sugiere baja si costo repuestos / costo_compra >= umbral', async () => {
    const assetModel = createAssetModelStub([
        { id_activo: 1, serial: 'SN-000001', modelo: 'X', costo_compra: 1000, costo_repuestos_window: 700 }
    ]);
    const alertaModel = createAlertaModelStub();
    const service = new IaJobsService({ assetModel, alertaModel, repuestoModel: {} });

    const result = await service.generateDisposalSuggestions({ windowDays: 365, thresholdPct: 0.6 });

    assert.equal(result.total_sugerencias, 1);
    assert.equal(alertaModel.ensured.length, 1);
    assert.equal(result.sugerencias[0].id_activo, 1);
});

test('IA-6 omite activos sin costo_compra', async () => {
    const assetModel = createAssetModelStub([
        { id_activo: 2, serial: 'SN-000002', modelo: 'Y', costo_compra: null, costo_repuestos_window: 999 }
    ]);
    const alertaModel = createAlertaModelStub();
    const service = new IaJobsService({ assetModel, alertaModel, repuestoModel: {} });

    const result = await service.generateDisposalSuggestions({ windowDays: 365, thresholdPct: 0.6 });

    assert.equal(result.total_sugerencias, 0);
    assert.equal(result.activos_sin_costo_compra, 1);
});

