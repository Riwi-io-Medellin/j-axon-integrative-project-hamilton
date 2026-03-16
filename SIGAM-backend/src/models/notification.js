import BaseModel from './BaseModel.js';

class NotificationModel extends BaseModel {
    async create({ tipo, destinatario, asunto, cuerpo, estado = 'Pendiente', error = null, fecha_envio = null }) {
        return this.dbCreate('notificaciones', { tipo, destinatario, asunto, cuerpo, estado, error, fecha_envio });
    }

    async updateEstado(id_notificacion, { estado, error = null, fecha_envio = null }) {
        return this.dbUpdate('notificaciones', 'id_notificacion', id_notificacion, { estado, error, fecha_envio });
    }

    async findAll({ estado } = {}) {
        if (this.useSupabase) {
            let query = this.supabase.from('notificaciones').select('*');
            if (estado) query = query.eq('estado', estado);
            const { data, error } = await query.order('fecha_creacion', { ascending: false });
            if (error) throw error;
            return data;
        }
        if (estado) {
            return this.dbFindAll('notificaciones', 'fecha_creacion', 'DESC', '*')
                .then((rows) => rows.filter((r) => r.estado === estado));
        }
        return this.dbFindAll('notificaciones', 'fecha_creacion', 'DESC');
    }
}

export default NotificationModel;
