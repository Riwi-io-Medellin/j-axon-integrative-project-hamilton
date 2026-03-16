import test from 'node:test';
import assert from 'node:assert/strict';
import SoftwareService from '../src/services/software.service.js';

function createModelStub() {
    return {
        createCalls: [],
        async findAll() { return []; },
        async findById(id) { return id === 1 ? { id_software: 1 } : null; },
        async create(payload) {
            this.createCalls.push(payload);
            return { id_software: 1, ...payload };
        },
        async update(id, payload) { return id === 1 ? { id_software: 1, ...payload } : null; },
        async remove(id) { return id === 1 ? { id_software: 1 } : null; }
    };
}

test('SoftwareService.create exige nombre', async () => {
    const service = new SoftwareService(createModelStub());
    assert.throws(
        () => service.create({ fabricante: 'ACME' }),
        (error) => error?.status === 400 && /nombre/i.test(error?.message)
    );
});

test('SoftwareService.findById retorna 404 cuando no existe', async () => {
    const service = new SoftwareService(createModelStub());
    await assert.rejects(
        () => service.findById(99),
        (error) => error?.status === 404
    );
});
