import test from 'node:test';
import assert from 'node:assert/strict';
import RepuestoService from '../src/services/repuesto.service.js';

function createAuditStub() {
    return {
        entries: [],
        buildDomainEntry(payload) {
            return payload;
        },
        async safeLog(entry) {
            this.entries.push(entry);
        }
    };
}

test('RepuestoService emite REPUESTO_ADJUST cuando cambia stock', async () => {
    const audit = createAuditStub();
    const model = {
        async findById(id) { return { id_repuesto: id, stock: 10, stock_minimo: 2 }; },
        async update(id, payload) { return { id_repuesto: id, stock: payload.stock ?? 10, stock_minimo: payload.stock_minimo ?? 2 }; }
    };
    const service = new RepuestoService(model, audit);
    const actor = { id: 1, role: 'Gerente', email: 'g@x.com' };
    const ctx = { request_id: 'r1' };

    await service.update(5, { stock: 7 }, actor, ctx);

    const acciones = audit.entries.map((e) => e.accion);
    assert.ok(acciones.includes('REPUESTO_UPDATE'));
    assert.ok(acciones.includes('REPUESTO_ADJUST'));
});
