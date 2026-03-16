import test from 'node:test';
import assert from 'node:assert/strict';
import categoriaRouter from '../src/routes/categoria.routes.js';

test('Categoria routes expone GET /', async () => {
    const layer = categoriaRouter.stack.find((l) => l.route && l.route.path === '/');
    assert.ok(layer);
    const methods = Object.keys(layer.route.methods || {});
    assert.ok(methods.includes('get'));
});
