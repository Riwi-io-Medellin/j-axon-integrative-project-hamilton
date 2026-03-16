import RepuestoModel from '../../models/repuesto.js';
import AlertaModel from '../../models/alerta.js';
import AssetModel from '../../models/Asset.js';
import TicketModel from '../../models/Ticket.js';
import MaintenanceModel from '../../models/Maintenance.js';
import CategoriaTicketModel from '../../models/categoriaTicket.js';
import { getIaConfig } from '../../config/ia.js';
import OpenAIProvider from './providers/OpenAIProvider.js';
import AuditLogService from '../auditLog.service.js';
import NotificationService from '../notification.service.js';

// Coerce values to numbers with a fallback.
function toNumber(value, defaultValue = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : defaultValue;
}

// Normalize query params to a safe positive integer range.
function normalizePositiveInt(value, { min = 1, max = 3650, defaultValue }) {
    if (value === undefined || value === null || value === '') return defaultValue;
    const n = Number.parseInt(String(value), 10);
    if (!Number.isInteger(n) || n < min || n > max) return defaultValue;
    return n;
}

// Service for IA batch jobs and scheduled recommendations.
class IaJobsService {
    constructor({ repuestoModel, alertaModel, assetModel, ticketModel, maintenanceModel, openAiProvider, iaConfig, auditLogService } = {}) {
        // Initialize dependencies with defaults.
        this.repuestoModel = repuestoModel || new RepuestoModel();
        this.alertaModel = alertaModel || new AlertaModel();
        this.assetModel = assetModel || new AssetModel();
        this.ticketModel = ticketModel || new TicketModel();
        this.maintenanceModel = maintenanceModel || new MaintenanceModel();
        this.categoriaTicketModel = new CategoriaTicketModel();
        this.iaConfig = iaConfig || getIaConfig();
        this.auditLogService = auditLogService || new AuditLogService();
        this.notificationService = new NotificationService();
        this.openAiProvider = openAiProvider || new OpenAIProvider({
            apiKey: this.iaConfig.openAiApiKey,
            model: this.iaConfig.openAiModel,
            timeoutMs: this.iaConfig.timeoutMs,
            circuitBreaker: this.iaConfig.circuitBreaker
        });
    }

    // Log a successful IA job execution.
    logJobSuccess(job, metadata) {
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor: null,
                context: null,
                entidad: 'JOB_IA',
                accion: 'JOB_IA_RUN',
                metadata: { job, ...(metadata || {}) }
            })
        );
    }

    // Log an IA job failure.
    logJobError(job, error, metadata) {
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor: null,
                context: null,
                entidad: 'JOB_IA',
                accion: 'JOB_IA_ERROR',
                status: 'ERROR',
                error,
                metadata: { job, ...(metadata || {}) }
            })
        );
    }

    // IA-5: Suggest spare part purchases based on consumption.
    async generatePurchaseSuggestions({
        windowDays = 60,
        horizonDays = 30,
        tipoAlerta = 'IA_COMPRA_SUGERIDA'
    } = {}) {
        const wd = normalizePositiveInt(windowDays, { min: 1, max: 3650, defaultValue: 60 });
        const hd = normalizePositiveInt(horizonDays, { min: 1, max: 3650, defaultValue: 30 });

        try {
            const rows = await this.repuestoModel.getConsumptionWindowByRepuesto({ windowDays: wd });

            const suggestions = [];
            let createdAlerts = 0;
            let skippedExistingAlerts = 0;

            for (const r of rows) {
                const stock = toNumber(r.stock, 0);
                const stock_minimo = toNumber(r.stock_minimo, 0);
                const consumido_window = toNumber(r.consumido_window, 0);
                const consumo_diario_estimado = consumido_window / wd;

                const dias_proyeccion_quiebre =
                    consumo_diario_estimado > 0 ? stock / consumo_diario_estimado : null;

                const shouldSuggest =
                    stock <= stock_minimo ||
                    (dias_proyeccion_quiebre !== null && dias_proyeccion_quiebre <= hd);

                if (!shouldSuggest) continue;

                suggestions.push({
                    id_repuesto: r.id_repuesto,
                    nombre: r.nombre,
                    stock,
                    stock_minimo,
                    window_days: wd,
                    horizon_days: hd,
                    consumido_window,
                    consumo_diario_estimado,
                    dias_proyeccion_quiebre
                });

                const ensured = await this.alertaModel.ensurePendingByTipoAndRepuesto(tipoAlerta, r.id_repuesto);
                if (ensured.created) createdAlerts += 1;
                else skippedExistingAlerts += 1;
            }

            const result = {
                window_days: wd,
                horizon_days: hd,
                tipo_alerta: tipoAlerta,
                total_sugerencias: suggestions.length,
                alertas_creadas: createdAlerts,
                alertas_ya_existentes: skippedExistingAlerts,
                sugerencias: suggestions
            };

            this.logJobSuccess('IA-5', {
                total_sugerencias: result.total_sugerencias,
                alertas_creadas: result.alertas_creadas,
                alertas_ya_existentes: result.alertas_ya_existentes
            });

            return result;
        } catch (error) {
            this.logJobError('IA-5', error);
            throw error;
        }
    }

    // IA-6: Suggest asset disposal based on repair cost ratio.
    async generateDisposalSuggestions({
        windowDays = 365,
        thresholdPct = 0.6,
        tipoAlerta = 'IA_BAJA_SUGERIDA'
    } = {}) {
        const defaultWindowDays = normalizePositiveInt(process.env.IA_DISPOSAL_WINDOW_DAYS, { min: 1, max: 3650, defaultValue: 365 });
        const defaultThresholdPctRaw = Number(process.env.IA_DISPOSAL_THRESHOLD_PCT);
        const defaultThresholdPct = Number.isFinite(defaultThresholdPctRaw) ? defaultThresholdPctRaw : 0.6;

        const wd = normalizePositiveInt(windowDays, { min: 1, max: 3650, defaultValue: defaultWindowDays });
        const threshold = Number(thresholdPct);
        const pct = Number.isFinite(threshold) && threshold > 0 && threshold < 10 ? threshold : defaultThresholdPct;

        try {
            const rows = await this.assetModel.getRepairPartsCostWindowByActivo({ windowDays: wd });

            const suggestions = [];
            let createdAlerts = 0;
            let skippedExistingAlerts = 0;
            let skippedMissingCost = 0;

            for (const a of rows) {
                const costo_compra = toNumber(a.costo_compra, 0);
                if (!(costo_compra > 0)) {
                    skippedMissingCost += 1;
                    continue;
                }
                const costo_repuestos_window = toNumber(a.costo_repuestos_window, 0);
                const ratio = costo_repuestos_window / costo_compra;

                if (!(ratio >= pct)) continue;

                suggestions.push({
                    id_activo: a.id_activo,
                    serial: a.serial || null,
                    modelo: a.modelo || null,
                    window_days: wd,
                    costo_compra,
                    costo_repuestos_window,
                    ratio_reparacion_vs_compra: ratio,
                    threshold_pct: pct
                });

                const ensured = await this.alertaModel.ensurePendingByTipoAndActivo(tipoAlerta, a.id_activo);
                if (ensured.created) createdAlerts += 1;
                else skippedExistingAlerts += 1;
            }

            const result = {
                window_days: wd,
                threshold_pct: pct,
                tipo_alerta: tipoAlerta,
                total_sugerencias: suggestions.length,
                alertas_creadas: createdAlerts,
                alertas_ya_existentes: skippedExistingAlerts,
                activos_sin_costo_compra: skippedMissingCost,
                sugerencias: suggestions
            };

            this.logJobSuccess('IA-6', {
                total_sugerencias: result.total_sugerencias,
                alertas_creadas: result.alertas_creadas,
                alertas_ya_existentes: result.alertas_ya_existentes,
                activos_sin_costo_compra: result.activos_sin_costo_compra
            });

            return result;
        } catch (error) {
            this.logJobError('IA-6', error);
            throw error;
        }
    }

    // IA-OBSOLESCENCIA: Generate alerts for assets older than N months.
    async generateObsolescenceAlerts({
        months = 48,
        limit = 50,
        tipoAlerta = 'ACTIVO_OBSOLESCENTE'
    } = {}) {
        const m = normalizePositiveInt(months, { min: 1, max: 2400, defaultValue: 48 });
        const lim = normalizePositiveInt(limit, { min: 1, max: 500, defaultValue: 50 });

        try {
            const candidates = await this.assetModel.findObsolescenceCandidates({ months: m, limit: lim });
            let createdAlerts = 0;
            let skippedExistingAlerts = 0;

            for (const a of candidates) {
                const ensured = await this.alertaModel.ensurePendingByTipoAndActivo(tipoAlerta, a.id_activo);
                if (ensured.created) createdAlerts += 1;
                else skippedExistingAlerts += 1;
            }

            const result = {
                months: m,
                limit: lim,
                tipo_alerta: tipoAlerta,
                candidatos: candidates.length,
                alertas_creadas: createdAlerts,
                alertas_ya_existentes: skippedExistingAlerts
            };

            this.logJobSuccess('IA-OBSOLESCENCIA', {
                candidatos: result.candidatos,
                alertas_creadas: result.alertas_creadas,
                alertas_ya_existentes: result.alertas_ya_existentes
            });

            return result;
        } catch (error) {
            this.logJobError('IA-OBSOLESCENCIA', error);
            throw error;
        }
    }

    // Re-run external IA for ticket classification and priority.
    async reprocessTicketsExternal({
        limit = 20,
        sinceDays = 30
    } = {}) {
        const lim = normalizePositiveInt(limit, { min: 1, max: 500, defaultValue: 20 });
        const days = normalizePositiveInt(sinceDays, { min: 1, max: 3650, defaultValue: 30 });

        if (!this.iaConfig.enabled) {
            const result = { ok: false, reason: 'IA deshabilitada', processed: 0, updated: 0 };
            this.logJobSuccess('IA-EXTERNAL', { ok: false, reason: result.reason });
            return result;
        }

        if (!this.openAiProvider?.isAvailable?.()) {
            const result = { ok: false, reason: 'Proveedor externo no disponible', processed: 0, updated: 0 };
            this.logJobSuccess('IA-EXTERNAL', { ok: false, reason: result.reason });
            return result;
        }

        try {
            const candidates = await this.ticketModel.findTicketsForIaReprocess({ limit: lim, sinceDays: days });
            let processed = 0;
            let updated = 0;
            let skippedNoActivo = 0;
            let skippedNoOutput = 0;
            let failed = 0;

            for (const t of candidates) {
                processed += 1;
                try {
                    const activo = await this.assetModel.findById(t.id_activo);
                    if (!activo) {
                        skippedNoActivo += 1;
                        continue;
                    }

                    const criticidadActivo = activo.nivel_criticidad || activo.criticidad || 'Media';

                    const clasificacion = await this.openAiProvider.classifyTicket({ descripcion: t.descripcion });
                    const categoria = clasificacion?.categoria ?? null;
                    if (!categoria) {
                        skippedNoOutput += 1;
                        continue;
                    }

                    const triage = await this.openAiProvider.triageTicket({
                        descripcion: t.descripcion,
                        categoria,
                        criticidadActivo
                    });
                    const prioridad = triage?.prioridad ?? null;
                    if (!prioridad) {
                        skippedNoOutput += 1;
                        continue;
                    }

                    await this.ticketModel.updateIaFields(t.id_ticket, {
                        clasificacion_nlp: categoria,
                        prioridad_ia: prioridad,
                        clasificacion_metodo: clasificacion?.metodo || this.openAiProvider.name,
                        clasificacion_confidence: clasificacion?.confidence ?? null,
                        clasificacion_rationale: clasificacion?.rationale || null,
                        prioridad_metodo: triage?.metodo || this.openAiProvider.name,
                        prioridad_rationale: triage?.rationale || null
                    });
                    updated += 1;
                } catch {
                    failed += 1;
                }
            }

            const result = {
                ok: true,
                limit: lim,
                since_days: days,
                processed,
                updated,
                skipped_no_activo: skippedNoActivo,
                skipped_no_output: skippedNoOutput,
                failed
            };

            this.logJobSuccess('IA-EXTERNAL', {
                processed,
                updated,
                skipped_no_activo: skippedNoActivo,
                skipped_no_output: skippedNoOutput,
                failed
            });

            return result;
        } catch (error) {
            this.logJobError('IA-EXTERNAL', error);
            throw error;
        }
    }

    // IA-7: Create preventive maintenance tickets on schedule.
    async generatePreventiveMaintenance({
        intervalDays = null,
        scheduleOffsetDays = null,
        limit = 20,
        reporterUserId
    } = {}) {
        if (!reporterUserId) throw { status: 400, message: 'reporterUserId es requerido' };

        const defaultInterval = normalizePositiveInt(process.env.IA_MP_INTERVAL_DAYS, { min: 1, max: 3650, defaultValue: 180 });
        const defaultOffset = normalizePositiveInt(process.env.IA_MP_OFFSET_DAYS, { min: 0, max: 3650, defaultValue: 1 });

        const interval = normalizePositiveInt(intervalDays, { min: 1, max: 3650, defaultValue: defaultInterval });
        const offset = normalizePositiveInt(scheduleOffsetDays, { min: 0, max: 3650, defaultValue: defaultOffset });
        const lim = normalizePositiveInt(limit, { min: 1, max: 500, defaultValue: 20 });

        try {
            const candidates = await this.assetModel.findPreventiveMaintenanceCandidates({ intervalDays: interval, limit: lim });

            let considered = 0;
            let createdTickets = 0;
            let skippedAlreadyOpen = 0;
            let skippedNoTechnician = 0;
            const created = [];

            const categoriaHardware = await this.categoriaTicketModel.findByNombre('Hardware');
            for (const a of candidates) {
                considered += 1;
                const alreadyOpen = await this.ticketModel.hasOpenPreventiveTicket(a.id_activo);
                if (alreadyOpen) {
                    skippedAlreadyOpen += 1;
                    continue;
                }

                const tecnico = await this.ticketModel.findSupportTechnicianWithLeastLoad();
                if (!tecnico) {
                    skippedNoTechnician += 1;
                    continue;
                }

                const criticidad = String(a.nivel_criticidad || 'Media');
                const scheduledAt = this.#computeScheduleDate({ offsetDays: offset, criticidad });

                const ticket = await this.ticketModel.create({
                    id_activo: a.id_activo,
                    id_usuario_reporta: reporterUserId,
                    descripcion: `Mantenimiento preventivo programado (intervalo ${interval} días)`,
                    prioridad_ia: criticidad === 'Crítica' ? 'Alta' : 'Media',
                    clasificacion_nlp: 'Hardware',
                    id_categoria_ticket: categoriaHardware?.id_categoria_ticket ?? null,
                    tipo_ticket: 'Preventivo',
                    estado: 'Abierto',
                    clasificacion_metodo: 'rules_v1',
                    prioridad_metodo: 'rules_v1',
                    clasificacion_rationale: `mp_interval_days=${interval}`,
                    prioridad_rationale: `mp_criticidad=${criticidad}`
                });

                await this.ticketModel.assignToTechnician(ticket.id_ticket, tecnico.id_usuario);
                await this.maintenanceModel.updateByTicketId(ticket.id_ticket, { fecha_inicio: scheduledAt });

                await this.assetModel.addHistory(
                    a.id_activo,
                    'Mantenimiento Preventivo',
                    `MP programado para ${scheduledAt}`
                );

                createdTickets += 1;
                created.push({
                    id_ticket: ticket.id_ticket,
                    id_activo: a.id_activo,
                    id_usuario_tecnico: tecnico.id_usuario,
                    tecnico_asignado: tecnico.nombre,
                    fecha_inicio: scheduledAt
                });

                if (tecnico?.email) {
                    await this.notificationService.enqueueEmail({
                        tipo: 'MANTENIMIENTO_PROGRAMADO',
                        destinatario: tecnico.email,
                        asunto: `Mantenimiento programado #${ticket.id_ticket}`,
                        cuerpo: `Se programó mantenimiento preventivo para el activo ${a.id_activo} (ticket ${ticket.id_ticket})`
                    });
                }
            }

            const result = {
                interval_days: interval,
                schedule_offset_days: offset,
                limit: lim,
                candidatos: candidates.length,
                considerados: considered,
                tickets_creados: createdTickets,
                omitidos_ya_abiertos: skippedAlreadyOpen,
                omitidos_sin_tecnico: skippedNoTechnician,
                creados: created
            };

            this.logJobSuccess('IA-7', {
                candidatos: result.candidatos,
                considerados: result.considerados,
                tickets_creados: result.tickets_creados,
                omitidos_ya_abiertos: result.omitidos_ya_abiertos,
                omitidos_sin_tecnico: result.omitidos_sin_tecnico
            });

            return result;
        } catch (error) {
            this.logJobError('IA-7', error);
            throw error;
        }
    }

    // Compute a scheduled date based on asset criticality.
    #computeScheduleDate({ offsetDays, criticidad }) {
        const d = new Date();
        d.setDate(d.getDate() + Number(offsetDays || 0));
        d.setMinutes(0, 0, 0);

        const normalizedCrit = String(criticidad || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();

        if (normalizedCrit === 'critica') {
            d.setHours(19, 0, 0, 0);
            return d.toISOString();
        }

        d.setHours(9, 0, 0, 0);
        return d.toISOString();
    }
}

export default IaJobsService;
