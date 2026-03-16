import test from 'node:test';
import assert from 'node:assert/strict';
import requestContext from '../src/middlewares/requestContext.middleware.js';

test('requestContext agrega request_id y contexto base', async () => {
    const req = { headers: { 'user-agent': 'test-agent' } };
    requestContext(req, {}, () => {});
    assert.ok(req.context);
    assert.ok(req.context.request_id);
    assert.ok(req.context.started_at_ms);
    assert.equal(req.context.user_agent, 'test-agent');
});

