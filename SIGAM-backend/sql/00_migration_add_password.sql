-- =========================================================================
-- MIGRACIÓN: agregar password_hash a USUARIOS existentes
-- =========================================================================

ALTER TABLE USUARIOS
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

UPDATE USUARIOS
SET password_hash = COALESCE(password_hash, '$2b$10$temporalpendientecambioxxxxxxxxxxxxxxxxxxxxxx');

ALTER TABLE USUARIOS
ALTER COLUMN password_hash SET NOT NULL;
