import RulesProvider from './providers/RulesProvider.js';
import OpenAIProvider from './providers/OpenAIProvider.js';

// Orchestrates IA providers with fallback to rules-based logic.
export default class DecisionEngine {
    constructor(config) {
        this.config = config;
        // Always keep a rules provider for deterministic fallback.
        this.rules = new RulesProvider();
        // External provider is optional and guarded by config.
        this.external = new OpenAIProvider({
            apiKey: config.openAiApiKey,
            model: config.openAiModel,
            timeoutMs: config.timeoutMs,
            circuitBreaker: config.circuitBreaker
        });
    }

    // Classify a ticket using external IA when available.
    async classifyTicket({ descripcion }) {
        if (!this.config.enabled) {
            return this.rules.classifyTicket({ descripcion });
        }

        if (this.config.provider === 'external' && this.external.isAvailable()) {
            try {
                const r = await this.external.classifyTicket({ descripcion });
                if (r?.categoria) return r;
            } catch {
                // fallback
            }
        }

        return this.rules.classifyTicket({ descripcion });
    }

    // Triage priority using external IA when available.
    async triageTicket({ descripcion, categoria, criticidadActivo }) {
        if (!this.config.enabled) {
            return this.rules.triageTicket({ descripcion, categoria, criticidadActivo });
        }

        if (this.config.provider === 'external' && this.external.isAvailable()) {
            try {
                const r = await this.external.triageTicket({ descripcion, categoria, criticidadActivo });
                if (r?.prioridad) return r;
            } catch {
                // fallback
            }
        }

        return this.rules.triageTicket({ descripcion, categoria, criticidadActivo });
    }

    // Suggest solutions using external IA when available.
    async suggestSolutions({ ticket, activo, candidates, maxSuggestions }) {
        if (!this.config.enabled || !this.config.suggestionsEnabled) {
            return null;
        }

        if (this.config.provider === 'external' && this.external.isAvailable()) {
            try {
                const r = await this.external.suggestSolutions({ ticket, activo, candidates, maxSuggestions });
                if (Array.isArray(r?.suggestions)) return r;
            } catch (err) {
                console.warn('IA suggestions failed:', err?.message || err);
                // fallback
            }
        }

        return null;
    }

    // Health check for the external IA provider.
    async healthCheck() {
        if (!this.config.enabled) {
            return { ok: false, provider: this.config.provider, error: 'IA deshabilitada' };
        }
        if (this.config.provider !== 'external') {
            return { ok: false, provider: this.config.provider, error: 'Proveedor no es external' };
        }
        if (!this.external.isAvailable()) {
            return { ok: false, provider: this.config.provider, error: 'Proveedor no disponible' };
        }
        try {
            const res = await this.external.healthCheck();
            return { ok: true, provider: this.external.name, model: this.external.model, data: res?.result || null };
        } catch (err) {
            return { ok: false, provider: this.external.name, model: this.external.model, error: err?.message || String(err) };
        }
    }
}
