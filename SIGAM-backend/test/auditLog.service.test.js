import test from 'node:test';
import assert from 'node:assert/strict';
import AuditLogService from '../src/services/auditLog.service.js';

function createModelStub() {
    return {
        created: [],
        async create(payload) {
            this.created.push(payload);
            return { id_audit: 1, ...payload };
        },
        async findById() {
            return null;
        },
        async findAll() {
            return [];
        }
    };
}

test('AuditLogService.safeLog redacta secretos y no lanza errores', async () => {
    const model = createModelStub();
    const service = new AuditLogService(model);

    await service.safeLog({
        accion: 'TEST',
        entidad: 'TICKETS',
        payload_after: {
            password: 'x',
            Authorization: 'Bearer abc',
            nested: { token: 'zzz' },
            normal: 'ok'
        },
        metadata: { API_IA: 'secret', ok: true }
    });

    assert.equal(model.created.length, 1);
    const created = model.created[0];
    assert.equal(created.payload_after.password, '[REDACTED]');
    assert.equal(created.payload_after.Authorization, '[REDACTED]');
    assert.equal(created.payload_after.nested.token, '[REDACTED]');
    assert.equal(created.payload_after.normal, 'ok');
    assert.equal(created.metadata.API_IA, '[REDACTED]');
});

