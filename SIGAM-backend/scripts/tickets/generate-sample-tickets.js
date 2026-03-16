#!/usr/bin/env node
import 'dotenv/config';

import AssetModel from '../../src/models/Asset.js';
import TicketModel from '../../src/models/Ticket.js';
import TicketService from '../../src/services/ticket.service.js';
import UserModel from '../../src/models/User.js';

const totalArg = Number(process.argv[2]);
const total = Number.isInteger(totalArg) && totalArg > 0 ? totalArg : 30;

const scenarioCatalog = [
    {
        key: 'laptop',
        match: ['laptop', 'notebook', 'portatil', 'latitude', 'elitebook', 'thinkpad'],
        descriptions: [
            'Portatil no enciende despues de suspender.',
            'Bateria de portatil descarga en menos de 20 minutos.',
            'Teclado de portatil deja de responder de forma intermitente.'
        ]
    },
    {
        key: 'red',
        match: ['router', 'switch', 'firewall', 'red', 'wifi', 'ap', 'access point'],
        descriptions: [
            'Caida de red en area administrativa, sin salida a internet.',
            'Latencia alta en red interna al abrir aplicaciones corporativas.',
            'WiFi pierde autenticacion cada 10 minutos en sala de juntas.'
        ]
    },
    {
        key: 'desktop',
        match: ['desktop', 'pc', 'workstation', 'optiplex'],
        descriptions: [
            'Equipo de escritorio reinicia al abrir hojas de calculo pesadas.',
            'Pantalla azul recurrente al iniciar sesion en desktop.',
            'Puerto USB frontal sin energia en equipo de escritorio.'
        ]
    },
    {
        key: 'impresora',
        match: ['impresora', 'printer', 'laserjet', 'epson', 'brother'],
        descriptions: [
            'Impresora no toma papel y muestra atasco sin hoja visible.',
            'Impresora imprime con lineas verticales negras.',
            'Cola de impresion se queda congelada para toda el area.'
        ]
    },
    {
        key: 'servidor',
        match: ['servidor', 'server', 'poweredge', 'proliant', 'rack'],
        descriptions: [
            'Servidor presenta uso de CPU al 100 por ciento sin procesos claros.',
            'Servicio de base de datos cae despues del reinicio nocturno.',
            'Alerta de temperatura alta en servidor del rack principal.'
        ]
    },
    {
        key: 'monitor',
        match: ['monitor', 'display', 'pantalla'],
        descriptions: [
            'Monitor parpadea al conectar por HDMI.',
            'Monitor no detecta señal en docking station.',
            'Pantalla muestra colores alterados tras actualizacion grafica.'
        ]
    },
    {
        key: 'telefonia',
        match: ['telefono', 'ip phone', 'telefonia', 'cisco'],
        descriptions: [
            'Telefono IP no registra en central y queda en estado searching.',
            'Audio entrecortado en llamadas internas por telefonia IP.',
            'Telefono IP reinicia solo cuando hay llamadas entrantes.'
        ]
    }
];

const assetModel = new AssetModel();
const ticketModel = new TicketModel();
const ticketService = new TicketService(ticketModel);
const userModel = new UserModel();

function normalize(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function buildAssetText(asset) {
    return normalize(`${asset?.nombre_categoria || ''} ${asset?.modelo || ''}`);
}

function pickAssetForScenario(assets, scenario) {
    const matched = assets.filter((asset) => {
        const haystack = buildAssetText(asset);
        return scenario.match.some((token) => haystack.includes(normalize(token)));
    });
    if (matched.length) {
        return matched[Math.floor(Math.random() * matched.length)];
    }
    return assets[Math.floor(Math.random() * assets.length)];
}

function pickDescriptionForScenario(scenario, index) {
    const base = scenario.descriptions[index % scenario.descriptions.length];
    return base;
}

async function pickReporterUser() {
    const users = await userModel.findAll({ limit: 200, offset: 0 });
    const candidates = users.filter((u) => u?.activo && ['usuario', 'analista', 'gerente'].includes(normalize(u?.rol)));
    if (!candidates.length) {
        throw new Error('No hay usuarios activos para reportar tickets.');
    }
    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    return { id: selected.id_usuario, role: selected.rol, name: selected.nombre };
}

async function main() {
    const assets = await assetModel.findAll({ limit: 500, offset: 0 });
    if (!assets.length) {
        throw new Error('No hay activos para asociar tickets.');
    }

    const reporter = await pickReporterUser();
    const batchTag = `BATCH-IA-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;
    const created = [];
    const errors = [];

    console.log(`Generando ${total} ticket(s) con lote ${batchTag}`);
    console.log(`Usuario reporta: ${reporter.name} (id=${reporter.id}, rol=${reporter.role})`);

    for (let i = 0; i < total; i += 1) {
        const scenario = scenarioCatalog[i % scenarioCatalog.length];
        const selectedAsset = pickAssetForScenario(assets, scenario);
        const description = `${pickDescriptionForScenario(scenario, i)} [${batchTag}] [caso-${String(i + 1).padStart(2, '0')}]`;

        try {
            const result = await ticketService.create(
                {
                    id_activo: selectedAsset.id_activo,
                    descripcion: description
                },
                { id: reporter.id, role: reporter.role },
                null
            );
            created.push({
                id_ticket: result?.id_ticket,
                id_activo: selectedAsset.id_activo,
                categoria_activo: selectedAsset.nombre_categoria || 'Sin categoria',
                descripcion: description
            });
            console.log(`OK ticket ${result?.id_ticket} -> activo ${selectedAsset.id_activo} (${selectedAsset.nombre_categoria || 'n/a'})`);
        } catch (error) {
            errors.push({
                index: i + 1,
                id_activo: selectedAsset.id_activo,
                error: error?.message || String(error)
            });
            console.error(`ERROR caso-${i + 1}: ${error?.message || error}`);
        }
    }

    // Verify persistence directly from DB.
    const verified = [];
    for (const item of created) {
        const row = await ticketModel.findById(item.id_ticket);
        if (row?.id_ticket) {
            verified.push(item.id_ticket);
        }
    }

    const categoryCount = new Map();
    for (const item of created) {
        const key = item.categoria_activo;
        categoryCount.set(key, (categoryCount.get(key) || 0) + 1);
    }

    console.log('\nResumen');
    console.log(`- Creados: ${created.length}`);
    console.log(`- Verificados en DB: ${verified.length}`);
    console.log(`- Errores: ${errors.length}`);
    console.log('- Distribucion por categoria de activo:');
    for (const [key, count] of categoryCount.entries()) {
        console.log(`  * ${key}: ${count}`);
    }
    if (errors.length) {
        console.log('- Detalle de errores:');
        for (const err of errors) {
            console.log(`  * caso-${err.index} activo=${err.id_activo}: ${err.error}`);
        }
    }

    const sampleIds = created.slice(0, 10).map((t) => t.id_ticket);
    console.log(`- Ejemplo IDs creados: ${sampleIds.join(', ')}`);
}

main().catch((error) => {
    console.error('Fallo generando tickets de muestra:', error);
    process.exit(1);
});
