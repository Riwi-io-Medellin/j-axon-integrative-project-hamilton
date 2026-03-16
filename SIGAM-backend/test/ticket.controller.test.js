import test from 'node:test';
import assert from 'node:assert/strict';
import TicketController from '../src/controllers/ticket.controller.js';

function createRes() {
    return {
        payload: null,
        json(data) { this.payload = data; }
    };
}

test('TicketController.getById incluye sugerencias cuando se solicita', async () => {
    const service = {
        async findById() { return { id_ticket: 1, descripcion: 'Falla' }; },
        async getSuggestions() { return { suggestions: [{ id_ticket: 9 }] }; }
    };
    const controller = new TicketController(service);
    const req = { params: { id: '1' }, query: { suggestions: 'true' }, user: { id: 1 } };
    const res = createRes();

    await controller.getById(req, res, () => {});

    assert.equal(res.payload.id_ticket, 1);
    assert.deepEqual(res.payload.suggestions, [{ id_ticket: 9 }]);
});

test('TicketController.getById no incluye sugerencias por defecto', async () => {
    const service = {
        async findById() { return { id_ticket: 2, descripcion: 'Red' }; },
        async getSuggestions() { return { suggestions: [{ id_ticket: 3 }] }; }
    };
    const controller = new TicketController(service);
    const req = { params: { id: '2' }, query: {}, user: { id: 1 } };
    const res = createRes();

    await controller.getById(req, res, () => {});

    assert.equal(res.payload.id_ticket, 2);
    assert.equal(res.payload.suggestions, undefined);
});
