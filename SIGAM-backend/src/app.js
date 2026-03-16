import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import errorMiddleware from './middlewares/error.middleware.js';
import requestContext from './middlewares/requestContext.middleware.js';
import optionalAuth from './middlewares/optionalAuth.middleware.js';
import auditRequest from './middlewares/auditRequest.middleware.js';

// Rutas
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import assetRoutes from './routes/asset.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import maintenanceRoutes from './routes/maintenance.routes.js';
import metricsRoutes from './routes/metrics.routes.js';
import categoriaRoutes from './routes/categoria.routes.js';
import auditLogRoutes from './routes/auditLog.routes.js';

//  Nuevas rutas CRUD completos
import repuestoRoutes from './routes/repuesto.routes.js';
import proveedorRoutes from './routes/proveedor.routes.js';
import ubicacionRoutes from './routes/ubicacion.routes.js';
import licenciaRoutes from './routes/licencia.routes.js';
import softwareRoutes from './routes/software.routes.js';
import iaJobsRoutes from './routes/iaJobs.routes.js';
import iaCronRoutes from './routes/iaCron.routes.js';
import categoriaTicketRoutes from './routes/categoriaTicket.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import reportRoutes from './routes/report.routes.js';
import alertRoutes from './routes/alerta.routes.js';

const app = express();

// Trust proxy for Vercel/Edge so rate limiting reads client IP correctly.
app.set('trust proxy', 1);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(requestContext);
app.use(optionalAuth);
app.use(auditRequest());

// Root route for quick health/info checks in deployments.
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'SIGAM API',
        docs: '/health and /api/*'
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Auth
app.use('/api/auth', authRoutes);

// Recursos
app.use('/api/usuarios', userRoutes);
app.use('/api/activos', assetRoutes);
app.use('/api/tickets/categorias', categoriaTicketRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/mantenimientos', maintenanceRoutes);
app.use('/api/metricas', metricsRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/repuestos', repuestoRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/ubicaciones', ubicacionRoutes);
app.use('/api/licencias', licenciaRoutes);
app.use('/api/software', softwareRoutes);
app.use('/api/jobs/ia', iaJobsRoutes);
app.use('/api/cron/ia', iaCronRoutes);
app.use('/api/auditoria', auditLogRoutes);
app.use('/api/notificaciones', notificationRoutes);
app.use('/api/reportes', reportRoutes);
app.use('/api/alertas', alertRoutes);

// Error handler
app.use(errorMiddleware);

export default app;
