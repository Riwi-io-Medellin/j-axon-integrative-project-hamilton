-- =========================================================================
-- MIGRACION: Sugerencias de tickets generadas automaticamente (IA)
-- =========================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS ticket_sugerencias (
    id_sugerencia SERIAL PRIMARY KEY,
    id_ticket INT REFERENCES tickets(id_ticket) ON DELETE CASCADE,
    sugerencias JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_ticket_sugerencias_ticket
    ON ticket_sugerencias (id_ticket);

CREATE INDEX IF NOT EXISTS idx_ticket_sugerencias_created
    ON ticket_sugerencias (created_at DESC);

COMMIT;
