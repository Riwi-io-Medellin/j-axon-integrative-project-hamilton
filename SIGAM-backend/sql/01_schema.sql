-- =========================================================================
-- SIGAM BACKEND - ESQUEMA PRINCIPAL
-- PostgreSQL
-- =========================================================================

BEGIN;

-- =========================================================================
-- FASE 1: TABLAS MAESTRAS E INDEPENDIENTES
-- =========================================================================

CREATE TABLE IF NOT EXISTS USUARIOS (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    ultimo_acceso TIMESTAMP,
    intentos_fallidos INT NOT NULL DEFAULT 0,
    bloqueado_hasta TIMESTAMP
);

CREATE TABLE IF NOT EXISTS UBICACIONES (
    id_ubicacion SERIAL PRIMARY KEY,
    sede VARCHAR(100) NOT NULL,
    piso VARCHAR(50),
    sala VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS CATEGORIAS (
    id_categoria SERIAL PRIMARY KEY,
    nombre_categoria VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS PROVEEDORES (
    id_proveedor SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    contacto VARCHAR(150),
    identificacion_legal VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS SOFTWARE (
    id_software SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    fabricante VARCHAR(100),
    version VARCHAR(100),
    proveedor VARCHAR(150),
    fecha_compra DATE
);

CREATE TABLE IF NOT EXISTS REPUESTOS (
    id_repuesto SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    stock INT DEFAULT 0,
    stock_minimo INT DEFAULT 5,
    CONSTRAINT chk_repuestos_stock_non_negative CHECK (stock >= 0),
    CONSTRAINT chk_repuestos_stock_min_non_negative CHECK (stock_minimo >= 0)
);

-- =========================================================================
-- FASE 2: TABLAS NÚCLEO
-- =========================================================================

CREATE TABLE IF NOT EXISTS ACTIVOS (
    id_activo SERIAL PRIMARY KEY,
    serial VARCHAR(100) UNIQUE NOT NULL,
    codigo_qr VARCHAR(150) UNIQUE,
    modelo VARCHAR(150),
    fecha_compra DATE NOT NULL,
    vida_util INT NOT NULL,
    estado_activo BOOLEAN NOT NULL DEFAULT TRUE,
    costo_compra NUMERIC(12,2),
    nivel_criticidad VARCHAR(50) DEFAULT 'Media',
    especificaciones_electricas VARCHAR(255),
    id_ubicacion INT REFERENCES UBICACIONES(id_ubicacion),
    id_categoria INT NOT NULL REFERENCES CATEGORIAS(id_categoria),
    id_proveedor INT NOT NULL REFERENCES PROVEEDORES(id_proveedor),
    CONSTRAINT chk_activos_vida_util CHECK (vida_util > 0 AND vida_util <= 240),
    CONSTRAINT chk_activos_costo_compra_non_negative CHECK (costo_compra IS NULL OR costo_compra >= 0),
    CONSTRAINT chk_activos_criticidad CHECK (nivel_criticidad IN ('Baja', 'Media', 'Alta', 'Crítica'))
);

CREATE TABLE IF NOT EXISTS LICENCIAS (
    id_licencia SERIAL PRIMARY KEY,
    id_software INT REFERENCES SOFTWARE(id_software),
    clave_producto VARCHAR(255) NOT NULL,
    fecha_expiracion DATE,
    asientos_totales INT DEFAULT 1,
    CONSTRAINT chk_licencias_asientos CHECK (asientos_totales > 0)
);

CREATE TABLE IF NOT EXISTS CATEGORIAS_TICKET (
    id_categoria_ticket SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS TICKETS (
    id_ticket SERIAL PRIMARY KEY,
    id_activo INT REFERENCES ACTIVOS(id_activo),
    id_usuario_reporta INT REFERENCES USUARIOS(id_usuario),
    descripcion TEXT NOT NULL,
    prioridad_ia VARCHAR(50),
    clasificacion_nlp VARCHAR(100),
    id_categoria_ticket INT REFERENCES categorias_ticket(id_categoria_ticket),
    clasificacion_metodo VARCHAR(80),
    clasificacion_confidence NUMERIC(4,3),
    clasificacion_rationale TEXT,
    prioridad_metodo VARCHAR(80),
    prioridad_rationale TEXT,
    estado VARCHAR(50) DEFAULT 'Abierto',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP,
    tipo_ticket VARCHAR(50) NOT NULL DEFAULT 'Correctivo'
    ,
    CONSTRAINT chk_tickets_prioridad CHECK (prioridad_ia IS NULL OR prioridad_ia IN ('Baja', 'Media', 'Alta', 'Crítica')),
    CONSTRAINT chk_tickets_clasificacion CHECK (clasificacion_nlp IS NULL OR clasificacion_nlp IN ('Hardware', 'Software', 'Red', 'Eléctrico')),
    CONSTRAINT chk_tickets_clasificacion_confidence CHECK (clasificacion_confidence IS NULL OR (clasificacion_confidence >= 0 AND clasificacion_confidence <= 1)),
    CONSTRAINT chk_tickets_estado CHECK (estado IN ('Abierto', 'Asignado', 'En Proceso', 'Resuelto', 'Cerrado')),
    CONSTRAINT chk_tickets_tipo CHECK (tipo_ticket IN ('Correctivo', 'Preventivo'))
);

-- =========================================================================
-- FASE 3: TABLAS DE TRAZABILIDAD, MANTENIMIENTO Y RELACIONES
-- =========================================================================

CREATE TABLE IF NOT EXISTS HISTORIAL_ACTIVOS (
    id_historial SERIAL PRIMARY KEY,
    id_activo INT REFERENCES ACTIVOS(id_activo),
    fecha_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo_evento VARCHAR(100) NOT NULL,
    detalle TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS BAJAS_ACTIVOS (
    id_baja SERIAL PRIMARY KEY,
    id_activo INT UNIQUE REFERENCES ACTIVOS(id_activo),
    fecha_baja DATE NOT NULL,
    motivo TEXT NOT NULL,
    borrado_seguro VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS ASIGNACION_LICENCIAS (
    id_asignacion SERIAL PRIMARY KEY,
    id_licencia INT REFERENCES LICENCIAS(id_licencia),
    id_usuario INT REFERENCES USUARIOS(id_usuario),
    id_activo INT REFERENCES ACTIVOS(id_activo),
    fecha_asignacion DATE DEFAULT CURRENT_DATE,
    CONSTRAINT chk_asignacion_licencias_destino CHECK (
        (id_usuario IS NOT NULL AND id_activo IS NULL)
        OR (id_usuario IS NULL AND id_activo IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS CATALOGO_PRECIOS_PROVEEDORES (
    id_catalogo SERIAL PRIMARY KEY,
    id_proveedor INT REFERENCES PROVEEDORES(id_proveedor),
    id_repuesto INT REFERENCES REPUESTOS(id_repuesto),
    precio DECIMAL(10,2) NOT NULL,
    moneda VARCHAR(10) DEFAULT 'COP',
    UNIQUE (id_proveedor, id_repuesto),
    CONSTRAINT chk_catalogo_precio_positive CHECK (precio > 0)
);

CREATE TABLE IF NOT EXISTS ORDENES_MANTENIMIENTO (
    id_orden SERIAL PRIMARY KEY,
    id_ticket INT UNIQUE REFERENCES TICKETS(id_ticket),
    id_usuario_tecnico INT REFERENCES USUARIOS(id_usuario),
    diagnostico TEXT,
    acciones_realizadas TEXT,
    fecha_inicio TIMESTAMP,
    fecha_fin TIMESTAMP,
    checklist_seguridad BOOLEAN DEFAULT FALSE,
    CONSTRAINT chk_ordenes_fechas CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio)
);

CREATE TABLE IF NOT EXISTS CONSUMO_REPUESTOS (
    id_consumo SERIAL PRIMARY KEY,
    id_orden INT REFERENCES ORDENES_MANTENIMIENTO(id_orden),
    id_repuesto INT REFERENCES REPUESTOS(id_repuesto),
    cantidad_usada INT NOT NULL,
    CONSTRAINT chk_consumo_cantidad_positive CHECK (cantidad_usada > 0)
);

CREATE TABLE IF NOT EXISTS ALERTAS (
    id_alerta SERIAL PRIMARY KEY,
    tipo VARCHAR(100) NOT NULL,
    id_activo INT REFERENCES ACTIVOS(id_activo),
    id_repuesto INT REFERENCES REPUESTOS(id_repuesto),
    id_licencia INT REFERENCES LICENCIAS(id_licencia),
    estado VARCHAR(50) DEFAULT 'Pendiente',
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS TICKET_COMENTARIOS (
    id_comentario SERIAL PRIMARY KEY,
    id_ticket INT REFERENCES TICKETS(id_ticket),
    id_usuario INT REFERENCES USUARIOS(id_usuario),
    comentario TEXT NOT NULL,
    fecha_comentario TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS TICKET_HISTORIAL (
    id_historial SERIAL PRIMARY KEY,
    id_ticket INT REFERENCES TICKETS(id_ticket),
    id_usuario INT REFERENCES USUARIOS(id_usuario),
    cambio VARCHAR(100) NOT NULL,
    detalle TEXT,
    fecha_evento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ASIGNACION_ACTIVOS (
    id_asignacion SERIAL PRIMARY KEY,
    id_activo INT REFERENCES ACTIVOS(id_activo),
    id_usuario INT REFERENCES USUARIOS(id_usuario),
    fecha_asignacion DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS DOCUMENTOS_ACTIVO (
    id_documento SERIAL PRIMARY KEY,
    id_activo INT REFERENCES ACTIVOS(id_activo),
    nombre VARCHAR(200) NOT NULL,
    tipo VARCHAR(100),
    url TEXT NOT NULL,
    fecha_subida TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS SOFTWARE_ACTIVOS (
    id_software_activo SERIAL PRIMARY KEY,
    id_software INT REFERENCES SOFTWARE(id_software),
    id_activo INT REFERENCES ACTIVOS(id_activo),
    version_instalada VARCHAR(100),
    fecha_instalacion DATE DEFAULT CURRENT_DATE,
    UNIQUE (id_software, id_activo)
);

CREATE TABLE IF NOT EXISTS PASSWORD_RESETS (
    id_reset SERIAL PRIMARY KEY,
    id_usuario INT REFERENCES USUARIOS(id_usuario),
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS NOTIFICACIONES (
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

-- =========================================================================
-- AUDITORÍA
-- =========================================================================

CREATE TABLE IF NOT EXISTS AUDIT_LOG (
    id_audit SERIAL PRIMARY KEY,
    fecha_evento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario_actor INT REFERENCES USUARIOS(id_usuario),
    rol_actor VARCHAR(50),
    actor_email VARCHAR(150),
    source VARCHAR(30) DEFAULT 'api',
    request_id UUID,
    ruta TEXT,
    metodo VARCHAR(10),
    ip VARCHAR(80),
    user_agent TEXT,
    duration_ms INT,
    entidad VARCHAR(80),
    entidad_id VARCHAR(80),
    accion VARCHAR(80),
    status VARCHAR(10) DEFAULT 'OK',
    http_status INT,
    error_code VARCHAR(80),
    error_message TEXT,
    payload_before JSONB,
    payload_after JSONB,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_fecha ON AUDIT_LOG (fecha_evento DESC);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON AUDIT_LOG (id_usuario_actor, fecha_evento DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entidad ON AUDIT_LOG (entidad, entidad_id, fecha_evento DESC);
CREATE INDEX IF NOT EXISTS idx_audit_accion ON AUDIT_LOG (accion, fecha_evento DESC);
CREATE INDEX IF NOT EXISTS idx_audit_status ON AUDIT_LOG (status, fecha_evento DESC);

-- =========================================================================
-- ÍNDICES DE OPERACIÓN
-- =========================================================================

-- Búsqueda rápida de serial exacto e insensible a mayúsculas/minúsculas.
CREATE INDEX IF NOT EXISTS idx_activos_serial_lower ON ACTIVOS (lower(serial));
CREATE INDEX IF NOT EXISTS idx_activos_codigo_qr ON ACTIVOS (codigo_qr);

-- Accesos frecuentes por FKs y estado/fecha en operación.
CREATE INDEX IF NOT EXISTS idx_tickets_id_activo ON TICKETS (id_activo);
CREATE INDEX IF NOT EXISTS idx_tickets_id_usuario_reporta ON TICKETS (id_usuario_reporta);
CREATE INDEX IF NOT EXISTS idx_tickets_estado_fecha ON TICKETS (estado, fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_ordenes_id_usuario_tecnico ON ORDENES_MANTENIMIENTO (id_usuario_tecnico);
CREATE INDEX IF NOT EXISTS idx_ordenes_id_ticket ON ORDENES_MANTENIMIENTO (id_ticket);
CREATE INDEX IF NOT EXISTS idx_consumo_id_orden ON CONSUMO_REPUESTOS (id_orden);
CREATE INDEX IF NOT EXISTS idx_consumo_id_repuesto ON CONSUMO_REPUESTOS (id_repuesto);
CREATE INDEX IF NOT EXISTS idx_historial_id_activo_fecha ON HISTORIAL_ACTIVOS (id_activo, fecha_evento DESC);

COMMIT;
