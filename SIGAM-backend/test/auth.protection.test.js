import test from 'node:test';
import assert from 'node:assert/strict';
import authMiddleware from '../src/middlewares/auth.middleware.js';
import roleMiddleware from '../src/middlewares/role.middleware.js';
import { generateToken } from '../src/utils/jwt.js';

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

async function runChain(req, res, handlers) {
    let idx = 0;
    return new Promise((resolve, reject) => {
        let nextCalled = false;
        const next = (err) => {
            if (err) return reject(err);
            nextCalled = true;
            const handler = handlers[idx++];
            if (!handler) return resolve();
            try {
                nextCalled = false;
                const maybePromise = handler(req, res, next);
                if (handler.length < 3 && idx >= handlers.length) {
                    return resolve();
                }
                if (handler.length >= 3 && !nextCalled && (res.statusCode !== null || res.body !== null)) {
                    return resolve();
                }
                if (maybePromise && typeof maybePromise.then === 'function') {
                    maybePromise.then(() => {}).catch(reject);
                }
            } catch (error) {
                reject(error);
            }
        };
        next();
    });
}

test('Ruta protegida devuelve 403 cuando el rol no es permitido', async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    const token = generateToken({ id: 1, role: 'Usuario' });

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createRes();
    const handlers = [
        authMiddleware,
        roleMiddleware(['Gerente']),
        (r, s) => s.json({ ok: true })
    ];

    await runChain(req, res, handlers);

    assert.equal(res.statusCode, 403);
    assert.match(res.body.message, /rol necesario/i);
});

test('Ruta protegida permite acceso con rol permitido', async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    const token = generateToken({ id: 2, role: 'Gerente' });

    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = createRes();
    const handlers = [
        authMiddleware,
        roleMiddleware(['Gerente']),
        (r, s) => s.json({ ok: true })
    ];

    await runChain(req, res, handlers);

    assert.equal(res.statusCode, null);
    assert.deepEqual(res.body, { ok: true });
});
