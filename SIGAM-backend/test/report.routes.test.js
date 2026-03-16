import test from 'node:test';
import assert from 'node:assert/strict';
import reportRouter from '../src/routes/report.routes.js';

function hasRoute(path, method) {
    return reportRouter.stack.some(
        (l) => l.route && l.route.path === path && l.route.methods?.[method]
    );
}

test('Report routes exponen endpoints de reportes', async () => {
    assert.ok(hasRoute('/activos', 'get'));
    assert.ok(hasRoute('/tickets', 'get'));
    assert.ok(hasRoute('/mantenimientos', 'get'));
    assert.ok(hasRoute('/licencias', 'get'));
    assert.ok(hasRoute('/inventario', 'get'));
    assert.ok(hasRoute('/consumo-repuestos', 'get'));
});
