import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

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

test('GET /health responde ok', async () => {
    const layer = app.router.stack.find((l) => l.route && l.route.path === '/health');
    const handler = layer.route.stack[0].handle;
    const req = {};
    const res = createRes();

    await handler(req, res);

    assert.deepEqual(res.body, { status: 'ok' });
});
