-- =========================================================================
-- SIGAM BACKEND - VISTAS
-- =========================================================================

CREATE OR REPLACE VIEW vw_activos_detalle AS
SELECT
    a.id_activo,
    a.serial,
    a.codigo_qr,
    a.modelo,
    a.fecha_compra,
    a.vida_util,
    a.estado_activo,
    a.nivel_criticidad,
    c.nombre_categoria,
    u.sede,
    u.piso,
    u.sala,
    p.nombre AS proveedor,
    CASE
        WHEN a.fecha_compra + (a.vida_util || ' months')::interval < CURRENT_DATE THEN 'Vencido'
        WHEN a.fecha_compra + ((a.vida_util - 6) || ' months')::interval < CURRENT_DATE THEN 'Por vencer'
        ELSE 'Vigente'
    END AS estado_vida_util
FROM ACTIVOS a
LEFT JOIN CATEGORIAS c ON c.id_categoria = a.id_categoria
LEFT JOIN UBICACIONES u ON u.id_ubicacion = a.id_ubicacion
LEFT JOIN PROVEEDORES p ON p.id_proveedor = a.id_proveedor;

CREATE OR REPLACE VIEW vw_tickets_operacion AS
SELECT
    t.id_ticket,
    t.id_activo,
    t.fecha_creacion,
    t.fecha_cierre,
    t.estado,
    t.prioridad_ia,
    t.clasificacion_nlp,
    t.tipo_ticket,
    ct.nombre AS categoria_ticket,
    t.descripcion,
    a.serial AS activo_serial,
    ur.nombre AS usuario_reporta,
    om.id_orden,
    ut.nombre AS tecnico_asignado,
    om.fecha_inicio,
    om.fecha_fin
FROM TICKETS t
LEFT JOIN ACTIVOS a ON a.id_activo = t.id_activo
LEFT JOIN USUARIOS ur ON ur.id_usuario = t.id_usuario_reporta
LEFT JOIN CATEGORIAS_TICKET ct ON ct.id_categoria_ticket = t.id_categoria_ticket
LEFT JOIN ORDENES_MANTENIMIENTO om ON om.id_ticket = t.id_ticket
LEFT JOIN USUARIOS ut ON ut.id_usuario = om.id_usuario_tecnico;

CREATE OR REPLACE VIEW vw_repuestos_bajo_stock AS
SELECT
    r.id_repuesto,
    r.nombre,
    r.stock,
    r.stock_minimo,
    (r.stock_minimo - r.stock) AS faltante
FROM REPUESTOS r
WHERE r.stock <= r.stock_minimo;

CREATE OR REPLACE VIEW vw_licencias_ocupacion AS
SELECT
    l.id_licencia,
    s.nombre AS software,
    l.clave_producto,
    l.fecha_expiracion,
    l.asientos_totales,
    COALESCE(x.asientos_usados, 0) AS asientos_usados,
    (l.asientos_totales - COALESCE(x.asientos_usados, 0)) AS asientos_disponibles
FROM LICENCIAS l
LEFT JOIN SOFTWARE s ON s.id_software = l.id_software
LEFT JOIN (
    SELECT id_licencia, COUNT(*) AS asientos_usados
    FROM ASIGNACION_LICENCIAS
    GROUP BY id_licencia
) x ON x.id_licencia = l.id_licencia;
