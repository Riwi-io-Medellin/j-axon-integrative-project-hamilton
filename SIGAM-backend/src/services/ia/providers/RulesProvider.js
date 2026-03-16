// Normalize text for rule matching.
function normalizeText(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

// Check if any keyword appears in the text.
function includesAny(text, keywords) {
    return keywords.some((k) => text.includes(k));
}

// Normalize criticality labels to canonical values.
function normalizeCriticidad(value) {
    const v = String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
    if (v === 'critica') return 'Crítica';
    if (v === 'alta') return 'Alta';
    if (v === 'media') return 'Media';
    if (v === 'baja') return 'Baja';
    return null;
}

// Rules-based IA provider for classification and triage.
export default class RulesProvider {
    constructor() {
        this.name = 'rules_v1';
    }

    // Classify ticket category based on keyword rules.
    async classifyTicket({ descripcion }) {
        const text = normalizeText(descripcion);

        const rules = [
            { label: 'Eléctrico', keywords: ['voltaje', 'corriente', 'energia', 'tomacorriente', 'breaker', 'ups', 'corto', 'quemado', 'humo', 'chispa'] },
            { label: 'Red', keywords: ['red', 'internet', 'wifi', 'router', 'switch', 'latencia', 'conexion', 'dns', 'ip', 'dhcp'] },
            { label: 'Software', keywords: ['sistema', 'programa', 'aplicacion', 'licencia', 'actualizacion', 'instalacion', 'office', 'windows', 'error', 'bug'] },
            { label: 'Hardware', keywords: ['pantalla', 'disco', 'teclado', 'mouse', 'ram', 'bateria', 'fuente', 'ventilador', 'monitor', 'cpu', 'memoria'] }
        ];

        for (const rule of rules) {
            if (includesAny(text, rule.keywords)) {
                const matched = rule.keywords.filter((k) => text.includes(k)).slice(0, 6);
                return {
                    categoria: rule.label,
                    confidence: Math.min(1, 0.55 + matched.length * 0.08),
                    rationale: matched.length ? `keywords=${matched.join(',')}` : 'keywords=none',
                    metodo: this.name
                };
            }
        }

        return {
            categoria: null,
            confidence: 0.0,
            rationale: 'keywords=none',
            metodo: this.name
        };
    }

    // Determine ticket priority based on risk and asset criticality.
    async triageTicket({ descripcion, categoria, criticidadActivo }) {
        const text = normalizeText(descripcion);
        const crit = normalizeCriticidad(criticidadActivo) || 'Media';

        const highRiskKeywords = [
            'quemado',
            'humo',
            'chispa',
            'chisp',
            'corto',
            'no enciende',
            'servidor caido',
            'caido',
            'bloqueo total'
        ];

        const hasHighRisk = includesAny(text, highRiskKeywords);

        let prioridad = 'Media';
        if (hasHighRisk) {
            prioridad = crit === 'Alta' || crit === 'Crítica' ? 'Crítica' : 'Alta';
        } else if (crit === 'Crítica') {
            prioridad = categoria === 'Hardware' || categoria === 'Eléctrico' ? 'Alta' : 'Media';
        } else if (crit === 'Alta') {
            prioridad = 'Alta';
        } else if (crit === 'Baja') {
            prioridad = 'Baja';
        }

        const matched = highRiskKeywords.filter((k) => text.includes(k.replace(' ', ' '))).slice(0, 6);
        return {
            prioridad,
            rationale: `criticidad=${crit};categoria=${categoria || 'null'};risk=${matched.join(',') || 'none'}`,
            metodo: this.name
        };
    }
}
