-- =========================================================================
-- SIGAM BACKEND - SUPABASE PERMISSIONS AND OPTIONAL RPC
-- =========================================================================
-- Run this in Supabase SQL editor using an admin/service role.

BEGIN;

-- Ensure schema usage for service_role.
GRANT USAGE ON SCHEMA public TO service_role;

-- Grants for existing objects.
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Default privileges for future objects.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL PRIVILEGES ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL PRIVILEGES ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT EXECUTE ON FUNCTIONS TO service_role;

-- Optional RPC for SQL passthrough used by the backend (run_query).
-- This is restricted to service_role only.
CREATE OR REPLACE FUNCTION public.run_query(query text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    jwt_role text := current_setting('request.jwt.claim.role', true);
BEGIN
    IF jwt_role IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'run_query forbidden' USING errcode = '42501';
    END IF;
    RETURN QUERY EXECUTE format('select row_to_json(t) from (%s) t', query);
END;
$$;

ALTER FUNCTION public.run_query(text) SET search_path = public;
REVOKE ALL ON FUNCTION public.run_query(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_query(text) TO service_role;

COMMIT;
