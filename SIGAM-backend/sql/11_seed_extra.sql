-- =========================================================================
-- SIGAM BACKEND - SEED EXTRA PARA REPORTES/DASHBOARD
-- Genera datos adicionales: categorias, activos, licencias y tecnicos.
-- =========================================================================

BEGIN;

-- 1) CATEGORIAS (20)
INSERT INTO categorias (nombre_categoria)
VALUES
    ('Categoria 01'),
    ('Categoria 02'),
    ('Categoria 03'),
    ('Categoria 04'),
    ('Categoria 05'),
    ('Categoria 06'),
    ('Categoria 07'),
    ('Categoria 08'),
    ('Categoria 09'),
    ('Categoria 10'),
    ('Categoria 11'),
    ('Categoria 12'),
    ('Categoria 13'),
    ('Categoria 14'),
    ('Categoria 15'),
    ('Categoria 16'),
    ('Categoria 17'),
    ('Categoria 18'),
    ('Categoria 19'),
    ('Categoria 20');

-- 2) TECNICOS (20)
-- Usa el mismo hash de Password1 del seed base.
INSERT INTO usuarios (nombre, email, password_hash, rol)
VALUES
    ('Tecnico 01', 'tecnico01@sigam.com', '$2b$10$gMqGm3KEj1PEpZ7GReggMeJjA8vzFWedk5/5yIGFimCRiAZnJPcU2', 'Tecnico'),
    ('Tecnico 02', 'tecnico02@sigam.com', '$2b$10$gMqGm3KEj1PEpZ7GReggMeJjA8vzFWedk5/5yIGFimCRiAZnJPcU2', 'Tecnico'),
    ('Tecnico 03', 'tecnico03@sigam.com', '$2b$10$gMqGm3KEj1PEpZ7GReggMeJjA8vzFWedk5/5yIGFimCRiAZnJPcU2', 'Tecnico'),
    ('Tecnico 04', 'tecnico04@sigam.com', '$2b$10$gMqGm3KEj1PEpZ7GReggMeJjA8vzFWedk5/5yIGFimCRiAZnJPcU2', 'Tecnico'),
    ('Tecnico 05', 'tecnico05@sigam.com', '$2b$10$gMqGm3KEj1PEpZ7GReggMeJjA8vzFWedk5/5yIGFimCRiAZnJPcU2', 'Tecnico'),
    ('Tecnico 06', 'tecnico06@sigam.com', '$2b$10$gMqGm3KEj1PEpZ7GReggMeJjA8vzFWedk5/5yIGFimCRiAZnJPcU2', 'Tecnico'),
    ('Tecnico 07', 'tecnico07@sigam.com', '$2b$10$gMqGm3KEj1PEpZ7GReggMeJjA8vzFWedk5/5yIGFimCRiAZnJPcU2', 'Tecnico'),
    ('Tecnico 08', 'tecnico08@sigam.com', '$2b$10$gMqGm3KEj1PEpZ7GReggMeJjA8vzFWedk5/5yIGFimCRiAZnJPcU2', 'Tecnico'),
    ('Tecnico 09', 'tecnico09@sigam.com', '$2b$10$gMqGm3KEj1PEpZ7GReggMeJjA8vzFWedk5/5yIGFimCRiAZnJPcU2', 'Tecnico'),
    ('Tecnico 10', 'tecnico10@sigam.com', '$2b$10$gMqGm3KEj1PEpZ7GReggMeJjA8vzFWedk5/5yIGFimCRiAZnJPcU2', 'Tecnico'),
    ('Tecnico 11', 'tecnico11@sigam.com', '$2b$10$gMqGm3KEj1PEpZ7GReggMeJjA8vzFWedk5/5yIGFimCRiAZnJPcU2', 'Tecnico'),
    ('Tecnico 12', 'tecnico12@sigam.com', '$2b$10$gMqGm3KEj1PEpZ7GReggMeJjA8vzFWedk5/5yIGFimCRiAZnJPcU2', 'Tecnico'),
    ('Tecnico 13', 'tecnico13@sigam.com', '$2b$10$gMqGm3KEj1PEpZ7GReggMeJjA8vzFWedk5/5yIGFimCRiAZnJPcU2', 'Tecnico'),
    ('Tecnico 14', 'tecnico14@sigam.com', '$2b$10$gMqGm3KEj1PEpZ7GReggMeJjA8vzFWedk5/5yIGFimCRiAZnJPcU2', 'Tecnico'),
    ('Tecnico 15', 'tecnico15@sigam.com', '$2b$10$gMqGm3KEj1PEpZ7GReggMeJjA8vzFWedk5/5yIGFimCRiAZnJPcU2', 'Tecnico'),
    ('Tecnico 16', 'tecnico16@sigam.com', '$2b$10$gMqGm3KEj1PEpZ7GReggMeJjA8vzFWedk5/5yIGFimCRiAZnJPcU2', 'Tecnico'),
    ('Tecnico 17', 'tecnico17@sigam.com', '$2b$10$gMqGm3KEj1PEpZ7GReggMeJjA8vzFWedk5/5yIGFimCRiAZnJPcU2', 'Tecnico'),
    ('Tecnico 18', 'tecnico18@sigam.com', '$2b$10$gMqGm3KEj1PEpZ7GReggMeJjA8vzFWedk5/5yIGFimCRiAZnJPcU2', 'Tecnico'),
    ('Tecnico 19', 'tecnico19@sigam.com', '$2b$10$gMqGm3KEj1PEpZ7GReggMeJjA8vzFWedk5/5yIGFimCRiAZnJPcU2', 'Tecnico'),
    ('Tecnico 20', 'tecnico20@sigam.com', '$2b$10$gMqGm3KEj1PEpZ7GReggMeJjA8vzFWedk5/5yIGFimCRiAZnJPcU2', 'Tecnico');

-- 3) ACTIVOS (20) - usa categorias y proveedores existentes
INSERT INTO activos (
    serial, id_categoria, id_proveedor, fecha_compra, vida_util,
    modelo, nivel_criticidad, costo_compra
)
SELECT
    'SN-EX-' || LPAD(i::text, 4, '0'),
    (SELECT id_categoria FROM categorias ORDER BY random() LIMIT 1),
    (SELECT id_proveedor FROM proveedores ORDER BY random() LIMIT 1),
    DATE '2022-01-01' + ((i - 1) * INTERVAL '15 days'),
    CASE WHEN i % 3 = 0 THEN 24 WHEN i % 3 = 1 THEN 36 ELSE 48 END,
    'Modelo ' || CHR(64 + i),
    CASE WHEN i % 3 = 0 THEN 'Alta' WHEN i % 3 = 1 THEN 'Media' ELSE 'Baja' END,
    800.00 + (i * 75.00)
FROM generate_series(1, 20) s(i);

-- 4) LICENCIAS (20) - usa software existente
INSERT INTO licencias (id_software, clave_producto, fecha_expiracion, asientos_totales)
SELECT
    (SELECT id_software FROM software ORDER BY random() LIMIT 1),
    'LIC-EX-' || LPAD(i::text, 4, '0'),
    DATE '2026-01-01' + ((i - 1) * INTERVAL '18 days'),
    5 + (i % 12)
FROM generate_series(1, 20) s(i);

COMMIT;
