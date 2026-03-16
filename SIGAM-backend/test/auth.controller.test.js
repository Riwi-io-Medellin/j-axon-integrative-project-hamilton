import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import AuthController from '../src/controllers/auth.controller.js';

function createRes() {
    return {
        statusCode: 200,
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

test('AuthController.login devuelve token JWT valido', async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    const authService = {
        async login() {
            return { id: 5, nombre: 'Ana', email: 'ana@acme.com', role: 'Analista' };
        }
    };

    const controller = new AuthController(authService);
    const req = { body: { email: 'ana@acme.com', password: 'x' } };
    const res = createRes();

    await controller.login(req, res, () => {});

    assert.equal(res.statusCode, 200);
    assert.ok(res.body.token);
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    assert.equal(decoded.id, 5);
    assert.equal(decoded.role, 'Analista');
});
