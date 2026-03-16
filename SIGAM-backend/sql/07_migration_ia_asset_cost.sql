-- =========================================================================
-- SIGAM BACKEND - MIGRACIÓN IA (COSTOS PARA BAJA SUGERIDA)
-- Agrega costo_compra al activo para permitir cálculo de umbral (ej. 60%).
-- =========================================================================

BEGIN;

ALTER TABLE ACTIVOS
    ADD COLUMN IF NOT EXISTS costo_compra NUMERIC(12,2);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_activos_costo_compra_non_negative'
    ) THEN
        ALTER TABLE ACTIVOS
            ADD CONSTRAINT chk_activos_costo_compra_non_negative
            CHECK (costo_compra IS NULL OR costo_compra >= 0);
    END IF;
END $$;

COMMIT;

