import test from 'node:test';
import assert from 'node:assert/strict';
import IaJobsService from '../src/services/ia/jobs.service.js';

function createTicketModelStub({ candidates = [] } = {}) {
    return {
        updated: [],
        async findTicketsForIaReprocess() {
            return candidates;
        },
        async updateIaFields(id_ticket, fields) {
            this.updated.push({ id_ticket, fields });
            return { id_ticket, ...fields };
        }
    };
}

function createAssetModelStub() {
    return {
        async findById() {
            return { nivel_criticidad: 'Media' };
        }
    };
}

function createOpenAiProviderStub({ available = true } = {}) {
    return {
        name: 'openai_stub',
        isAvailable() {
            return available;
        },
        async classifyTicket() {
            return { categoria: 'Red', confidence: 0.9, rationale: 'stub', metodo: 'openai_stub' };
        },
        async triageTicket() {
            return { prioridad: 'Alta', rationale: 'stub', metodo: 'openai_stub' };
        }
    };
}

test('reprocessTicketsExternal actualiza tickets cuando proveedor está disponible', async () => {
    const ticketModel = createTicketModelStub({
        candidates: [{ id_ticket: 10, id_activo: 5, descripcion: 'Sin internet' }]
    });
    const service = new IaJobsService({
        iaConfig: { enabled: true, openAiApiKey: 'x', openAiModel: 'x', timeoutMs: 1, circuitBreaker: {} },
        ticketModel,
        assetModel: createAssetModelStub(),
        openAiProvider: createOpenAiProviderStub({ available: true }),
        repuestoModel: {},
        alertaModel: {}
    });

    const result = await service.reprocessTicketsExternal({ limit: 10, sinceDays: 30 });
    assert.equal(result.ok, true);
    assert.equal(result.updated, 1);
    assert.equal(ticketModel.updated.length, 1);
    assert.equal(ticketModel.updated[0].fields.clasificacion_nlp, 'Red');
    assert.equal(ticketModel.updated[0].fields.prioridad_ia, 'Alta');
});

test('reprocessTicketsExternal no hace nada si proveedor no está disponible', async () => {
    const ticketModel = createTicketModelStub({
        candidates: [{ id_ticket: 11, id_activo: 5, descripcion: 'Sin internet' }]
    });
    const service = new IaJobsService({
        iaConfig: { enabled: true, openAiApiKey: null, openAiModel: 'x', timeoutMs: 1, circuitBreaker: {} },
        ticketModel,
        assetModel: createAssetModelStub(),
        openAiProvider: createOpenAiProviderStub({ available: false }),
        repuestoModel: {},
        alertaModel: {}
    });

    const result = await service.reprocessTicketsExternal({ limit: 10, sinceDays: 30 });
    assert.equal(result.ok, false);
    assert.equal(ticketModel.updated.length, 0);
});

