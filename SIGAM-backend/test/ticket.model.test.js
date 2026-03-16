import test from 'node:test';
import assert from 'node:assert/strict';
import TicketModel from '../src/models/Ticket.js';
import db from '../src/config/db.js';

test('TicketModel.create crea ticket en estado Abierto', async () => {
    const model = new TicketModel();
    const originalQuery = db.query.bind(db);
    const calls = [];

    db.query = async (text, params) => {
        calls.push({ text, params });

        if (/INSERT INTO tickets/i.test(text)) {
            return {
                rows: [{
                    id_ticket: 50,
                    id_activo: params[0],
                    id_usuario_reporta: params[1],
                    descripcion: params[2],
                    prioridad_ia: params[3],
                    clasificacion_nlp: params[4],
                    estado: params[10] || 'Abierto'
                }]
            };
        }

        return { rows: [] };
    };

    try {
        const ticket = await model.create({
            id_activo: 2,
            id_usuario_reporta: 9,
            descripcion: 'Prueba asignacion',
            prioridad_ia: 'Media',
            clasificacion_nlp: 'Hardware',
            estado: 'Abierto'
        });

        assert.equal(ticket.estado, 'Abierto');

        assert.equal(calls.length, 1);
        assert.match(calls[0].text, /INSERT INTO tickets/i);
    } finally {
        db.query = originalQuery;
    }
});

test('TicketModel.closeWithConsumos usa transaccion y registra consumo', async () => {
    const model = new TicketModel();
    const originalTransaction = db.transaction;
    const calls = [];

    db.transaction = async (callback) => {
        const client = {
            async query(text, params) {
                calls.push({ text, params });
                if (/SELECT id_orden/i.test(text)) {
                    return { rows: [{ id_orden: 5 }] };
                }
                if (/UPDATE tickets SET estado = 'Cerrado'/i.test(text)) {
                    return { rows: [{ id_ticket: 9, estado: 'Cerrado' }] };
                }
                return { rows: [] };
            }
        };
        return callback(client);
    };

    try {
        const result = await model.closeWithConsumos(9, [{ id_repuesto: 2, cantidad_usada: 3 }]);
        assert.equal(result.estado, 'Cerrado');
        assert.ok(calls.find((c) => /INSERT INTO consumo_repuestos/i.test(c.text)));
    } finally {
        db.transaction = originalTransaction;
    }
});
