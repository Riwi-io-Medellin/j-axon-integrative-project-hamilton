import test from 'node:test';
import assert from 'node:assert/strict';
import TicketModel from '../src/models/Ticket.js';
import db from '../src/config/db.js';

test('Flujo Ticket -> Repuesto descuenta stock y cierra ticket', async () => {
    const model = new TicketModel();
    const originalTransaction = db.transaction;
    let stock = 5;

    db.transaction = async (callback) => {
        const client = {
            async query(text, params) {
                if (/SELECT id_orden/i.test(text)) {
                    return { rows: [{ id_orden: 7 }] };
                }
                if (/INSERT INTO consumo_repuestos/i.test(text)) {
                    const qty = params[2];
                    if (qty > stock) {
                        const err = new Error('Stock insuficiente');
                        err.code = 'STOCK_NEGATIVE';
                        throw err;
                    }
                    stock -= qty;
                    return { rows: [{ id_consumo: 1 }] };
                }
                if (/UPDATE tickets SET estado = 'Cerrado'/i.test(text)) {
                    return { rows: [{ id_ticket: 12, estado: 'Cerrado' }] };
                }
                return { rows: [] };
            }
        };
        return callback(client);
    };

    try {
        const result = await model.closeWithConsumos(12, [{ id_repuesto: 2, cantidad_usada: 3 }]);
        assert.equal(result.estado, 'Cerrado');
        assert.equal(stock, 2);

        await assert.rejects(
            () => model.closeWithConsumos(12, [{ id_repuesto: 2, cantidad_usada: 10 }]),
            /Stock insuficiente/
        );
    } finally {
        db.transaction = originalTransaction;
    }
});
