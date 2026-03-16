import test from 'node:test';
import assert from 'node:assert/strict';
import TicketService from '../src/services/ticket.service.js';

function createAuditStub() {
    return {
        buildDomainEntry(payload) { return payload; },
        async safeLog() { return null; }
    };
}

function createBaseService({ model, assetModel, decisionEngine, iaConfig } = {}) {
    const svc = new TicketService(
        model,
        {
            assetModel,
            decisionEngine,
            iaConfig,
            auditLogService: createAuditStub()
        }
    );
    svc.notificationService = { async enqueueEmail() { return null; } };
    return svc;
}

test('TicketService.create rechaza id_categoria_ticket invalido', async () => {
    const model = {
        async create() { throw new Error('should not create'); },
        async addHistory() { return null; }
    };
    const assetModel = { async findById() { return { id_activo: 1, nivel_criticidad: 'Media' }; } };
    const decisionEngine = {
        async classifyTicket() { return { categoria: 'Hardware' }; },
        async triageTicket() { return { prioridad: 'Media' }; }
    };

    const service = createBaseService({
        model,
        assetModel,
        decisionEngine,
        iaConfig: { enabled: false, assignmentEnabled: false }
    });

    service.categoriaModel = {
        async findById() { return null; },
        async findByNombre() { return null; }
    };

    await assert.rejects(
        () => service.create(
            { id_activo: 1, descripcion: 'Falla', id_categoria_ticket: 999 },
            { id: 1, role: 'Gerente' }
        ),
        (err) => {
            assert.equal(err?.status, 400);
            assert.match(String(err?.message || ''), /id_categoria_ticket inválido/i);
            return true;
        }
    );
});

test('TicketService.create usa categoria IA cuando no se envia id_categoria_ticket', async () => {
    let captured = null;
    const model = {
        async create(payload) { captured = payload; return { id_ticket: 10, ...payload }; },
        async addHistory() { return null; }
    };
    const assetModel = { async findById() { return { id_activo: 2, nivel_criticidad: 'Media' }; } };
    const decisionEngine = {
        async classifyTicket() { return { categoria: 'Hardware' }; },
        async triageTicket() { return { prioridad: 'Alta' }; }
    };

    const service = createBaseService({
        model,
        assetModel,
        decisionEngine,
        iaConfig: { enabled: false, assignmentEnabled: false }
    });

    service.categoriaModel = {
        async findByNombre() { return { id_categoria_ticket: 2 }; },
        async findById() { return null; }
    };

    const user = { id: 7, role: 'Analista' };
    const created = await service.create({ id_activo: 2, descripcion: 'Falla hardware' }, user);

    assert.equal(created.id_ticket, 10);
    assert.equal(captured.id_usuario_reporta, 7);
    assert.equal(captured.clasificacion_nlp, 'Hardware');
    assert.equal(captured.id_categoria_ticket, 2);
    assert.equal(captured.estado, 'Abierto');
});

test('TicketService.addComment requiere comentario', async () => {
    const model = {
        async addComment() { return null; },
        async addHistory() { return null; }
    };
    const service = createBaseService({ model });

    await assert.rejects(
        () => service.addComment(1, '', { id: 1, role: 'Gerente' }),
        (err) => {
            assert.equal(err?.status, 400);
            assert.match(String(err?.message || ''), /comentario es requerido/i);
            return true;
        }
    );
});

test('TicketService.getMetrics normaliza horas y dias', async () => {
    const model = {
        async getMetrics() {
            return { mttr_seconds: 3600, mtbf_seconds: 7200, reparaciones: 2, intervalos: 1 };
        }
    };
    const service = createBaseService({ model });

    const result = await service.getMetrics({ id_activo: 5 });

    assert.equal(result.mttr_seconds, 3600);
    assert.equal(result.mttr_horas, 1);
    assert.equal(result.mttr_dias, 3600 / 86400);
    assert.equal(result.mtbf_seconds, 7200);
    assert.equal(result.mtbf_horas, 2);
    assert.equal(result.reparaciones, 2);
    assert.equal(result.intervalos, 1);
    assert.equal(result.filtro_id_activo, 5);
});

test('TicketService.changeEstado bloquea cierre a tecnico no asignado', async () => {
    const model = {
        async isAssignedToTecnico() { return false; }
    };
    const service = createBaseService({ model });

    await assert.rejects(
        () => service.changeEstado(3, 'Cerrado', { id: 4, role: 'Técnico' }),
        (err) => {
            assert.equal(err?.status, 403);
            assert.match(String(err?.message || ''), /no está asignado a este técnico/i);
            return true;
        }
    );
});
