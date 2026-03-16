import NotificationModel from '../models/notification.js';

let nodemailer = null;
try {
    // Optional dependency; only used when SMTP is configured.
    const imported = await import('nodemailer');
    nodemailer = imported?.default || imported;
} catch {
    nodemailer = null;
}

class NotificationService {
    constructor(model = new NotificationModel()) {
        this.model = model;
    }

    async enqueueEmail({ tipo, destinatario, asunto, cuerpo }) {
        const created = await this.model.create({ tipo, destinatario, asunto, cuerpo, estado: 'Pendiente' });
        await this.trySend(created);
        return created;
    }

    async trySend(notification) {
        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = Number(process.env.SMTP_PORT || 587);
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;
        const from = process.env.SMTP_FROM || smtpUser;

        if (!smtpHost || !smtpUser || !smtpPass || !from || !nodemailer) {
            return notification;
        }

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: { user: smtpUser, pass: smtpPass }
        });

        try {
            await transporter.sendMail({
                from,
                to: notification.destinatario,
                subject: notification.asunto,
                text: notification.cuerpo
            });
            await this.model.updateEstado(notification.id_notificacion, {
                estado: 'Enviado',
                fecha_envio: new Date()
            });
        } catch (error) {
            await this.model.updateEstado(notification.id_notificacion, {
                estado: 'Error',
                error: String(error?.message || error)
            });
        }
        return notification;
    }

    findAll(filters) {
        return this.model.findAll(filters);
    }
}

export default NotificationService;
