-- =========================================================================
-- SIGAM BACKEND - MIGRACIÓN AUDITORÍA (AUDIT_LOG)
-- Registro de movimientos para calidad, seguridad y tiempos de respuesta.
-- =========================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS AUDIT_LOG (
    id_audit SERIAL PRIMARY KEY,
    fecha_evento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Actor
    id_usuario_actor INT REFERENCES USUARIOS(id_usuario),
    rol_actor VARCHAR(50),
    actor_email VARCHAR(150),
    source VARCHAR(30) DEFAULT 'api',

    -- Request context
    request_id UUID,
    ruta TEXT,
    metodo VARCHAR(10),
    ip VARCHAR(80),
    user_agent TEXT,
    duration_ms INT,

    -- Acción / entidad
    entidad VARCHAR(80),
    entidad_id VARCHAR(80),
    accion VARCHAR(80),

    -- Resultado
    status VARCHAR(10) DEFAULT 'OK',
    http_status INT,
    error_code VARCHAR(80),
    error_message TEXT,

    -- Detalle
    payload_before JSONB,
    payload_after JSONB,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_fecha ON AUDIT_LOG (fecha_evento DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON AUDIT_LOG (id_usuario_actor, fecha_evento DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entidad ON AUDIT_LOG (entidad, entidad_id, fecha_evento DESC);
CREATE INDEX IF NOT EXISTS idx_audit_accion ON AUDIT_LOG (accion, fecha_evento DESC);
CREATE INDEX IF NOT EXISTS idx_audit_status ON AUDIT_LOG (status, fecha_evento DESC);

COMMIT;

