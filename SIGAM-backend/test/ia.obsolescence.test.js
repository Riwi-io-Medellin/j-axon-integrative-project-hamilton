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

test('IaJobsService genera alertas de obsolescencia', async () => {
    const audit = createAuditStub();
    const assetModel = {
        async findObsolescenceCandidates() {
            return [{ id_activo: 1 }, { id_activo: 2 }];
        }
    };
    const alertaModel = {
        async ensurePendingByTipoAndActivo() { return { created: true }; }
    };

    const service = new IaJobsService({ assetModel, alertaModel, auditLogService: audit });

    const result = await service.generateObsolescenceAlerts({ months: 48, limit: 10 });

    assert.equal(result.candidatos, 2);
    assert.equal(result.alertas_creadas, 2);
    assert.equal(audit.entries[0].metadata.job, 'IA-OBSOLESCENCIA');
});
