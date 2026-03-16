-- SIGAM BACKEND - MIGRACIÓN ACTIVOS: exigir categoria y proveedor

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'activos' AND column_name = 'id_categoria'
    ) THEN
        IF EXISTS (SELECT 1 FROM activos WHERE id_categoria IS NULL) THEN
            RAISE EXCEPTION 'No se puede aplicar NOT NULL: existen activos sin id_categoria';
        END IF;
        ALTER TABLE activos ALTER COLUMN id_categoria SET NOT NULL;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'activos' AND column_name = 'id_proveedor'
    ) THEN
        IF EXISTS (SELECT 1 FROM activos WHERE id_proveedor IS NULL) THEN
            RAISE EXCEPTION 'No se puede aplicar NOT NULL: existen activos sin id_proveedor';
        END IF;
        ALTER TABLE activos ALTER COLUMN id_proveedor SET NOT NULL;
    END IF;
END $$;
