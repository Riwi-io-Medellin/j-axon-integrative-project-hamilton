import BaseModel from './BaseModel.js';

// Users model: DB access for users table operations.
class UserModel extends BaseModel {
    // Find user by email (includes password hash for login checks).
    async findByEmail(email) {
        return this.dbFindById(
            'usuarios',
            'email',
            email,
            ['id_usuario', 'nombre', 'email', 'password_hash', 'rol', 'activo', 'ultimo_acceso', 'intentos_fallidos', 'bloqueado_hasta']
        );
    }

    async findAll({ limit, offset } = {}) {
        if (this.useSupabase) {
            let query = this.supabase
                .from('usuarios')
                .select('id_usuario, nombre, email, rol, fecha_creacion, activo, ultimo_acceso')
                .order('id_usuario', { ascending: true });
            if (limit !== undefined && offset !== undefined) {
                query = query.range(offset, offset + limit - 1);
            }
            const { data, error } = await query;
            if (error) throw error;
            return data;
        }
        const params = [];
        let sql = `SELECT id_usuario, nombre, email, rol, fecha_creacion, activo, ultimo_acceso
                   FROM usuarios
                   ORDER BY id_usuario ASC`;
        if (limit !== undefined && offset !== undefined) {
            params.push(limit, offset);
            sql += ' LIMIT $1 OFFSET $2';
        }
        const { rows } = await this.query(sql, params);
        return rows;
    }

    // Find user by id (without password hash).
    async findById(id) {
        return this.dbFindById(
            'usuarios',
            'id_usuario',
            id,
            ['id_usuario', 'nombre', 'email', 'rol', 'fecha_creacion', 'activo', 'ultimo_acceso']
        );
    }

    async create({ nombre, email, passwordHash, rol }) {
        return this.dbCreate(
            'usuarios',
            { nombre, email, password_hash: passwordHash, rol },
            ['id_usuario', 'nombre', 'email', 'rol', 'fecha_creacion']
        );
    }

    // Update basic user fields.
    async update(id, { nombre, email, rol }) {
        return this.dbUpdate(
            'usuarios',
            'id_usuario',
            id,
            { nombre, email, rol },
            ['id_usuario', 'nombre', 'email', 'rol', 'fecha_creacion', 'activo', 'ultimo_acceso']
        );
    }

    async updateRole(id, rol) {
        return this.dbUpdate(
            'usuarios',
            'id_usuario',
            id,
            { rol },
            ['id_usuario', 'nombre', 'email', 'rol', 'fecha_creacion', 'activo', 'ultimo_acceso']
        );
    }

    async updatePassword(id, passwordHash) {
        return this.dbUpdate(
            'usuarios',
            'id_usuario',
            id,
            { password_hash: passwordHash },
            ['id_usuario', 'nombre', 'email', 'rol', 'fecha_creacion', 'activo', 'ultimo_acceso']
        );
    }

    async updateBasic(id, { nombre, email }) {
        return this.dbUpdate(
            'usuarios',
            'id_usuario',
            id,
            { nombre, email },
            ['id_usuario', 'nombre', 'email', 'rol', 'fecha_creacion', 'activo', 'ultimo_acceso']
        );
    }

    async updateActive(id, activo) {
        return this.dbUpdate(
            'usuarios',
            'id_usuario',
            id,
            { activo },
            ['id_usuario', 'nombre', 'email', 'rol', 'fecha_creacion', 'activo', 'ultimo_acceso']
        );
    }

    async registerLoginSuccess(id) {
        if (this.useSupabase) {
            const { data, error } = await this.supabase
                .from('usuarios')
                .update({ ultimo_acceso: new Date().toISOString(), intentos_fallidos: 0, bloqueado_hasta: null })
                .eq('id_usuario', id)
                .select('*')
                .single();
            if (error) throw error;
            return data;
        }
        const { rows } = await this.query(
            `UPDATE usuarios
             SET ultimo_acceso = NOW(), intentos_fallidos = 0, bloqueado_hasta = NULL
             WHERE id_usuario = $1
             RETURNING *`,
            [id]
        );
        return rows[0] || null;
    }

    async registerLoginFailure(id, maxAttempts, blockMinutes) {
        if (this.useSupabase) {
            const { data: user, error: userError } = await this.supabase
                .from('usuarios')
                .select('intentos_fallidos')
                .eq('id_usuario', id)
                .single();
            if (userError) throw userError;
            const attempts = Number(user?.intentos_fallidos || 0) + 1;
            const blocked = attempts >= maxAttempts
                ? new Date(Date.now() + blockMinutes * 60 * 1000).toISOString()
                : null;
            const { data, error } = await this.supabase
                .from('usuarios')
                .update({ intentos_fallidos: attempts, bloqueado_hasta: blocked })
                .eq('id_usuario', id)
                .select('*')
                .single();
            if (error) throw error;
            return data;
        }
        const { rows } = await this.query(
            `UPDATE usuarios
             SET intentos_fallidos = intentos_fallidos + 1,
                 bloqueado_hasta = CASE
                     WHEN intentos_fallidos + 1 >= $2 THEN NOW() + ($3 * INTERVAL '1 minute')
                     ELSE bloqueado_hasta
                 END
             WHERE id_usuario = $1
             RETURNING *`,
            [id, maxAttempts, blockMinutes]
        );
        return rows[0] || null;
    }

    async updateBasic(id, { nombre, email }) {
        return this.dbUpdate(
            'usuarios',
            'id_usuario',
            id,
            { nombre, email },
            ['id_usuario', 'nombre', 'email', 'rol', 'fecha_creacion']
        );
    }

    async remove(id) {
        return this.dbRemove(
            'usuarios',
            'id_usuario',
            id,
            ['id_usuario', 'nombre', 'email']
        );
    }
}

export default UserModel;
