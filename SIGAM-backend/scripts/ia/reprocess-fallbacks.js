#!/usr/bin/env node
import 'dotenv/config';

import TicketModel from '../../src/models/Ticket.js';
import TicketService from '../../src/services/ticket.service.js';

const limitArg = Number(process.argv[2]);
const limit = Number.isFinite(limitArg) && limitArg > 0 ? limitArg : undefined;

const model = new TicketModel();
const service = new TicketService(model);

function parseSuggestions(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

function isFallbackItem(item) {
    if (!item || typeof item !== 'object') return false;
    if (item.origen === 'fallback') return true;
    const title = String(item.titulo || '').toLowerCase();
    const advertencias = Array.isArray(item.advertencias) ? item.advertencias : [];
    if (title.includes('fallback')) return true;
    if (String(item.solucion || '').includes('Solución sugerida basada')) return true;
    return advertencias.some((warning) => String(warning).toLowerCase().includes('fallback'));
}

function hasFallbackSuggestion(entry) {
    const suggestions = parseSuggestions(entry?.sugerencias);
    return suggestions.some(isFallbackItem);
}

async function main() {
    console.log('IA fallback reprocess run', new Date().toISOString());
    const caches = await model.listSuggestionCaches({ limit: limit ?? 100, offset: 0 });
    const fallbackEntries = caches.filter((entry) => hasFallbackSuggestion(entry));
    if (!fallbackEntries.length) {
        console.log('No fallback entries found, nothing to reprocess.');
        return;
    }

    const slice = fallbackEntries.slice(0, limit ?? fallbackEntries.length);
    console.log(`Found ${fallbackEntries.length} fallback caches, reprocessing ${slice.length} ticket(s)`);

    for (const entry of slice) {
        console.log(`- ticket ${entry.id_ticket} (updated ${entry.updated_at})`);
        try {
            await service.generateAndCacheSuggestions(entry.id_ticket);
            console.log('  -> suggestions refreshed');
        } catch (error) {
            console.error(`  -> failed (${error?.message || error})`);
        }
    }
}

main().catch((error) => {
    console.error('Unexpected error running IA reprocess script', error);
    process.exit(1);
});
