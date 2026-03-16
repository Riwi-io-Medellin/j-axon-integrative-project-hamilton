-- =========================================================================
-- SIGAM BACKEND - SEED REALISTA (SIN USUARIOS)
-- Trunca datos (excepto usuarios) y genera dataset completo para reportes.
-- =========================================================================

BEGIN;

-- Limpieza total (sin usuarios)
TRUNCATE TABLE
    alertas,
    consumo_repuestos,
    ordenes_mantenimiento,
    catalogo_precios_proveedores,
    asignacion_licencias,
    bajas_activos,
    historial_activos,
    tickets,
    licencias,
    activos,
    repuestos,
    software,
    proveedores,
    categorias,
    ubicaciones,
    audit_log
RESTART IDENTITY CASCADE;

-- 1) UBICACIONES (30)
INSERT INTO ubicaciones (sede, piso, sala)
SELECT
    CASE (i % 4)
        WHEN 0 THEN 'Norte'
        WHEN 1 THEN 'Sur'
        WHEN 2 THEN 'Centro'
        ELSE 'Este'
    END AS sede,
    'Piso ' || ((i % 8) + 1) AS piso,
    CASE (i % 7)
        WHEN 0 THEN 'Recepcion'
        WHEN 1 THEN 'Soporte'
        WHEN 2 THEN 'Data Center'
        WHEN 3 THEN 'Gerencia'
        WHEN 4 THEN 'Bodega'
        WHEN 5 THEN 'Operaciones'
        ELSE 'Laboratorio'
    END AS sala
FROM generate_series(1, 30) s(i);

-- 2) CATEGORIAS (10) - 50 activos por categoria
INSERT INTO categorias (nombre_categoria)
VALUES
    ('Laptop'),
    ('Desktop'),
    ('Servidor'),
    ('Monitor'),
    ('Impresora'),
    ('Router'),
    ('Switch'),
    ('UPS'),
    ('Tablet'),
    ('Telefono IP');

-- 2b) CATEGORIAS DE TICKETS (4)
INSERT INTO categorias_ticket (nombre, descripcion)
VALUES
    ('Hardware', 'Incidentes relacionados con hardware'),
    ('Software', 'Incidentes relacionados con software'),
    ('Red', 'Incidentes de conectividad o red'),
    ('Eléctrico', 'Incidentes eléctricos o de energía')
ON CONFLICT (nombre) DO NOTHING;

-- 3) PROVEEDORES (12)
INSERT INTO proveedores (nombre, contacto, identificacion_legal)
VALUES
    ('Dell Technologies', 'ventas@dell.co', 'NIT-900000001-1'),
    ('HP Enterprise', 'soporte@hp.co', 'NIT-900000002-2'),
    ('Lenovo LATAM', 'b2b@lenovo.co', 'NIT-900000003-3'),
    ('Cisco Systems', 'redes@cisco.co', 'NIT-900000004-4'),
    ('Apple Business', 'ventas@apple.com', 'NIT-900000005-5'),
    ('Samsung Business', 'enterprise@samsung.com', 'NIT-900000006-6'),
    ('Acer', 'corporate@acer.com', 'NIT-900000007-7'),
    ('ASUS', 'b2b@asus.com', 'NIT-900000008-8'),
    ('Epson', 'impresion@epson.com', 'NIT-900000009-9'),
    ('Canon', 'canon@canon.com', 'NIT-900000010-0'),
    ('Ubiquiti', 'ventas@ubnt.com', 'NIT-900000011-1'),
    ('APC', 'energia@apc.com', 'NIT-900000012-2');

-- 4) SOFTWARE (12)
INSERT INTO software (nombre, fabricante)
VALUES
    ('Windows 11 Pro', 'Microsoft'),
    ('Office 365', 'Microsoft'),
    ('Creative Cloud', 'Adobe'),
    ('AutoCAD 2024', 'Autodesk'),
    ('Antivirus Endpoint', 'Kaspersky'),
    ('VMware Workstation', 'VMware'),
    ('Slack Business', 'Slack'),
    ('Teams Enterprise', 'Microsoft'),
    ('Jira Software', 'Atlassian'),
    ('Confluence', 'Atlassian'),
    ('SQL Server Standard', 'Microsoft'),
    ('Visual Studio Pro', 'Microsoft');

-- 5) REPUESTOS (60) - nombres reales
INSERT INTO repuestos (nombre, stock, stock_minimo)
VALUES
    ('RAM DDR4 16GB', 6000, 300),
    ('RAM DDR4 8GB', 6000, 300),
    ('SSD NVMe 512GB', 6000, 250),
    ('SSD SATA 1TB', 6000, 200),
    ('HDD 2TB 7200RPM', 6000, 150),
    ('Fuente 650W 80+ Bronze', 6000, 120),
    ('Fuente 750W 80+ Gold', 6000, 120),
    ('Teclado USB', 6000, 200),
    ('Mouse USB', 6000, 200),
    ('Pantalla 24" IPS', 6000, 100),
    ('Pantalla 27" IPS', 6000, 100),
    ('Bateria Laptop 3 celdas', 6000, 120),
    ('Bateria Laptop 6 celdas', 6000, 120),
    ('Cargador USB-C 65W', 6000, 150),
    ('Cargador USB-C 90W', 6000, 150),
    ('Cable de red Cat6 2m', 6000, 200),
    ('Cable de red Cat6 5m', 6000, 200),
    ('Patch panel 24 puertos', 6000, 50),
    ('SFP 1Gbps', 6000, 80),
    ('SFP 10Gbps', 6000, 60),
    ('Ventilador 120mm', 6000, 150),
    ('Disipador CPU', 6000, 90),
    ('Pasta termica 4g', 6000, 200),
    ('Toner negro', 6000, 150),
    ('Toner cian', 6000, 80),
    ('Toner magenta', 6000, 80),
    ('Toner amarillo', 6000, 80),
    ('Kit rodillos impresora', 6000, 50),
    ('Kit mantenimiento impresora', 6000, 40),
    ('Switch PSU 350W', 6000, 30),
    ('UPS bateria 12V 9Ah', 6000, 120),
    ('UPS bateria 12V 7Ah', 6000, 120),
    ('Tarjeta de red 1Gb', 6000, 100),
    ('Tarjeta de red 10Gb', 6000, 60),
    ('Modulo WiFi', 6000, 90),
    ('Modulo Bluetooth', 6000, 90),
    ('Webcam 1080p', 6000, 120),
    ('Docking USB-C', 6000, 80),
    ('Lector RFID', 6000, 40),
    ('Tarjeta grafica 4GB', 6000, 50),
    ('Tarjeta grafica 8GB', 6000, 50),
    ('Memoria USB 32GB', 6000, 200),
    ('Memoria USB 64GB', 6000, 200),
    ('Cable HDMI 2m', 6000, 200),
    ('Cable DisplayPort 2m', 6000, 200),
    ('Soporte monitor', 6000, 80),
    ('Adaptador USB a RJ45', 6000, 120),
    ('Bateria CMOS', 6000, 200),
    ('Modulo LTE', 6000, 40),
    ('Microfono USB', 6000, 80),
    ('Telefono IP handset', 6000, 60),
    ('Fuente impresora 24V', 6000, 40),
    ('Fusor impresora', 6000, 30),
    ('Placa madre ATX', 6000, 40),
    ('Placa madre ITX', 6000, 40),
    ('Cable alimentacion 1.5m', 6000, 200),
    ('Cable alimentacion 3m', 6000, 200),
    ('Fan server 40mm', 6000, 80),
    ('Backplane SAS', 6000, 20);

-- 6) CATALOGO DE PRECIOS (por proveedor y repuesto)
INSERT INTO catalogo_precios_proveedores (id_proveedor, id_repuesto, precio, moneda)
SELECT
    p.id_proveedor,
    r.id_repuesto,
    (30 + (random() * 970))::numeric(10,2) AS precio,
    'COP'
FROM proveedores p
JOIN repuestos r ON random() < 0.35
ON CONFLICT (id_proveedor, id_repuesto) DO NOTHING;

-- 7) ACTIVOS (50 por categoria = 500)
INSERT INTO activos (
    serial, id_categoria, id_proveedor, id_ubicacion,
    fecha_compra, vida_util, modelo, nivel_criticidad,
    especificaciones_electricas, costo_compra
)
SELECT
    'SN-' || c.id_categoria || '-' || LPAD(i::text, 4, '0') || '-' || substring(md5(random()::text) from 1 for 4),
    c.id_categoria,
    (SELECT id_proveedor FROM proveedores ORDER BY random() LIMIT 1),
    (SELECT id_ubicacion FROM ubicaciones ORDER BY random() LIMIT 1),
    CURRENT_DATE - ((random() * 1800)::int),
    CASE c.nombre_categoria
        WHEN 'Servidor' THEN 60
        WHEN 'UPS' THEN 60
        WHEN 'Switch' THEN 48
        WHEN 'Router' THEN 48
        WHEN 'Monitor' THEN 48
        WHEN 'Impresora' THEN 48
        ELSE 36
    END,
    CASE c.nombre_categoria
        WHEN 'Laptop' THEN 'Latitude 5440'
        WHEN 'Desktop' THEN 'OptiPlex 7010'
        WHEN 'Servidor' THEN 'PowerEdge R540'
        WHEN 'Monitor' THEN 'Dell P2422H'
        WHEN 'Impresora' THEN 'HP LaserJet M507'
        WHEN 'Router' THEN 'Cisco ISR 4331'
        WHEN 'Switch' THEN 'Cisco Catalyst 2960'
        WHEN 'UPS' THEN 'APC Smart-UPS 1500'
        WHEN 'Tablet' THEN 'Galaxy Tab A8'
        ELSE 'Cisco 8841'
    END,
    CASE (i % 4)
        WHEN 0 THEN 'Crítica'
        WHEN 1 THEN 'Alta'
        WHEN 2 THEN 'Media'
        ELSE 'Baja'
    END,
    CASE WHEN random() > 0.5 THEN '120V - 15A' ELSE '240V - 20A' END,
    CASE c.nombre_categoria
        WHEN 'Servidor' THEN 18000
        WHEN 'UPS' THEN 3500
        WHEN 'Switch' THEN 2200
        WHEN 'Router' THEN 2600
        WHEN 'Impresora' THEN 1400
        WHEN 'Monitor' THEN 900
        WHEN 'Desktop' THEN 2500
        WHEN 'Laptop' THEN 3200
        WHEN 'Tablet' THEN 1200
        ELSE 1100
    END + (random() * 500)::numeric(12,2)
FROM categorias c
CROSS JOIN generate_series(1, 50) s(i)
ON CONFLICT (serial) DO NOTHING;

-- 8) LICENCIAS (300)
INSERT INTO licencias (id_software, clave_producto, fecha_expiracion, asientos_totales)
SELECT
    (SELECT id_software FROM software ORDER BY random() LIMIT 1),
    'LIC-' || LPAD(i::text, 6, '0') || '-' || substring(md5(random()::text) from 1 for 4),
    CURRENT_DATE + ((random() * 900)::int),
    5 + (i % 60)
FROM generate_series(1, 300) s(i);

-- 9) TICKETS (1200)
INSERT INTO tickets (
    id_activo, id_usuario_reporta, descripcion, prioridad_ia,
    clasificacion_nlp, clasificacion_metodo, clasificacion_confidence,
    clasificacion_rationale, prioridad_metodo, prioridad_rationale,
    estado, fecha_creacion, id_categoria_ticket
)
SELECT
    (SELECT id_activo FROM activos ORDER BY random() LIMIT 1),
    (SELECT id_usuario FROM usuarios ORDER BY random() LIMIT 1),
    'Incidente reportado. Caso #' || i,
    CASE WHEN random() > 0.85 THEN 'Crítica'
         WHEN random() > 0.65 THEN 'Alta'
         WHEN random() > 0.35 THEN 'Media'
         ELSE 'Baja' END,
    cat.nombre,
    CASE WHEN random() > 0.5 THEN 'rules_v1' ELSE 'ml_v1' END,
    (random())::numeric(4,3),
    'Clasificacion automatica para pruebas',
    CASE WHEN random() > 0.5 THEN 'rules_v1' ELSE 'ml_v1' END,
    'Prioridad automatica para pruebas',
    CASE WHEN random() > 0.75 THEN 'Abierto'
         WHEN random() > 0.55 THEN 'Asignado'
         WHEN random() > 0.35 THEN 'En Proceso'
         WHEN random() > 0.15 THEN 'Resuelto'
         ELSE 'Cerrado' END,
    CURRENT_TIMESTAMP - (random() * interval '240 days'),
    cat.id_categoria_ticket
FROM generate_series(1, 1200) s(i)
JOIN LATERAL (
    SELECT
        ct.id_categoria_ticket,
        ct.nombre
    FROM categorias_ticket ct
    ORDER BY random()
    LIMIT 1
) cat ON true;

-- Asegurar que todos los tickets queden asociados a un activo
UPDATE tickets
SET id_activo = (SELECT id_activo FROM activos ORDER BY random() LIMIT 1)
WHERE id_activo IS NULL;

-- Reasignar tickets que apunten a activos inexistentes (o sin categoria por data inconsistente)
UPDATE tickets t
SET id_activo = (SELECT id_activo FROM activos ORDER BY random() LIMIT 1)
WHERE NOT EXISTS (
    SELECT 1 FROM activos a WHERE a.id_activo = t.id_activo
);

-- 10) ORDENES DE MANTENIMIENTO (700)
WITH candidatos AS (
    SELECT t.id_ticket
    FROM tickets t
    LEFT JOIN ordenes_mantenimiento om ON om.id_ticket = t.id_ticket
    WHERE om.id_ticket IS NULL
    ORDER BY random()
    LIMIT 700
)
INSERT INTO ordenes_mantenimiento (
    id_ticket, id_usuario_tecnico, diagnostico,
    fecha_inicio, fecha_fin, checklist_seguridad
)
SELECT
    c.id_ticket,
    (SELECT id_usuario FROM usuarios
     WHERE lower(translate(rol, 'ÁÉÍÓÚáéíóú', 'AEIOUaeiou')) = 'tecnico'
     ORDER BY random() LIMIT 1),
    'Diagnostico tecnico generado para pruebas',
    base.fecha_inicio,
    CASE WHEN base.con_fin THEN base.fecha_inicio + (random() * interval '5 days') ELSE NULL END,
    (random() > 0.5)
FROM candidatos c
JOIN tickets t ON t.id_ticket = c.id_ticket
JOIN LATERAL (
    SELECT
        t.fecha_creacion + (random() * interval '3 days') AS fecha_inicio,
        (random() > 0.4) AS con_fin
) base ON true;

-- Reforzar stock antes de consumo (evita errores por stock insuficiente)
UPDATE repuestos
SET stock = GREATEST(COALESCE(stock, 0), 100000);

-- 11) CONSUMO DE REPUESTOS (2500)
INSERT INTO consumo_repuestos (id_orden, id_repuesto, cantidad_usada)
SELECT
    (SELECT id_orden FROM ordenes_mantenimiento ORDER BY random() LIMIT 1),
    (SELECT id_repuesto FROM repuestos WHERE stock > 0 ORDER BY random() LIMIT 1),
    1 + (random() * 3)::int
FROM generate_series(1, 2500) s(i);

-- 12) HISTORIAL DE ACTIVOS (1200)
INSERT INTO historial_activos (id_activo, fecha_evento, tipo_evento, detalle)
SELECT
    (SELECT id_activo FROM activos ORDER BY random() LIMIT 1),
    CURRENT_TIMESTAMP - (random() * interval '365 days'),
    CASE WHEN random() > 0.5 THEN 'Mantenimiento Preventivo' ELSE 'Actualizacion de Software' END,
    'Evento registrado automaticamente para auditoria'
FROM generate_series(1, 1200) s(i);

-- 13) ASIGNACION DE LICENCIAS (600)
WITH base AS (
    SELECT id_licencia, random() AS r
    FROM licencias
    ORDER BY random()
    LIMIT 600
)
INSERT INTO asignacion_licencias (id_licencia, id_usuario, id_activo, fecha_asignacion)
SELECT
    b.id_licencia,
    (SELECT id_usuario FROM usuarios ORDER BY random() LIMIT 1),
    NULL,
    CURRENT_DATE - (random() * 120)::int
FROM base b
WHERE b.r > 0.5
UNION ALL
SELECT
    b.id_licencia,
    NULL,
    (SELECT id_activo FROM activos ORDER BY random() LIMIT 1),
    CURRENT_DATE - (random() * 120)::int
FROM base b
WHERE b.r <= 0.5;

-- 14) BAJAS DE ACTIVOS (60)
INSERT INTO bajas_activos (id_activo, fecha_baja, motivo, borrado_seguro)
SELECT
    a.id_activo,
    CURRENT_DATE - (random() * 120)::int,
    'Fin de vida util',
    'CERT-' || substring(md5(random()::text) from 1 for 10)
FROM activos a
LEFT JOIN bajas_activos b ON b.id_activo = a.id_activo
WHERE b.id_activo IS NULL
ORDER BY random()
LIMIT 60;

-- 15) ALERTAS (300)
INSERT INTO alertas (tipo, id_activo, id_repuesto, estado, fecha_generacion)
SELECT
    CASE WHEN random() > 0.6 THEN 'Stock bajo de repuesto'
         WHEN random() > 0.3 THEN 'Mantenimiento preventivo sugerido'
         ELSE 'Activo dado de baja' END,
    CASE WHEN random() > 0.5 THEN (SELECT id_activo FROM activos ORDER BY random() LIMIT 1) ELSE NULL END,
    CASE WHEN random() > 0.5 THEN (SELECT id_repuesto FROM repuestos ORDER BY random() LIMIT 1) ELSE NULL END,
    CASE WHEN random() > 0.7 THEN 'Resuelta' ELSE 'Pendiente' END,
    CURRENT_TIMESTAMP - (random() * interval '60 days')
FROM generate_series(1, 300) s(i);

-- 16) AUDIT LOG (400)
INSERT INTO audit_log (
    fecha_evento, id_usuario_actor, rol_actor, actor_email, source,
    ruta, metodo, ip, user_agent, duration_ms, entidad, entidad_id,
    accion, status, http_status, error_code, error_message, metadata
)
SELECT
    CURRENT_TIMESTAMP - (random() * interval '30 days'),
    u.id_usuario,
    u.rol,
    u.email,
    'api',
    '/api/' || lower(CASE WHEN random() > 0.5 THEN 'tickets' ELSE 'activos' END),
    CASE WHEN random() > 0.7 THEN 'POST' WHEN random() > 0.4 THEN 'PATCH' ELSE 'GET' END,
    '192.168.' || (random() * 255)::int || '.' || (random() * 255)::int,
    'PostmanRuntime/7.32.0',
    50 + (random() * 900)::int,
    CASE WHEN random() > 0.5 THEN 'TICKETS' ELSE 'ACTIVOS' END,
    (random() * 500)::int,
    CASE WHEN random() > 0.7 THEN 'CREATE' WHEN random() > 0.4 THEN 'UPDATE' ELSE 'READ' END,
    CASE WHEN random() > 0.9 THEN 'ERROR' ELSE 'OK' END,
    CASE WHEN random() > 0.9 THEN 500 ELSE 200 END,
    CASE WHEN random() > 0.9 THEN 'E_RUNTIME' ELSE NULL END,
    CASE WHEN random() > 0.9 THEN 'Error simulado' ELSE NULL END,
    jsonb_build_object('source', 'seed_realista')
FROM usuarios u
ORDER BY random()
LIMIT 400;

COMMIT;
