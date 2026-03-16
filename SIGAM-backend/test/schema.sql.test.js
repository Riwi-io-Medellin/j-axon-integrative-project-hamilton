import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const schemaPath = path.resolve('./sql/01_schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

test('Schema define tablas principales con PK, FK y constraints', async () => {
    const requiredTables = [
        'USUARIOS',
        'UBICACIONES',
        'CATEGORIAS',
        'PROVEEDORES',
        'SOFTWARE',
        'REPUESTOS',
        'ACTIVOS',
        'LICENCIAS',
        'TICKETS',
        'HISTORIAL_ACTIVOS',
        'BAJAS_ACTIVOS',
        'ASIGNACION_LICENCIAS',
        'CATALOGO_PRECIOS_PROVEEDORES',
        'ORDENES_MANTENIMIENTO',
        'CONSUMO_REPUESTOS',
        'ALERTAS'
    ];

    for (const table of requiredTables) {
        assert.match(
            schema,
            new RegExp(`CREATE TABLE IF NOT EXISTS\\s+${table}\\s*\\(`, 'i'),
            `Falta tabla ${table}`
        );
    }

    assert.match(schema, /PRIMARY KEY/i);
    assert.match(schema, /REFERENCES/i);
    assert.match(schema, /NOT NULL/i);
    assert.match(schema, /UNIQUE/i);
});

test('Schema agrega indice para busqueda por serial', async () => {
    assert.match(schema, /idx_activos_serial_lower/i);
    assert.match(schema, /CREATE INDEX IF NOT EXISTS idx_activos_serial_lower ON ACTIVOS/i);
});

test('Schema marca serial como UNIQUE en activos', async () => {
    assert.match(schema, /serial\s+VARCHAR\(100\)\s+UNIQUE\s+NOT NULL/i);
});
