import AssetModel from '../models/Asset.js';
import UserModel from '../models/User.js';
import CategoriaTicketModel from '../models/categoriaTicket.js';
import MaintenanceModel from '../models/Maintenance.js';
import { getIaConfig } from '../config/ia.js';
import DecisionEngine from './ia/DecisionEngine.js';
import TicketSuggestionEngine from './ia/TicketSuggestionEngine.js';
import AuditLogService from './auditLog.service.js';
import NotificationService from './notification.service.js';
import { normalizePagination } from '../utils/pagination.js';

// Tickets service: classification, triage, assignment, and audit logging.
class TicketService {
    constructor(model, { assetModel, iaConfig, decisionEngine, auditLogService } = {}) {
        this.model = model;
        this.assetModel = assetModel || new AssetModel();
        this.userModel = new UserModel();
        this.categoriaModel = new CategoriaTicketModel();
        this.maintenanceModel = new MaintenanceModel();
        this.iaConfig = iaConfig || getIaConfig();
        this.decisionEngine = decisionEngine || new DecisionEngine(this.iaConfig);
        this.suggestionEngine = new TicketSuggestionEngine({ maxSuggestions: 3 });
        this.auditLogService = auditLogService || new AuditLogService();
        this.notificationService = new NotificationService();
    }
    static ESTADOS_VALIDOS = new Set(['Abierto', 'Asignado', 'En Proceso', 'Resuelto', 'Cerrado']);

    // List tickets (data access handled by model).
    findAll({ limit, offset } = {}) {
        const pagination = normalizePagination({ limit, offset, defaultLimit: 100, maxLimit: 500 });
        return this.model.findAll(pagination);
    }

    // Read ticket by id and enforce access rules.
    async findById(id, user) {
        const t = await this.model.findById(id);
        if (!t) throw { status: 404, message: `Ticket ${id} no encontrado` };
        await this.ensureAccess(id, user);
        return t;
    }

    // Tickets by asset id.
    findByActivo(id_activo, { limit, offset } = {}) {
        const pagination = normalizePagination({ limit, offset, defaultLimit: 100, maxLimit: 500 });
        return this.model.findByActivo(id_activo, pagination);
    }

    // Tickets assigned to a technician.
    findAssignedByTecnico(id_tecnico, { limit, offset } = {}) {
        const pagination = normalizePagination({ limit, offset, defaultLimit: 100, maxLimit: 500 });
        return this.model.findAssignedByTecnico(id_tecnico, pagination);
    }

    // Suggest similar resolutions using recent history.
    async getSuggestions(id_ticket, user) {
        await this.ensureAccess(id_ticket, user);

        const cached = await this.model.getSuggestionsCache(id_ticket);
        if (cached?.sugerencias) {
            const ticket = await this.model.findCoreById(id_ticket);
            let cachedSuggestions = cached.sugerencias;
            if (typeof cachedSuggestions === 'string') {
                try { cachedSuggestions = JSON.parse(cachedSuggestions); } catch { cachedSuggestions = []; }
            }
            return {
                id_ticket,
                id_activo: ticket?.id_activo ?? null,
                suggestions: Array.isArray(cachedSuggestions) ? cachedSuggestions : []
            };
        }

        return this.generateAndCacheSuggestions(id_ticket);
    }

    // Create ticket: classify and triage with IA rules, then optionally auto-assign.
    async create(payload, user, auditContext) {
        if (!payload.descripcion) throw { status: 400, message: 'descripcion es requerida' };
        if (!payload.id_activo) throw { status: 400, message: 'id_activo es requerido' };
        if (!user?.id) throw { status: 401, message: 'Usuario no autenticado' };

        const activo = await this.assetModel.findById(payload.id_activo);
        if (!activo) throw { status: 404, message: `Activo ${payload.id_activo} no encontrado` };

        const criticidadActivo = activo.nivel_criticidad || activo.criticidad || 'Media';

        const clasificacion = await this.decisionEngine.classifyTicket({
            descripcion: payload.descripcion
        });
        const categoria = clasificacion?.categoria ?? null;
        const categoriaRow = payload?.id_categoria_ticket
            ? await this.categoriaModel.findById(payload.id_categoria_ticket)
            : (categoria ? await this.categoriaModel.findByNombre(categoria) : null);
        if (payload?.id_categoria_ticket && !categoriaRow) {
            throw { status: 400, message: 'id_categoria_ticket inválido' };
        }

        const triage = await this.decisionEngine.triageTicket({
            descripcion: payload.descripcion,
            categoria,
            criticidadActivo
        });

        const prioridad = triage?.prioridad ?? 'Media';

        const normalizedPayload = {
            ...payload,
            id_usuario_reporta: user.id,
            clasificacion_nlp: categoria,
            id_categoria_ticket: categoriaRow?.id_categoria_ticket ?? null,
            tipo_ticket: payload?.tipo_ticket || 'Correctivo',
            prioridad_ia: prioridad,
            clasificacion_metodo: clasificacion?.metodo || null,
            clasificacion_confidence: clasificacion?.confidence ?? null,
            clasificacion_rationale: clasificacion?.rationale || null,
            prioridad_metodo: triage?.metodo || null,
            prioridad_rationale: triage?.rationale || null,
            estado: 'Abierto'
        };

        const created = await this.model.create(normalizedPayload);

        await this.model.addHistory({
            id_ticket: created?.id_ticket,
            id_usuario: user.id,
            cambio: 'CREADO',
            detalle: 'Ticket creado'
        });

        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor: user,
                context: auditContext,
                entidad: 'TICKET',
                entidad_id: created?.id_ticket,
                accion: 'TICKET_CREATE',
                payload_after: created,
                metadata: { id_activo: payload.id_activo }
            })
        );

        if (!created?.id_ticket) return created;

        // Generate suggestions immediately after ticket creation (best-effort).
        this.generateAndCacheSuggestions(created.id_ticket, user).catch((error) => {
            this.auditLogService.safeLog(
                this.auditLogService.buildDomainEntry({
                    actor: user,
                    context: auditContext,
                    entidad: 'JOB_IA',
                    accion: 'JOB_IA_ERROR',
                    status: 'ERROR',
                    error,
                    metadata: { job: 'TICKET_SUGGESTIONS', id_ticket: created.id_ticket }
                })
            );
        });

        // Auto-assign if IA config allows and model supports it.
        if (!this.iaConfig.enabled || !this.iaConfig.assignmentEnabled) {
            return created;
        }

        if (typeof this.model.findSupportTechnicianWithLeastLoad !== 'function' || typeof this.model.assignToTechnician !== 'function') {
            return created;
        }

        const tecnico = await this.model.findSupportTechnicianWithLeastLoad();
        if (!tecnico) {
            return created;
        }

        await this.model.assignToTechnician(created.id_ticket, tecnico.id_usuario);
        const hydrated = await this.model.findById(created.id_ticket);
        if (!hydrated) return created;
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor: user,
                context: auditContext,
                entidad: 'TICKET',
                entidad_id: created.id_ticket,
                accion: 'TICKET_ASSIGN',
                payload_after: hydrated,
                metadata: { id_usuario_tecnico: tecnico.id_usuario }
            })
        );
        if (tecnico?.email) {
            await this.notificationService.enqueueEmail({
                tipo: 'TICKET_ASIGNADO',
                destinatario: tecnico.email,
                asunto: `Ticket asignado #${created.id_ticket}`,
                cuerpo: `Se te asignó el ticket ${created.id_ticket}.`
            });
        }
        return {
            ...hydrated,
            id_usuario_tecnico: tecnico.id_usuario,
            tecnico_asignado: tecnico.nombre
        };
    }

    async generateAndCacheSuggestions(id_ticket, user = null) {
        const ticket = await this.model.findCoreById(id_ticket);
        if (!ticket) throw { status: 404, message: `Ticket ${id_ticket} no encontrado` };

        const candidates = await this.model.findResolvedCandidatesByActivo({
            id_activo: ticket.id_activo,
            exclude_id_ticket: id_ticket,
            limit: 12
        });

        const historical = this.suggestionEngine.suggest({ ticket, candidates });
        const iaMax = Number.isInteger(this.iaConfig?.suggestionsMax) ? this.iaConfig.suggestionsMax : 3;
        let iaSuggestions = [];
        const derivedFromHistory = (historical || []).map((h) => ({
            titulo: h?.descripcion || 'Solución basada en historial',
            solucion: h?.solucion || h?.diagnostico || 'Solución basada en historial.',
            pasos: [],
            advertencias: ['Derivado de ticket similar.'],
            confianza: Number.isFinite(h?.score) ? h.score : null,
            origen: 'historico'
        }));
        iaSuggestions = iaSuggestions.concat(derivedFromHistory);
        let iaWarning = null;

        if (this.iaConfig?.suggestionsEnabled) {
            const activo = await this.assetModel.findById(ticket.id_activo).catch(() => null);
            const iaResult = await this.decisionEngine.suggestSolutions({
                ticket,
                activo,
                candidates,
                maxSuggestions: iaMax
            });
            if (!iaResult) {
                iaWarning = 'IA no disponible o sin respuesta.';
            }
            const modelSuggestions = (iaResult?.suggestions || []).map((s) => {
                const rawSolution = typeof s?.solucion === 'string' ? s.solucion.trim() : '';
                const rawCause = typeof s?.causa === 'string' ? s.causa.trim() : '';
                const fallbackSolution = `Solución sugerida basada en la descripción: ${ticket?.descripcion || 'sin descripción'}.`;
                const fallbackCause = 'Causa probable no confirmada';
                const pasos = Array.isArray(s?.pasos) ? s.pasos.filter(Boolean) : [];
                const fallbackPasos = [
                    'Revisar síntomas y validar el estado del activo.',
                    'Aplicar procedimiento estándar según la categoría del ticket.'
                ];
                const advertencias = Array.isArray(s?.advertencias) ? s.advertencias.filter(Boolean) : [];
                if (!rawSolution) {
                    advertencias.unshift('IA no devolvió solución; se aplicó fallback.');
                }
                return {
                    titulo: s?.titulo ?? 'Solución sugerida',
                    causa: rawCause || fallbackCause,
                    solucion: rawSolution || fallbackSolution,
                    pasos: pasos.length ? pasos : fallbackPasos,
                    advertencias,
                    confianza: Number.isFinite(s?.confianza) ? s.confianza : null,
                    origen: rawSolution ? 'ia' : 'fallback'
                };
            });
            iaSuggestions = modelSuggestions;
            if (!iaSuggestions.length && iaWarning) {
                iaSuggestions.push({
                    titulo: 'Sugerencia generada por fallback',
                    causa: 'Causa probable no confirmada',
                    solucion: `Solución sugerida basada en la descripción: ${ticket?.descripcion || 'sin descripción'}.`,
                    pasos: [
                        'Revisar síntomas y validar el estado del activo.',
                        'Aplicar procedimiento estándar según la categoría del ticket.'
                    ],
                    advertencias: [iaWarning, 'Se usó fallback por falta de respuesta de IA.'],
                    confianza: null,
                    origen: 'fallback'
                });
            }
        }

        const maxTotal = Math.max(this.suggestionEngine.maxSuggestions, iaMax);
        let suggestions = iaSuggestions.slice(0, maxTotal);
        if (!suggestions.length) {
            suggestions = derivedFromHistory.slice(0, maxTotal);
        }

        await this.model.saveSuggestionsCache(id_ticket, suggestions);

        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor: user,
                context: null,
                entidad: 'JOB_IA',
                accion: 'JOB_IA_RUN',
                metadata: {
                    job: 'TICKET_SUGGESTIONS',
                    id_ticket,
                    total_sugerencias: suggestions.length,
                    historico: historical.length,
                    ia: iaSuggestions.length
                }
            })
        );

        return {
            id_ticket,
            id_activo: ticket.id_activo,
            suggestions
        };
    }

    // Update ticket fields or delegate to changeEstado when requested.
    async update(id, payload, user, auditContext) {
        await this.ensureAccess(id, user);
        if (payload?.estado !== undefined) {
            await this.changeEstado(
                id,
                payload.estado,
                user,
                payload?.consumos,
                auditContext,
                {
                    diagnostico: payload?.diagnostico,
                    acciones_realizadas: payload?.acciones_realizadas
                }
            );
            const updateData = { ...payload };
            delete updateData.estado;
            delete updateData.consumos;
            delete updateData.diagnostico;
            delete updateData.acciones_realizadas;
            if (Object.keys(updateData).length === 0) {
                const current = await this.model.findById(id);
                if (!current) throw { status: 404, message: `Ticket ${id} no encontrado` };
                return current;
            }
            const before = await this.model.findById(id);
            const updated = await this.model.update(id, updateData);
            if (!updated) throw { status: 404, message: `Ticket ${id} no encontrado` };
            this.auditLogService.safeLog(
                this.auditLogService.buildDomainEntry({
                    actor: user,
                    context: auditContext,
                    entidad: 'TICKET',
                    entidad_id: id,
                    accion: 'TICKET_UPDATE',
                    payload_before: before,
                    payload_after: updated
                })
            );
            await this.model.addHistory({
                id_ticket: id,
                id_usuario: user?.id ?? null,
                cambio: 'ACTUALIZADO',
                detalle: 'Ticket actualizado'
            });
            return updated;
        }
        const before = typeof this.model.findById === 'function'
            ? await this.model.findById(id)
            : null;
        const t = await this.model.update(id, payload);
        if (!t) throw { status: 404, message: `Ticket ${id} no encontrado` };
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor: user,
                context: auditContext,
                entidad: 'TICKET',
                entidad_id: id,
                accion: 'TICKET_UPDATE',
                payload_before: before,
                payload_after: t
            })
        );
        await this.model.addHistory({
            id_ticket: id,
            id_usuario: user?.id ?? null,
            cambio: 'ACTUALIZADO',
            detalle: 'Ticket actualizado'
        });
        return t;
    }

    // Change state with validation and optional consumos handling.
    async changeEstado(id, estado, user, consumos, auditContext, solucion = {}) {
        if (!estado) throw { status: 400, message: 'estado es requerido' };
        if (!TicketService.ESTADOS_VALIDOS.has(estado)) {
            throw { status: 400, message: `estado inválido: ${estado}` };
        }

        await this.ensureAccess(id, user);
        const before = typeof this.model.findById === 'function'
            ? await this.model.findById(id)
            : null;

        // Business rule: technicians can only close tickets assigned to them.
        if (user?.role === 'Técnico' && estado === 'Cerrado') {
            const assigned = await this.model.isAssignedToTecnico(id, user.id);
            if (!assigned) {
                throw { status: 403, message: 'El ticket no está asignado a este técnico' };
            }
        }

        const diagnostico = solucion?.diagnostico ?? null;
        const acciones_realizadas = solucion?.acciones_realizadas ?? null;
        const hasSolution = Boolean(diagnostico || acciones_realizadas);
        const persistSolution = async () => {
            if (!hasSolution) return;
            await this.maintenanceModel.upsertByTicketId(id, {
                diagnostico,
                acciones_realizadas,
                fecha_fin: new Date(),
                id_usuario_tecnico: user?.id ?? null
            });
        };

        if (estado === 'Cerrado' && Array.isArray(consumos) && consumos.length) {
            for (const item of consumos) {
                if (!item?.id_repuesto) {
                    throw { status: 400, message: 'consumos.id_repuesto es requerido' };
                }
                const qty = Number(item.cantidad_usada);
                if (!Number.isFinite(qty) || qty <= 0) {
                    throw { status: 400, message: 'consumos.cantidad_usada debe ser > 0' };
                }
            }
            const closed = await this.model.closeWithConsumos(id, consumos);
            await persistSolution();
            await this.model.addHistory({
                id_ticket: id,
                id_usuario: user?.id ?? null,
                cambio: 'CERRADO',
                detalle: 'Ticket cerrado con consumos'
            });
            this.auditLogService.safeLog(
                this.auditLogService.buildDomainEntry({
                    actor: user,
                    context: auditContext,
                    entidad: 'TICKET',
                    entidad_id: id,
                    accion: 'TICKET_CLOSE',
                    payload_before: before,
                    payload_after: closed,
                    metadata: { consumos }
                })
            );
            return closed;
        }

        const fechaCierre = estado === 'Cerrado' ? new Date() : null;
        const t = await this.model.updateEstado(id, estado, fechaCierre);
        if (!t) throw { status: 404, message: `Ticket ${id} no encontrado` };
        if (estado === 'Cerrado') {
            await persistSolution();
        }
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor: user,
                context: auditContext,
                entidad: 'TICKET',
                entidad_id: id,
                accion: estado === 'Cerrado' ? 'TICKET_CLOSE' : 'TICKET_UPDATE',
                payload_before: before,
                payload_after: t
            })
        );
        await this.model.addHistory({
            id_ticket: id,
            id_usuario: user?.id ?? null,
            cambio: estado === 'Cerrado' ? 'CERRADO' : 'ESTADO',
            detalle: `Estado actualizado a ${estado}`
        });
        const core = await this.model.findCoreById(id);
        const reporter = core?.id_usuario_reporta ? await this.userModel.findById(core.id_usuario_reporta) : null;
        if (reporter?.email) {
            const tipo = estado === 'Cerrado' ? 'TICKET_CERRADO' : 'TICKET_ESTADO';
            const asunto = estado === 'Cerrado' ? `Ticket cerrado #${id}` : `Actualización de ticket #${id}`;
            const cuerpo = estado === 'Cerrado'
                ? `Tu ticket ${id} fue cerrado.`
                : `Tu ticket ${id} cambió a estado ${estado}.`;
            await this.notificationService.enqueueEmail({
                tipo,
                destinatario: reporter.email,
                asunto,
                cuerpo
            });
        }
        return t;
    }

    async addComment(id_ticket, comentario, user, auditContext) {
        if (!comentario) throw { status: 400, message: 'comentario es requerido' };
        await this.ensureAccess(id_ticket, user);
        const created = await this.model.addComment({ id_ticket, id_usuario: user?.id ?? null, comentario });
        await this.model.addHistory({
            id_ticket,
            id_usuario: user?.id ?? null,
            cambio: 'COMENTARIO',
            detalle: 'Comentario agregado'
        });
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor: user,
                context: auditContext,
                entidad: 'TICKET',
                entidad_id: id_ticket,
                accion: 'TICKET_COMMENT',
                payload_after: created
            })
        );
        return created;
    }

    async listComments(id_ticket, user) {
        await this.ensureAccess(id_ticket, user);
        return this.model.listComments(id_ticket);
    }

    async listHistory(id_ticket, user) {
        await this.ensureAccess(id_ticket, user);
        return this.model.listHistory(id_ticket);
    }

    async assignToTechnician(id_ticket, id_usuario_tecnico, user, auditContext) {
        if (!id_usuario_tecnico) throw { status: 400, message: 'id_usuario_tecnico es requerido' };
        await this.ensureAccess(id_ticket, user);
        const assigned = await this.model.assignToTechnician(id_ticket, id_usuario_tecnico);
        await this.model.addHistory({
            id_ticket,
            id_usuario: user?.id ?? null,
            cambio: 'ASIGNADO',
            detalle: `Asignado a tecnico ${id_usuario_tecnico}`
        });
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor: user,
                context: auditContext,
                entidad: 'TICKET',
                entidad_id: id_ticket,
                accion: 'TICKET_ASSIGN',
                payload_after: assigned,
                metadata: { id_usuario_tecnico }
            })
        );
        const tecnico = await this.userModel.findById(id_usuario_tecnico);
        if (tecnico?.email) {
            await this.notificationService.enqueueEmail({
                tipo: 'TICKET_ASIGNADO',
                destinatario: tecnico.email,
                asunto: `Ticket asignado #${id_ticket}`,
                cuerpo: `Se te asignó el ticket ${id_ticket}.`
            });
        }
        return assigned;
    }

    // Delete ticket with audit trail.
    async remove(id, actor, auditContext) {
        const before = await this.model.findById(id);
        const t = await this.model.remove(id);
        if (!t) throw { status: 404, message: `Ticket ${id} no encontrado` };
        this.auditLogService.safeLog(
            this.auditLogService.buildDomainEntry({
                actor,
                context: auditContext,
                entidad: 'TICKET',
                entidad_id: id,
                accion: 'TICKET_DELETE',
                payload_before: before,
                payload_after: t
            })
        );
        return t;
    }

    // Access control by role and ownership/assignment.
    async ensureAccess(id, user) {
        if (!user?.role) return;
        if (user.role === 'Gerente' || user.role === 'Analista') return;
        if (user.role === 'Técnico') {
            const assigned = await this.model.isAssignedToTecnico(id, user.id);
            if (!assigned) {
                throw { status: 403, message: 'El ticket no está asignado a este técnico' };
            }
            return;
        }
        if (user.role === 'Usuario') {
            const reported = await this.model.isReportedByUser(id, user.id);
            if (!reported) {
                throw { status: 403, message: 'El ticket no pertenece al usuario' };
            }
        }
    }

    // MTTR/MTBF summary with optional asset filter.
    async getMetrics({ id_activo } = {}) {
        const m = await this.model.getMetrics({ id_activo });
        const mttrSeconds = Number(m.mttr_seconds) || 0;
        const mtbfSeconds = Number(m.mtbf_seconds) || 0;
        return {
            mttr_seconds: mttrSeconds,
            mttr_horas: mttrSeconds / 3600,
            mttr_dias: mttrSeconds / 86400,
            mtbf_seconds: mtbfSeconds,
            mtbf_horas: mtbfSeconds / 3600,
            mtbf_dias: mtbfSeconds / 86400,
            reparaciones: Number(m.reparaciones) || 0,
            intervalos: Number(m.intervalos) || 0,
            filtro_id_activo: id_activo ?? null
        };
    }
}

export default TicketService;
