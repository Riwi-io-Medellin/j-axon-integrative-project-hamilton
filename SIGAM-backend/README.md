# SIGAM Backend

Backend for J-AXON (SIGAM), a system for IT asset management, support tickets, and maintenance.

Main technologies:
- Node.js
- Express
- PostgreSQL (local or Supabase)

## Documentation
- `README_FUNCIONAMIENTO_DETALLADO.md` (full API guide and usage)

## Requirements
- Node.js 20.x
- pnpm 10+

## Environment variables
Create a `.env` file at the repo root:

```env
PORT=4000
JWT_SECRET=put_a_long_secret_here
DB_MODE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=sigam
```

If you are using Supabase instead of a local PostgreSQL server, replace those variables with:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Important rules:
- Do not commit `.env` (already ignored in `.gitignore`).
- Never paste secrets in commits, issues, or pull requests.

## Install
```bash
pnpm install
```

## Database
New database:

```sql
\i sql/01_schema.sql
\i sql/03_views.sql
\i sql/04_triggers.sql
\i sql/06_migration_ticket_consumo_tx.sql
\i sql/06_migration_ia_metadata.sql
\i sql/07_migration_ia_asset_cost.sql
\i sql/08_migration_audit_log.sql
\i sql/09_migration_activos_categoria_proveedor_not_null.sql
\i sql/02_seed_data.sql
```

Existing database (migrations first):

```sql
\i sql/00_migration_add_password.sql
\i sql/05_migration_db_foundations.sql
\i sql/06_migration_ticket_consumo_tx.sql
\i sql/06_migration_ia_metadata.sql
\i sql/07_migration_ia_asset_cost.sql
\i sql/08_migration_audit_log.sql
\i sql/09_migration_activos_categoria_proveedor_not_null.sql
\i sql/03_views.sql
\i sql/04_triggers.sql
```

## Run
```bash
pnpm dev
```

## Verificar sugerencias de IA

Cuando la UI solo muestra la sugerencia de fallback la IA externa no devolvió soluciones específicas; para reintentar en bloque puedes usar el script incluido:

```bash
pnpm ia:reprocess-fallbacks [cantidad]
```

El script recorre la tabla `ticket_sugerencias`, detecta tickets cuya caché contiene mensajes de fallback y vuelve a generar las sugerencias (hasta el número opcional `cantidad`). Así puedes revisar si el proveedor ya responde correctamente para más de un ticket.

## Vercel deploy
Vercel uses `src/app.js` as the serverless handler. `src/server.js` is for local runs.
Config is in `vercel.json`.

## Healthcheck
- `GET /health` should return `200`.
