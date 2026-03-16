-- =========================================================================
-- MIGRACION: TRANSACCION DE CONSUMO Y ESTADO DE TICKET
-- =========================================================================

-- Validar constraints base (idempotente)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_repuestos_stock_non_negative'
    ) THEN
        ALTER TABLE REPUESTOS
            ADD CONSTRAINT chk_repuestos_stock_non_negative CHECK (stock >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_consumo_cantidad_positive'
    ) THEN
        ALTER TABLE CONSUMO_REPUESTOS
            ADD CONSTRAINT chk_consumo_cantidad_positive CHECK (cantidad_usada > 0);
    END IF;
END $$;

-- Transaccion SQL: cambiar estado ticket + registrar consumo + descontar stock (via trigger)
CREATE OR REPLACE FUNCTION fn_registrar_consumo_ticket(
    p_id_orden INT,
    p_id_repuesto INT,
    p_cantidad_usada INT,
    p_estado_ticket VARCHAR
)
RETURNS TABLE (
    id_consumo INT,
    id_orden INT,
    id_repuesto INT,
    cantidad_usada INT,
    id_ticket INT,
    estado_ticket VARCHAR,
    stock_restante INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_ticket_id INT;
    v_stock_actual INT;
BEGIN
    IF p_cantidad_usada IS NULL OR p_cantidad_usada <= 0 THEN
        RAISE EXCEPTION 'cantidad_usada debe ser mayor que 0';
    END IF;

    IF p_estado_ticket IS NULL OR length(trim(p_estado_ticket)) = 0 THEN
        RAISE EXCEPTION 'estado_ticket es requerido';
    END IF;

    SELECT id_ticket
    INTO v_ticket_id
    FROM ORDENES_MANTENIMIENTO
    WHERE id_orden = p_id_orden
    FOR UPDATE;

    IF v_ticket_id IS NULL THEN
        RAISE EXCEPTION 'Orden % no existe', p_id_orden;
    END IF;

    SELECT stock
    INTO v_stock_actual
    FROM REPUESTOS
    WHERE id_repuesto = p_id_repuesto
    FOR UPDATE;

    IF v_stock_actual IS NULL THEN
        RAISE EXCEPTION 'Repuesto % no existe', p_id_repuesto;
    END IF;

    IF v_stock_actual < p_cantidad_usada THEN
        RAISE EXCEPTION 'Stock insuficiente para repuesto % (stock %, solicitado %)',
            p_id_repuesto, v_stock_actual, p_cantidad_usada;
    END IF;

    UPDATE TICKETS
    SET estado = p_estado_ticket,
        fecha_cierre = CASE WHEN p_estado_ticket = 'Cerrado' THEN NOW() ELSE fecha_cierre END
    WHERE id_ticket = v_ticket_id;

    INSERT INTO CONSUMO_REPUESTOS (id_orden, id_repuesto, cantidad_usada)
    VALUES (p_id_orden, p_id_repuesto, p_cantidad_usada)
    RETURNING id_consumo INTO id_consumo;

    SELECT stock
    INTO stock_restante
    FROM REPUESTOS
    WHERE id_repuesto = p_id_repuesto;

    id_orden := p_id_orden;
    id_repuesto := p_id_repuesto;
    cantidad_usada := p_cantidad_usada;
    id_ticket := v_ticket_id;
    estado_ticket := p_estado_ticket;

    RETURN NEXT;
END;
$$;
