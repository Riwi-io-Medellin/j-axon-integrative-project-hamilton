-- =========================================================================
-- MIGRACION: Requisitos RF parciales/no cumplidos + categorias de tickets
-- =========================================================================

BEGIN;

-- Usuarios: seguridad, estado y acceso
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS activo BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMP,
    ADD COLUMN IF NOT EXISTS intentos_fallidos INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS bloqueado_hasta TIMESTAMP;

-- Recuperacion de contrasena
CREATE TABLE IF NOT EXISTS password_resets (
    id_reset SERIAL PRIMARY KEY,
    id_usuario INT REFERENCES usuarios(id_usuario),
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_password_resets_usuario ON password_resets (id_usuario, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets (token_hash);

-- Categorias de tickets
CREATE TABLE IF NOT EXISTS categorias_ticket (
    id_categoria_ticket SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE tickets
    ADD COLUMN IF NOT EXISTS id_categoria_ticket INT REFERENCES categorias_ticket(id_categoria_ticket),
    ADD COLUMN IF NOT EXISTS fecha_cierre TIMESTAMP,
    ADD COLUMN IF NOT EXISTS tipo_ticket VARCHAR(50) NOT NULL DEFAULT 'Correctivo';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_tickets_tipo'
    ) THEN
        ALTER TABLE tickets
            ADD CONSTRAINT chk_tickets_tipo CHECK (tipo_ticket IN ('Correctivo', 'Preventivo'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_tickets_categoria ON tickets (id_categoria_ticket);

-- Ticket comentarios
CREATE TABLE IF NOT EXISTS ticket_comentarios (
    id_comentario SERIAL PRIMARY KEY,
    id_ticket INT REFERENCES tickets(id_ticket),
    id_usuario INT REFERENCES usuarios(id_usuario),
    comentario TEXT NOT NULL,
    fecha_comentario TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ticket_comentarios_ticket ON ticket_comentarios (id_ticket, fecha_comentario DESC);

-- Ticket historial
CREATE TABLE IF NOT EXISTS ticket_historial (
    id_historial SERIAL PRIMARY KEY,
    id_ticket INT REFERENCES tickets(id_ticket),
    id_usuario INT REFERENCES usuarios(id_usuario),
    cambio VARCHAR(100) NOT NULL,
    detalle TEXT,
    fecha_evento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ticket_historial_ticket ON ticket_historial (id_ticket, fecha_evento DESC);

-- Asignacion de activos a usuarios
CREATE TABLE IF NOT EXISTS asignacion_activos (
    id_asignacion SERIAL PRIMARY KEY,
    id_activo INT REFERENCES activos(id_activo),
    id_usuario INT REFERENCES usuarios(id_usuario),
    fecha_asignacion DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE INDEX IF NOT EXISTS idx_asignacion_activos_activo ON asignacion_activos (id_activo, activo);
CREATE INDEX IF NOT EXISTS idx_asignacion_activos_usuario ON asignacion_activos (id_usuario, activo);

-- Documentos del activo
CREATE TABLE IF NOT EXISTS documentos_activo (
    id_documento SERIAL PRIMARY KEY,
    id_activo INT REFERENCES activos(id_activo),
    nombre VARCHAR(200) NOT NULL,
    tipo VARCHAR(100),
    url TEXT NOT NULL,
    fecha_subida TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_documentos_activo ON documentos_activo (id_activo, fecha_subida DESC);

-- Software: version, proveedor, fecha_compra
ALTER TABLE software
    ADD COLUMN IF NOT EXISTS version VARCHAR(100),
    ADD COLUMN IF NOT EXISTS proveedor VARCHAR(150),
    ADD COLUMN IF NOT EXISTS fecha_compra DATE;

-- Software instalado en activos
CREATE TABLE IF NOT EXISTS software_activos (
    id_software_activo SERIAL PRIMARY KEY,
    id_software INT REFERENCES software(id_software),
    id_activo INT REFERENCES activos(id_activo),
    version_instalada VARCHAR(100),
    fecha_instalacion DATE DEFAULT CURRENT_DATE,
    UNIQUE (id_software, id_activo)
);
CREATE INDEX IF NOT EXISTS idx_software_activos_activo ON software_activos (id_activo);

-- Alertas: soporte licencias
ALTER TABLE alertas
    ADD COLUMN IF NOT EXISTS id_licencia INT REFERENCES licencias(id_licencia);

-- Notificaciones (email queue/registro)
CREATE TABLE IF NOT EXISTS notificaciones (
    id_notificacion SERIAL PRIMARY KEY,
    tipo VARCHAR(100) NOT NULL,
    destinatario VARCHAR(200) NOT NULL,
    asunto VARCHAR(200) NOT NULL,
    cuerpo TEXT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    error TEXT,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_envio TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notificaciones_estado ON notificaciones (estado, fecha_creacion DESC);

-- Mantenimiento: acciones realizadas
ALTER TABLE ordenes_mantenimiento
    ADD COLUMN IF NOT EXISTS acciones_realizadas TEXT;

-- Evitar duplicados de asignacion de licencias
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'uniq_licencia_usuario'
    ) THEN
        CREATE UNIQUE INDEX uniq_licencia_usuario
            ON asignacion_licencias (id_licencia, id_usuario)
            WHERE id_usuario IS NOT NULL;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'uniq_licencia_activo'
    ) THEN
        CREATE UNIQUE INDEX uniq_licencia_activo
            ON asignacion_licencias (id_licencia, id_activo)
            WHERE id_activo IS NOT NULL;
    END IF;
END $$;

-- Seed categorias_ticket y backfill
INSERT INTO categorias_ticket (nombre, descripcion)
VALUES
    ('Hardware', 'Incidentes relacionados con hardware'),
    ('Software', 'Incidentes relacionados con software'),
    ('Red', 'Incidentes de conectividad o red'),
    ('Eléctrico', 'Incidentes eléctricos o de energía')
ON CONFLICT (nombre) DO NOTHING;

UPDATE tickets t
SET id_categoria_ticket = ct.id_categoria_ticket
FROM categorias_ticket ct
WHERE t.id_categoria_ticket IS NULL
  AND ct.nombre = t.clasificacion_nlp;

COMMIT;
