# ESLint Security Report

Fecha: 2026-03-10
Scope: SIGAM-backend (Node.js, Express, PostgreSQL)
Comando:
- `pnpm exec eslint . -f json -o reports/eslint-security.json`

## Resumen
- Errores: 0
- Advertencias: 10
- Archivos con hallazgos: 6

## Hallazgos

### 1) RegExp no literal (security/detect-non-literal-regexp)
- Archivo: `src/config/db.js`
- Línea: 81
- Descripción: uso de `new RegExp` con argumento no literal.
- Contexto: reemplazo controlado de `$1`, `$2` en SQL para el adaptador Supabase.
- Mitigación aplicada:
  - Se restringe a SQL DML (`SELECT|INSERT|UPDATE|DELETE|WITH`).
  - Se bloquea SQL multi-sentencia (`;`).

### 2) Object Injection (security/detect-object-injection)
Archivos:
- `src/config/env.js` (linea 17) – acceso dinámico a `process.env[key]`.
- `src/controllers/licencia.controller.js` (linea 5) – binding dinámico de métodos.
- `src/controllers/maintenance.controller.js` (linea 5) – binding dinámico de métodos.
- `src/controllers/proveedor.controller.js` (linea 5) – binding dinámico de métodos.
- `src/controllers/repuesto.controller.js` (linea 5) – binding dinámico de métodos.
- `src/controllers/software.controller.js` (linea 5) – binding dinámico de métodos.
- `src/controllers/ticket.controller.js` (linea 5) – binding dinámico de métodos.
- `src/controllers/ubicacion.controller.js` (linea 5) – binding dinámico de métodos.
- `test/asset.routes.test.js` (linea 7) – acceso dinámico a `route.methods[method]`.
- `test/software.routes.test.js` (linea 7) – acceso dinámico a `route.methods[method]`.

Observación:
- La mayoría son falsos positivos (listas internas de métodos, no input del usuario).
- `env.js` usa `process.env` de forma esperada.

### 3) RegExp no literal en tests
- Archivo: `test/schema.sql.test.js` (linea 32)
- Descripción: `new RegExp` con interpolación de nombre de tabla.
- Riesgo: bajo, uso interno de tests.

## Cambios de hardening aplicados
- `helmet` agregado en `src/app.js`.
- `express-rate-limit` aplicado en `POST /auth/login`.
- Restricciones adicionales en `SupabaseAdapter.query`.
- Sanitización de mensajes para errores 5xx en `src/middlewares/error.middleware.js`.
- Control de acceso por ownership en tickets (usuario y técnico) en `src/services/ticket.service.js`.

## Evidencia
- Archivo completo del lint: `reports/eslint-security.json`
