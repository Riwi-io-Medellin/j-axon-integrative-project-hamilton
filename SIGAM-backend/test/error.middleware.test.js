import test from 'node:test';
import assert from 'node:assert/strict';
import errorMiddleware from '../src/middlewares/error.middleware.js';

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

test('errorMiddleware responde 500 por defecto cuando no hay status', () => {
    const req = { originalUrl: '/api/x', method: 'GET' };
    const res = createRes();

    errorMiddleware(new Error('fallo inesperado'), req, res, () => {});

    assert.equal(res.statusCode, 500);
    assert.equal(res.body.code, 'UNKNOWN_ERROR');
    assert.equal(res.body.message, 'Error interno');
});

test('errorMiddleware conserva status y code cuando vienen en el error', () => {
    const req = { originalUrl: '/api/y', method: 'POST' };
    const res = createRes();

    errorMiddleware({ status: 409, code: 'CONFLICT', message: 'registro duplicado' }, req, res, () => {});

    assert.equal(res.statusCode, 409);
    assert.equal(res.body.code, 'CONFLICT');
    assert.equal(res.body.message, 'registro duplicado');
});
