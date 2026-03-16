import test from 'node:test';
import assert from 'node:assert/strict';
import db from '../src/config/db.js';

test('db.testConnection usa SELECT 1 y retorna la primera fila', async () => {
    const originalQuery = db.query.bind(db);
    const calls = [];

    db.query = async (text, params = []) => {
        calls.push({ text, params });
        return { rows: [{ ok: 1, now: '2026-01-01T00:00:00Z' }] };
    };

    try {
        const result = await db.testConnection();
        assert.equal(result.ok, 1);
        assert.ok(calls.length >= 1);
        assert.match(calls[0].text, /select 1/i);
    } finally {
        db.query = originalQuery;
    }
});
