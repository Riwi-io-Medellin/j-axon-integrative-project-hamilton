import test from 'node:test';
import assert from 'node:assert/strict';
import AssetService from '../src/services/asset.service.js';

function createAssetModelStub() {
    return {
        createCalls: [],
        removeCalls: [],
        async create(payload) {
            this.createCalls.push(payload);
            return { id_activo: 1, ...payload };
        },
        async findBySerial(serial) {
            return serial === 'DUP-1' ? { id_activo: 9, serial } : null;
        },
        async findById(id) {
            return id === 1 ? { id_activo: 1 } : null;
        },
        async addHistory(id, tipo_evento, detalle) {
            this.historyCalls = this.historyCalls || [];
            this.historyCalls.push({ id, tipo_evento, detalle });
            return { id_historial: 1, id_activo: id, tipo_evento, detalle };
        },
        async remove(id, motivo, certificado) {
            this.removeCalls.push({ id, motivo, certificado });
            return { id_baja: 99, id_activo: id, motivo, borrado_seguro: certificado };
        }
    };
}

test('AssetService.findById retorna 404 cuando no existe el activo', async () => {
    const service = new AssetService(createAssetModelStub());

    await assert.rejects(
        () => service.findById(999),
        (error) => error?.status === 404
    );
});

test('AssetService.remove exige motivo_baja y certificado_borrado', async () => {
    const service = new AssetService(createAssetModelStub());

    await assert.rejects(
        () => service.remove(1, '', ''),
        (error) => error?.status === 400 && /ISO 27001/.test(error?.message)
    );
});

test('AssetService.remove procesa baja cuando payload es valido', async () => {
    const model = createAssetModelStub();
    const service = new AssetService(model);

    const result = await service.remove(2, 'Fin de vida útil', 'CERT-12345');

    assert.equal(result.id_activo, 2);
    assert.equal(model.removeCalls.length, 1);
});

test('AssetService.create genera codigo_qr y calcula fecha_obsolescencia', async () => {
    const model = createAssetModelStub();
    const service = new AssetService(model);

    const asset = await service.create({
        serial: 'SN-100',
        id_categoria: 1,
        id_proveedor: 1,
        fecha_compra: '2026-01-15',
        vida_util: 12
    });

    assert.ok(asset.codigo_qr);
    assert.equal(asset.fecha_obsolescencia, '2027-01-15');
    assert.equal(model.createCalls.length, 1);
    assert.ok(model.createCalls[0].codigo_qr);
});

test('AssetService.create respeta codigo_qr enviado', async () => {
    const model = createAssetModelStub();
    const service = new AssetService(model);

    const asset = await service.create({
        serial: 'SN-101',
        id_categoria: 1,
        id_proveedor: 1,
        fecha_compra: '2026-02-10',
        vida_util: 6,
        codigo_qr: 'ACT-TEST-0001'
    });

    assert.equal(asset.codigo_qr, 'ACT-TEST-0001');
    assert.equal(model.createCalls[0].codigo_qr, 'ACT-TEST-0001');
});

test('AssetService.create rechaza serial duplicado', async () => {
    const model = createAssetModelStub();
    const service = new AssetService(model);

    await assert.rejects(
        () => service.create({
            serial: 'DUP-1',
            id_categoria: 1,
            id_proveedor: 1,
            fecha_compra: '2026-03-01',
            vida_util: 24
        }),
        (error) => error?.status === 409 && /serial duplicado/i.test(error?.message)
    );
});

test('AssetService.update registra historial cuando cambia estado_activo', async () => {
    const model = createAssetModelStub();
    const service = new AssetService(model);

    model.update = async () => ({ id_activo: 5, estado_activo: false });

    const asset = await service.update(5, { estado_activo: false });

    assert.equal(asset.id_activo, 5);
    assert.ok(model.historyCalls?.length);
    assert.equal(model.historyCalls[0].tipo_evento, 'Cambio de estado');
});
