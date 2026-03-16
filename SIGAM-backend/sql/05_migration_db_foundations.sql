-- =========================================================================
-- SIGAM BACKEND - MIGRACIÓN BASE DB (ISSUES 3 y 7)
-- Ajustes para ambientes existentes sin recrear el esquema completo.
-- =========================================================================

BEGIN;

-- ACTIVOS: QR, estado y reglas
ALTER TABLE ACTIVOS
    ADD COLUMN IF NOT EXISTS codigo_qr VARCHAR(150),
    ADD COLUMN IF NOT EXISTS estado_activo BOOLEAN NOT NULL DEFAULT TRUE;

-- Si estado_activo existe como texto en un entorno previo, convertirlo a booleano.
DO $$
DECLARE
    v_data_type TEXT;
BEGIN
    SELECT data_type
    INTO v_data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'activos'
      AND column_name = 'estado_activo';

    IF v_data_type = 'character varying' OR v_data_type = 'text' THEN
        ALTER TABLE ACTIVOS
            ALTER COLUMN estado_activo DROP DEFAULT;

        ALTER TABLE ACTIVOS
            ALTER COLUMN estado_activo TYPE BOOLEAN
            USING (
                CASE
                    WHEN lower(trim(estado_activo::text)) IN ('activo', 'true', '1', 'en mantenimiento') THEN TRUE
                    ELSE FALSE
                END
            );

        ALTER TABLE ACTIVOS
            ALTER COLUMN estado_activo SET DEFAULT TRUE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_activos_vida_util'
    ) THEN
        ALTER TABLE ACTIVOS
            ADD CONSTRAINT chk_activos_vida_util CHECK (vida_util > 0 AND vida_util <= 240);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_activos_criticidad'
    ) THEN
        ALTER TABLE ACTIVOS
            ADD CONSTRAINT chk_activos_criticidad CHECK (nivel_criticidad IN ('Baja', 'Media', 'Alta', 'Crítica'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'activos_codigo_qr_key'
    ) THEN
        ALTER TABLE ACTIVOS
            ADD CONSTRAINT activos_codigo_qr_key UNIQUE (codigo_qr);
    END IF;
END $$;

-- TICKETS: catálogos controlados para prioridad/clasificación/estado
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_tickets_prioridad'
    ) THEN
        ALTER TABLE TICKETS
            ADD CONSTRAINT chk_tickets_prioridad CHECK (prioridad_ia IS NULL OR prioridad_ia IN ('Baja', 'Media', 'Alta', 'Crítica'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_tickets_clasificacion'
    ) THEN
        ALTER TABLE TICKETS
            ADD CONSTRAINT chk_tickets_clasificacion CHECK (clasificacion_nlp IS NULL OR clasificacion_nlp IN ('Hardware', 'Software', 'Red', 'Eléctrico'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_tickets_estado'
    ) THEN
        ALTER TABLE TICKETS
            ADD CONSTRAINT chk_tickets_estado CHECK (estado IN ('Abierto', 'Asignado', 'En Proceso', 'Resuelto', 'Cerrado'));
    END IF;
END $$;

-- ASIGNACION_LICENCIAS: exactamente un destino
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_asignacion_licencias_destino'
    ) THEN
        ALTER TABLE ASIGNACION_LICENCIAS
            ADD CONSTRAINT chk_asignacion_licencias_destino CHECK (
                (id_usuario IS NOT NULL AND id_activo IS NULL)
                OR (id_usuario IS NULL AND id_activo IS NOT NULL)
            );
    END IF;
END $$;

-- Índices operativos
CREATE INDEX IF NOT EXISTS idx_activos_serial_lower ON ACTIVOS (lower(serial));
CREATE INDEX IF NOT EXISTS idx_activos_codigo_qr ON ACTIVOS (codigo_qr);
CREATE INDEX IF NOT EXISTS idx_tickets_id_activo ON TICKETS (id_activo);
CREATE INDEX IF NOT EXISTS idx_tickets_id_usuario_reporta ON TICKETS (id_usuario_reporta);
CREATE INDEX IF NOT EXISTS idx_tickets_estado_fecha ON TICKETS (estado, fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_ordenes_id_usuario_tecnico ON ORDENES_MANTENIMIENTO (id_usuario_tecnico);
CREATE INDEX IF NOT EXISTS idx_ordenes_id_ticket ON ORDENES_MANTENIMIENTO (id_ticket);
CREATE INDEX IF NOT EXISTS idx_consumo_id_orden ON CONSUMO_REPUESTOS (id_orden);
CREATE INDEX IF NOT EXISTS idx_consumo_id_repuesto ON CONSUMO_REPUESTOS (id_repuesto);
CREATE INDEX IF NOT EXISTS idx_historial_id_activo_fecha ON HISTORIAL_ACTIVOS (id_activo, fecha_evento DESC);

COMMIT;
