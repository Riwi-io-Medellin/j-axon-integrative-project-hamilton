import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

test('App registra middlewares base (cors, json, morgan)', async () => {
    const names = (app.router?.stack || []).map((layer) => layer?.name);

    assert.ok(names.includes('corsMiddleware'));
    assert.ok(names.includes('jsonParser'));
    assert.ok(names.includes('logger'));
});
