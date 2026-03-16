import test from 'node:test';
import assert from 'node:assert/strict';
import IaJobsService from '../src/services/ia/jobs.service.js';

function createAssetModelStub({ candidates = [] } = {}) {
    return {
        histories: [],
        async findPreventiveMaintenanceCandidates() {
            return candidates;
        },
        async addHistory(id_activo, tipo_evento, detalle) {
            this.histories.push({ id_activo, tipo_evento, detalle });
            return { id_historial: 1 };
        }
    };
}

function createTicketModelStub() {
    return {
        openByActivo: new Set(),
        created: [],
        assigned: [],
        async hasOpenPreventiveTicket(id_activo) {
            return this.openByActivo.has(id_activo);
        },
        async findSupportTechnicianWithLeastLoad() {
            return { id_usuario: 2, nombre: 'Tec Uno' };
        },
        async create(payload) {
            const id_ticket = 100 + this.created.length;
            this.created.push(payload);
            return { id_ticket, ...payload };
        },
        async assignToTechnician(id_ticket, id_usuario_tecnico) {
            this.assigned.push({ id_ticket, id_usuario_tecnico });
            return { id_ticket };
        }
    };
}

function createMaintenanceModelStub() {
    return {
        updates: [],
        async updateByTicketId(id_ticket, payload) {
            this.updates.push({ id_ticket, payload });
            return { id_ticket, ...payload };
        }
    };
}

test('IA-7 crea MP para candidato y programa fecha_inicio', async () => {
    const assetModel = createAssetModelStub({
        candidates: [{ id_activo: 1, nivel_criticidad: 'Media' }]
    });
    const ticketModel = createTicketModelStub();
    const maintenanceModel = createMaintenanceModelStub();

    const service = new IaJobsService({
        assetModel,
        ticketModel,
        maintenanceModel,
        repuestoModel: {},
        alertaModel: {},
        iaConfig: { enabled: true, openAiApiKey: null, openAiModel: 'x', timeoutMs: 1, circuitBreaker: {} }
    });
    service.categoriaTicketModel = {
        async findByNombre() { return { id_categoria_ticket: 1 }; }
    };

    const result = await service.generatePreventiveMaintenance({
        intervalDays: 180,
        scheduleOffsetDays: 1,
        limit: 10,
        reporterUserId: 9
    });

    assert.equal(result.tickets_creados, 1);
    assert.equal(ticketModel.created.length, 1);
    assert.equal(maintenanceModel.updates.length, 1);
    assert.equal(assetModel.histories.length, 1);
});
