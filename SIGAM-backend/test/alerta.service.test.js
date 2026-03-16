import test from 'node:test';
import assert from 'node:assert/strict';
import AlertaService from '../src/services/alerta.service.js';

function createAuditStub() {
    return {
        entries: [],
        buildDomainEntry(payload) { return payload; },
        async safeLog(entry) { this.entries.push(entry); }
    };
}

test('AlertaService.updateEstado actualiza y registra auditoria', async () => {
    const audit = createAuditStub();
    const model = {
        async updateEstado(id_alerta, estado) { return { id_alerta, estado }; }
    };
    const service = new AlertaService(model, audit);

    const updated = await service.updateEstado(5, 'Resuelta', { id: 1, role: 'Gerente' }, { request_id: 'r1' });

    assert.equal(updated.estado, 'Resuelta');
    assert.equal(audit.entries[0].accion, 'ALERTA_UPDATE');
});
