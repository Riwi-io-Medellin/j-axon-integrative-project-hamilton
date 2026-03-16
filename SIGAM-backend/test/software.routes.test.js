import test from 'node:test';
import assert from 'node:assert/strict';
import softwareRouter from '../src/routes/software.routes.js';

function hasRoute(path, method) {
    return softwareRouter.stack.some(
        (l) => l.route && l.route.path === path && l.route.methods?.[method]
    );
}

test('Software routes exponen CRUD basico', async () => {
    assert.ok(hasRoute('/', 'get'));
    assert.ok(hasRoute('/', 'post'));
    assert.ok(hasRoute('/:id', 'get'));
    assert.ok(hasRoute('/:id', 'put'));
    assert.ok(hasRoute('/:id', 'delete'));
});
