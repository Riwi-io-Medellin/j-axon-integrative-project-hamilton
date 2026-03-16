import test from 'node:test';
import assert from 'node:assert/strict';
import roleMiddleware from '../src/middlewares/role.middleware.js';

function createRes() {
    return {
        statusCode: null,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        }
    };
}

test('roleMiddleware rechaza cuando no hay usuario autenticado', () => {
    const middleware = roleMiddleware(['Gerente']);
    const req = {};
    const res = createRes();
    let nextCalled = false;

    middleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /Acceso denegado/i);
});

test('roleMiddleware rechaza cuando el rol no coincide', () => {
    const middleware = roleMiddleware(['Gerente']);
    const req = { user: { id: 5, role: 'Usuario' } };
    const res = createRes();
    let nextCalled = false;

    middleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
});

test('roleMiddleware permite acceso cuando el rol coincide', () => {
    const middleware = roleMiddleware(['Gerente', 'Analista']);
    const req = { user: { id: 1, role: 'Analista' } };
    const res = createRes();
    let nextCalled = false;

    middleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, null);
});
