// Normalize text for keyword comparison.
function normalizeText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

// Tokenize text into a small keyword list.
function tokenize(value) {
    const text = normalizeText(value);
    return text
        .replace(/[^a-z0-9\s]+/g, ' ')
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .filter((t) => t.length >= 3);
}

// Build a unique keyword set for similarity checks.
function buildKeywordSet(text) {
    const tokens = tokenize(text);
    return new Set(tokens);
}

// Compute Jaccard similarity between two sets.
function jaccard(aSet, bSet) {
    if (!aSet.size || !bSet.size) return 0;
    let intersection = 0;
    for (const t of aSet) {
        if (bSet.has(t)) intersection += 1;
    }
    const union = aSet.size + bSet.size - intersection;
    return union ? intersection / union : 0;
}

// Suggest similar tickets based on keyword overlap.
export default class TicketSuggestionEngine {
    constructor({ maxSuggestions = 3 } = {}) {
        this.maxSuggestions = maxSuggestions;
    }

    // Score candidates and return the top suggestions.
    suggest({ ticket, candidates }) {
        const baseText = `${ticket?.descripcion || ''} ${ticket?.clasificacion_nlp || ''} ${ticket?.prioridad_ia || ''}`;
        const baseKeywords = buildKeywordSet(baseText);

        const scored = (Array.isArray(candidates) ? candidates : [])
            .map((c) => {
                const text = `${c?.descripcion || ''} ${c?.clasificacion_nlp || ''} ${c?.prioridad_ia || ''}`;
                const keywords = buildKeywordSet(text);
                const score = jaccard(baseKeywords, keywords);
                const diagnostico = c?.diagnostico || null;
                const acciones = c?.acciones_realizadas || null;
                const solucion = acciones || diagnostico;
                return {
                    id_ticket: c?.id_ticket,
                    descripcion: c?.descripcion || null,
                    clasificacion_nlp: c?.clasificacion_nlp || null,
                    prioridad_ia: c?.prioridad_ia || null,
                    estado: c?.estado || null,
                    fecha_creacion: c?.fecha_creacion || null,
                    diagnostico,
                    acciones_realizadas: acciones,
                    solucion,
                    fuente: 'historico',
                    score,
                    matched_keywords: [...baseKeywords].filter((k) => keywords.has(k)).slice(0, 12)
                };
            })
            .filter((s) => Number.isFinite(s.score) && s.id_ticket)
            .sort((a, b) => b.score - a.score);

        return scored.slice(0, this.maxSuggestions);
    }
}
