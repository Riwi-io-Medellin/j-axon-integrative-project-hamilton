-- =========================================================================
-- SIGAM BACKEND - FUNCIONES Y DISPARADORES
-- =========================================================================

-- 1) Validar seguridad básica de password_hash
CREATE OR REPLACE FUNCTION fn_validar_password_hash()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.password_hash IS NULL OR length(trim(NEW.password_hash)) < 20 THEN
        RAISE EXCEPTION 'password_hash es obligatorio y debe parecer un hash válido';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_password_hash ON USUARIOS;
CREATE TRIGGER trg_validar_password_hash
BEFORE INSERT OR UPDATE OF password_hash ON USUARIOS
FOR EACH ROW
EXECUTE FUNCTION fn_validar_password_hash();

-- 2) Generar código QR de activo automáticamente
CREATE OR REPLACE FUNCTION fn_generar_codigo_qr_activo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigo_qr IS NULL OR length(trim(NEW.codigo_qr)) = 0 THEN
        NEW.codigo_qr := 'QR-' || NEW.serial;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generar_codigo_qr_activo ON ACTIVOS;
CREATE TRIGGER trg_generar_codigo_qr_activo
BEFORE INSERT OR UPDATE OF serial, codigo_qr ON ACTIVOS
FOR EACH ROW
EXECUTE FUNCTION fn_generar_codigo_qr_activo();

-- 3) Registrar historial automático al cambiar estado de activo
CREATE OR REPLACE FUNCTION fn_historial_cambio_estado_activo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado_activo IS DISTINCT FROM OLD.estado_activo THEN
        INSERT INTO HISTORIAL_ACTIVOS (id_activo, tipo_evento, detalle)
        VALUES (
            NEW.id_activo,
            'Cambio de estado',
            'Estado actualizado de "' ||
            CASE WHEN OLD.estado_activo THEN 'Activo' ELSE 'Inactivo' END ||
            '" a "' ||
            CASE WHEN NEW.estado_activo THEN 'Activo' ELSE 'Inactivo' END ||
            '"'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_historial_cambio_estado_activo ON ACTIVOS;
CREATE TRIGGER trg_historial_cambio_estado_activo
AFTER UPDATE OF estado_activo ON ACTIVOS
FOR EACH ROW
EXECUTE FUNCTION fn_historial_cambio_estado_activo();

-- 4) Controlar regla de asignación de licencias
CREATE OR REPLACE FUNCTION fn_validar_asignacion_licencias()
RETURNS TRIGGER AS $$
DECLARE
    v_asientos_totales INT;
    v_asignaciones_actuales INT;
BEGIN
    -- Debe existir exactamente uno: usuario o activo
    IF (NEW.id_usuario IS NULL AND NEW.id_activo IS NULL)
       OR (NEW.id_usuario IS NOT NULL AND NEW.id_activo IS NOT NULL) THEN
        RAISE EXCEPTION 'La asignación de licencia debe ser a usuario o a activo, pero no ambos';
    END IF;

    SELECT asientos_totales
    INTO v_asientos_totales
    FROM LICENCIAS
    WHERE id_licencia = NEW.id_licencia;

    SELECT COUNT(*)
    INTO v_asignaciones_actuales
    FROM ASIGNACION_LICENCIAS
    WHERE id_licencia = NEW.id_licencia
      AND (TG_OP = 'INSERT' OR id_asignacion <> NEW.id_asignacion);

    IF v_asignaciones_actuales >= v_asientos_totales THEN
        RAISE EXCEPTION 'No hay asientos disponibles para la licencia %', NEW.id_licencia;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validar_asignacion_licencias ON ASIGNACION_LICENCIAS;
CREATE TRIGGER trg_validar_asignacion_licencias
BEFORE INSERT OR UPDATE ON ASIGNACION_LICENCIAS
FOR EACH ROW
EXECUTE FUNCTION fn_validar_asignacion_licencias();

-- 5) Descontar stock al registrar consumo y crear alerta por stock bajo
CREATE OR REPLACE FUNCTION fn_consumo_repuesto_descontar_stock()
RETURNS TRIGGER AS $$
DECLARE
    v_stock_actual INT;
    v_stock_minimo INT;
BEGIN
    SELECT stock, stock_minimo
    INTO v_stock_actual, v_stock_minimo
    FROM REPUESTOS
    WHERE id_repuesto = NEW.id_repuesto
    FOR UPDATE;

    IF v_stock_actual IS NULL THEN
        RAISE EXCEPTION 'Repuesto % no existe', NEW.id_repuesto;
    END IF;

    IF v_stock_actual < NEW.cantidad_usada THEN
        RAISE EXCEPTION 'Stock insuficiente para repuesto % (stock %, solicitado %)', NEW.id_repuesto, v_stock_actual, NEW.cantidad_usada;
    END IF;

    UPDATE REPUESTOS
    SET stock = stock - NEW.cantidad_usada
    WHERE id_repuesto = NEW.id_repuesto;

    SELECT stock, stock_minimo
    INTO v_stock_actual, v_stock_minimo
    FROM REPUESTOS
    WHERE id_repuesto = NEW.id_repuesto;

    IF v_stock_actual <= v_stock_minimo THEN
        INSERT INTO ALERTAS (tipo, id_repuesto, estado)
        VALUES ('Stock bajo de repuesto', NEW.id_repuesto, 'Pendiente');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_consumo_repuesto_descontar_stock ON CONSUMO_REPUESTOS;
CREATE TRIGGER trg_consumo_repuesto_descontar_stock
AFTER INSERT ON CONSUMO_REPUESTOS
FOR EACH ROW
EXECUTE FUNCTION fn_consumo_repuesto_descontar_stock();

-- 6) Registrar baja de activo en historial y generar alerta
CREATE OR REPLACE FUNCTION fn_registrar_baja_activo()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO HISTORIAL_ACTIVOS (id_activo, tipo_evento, detalle)
    VALUES (NEW.id_activo, 'Baja de activo', NEW.motivo);

    INSERT INTO ALERTAS (tipo, id_activo, estado)
    VALUES ('Activo dado de baja', NEW.id_activo, 'Pendiente');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_registrar_baja_activo ON BAJAS_ACTIVOS;
CREATE TRIGGER trg_registrar_baja_activo
AFTER INSERT ON BAJAS_ACTIVOS
FOR EACH ROW
EXECUTE FUNCTION fn_registrar_baja_activo();

-- 7) Sincronizar estado del ticket según el avance de la orden
CREATE OR REPLACE FUNCTION fn_sincronizar_estado_ticket()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.fecha_fin IS NOT NULL THEN
        UPDATE TICKETS SET estado = 'Resuelto' WHERE id_ticket = NEW.id_ticket;
    ELSIF NEW.fecha_inicio IS NOT NULL THEN
        UPDATE TICKETS SET estado = 'En Proceso' WHERE id_ticket = NEW.id_ticket;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sincronizar_estado_ticket ON ORDENES_MANTENIMIENTO;
CREATE TRIGGER trg_sincronizar_estado_ticket
AFTER INSERT OR UPDATE ON ORDENES_MANTENIMIENTO
FOR EACH ROW
EXECUTE FUNCTION fn_sincronizar_estado_ticket();
