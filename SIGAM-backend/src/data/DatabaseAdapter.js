import db from '../config/db.js';

function assertIdentifier(value, label) {
    if (typeof value !== 'string' || !/^[A-Za-z0-9_]+$/.test(value)) {
        throw new Error(`Identificador invalido: ${label}`);
    }
    return value;
}

function normalizeIdentifier(value, label) {
    assertIdentifier(value, label);
    return `"${value}"`;
}

function normalizeColumns(columns) {
    if (!columns || columns === '*') {
        return { sql: '*', supabase: '*' };
    }
    const list = Array.isArray(columns)
        ? columns
        : String(columns).split(',').map((v) => v.trim()).filter(Boolean);
    if (!list.length) {
        return { sql: '*', supabase: '*' };
    }
    list.forEach((col) => normalizeIdentifier(col, `columna ${col}`));
    return {
        sql: list.map((col) => `"${col}"`).join(', '),
        supabase: list.join(', ')
    };
}

class DatabaseAdapter {
    constructor() {
        const rawMode = String(process.env.DB_MODE || '').trim().toLowerCase();
        if (rawMode) {
            this.mode = rawMode;
        } else if (process.env.SUPABASE_URL) {
            this.mode = 'supabase';
        } else {
            this.mode = 'postgres';
        }
    }

    get isSupabase() {
        return this.mode === 'supabase';
    }

    get supabase() {
        if (!this.isSupabase) {
            throw new Error('Supabase no disponible en modo postgres');
        }
        return db.supabase;
    }

    query(text, params = []) {
        return db.query(text, params);
    }

    transaction(callback) {
        if (typeof db.transaction !== 'function') {
            throw new Error('Transacciones no soportadas por el adaptador actual');
        }
        return db.transaction(callback);
    }

    async findAll(table, orderBy, orderDir = 'ASC', columns = '*') {
        const cols = normalizeColumns(columns);
        if (this.isSupabase) {
            assertIdentifier(table, 'tabla');
            let query = this.supabase.from(table).select(cols.supabase);
            if (orderBy) {
                assertIdentifier(orderBy, 'orden');
                query = query.order(orderBy, { ascending: String(orderDir).toUpperCase() !== 'DESC' });
            }
            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
        const tableSql = normalizeIdentifier(table, 'tabla');
        let sql = `SELECT ${cols.sql} FROM ${tableSql}`;
        if (orderBy) {
            const orderSql = normalizeIdentifier(orderBy, 'orden');
            const dir = String(orderDir).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
            sql += ` ORDER BY ${orderSql} ${dir}`;
        }
        const { rows } = await this.query(sql);
        return rows;
    }

    async findById(table, idColumn, id, columns = '*') {
        const cols = normalizeColumns(columns);
        if (this.isSupabase) {
            assertIdentifier(table, 'tabla');
            assertIdentifier(idColumn, 'columna id');
            const { data, error } = await this.supabase
                .from(table)
                .select(cols.supabase)
                .eq(idColumn, id)
                .maybeSingle();
            if (error) throw error;
            return data || null;
        }
        const tableSql = normalizeIdentifier(table, 'tabla');
        const idSql = normalizeIdentifier(idColumn, 'columna id');
        const { rows } = await this.query(
            `SELECT ${cols.sql} FROM ${tableSql} WHERE ${idSql} = $1`,
            [id]
        );
        return rows[0] || null;
    }

    async create(table, data, returning = '*') {
        const cols = normalizeColumns(returning);
        const entries = Object.entries(data || {}).filter(([, v]) => v !== undefined);
        if (!entries.length) {
            throw new Error('No hay datos para insertar');
        }
        if (this.isSupabase) {
            assertIdentifier(table, 'tabla');
            const { data: created, error } = await this.supabase
                .from(table)
                .insert(Object.fromEntries(entries))
                .select(cols.supabase)
                .single();
            if (error) throw error;
            return created;
        }
        const tableSql = normalizeIdentifier(table, 'tabla');
        const columnsSql = entries.map(([key]) => normalizeIdentifier(key, `columna ${key}`)).join(', ');
        const placeholders = entries.map((_, i) => `$${i + 1}`).join(', ');
        const params = entries.map(([, value]) => value);
        const { rows } = await this.query(
            `INSERT INTO ${tableSql} (${columnsSql}) VALUES (${placeholders}) RETURNING ${cols.sql}`,
            params
        );
        return rows[0];
    }

    async update(table, idColumn, id, data, returning = '*') {
        const cols = normalizeColumns(returning);
        const entries = Object.entries(data || {}).filter(([, v]) => v !== undefined);
        if (!entries.length) {
            return this.findById(table, idColumn, id, returning);
        }
        if (this.isSupabase) {
            assertIdentifier(table, 'tabla');
            assertIdentifier(idColumn, 'columna id');
            const { data: updated, error } = await this.supabase
                .from(table)
                .update(Object.fromEntries(entries))
                .eq(idColumn, id)
                .select(cols.supabase)
                .single();
            if (error) throw error;
            return updated || null;
        }
        const tableSql = normalizeIdentifier(table, 'tabla');
        const idSql = normalizeIdentifier(idColumn, 'columna id');
        const setSql = entries
            .map(([key], i) => `${normalizeIdentifier(key, `columna ${key}`)} = $${i + 1}`)
            .join(', ');
        const params = entries.map(([, value]) => value);
        params.push(id);
        const { rows } = await this.query(
            `UPDATE ${tableSql} SET ${setSql} WHERE ${idSql} = $${params.length} RETURNING ${cols.sql}`,
            params
        );
        return rows[0] || null;
    }

    async remove(table, idColumn, id, returning = '*') {
        const cols = normalizeColumns(returning);
        if (this.isSupabase) {
            assertIdentifier(table, 'tabla');
            assertIdentifier(idColumn, 'columna id');
            const { data, error } = await this.supabase
                .from(table)
                .delete()
                .eq(idColumn, id)
                .select(cols.supabase)
                .single();
            if (error) throw error;
            return data || null;
        }
        const tableSql = normalizeIdentifier(table, 'tabla');
        const idSql = normalizeIdentifier(idColumn, 'columna id');
        const { rows } = await this.query(
            `DELETE FROM ${tableSql} WHERE ${idSql} = $1 RETURNING ${cols.sql}`,
            [id]
        );
        return rows[0] || null;
    }
}

const databaseAdapter = new DatabaseAdapter();
export default databaseAdapter;
