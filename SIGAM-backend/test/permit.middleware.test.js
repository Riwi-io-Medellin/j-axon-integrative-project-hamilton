import test from 'node:test';
import assert from 'node:assert/strict';
import permit from '../src/middlewares/permit.middleware.js';

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

test('permit permite acceso cuando el rol tiene permiso', async () => {
    const middleware = permit('tickets', 'list');
    const req = { user: { role: 'Auditor' } };
    const res = createRes();
    let called = false;
    await middleware(req, res, () => {
        called = true;
    });
    assert.equal(called, true);
});

test('permit devuelve 403 cuando el rol no tiene permiso', async () => {
    const middleware = permit('tickets', 'delete');
    const req = { user: { role: 'Analista' } };
    const res = createRes();
    let called = false;
    await middleware(req, res, () => {
        called = true;
    });
    assert.equal(called, false);
    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /Acceso denegado/i);
});

test('permit registra acceso denegado en auditoria', async () => {
    const audit = {
        entries: [],
        buildDomainEntry(payload) { return payload; },
        async safeLog(entry) { this.entries.push(entry); }
    };
    const middleware = permit('tickets', 'delete', audit);
    const req = { user: { role: 'Analista' }, headers: {} };
    const res = createRes();
    let called = false;
    await middleware(req, res, () => { called = true; });

    assert.equal(called, false);
    assert.equal(res.statusCode, 403);
    assert.equal(audit.entries.length, 1);
    assert.equal(audit.entries[0].accion, 'SECURITY_ACCESS_DENIED');
});

test('permit devuelve error 500 si no existe configuración', async () => {
    const middleware = permit('nope', 'nope');
    const req = { user: { role: 'Gerente' } };
    const res = createRes();
    let nextErr = null;
    await middleware(req, res, (err) => {
        nextErr = err;
    });
    assert.ok(nextErr);
    assert.equal(nextErr.status, 500);
});
