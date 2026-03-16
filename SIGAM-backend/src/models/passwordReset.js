import BaseModel from './BaseModel.js';

// Data access for password reset tokens.
class PasswordResetModel extends BaseModel {
    async create({ id_usuario, token_hash, expires_at }) {
        return this.dbCreate('password_resets', { id_usuario, token_hash, expires_at });
    }

    async findValidByTokenHash(token_hash) {
        if (this.useSupabase) {
            const { data, error } = await this.supabase
                .from('password_resets')
                .select('*')
                .eq('token_hash', token_hash)
                .is('used_at', null)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (error) throw error;
            return data || null;
        }
        const { rows } = await this.query(
            `SELECT * FROM password_resets
             WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
             ORDER BY created_at DESC
             LIMIT 1`,
            [token_hash]
        );
        return rows[0] || null;
    }

    async markUsed(id_reset) {
        return this.dbUpdate('password_resets', 'id_reset', id_reset, { used_at: new Date() });
    }
}

export default PasswordResetModel;
