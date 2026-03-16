import test from 'node:test';
import assert from 'node:assert/strict';
import UserService from '../src/services/user.service.js';

function createModelStub() {
    return {
        createCalls: [],
        async create(payload) {
            this.createCalls.push(payload);
            return { id_usuario: 1, ...payload };
        }
    };
}

test('UserService.create falla cuando rol es invalido', async () => {
    const model = createModelStub();
    const service = new UserService(model);

    await assert.rejects(
        () => service.create(
            { nombre: 'A', email: 'a@a.com', password: 'x', rol: 'Root' },
            { id: 1, role: 'Gerente' }
        ),
        (error) => error?.status === 400 && /rol/i.test(error?.message)
    );
});

test('UserService.create permite rol valido', async () => {
    const model = createModelStub();
    const audit = {
        entries: [],
        buildDomainEntry(payload) { return payload; },
        async safeLog(entry) { this.entries.push(entry); }
    };
    const service = new UserService(model, audit);

    const user = await service.create(
        { nombre: 'B', email: 'b@b.com', password: 'x', rol: 'Analista' },
        { id: 1, role: 'Gerente' }
    );

    assert.equal(user.rol, 'Analista');
    assert.equal(model.createCalls.length, 1);
    assert.ok(audit.entries.some((e) => e.accion === 'SECURITY_ROLE_ASSIGN'));
});

test('UserService.create bloquea a Analista creando roles no permitidos', async () => {
    const model = createModelStub();
    const service = new UserService(model);

    await assert.rejects(
        () => service.create(
            { nombre: 'C', email: 'c@c.com', password: 'x', rol: 'Gerente' },
            { id: 2, role: 'Analista' }
        ),
        (error) => error?.status === 403 && /Analista/i.test(error?.message)
    );
});

test('UserService.updateRole registra SECURITY_ROLE_CHANGE', async () => {
    const audit = {
        entries: [],
        buildDomainEntry(payload) { return payload; },
        async safeLog(entry) { this.entries.push(entry); }
    };
    const model = {
        async findById() { return { id_usuario: 1, rol: 'Usuario' }; },
        async updateRole(id, rol) { return { id_usuario: id, rol }; }
    };
    const service = new UserService(model, audit);

    const updated = await service.updateRole(1, 'Analista', { id: 9, role: 'Gerente' }, { request_id: 'r1' });

    assert.equal(updated.rol, 'Analista');
    assert.ok(audit.entries.some((e) => e.accion === 'SECURITY_ROLE_CHANGE'));
});

test('UserService.resetPassword registra SECURITY_PASSWORD_RESET', async () => {
    const audit = {
        entries: [],
        buildDomainEntry(payload) { return payload; },
        async safeLog(entry) { this.entries.push(entry); }
    };
    const model = {
        async findById() { return { id_usuario: 1, rol: 'Usuario' }; },
        async updatePassword(id) { return { id_usuario: id }; }
    };
    const service = new UserService(model, audit);

    await service.resetPassword(1, 'Nueva123', { id: 9, role: 'Gerente' }, { request_id: 'r1' });

    assert.ok(audit.entries.some((e) => e.accion === 'SECURITY_PASSWORD_RESET'));
});

test('UserService.resetPassword permite tecnico solo para usuarios', async () => {
    const model = {
        async findById() { return { id_usuario: 10, rol: 'Usuario' }; },
        async updatePassword(id) { return { id_usuario: id }; }
    };
    const service = new UserService(model);

    await service.resetPassword(10, 'Nueva123', { id: 5, role: 'Técnico' });
});

test('UserService.resetPassword bloquea tecnico sobre otros roles', async () => {
    const model = {
        async findById() { return { id_usuario: 11, rol: 'Gerente' }; },
        async updatePassword(id) { return { id_usuario: id }; }
    };
    const service = new UserService(model);

    await assert.rejects(
        () => service.resetPassword(11, 'Nueva123', { id: 5, role: 'Técnico' }),
        (error) => error?.status === 403 && /Técnico/i.test(error?.message)
    );
});

test('UserService.resetPassword permite usuario solo sobre si mismo', async () => {
    const model = {
        async findById() { return { id_usuario: 20, rol: 'Usuario' }; },
        async updatePassword(id) { return { id_usuario: id }; }
    };
    const service = new UserService(model);

    await service.resetPassword(20, 'Nueva123', { id: 20, role: 'Usuario' });
});
