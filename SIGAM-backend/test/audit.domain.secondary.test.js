import test from 'node:test';
import assert from 'node:assert/strict';
import LicenciaService from '../src/services/licencia.service.js';
import SoftwareService from '../src/services/software.service.js';
import ProveedorService from '../src/services/proveedor.service.js';
import UbicacionService from '../src/services/ubicacion.service.js';

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

test('LicenciaService emite logs en create/update/remove/asignar/revocar', async () => {
    const audit = createAuditStub();
    const model = {
        async create(payload) { return { id_licencia: 1, ...payload }; },
        async findById(id) { return { id_licencia: id, fecha_expiracion: '2026-01-01' }; },
        async update(id, payload) { return { id_licencia: id, ...payload }; },
        async remove(id) { return { id_licencia: id }; },
        async hasAssignment() { return false; },
        async asignar(payload) { return { id_asignacion: 10, ...payload }; },
        async revocarAsignacion(id) { return { id_asignacion: id }; }
    };
    const service = new LicenciaService(model, audit);
    const actor = { id: 1, role: 'Gerente', email: 'g@x.com' };
    const ctx = { request_id: 'r1' };

    await service.create({ id_software: 2, clave_producto: 'ABC' }, actor, ctx);
    await service.update(1, { fecha_expiracion: '2026-12-31' }, actor, ctx);
    await service.asignar({ id_licencia: 1, id_usuario: 9 }, actor, ctx);
    await service.revocarAsignacion(10, actor, ctx);
    await service.remove(1, actor, ctx);

    assert.equal(audit.entries.length, 5);
    assert.equal(audit.entries[0].accion, 'LICENCIA_CREATE');
    assert.equal(audit.entries[1].accion, 'LICENCIA_UPDATE');
    assert.equal(audit.entries[2].accion, 'LICENCIA_ASSIGN');
    assert.equal(audit.entries[3].accion, 'LICENCIA_REVOKE');
    assert.equal(audit.entries[4].accion, 'LICENCIA_DELETE');
});

test('SoftwareService emite logs en create/update/remove', async () => {
    const audit = createAuditStub();
    const model = {
        async create(payload) { return { id_software: 5, ...payload }; },
        async findById(id) { return { id_software: id, nombre: 'Office' }; },
        async update(id, payload) { return { id_software: id, ...payload }; },
        async remove(id) { return { id_software: id }; }
    };
    const service = new SoftwareService(model, audit);
    const actor = { id: 2, role: 'Gerente', email: 'g@x.com' };
    const ctx = { request_id: 'r2' };

    await service.create({ nombre: 'Office', fabricante: 'MS' }, actor, ctx);
    await service.update(5, { nombre: 'Office 2' }, actor, ctx);
    await service.remove(5, actor, ctx);

    assert.equal(audit.entries.length, 3);
    assert.equal(audit.entries[0].accion, 'SOFTWARE_CREATE');
    assert.equal(audit.entries[1].accion, 'SOFTWARE_UPDATE');
    assert.equal(audit.entries[2].accion, 'SOFTWARE_DELETE');
});

test('ProveedorService emite logs en create/update/remove', async () => {
    const audit = createAuditStub();
    const model = {
        async create(payload) { return { id_proveedor: 7, ...payload }; },
        async findById(id) { return { id_proveedor: id, nombre: 'Acme' }; },
        async update(id, payload) { return { id_proveedor: id, ...payload }; },
        async remove(id) { return { id_proveedor: id }; }
    };
    const service = new ProveedorService(model, audit);
    const actor = { id: 3, role: 'Gerente', email: 'g@x.com' };
    const ctx = { request_id: 'r3' };

    await service.create({ nombre: 'Acme' }, actor, ctx);
    await service.update(7, { nombre: 'Acme 2' }, actor, ctx);
    await service.remove(7, actor, ctx);

    assert.equal(audit.entries.length, 3);
    assert.equal(audit.entries[0].accion, 'PROVEEDOR_CREATE');
    assert.equal(audit.entries[1].accion, 'PROVEEDOR_UPDATE');
    assert.equal(audit.entries[2].accion, 'PROVEEDOR_DELETE');
});

test('UbicacionService emite logs en create/update/remove', async () => {
    const audit = createAuditStub();
    const model = {
        async create(payload) { return { id_ubicacion: 4, ...payload }; },
        async findById(id) { return { id_ubicacion: id, sede: 'HQ' }; },
        async update(id, payload) { return { id_ubicacion: id, ...payload }; },
        async remove(id) { return { id_ubicacion: id }; }
    };
    const service = new UbicacionService(model, audit);
    const actor = { id: 4, role: 'Gerente', email: 'g@x.com' };
    const ctx = { request_id: 'r4' };

    await service.create({ sede: 'HQ', piso: '1' }, actor, ctx);
    await service.update(4, { piso: '2' }, actor, ctx);
    await service.remove(4, actor, ctx);

    assert.equal(audit.entries.length, 3);
    assert.equal(audit.entries[0].accion, 'UBICACION_CREATE');
    assert.equal(audit.entries[1].accion, 'UBICACION_UPDATE');
    assert.equal(audit.entries[2].accion, 'UBICACION_DELETE');
});
