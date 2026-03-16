import test from 'node:test';
import assert from 'node:assert/strict';
import IaJobsService from '../src/services/ia/jobs.service.js';

function createAuditStub() {
    return {
        entries: [],
        buildDomainEntry(payload) { return payload; },
        async safeLog(entry) { this.entries.push(entry); }
    };
}

test('IaJobsService registra JOB_IA_RUN en IA-5', async () => {
    const audit = createAuditStub();
    const repuestoModel = {
        async getConsumptionWindowByRepuesto() {
            return [{ id_repuesto: 1, nombre: 'Cable', stock: 1, stock_minimo: 5, consumido_window: 10 }];
        }
    };
    const alertaModel = { async ensurePendingByTipoAndRepuesto() { return { created: true }; } };
    const service = new IaJobsService({ repuestoModel, alertaModel, auditLogService: audit });

    await service.generatePurchaseSuggestions({ windowDays: 30, horizonDays: 10 });

    assert.equal(audit.entries.length, 1);
    assert.equal(audit.entries[0].accion, 'JOB_IA_RUN');
    assert.equal(audit.entries[0].metadata.job, 'IA-5');
});

test('IaJobsService registra JOB_IA_ERROR cuando falla IA-6', async () => {
    const audit = createAuditStub();
    const assetModel = {
        async getRepairPartsCostWindowByActivo() {
            throw new Error('boom');
        }
    };
    const service = new IaJobsService({ assetModel, auditLogService: audit });

    await assert.rejects(() => service.generateDisposalSuggestions(), /boom/);
    assert.equal(audit.entries.length, 1);
    assert.equal(audit.entries[0].accion, 'JOB_IA_ERROR');
    assert.equal(audit.entries[0].metadata.job, 'IA-6');
});
