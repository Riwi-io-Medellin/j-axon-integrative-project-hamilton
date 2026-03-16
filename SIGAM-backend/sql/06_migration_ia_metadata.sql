-- =========================================================================
-- SIGAM BACKEND - MIGRACIÓN IA (METADATA + TRAZABILIDAD)
-- Agrega columnas opcionales para registrar metodo/rationale/confidence.
-- =========================================================================

BEGIN;

ALTER TABLE TICKETS
    ADD COLUMN IF NOT EXISTS clasificacion_metodo VARCHAR(80),
    ADD COLUMN IF NOT EXISTS clasificacion_confidence NUMERIC(4,3),
    ADD COLUMN IF NOT EXISTS clasificacion_rationale TEXT,
    ADD COLUMN IF NOT EXISTS prioridad_metodo VARCHAR(80),
    ADD COLUMN IF NOT EXISTS prioridad_rationale TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_tickets_clasificacion_confidence'
    ) THEN
        ALTER TABLE TICKETS
            ADD CONSTRAINT chk_tickets_clasificacion_confidence
            CHECK (clasificacion_confidence IS NULL OR (clasificacion_confidence >= 0 AND clasificacion_confidence <= 1));
    END IF;
END $$;

COMMIT;

