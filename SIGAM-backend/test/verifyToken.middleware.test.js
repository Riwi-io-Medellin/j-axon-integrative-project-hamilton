import test from 'node:test';
import assert from 'node:assert/strict';
import verifyToken from '../src/middlewares/verifyToken.middleware.js';
import { generateToken } from '../src/utils/jwt.js';

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

test('verifyToken acepta token valido y expone req.user', async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    const token = generateToken({ id: 7, role: 'Analista' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createRes();

    let nextCalled = false;
    const next = () => { nextCalled = true; };

    const middleware = verifyToken();
    middleware(req, res, next);

    assert.equal(nextCalled, true);
    assert.deepEqual(req.user.id, 7);
    assert.deepEqual(req.user.role, 'Analista');
});

test('verifyToken rechaza cuando no hay token', async () => {
    const req = { headers: {} };
    const res = createRes();
    let nextCalled = false;

    const middleware = verifyToken();
    middleware(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.match(res.body.message, /token no proporcionado/i);
});

test('verifyToken registra evento cuando token es inválido', async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    const audit = {
        entries: [],
        buildDomainEntry(payload) { return payload; },
        async safeLog(entry) { this.entries.push(entry); }
    };

    const req = { headers: { authorization: 'Bearer invalido' } };
    const res = createRes();
    const middleware = verifyToken(audit);
    middleware(req, res, () => {});

    assert.equal(res.statusCode, 401);
    assert.equal(audit.entries.length, 1);
    assert.equal(audit.entries[0].accion, 'AUTH_TOKEN_INVALID');
});
