import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRequired } from '../src/middlewares/validate.middleware.js';

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

test('validateRequired rechaza cuando faltan campos', () => {
    const middleware = validateRequired(['email', 'password']);
    const req = { body: { email: '' } };
    const res = createRes();
    let nextCalled = false;

    middleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 400);
    assert.match(res.body.message, /Campos requeridos/i);
    assert.match(res.body.message, /email/i);
    assert.match(res.body.message, /password/i);
});

test('validateRequired permite continuar cuando todos los campos existen', () => {
    const middleware = validateRequired(['email', 'password']);
    const req = { body: { email: 'a@b.com', password: 'secret' } };
    const res = createRes();
    let nextCalled = false;

    middleware(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, null);
});
