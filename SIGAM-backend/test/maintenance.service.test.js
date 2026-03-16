import test from 'node:test';
import assert from 'node:assert/strict';
import MaintenanceService from '../src/services/maintenance.service.js';

function createMaintenanceModelStub() {
    return {
        createCalls: [],
        consumoCalls: [],
        async create(payload) {
            this.createCalls.push(payload);
            return { id_orden: 1, ...payload };
        },
        async registrarConsumo(id_orden, payload) {
            this.consumoCalls.push({ id_orden, payload });
            return { id_consumo: 1, id_orden, ...payload };
        }
    };
}

test('MaintenanceService.create exige id_ticket', async () => {
    const service = new MaintenanceService(createMaintenanceModelStub());

    assert.throws(
        () => service.create({ id_usuario_tecnico: 2 }),
        (error) => error?.status === 400 && /id_ticket/i.test(error?.message)
    );
});

test('MaintenanceService.create exige id_usuario_tecnico', async () => {
    const service = new MaintenanceService(createMaintenanceModelStub());

    assert.throws(
        () => service.create({ id_ticket: 20 }),
        (error) => error?.status === 400 && /id_usuario_tecnico/i.test(error?.message)
    );
});

test('MaintenanceService.registrarConsumo exige id_repuesto y cantidad_usada', async () => {
    const service = new MaintenanceService(createMaintenanceModelStub());

    assert.throws(
        () => service.registrarConsumo(1, { cantidad_usada: 2 }),
        (error) => error?.status === 400 && /id_repuesto/i.test(error?.message)
    );

    assert.throws(
        () => service.registrarConsumo(1, { id_repuesto: 7 }),
        (error) => error?.status === 400 && /cantidad_usada/i.test(error?.message)
    );
});

test('MaintenanceService.registrarConsumo delega al modelo con payload valido', async () => {
    const model = createMaintenanceModelStub();
    const service = new MaintenanceService(model);

    const result = await service.registrarConsumo(5, { id_repuesto: 2, cantidad_usada: 1 });

    assert.equal(result.id_orden, 5);
    assert.equal(model.consumoCalls.length, 1);
});

test('MaintenanceService.create delega al modelo cuando payload es valido', async () => {
    const model = createMaintenanceModelStub();
    const service = new MaintenanceService(model);

    const result = await service.create({ id_ticket: 88, id_usuario_tecnico: 3, diagnostico: 'Revisión inicial' });

    assert.equal(result.id_ticket, 88);
    assert.equal(model.createCalls.length, 1);
    assert.equal(model.createCalls[0].id_usuario_tecnico, 3);
});
