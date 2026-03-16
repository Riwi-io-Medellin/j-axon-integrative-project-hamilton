import test from 'node:test';
import assert from 'node:assert/strict';
import IaJobsService from '../src/services/ia/jobs.service.js';

function createRepuestoModelStub(rows) {
    return {
        async getConsumptionWindowByRepuesto() {
            return rows;
        }
    };
}

function createAlertaModelStub() {
    return {
        ensured: [],
        async ensurePendingByTipoAndRepuesto(tipo, id_repuesto) {
            this.ensured.push({ tipo, id_repuesto });
            return { created: true, id_alerta: 1 };
        }
    };
}

test('IA-5 genera sugerencia cuando stock <= stock_minimo', async () => {
    const repuestoModel = createRepuestoModelStub([
        { id_repuesto: 1, nombre: 'RAM', stock: 2, stock_minimo: 5, consumido_window: 0 }
    ]);
    const alertaModel = createAlertaModelStub();
    const service = new IaJobsService({ repuestoModel, alertaModel });

    const result = await service.generatePurchaseSuggestions({ windowDays: 60, horizonDays: 30 });

    assert.equal(result.total_sugerencias, 1);
    assert.equal(alertaModel.ensured.length, 1);
    assert.equal(result.sugerencias[0].id_repuesto, 1);
});

test('IA-5 genera sugerencia cuando proyección de quiebre <= horizonte', async () => {
    const repuestoModel = createRepuestoModelStub([
        { id_repuesto: 2, nombre: 'SSD', stock: 10, stock_minimo: 1, consumido_window: 60 }
    ]);
    const alertaModel = createAlertaModelStub();
    const service = new IaJobsService({ repuestoModel, alertaModel });

    const result = await service.generatePurchaseSuggestions({ windowDays: 60, horizonDays: 30 });

    assert.equal(result.total_sugerencias, 1);
    assert.ok(result.sugerencias[0].dias_proyeccion_quiebre <= 30);
});

