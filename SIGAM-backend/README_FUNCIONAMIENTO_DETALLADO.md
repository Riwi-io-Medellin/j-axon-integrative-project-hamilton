# SIGAM Backend - Documento Detallado de Funcionamiento (Maximo Detalle)

Este documento esta pensado para sustentacion y estudio profundo del backend SIGAM. Incluye arquitectura, reglas, endpoints, ejemplos de request/response, flujos y pruebas. No modifica el README principal.

## 1) Proposito del sistema
SIGAM centraliza la gestion de activos TI y su operacion:
- Activos e historial
- Tickets de soporte
- Ordenes de mantenimiento
- Consumo y stock de repuestos
- Licencias de software
- Catalogo de software

La API es REST y se protege con JWT + roles.

## 2) Stack tecnico
- Node.js + Express
- PostgreSQL (local) o Supabase
- JWT para autenticacion
- bcryptjs para hashing

## 3) Estructura del proyecto
- `src/app.js`: middlewares y rutas.
- `src/server.js`: arranque del servidor.
- `src/routes/*.routes.js`: endpoints por recurso.
- `src/controllers/*.controller.js`: capa HTTP.
- `src/services/*.service.js`: reglas de negocio.
- `src/models/*.js`: acceso a DB.
- `src/middlewares/*`: auth, roles, validaciones.
- `sql/*.sql`: esquema, vistas, triggers y seed.
- `postman/*.json`: coleccion de pruebas.

## 4) Seleccion de base de datos
`src/config/db.js` decide por `DB_MODE`:
- `postgres`: usa `pg`.
- `supabase`: usa `@supabase/supabase-js`.

Variables tipicas:
```
PORT=4000
JWT_SECRET=...
DB_MODE=postgres
DB_HOST=...
DB_PORT=5432
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
```

## 4.1) Iniciar la API paso a paso (breve)
1. Instalar dependencias:
```
pnpm install
```
2. Crear `.env` con variables minimas:
```
PORT=4000
JWT_SECRET=coloca_un_secreto_largo
DB_MODE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=usuario
DB_PASSWORD=clave
DB_NAME=sigam
```
3. Preparar base de datos (elige una opcion):

Base nueva:
```
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

Base existente:
```
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
4. Ejecutar API:
```
pnpm dev
```
5. Verificar salud:
```
GET /health -> 200 { "status": "ok" }
```
6. Autenticarse:
```
POST /api/auth/login -> token
```

## 5) Seguridad
### 5.1 Autenticacion
- `POST /api/auth/login`
- Si las credenciales son validas -> devuelve `token`.
- El token incluye `{ id, role }`.

### 5.2 Autorizacion
- `authMiddleware`: requiere token.
- `permit(resource, action)`: autoriza por rol.

Roles esperados:
- `Analista`
- `Tecnico`
- `Gerente`
- `Usuario`
- `Auditor`

## 6) Modelo de datos (resumen)
Tablas (ver `sql/01_schema.sql`):
- `USUARIOS`, `UBICACIONES`, `CATEGORIAS`, `PROVEEDORES`, `SOFTWARE`
- `ACTIVOS`, `TICKETS`
- `ORDENES_MANTENIMIENTO`, `REPUESTOS`, `CONSUMO_REPUESTOS`
- `LICENCIAS`, `ASIGNACION_LICENCIAS`
- `HISTORIAL_ACTIVOS`, `ALERTAS`

Vistas (ver `sql/03_views.sql`):
- `vw_activos_detalle`
- `vw_tickets_operacion`
- `vw_repuestos_bajo_stock`
- `vw_licencias_ocupacion`

Triggers (ver `sql/04_triggers.sql`):
- Descuento automatico de stock al registrar consumo.

## 7) Diagrama textual de relaciones
```
USUARIOS (1) --- (N) TICKETS
USUARIOS (1) --- (N) ORDENES_MANTENIMIENTO (tecnico)
ACTIVOS  (1) --- (N) TICKETS
TICKETS  (1) --- (1) ORDENES_MANTENIMIENTO
ORDENES_MANTENIMIENTO (1) --- (N) CONSUMO_REPUESTOS
REPUESTOS (1) --- (N) CONSUMO_REPUESTOS
SOFTWARE (1) --- (N) LICENCIAS
LICENCIAS (1) --- (N) ASIGNACION_LICENCIAS
ACTIVOS (1) --- (N) ASIGNACION_LICENCIAS (opcional)
USUARIOS (1) --- (N) ASIGNACION_LICENCIAS (opcional)
ACTIVOS (1) --- (N) HISTORIAL_ACTIVOS
ACTIVOS (1) --- (0/1) BAJAS_ACTIVOS
```

## 8) Arquitectura interna (flujo)
```
HTTP Request
  -> Route (validacion y roles)
    -> Controller
      -> Service (reglas de negocio)
        -> Model (DB: Postgres o Supabase)
          -> Response JSON
```

## 9) Endpoints por modulo (uso y respuesta esperada)

### 9.1 Convenciones generales
- Base URL: `https://sigam-backend.vercel.app`
- Header de autenticacion:
```
Authorization: Bearer <token>
```
- Respuestas:
  - Listas: `[]` de objetos.
  - Lectura: objeto del recurso.
  - Creacion/actualizacion: objeto creado/actualizado.
  - Eliminacion: `{ "message": "..." }`

### 9.2 Auth
**POST /api/auth/register** (publico)
Request:
```
{ "nombre": "Ana", "email": "ana@sigam.com", "password": "Password1", "rol": "Analista" }
```
Respuesta:
```
{ "id": 1, "nombre": "Ana", "email": "ana@sigam.com", "role": "Usuario", "fecha_creacion": "..." }
```
Nota: solo un `Gerente` autenticado puede asignar roles distintos de `Usuario`.

**POST /api/auth/login** (publico)
Request:
```
{ "email": "carlos.ruiz@empresa.com", "password": "Admin1234" }
```
Respuesta:
```
{ "token": "...", "user": { "id": 3, "nombre": "Carlos Ruiz", "email": "...", "role": "Gerente" } }
```

**GET /api/auth/admin-panel** (Gerente)
Respuesta:
```
{ "msg": "Bienvenido, Gerente" }
```

**GET /api/auth/configuracion** (Tecnico, Gerente)
Respuesta:
```
{ "msg": "Acceso a configuración técnica" }
```

**GET /api/auth/perfil** (Analista, Tecnico, Gerente, Usuario, Auditor)
Respuesta:
```
{ "msg": "Tu perfil de usuario" }
```

### 9.3 Usuarios
**GET /api/usuarios** (Gerente, Analista, Auditor)  
Query opcional: `limit`, `offset` (por defecto `limit=100`, `offset=0`, max `limit=500`).
Respuesta:
```
[{ "id_usuario": 1, "nombre": "...", "email": "...", "rol": "Analista", "fecha_creacion": "..." }]
```

**POST /api/usuarios** (Gerente, Analista)
Request:
```
{ "nombre": "Ana", "email": "ana@sigam.com", "password": "Password1", "rol": "Analista" }
```
Respuesta:
```
{ "id_usuario": 1, "nombre": "Ana", "email": "ana@sigam.com", "rol": "Analista", "fecha_creacion": "..." }
```
Nota: Analista solo puede crear roles `Usuario` o `Técnico`.

**PATCH /api/usuarios/:id** (Gerente, Analista)
Request:
```
{ "nombre": "Ana Perez", "email": "ana.perez@sigam.com" }
```
Respuesta:
```
{ "id_usuario": 1, "nombre": "Ana Perez", "email": "ana.perez@sigam.com", "rol": "Analista", "fecha_creacion": "..." }
```

**PATCH /api/usuarios/:id/rol** (Gerente)
Request:
```
{ "rol": "Técnico" }
```
Respuesta:
```
{ "id_usuario": 1, "nombre": "...", "email": "...", "rol": "Técnico", "fecha_creacion": "..." }
```

**PATCH /api/usuarios/:id/password** (Gerente, Tecnico, Usuario)
Request:
```
{ "password": "NuevaClave123" }
```
Respuesta:
```
{ "message": "Password actualizado", "user": { "id_usuario": 1, "nombre": "...", "email": "...", "rol": "..." } }
```
Nota: Tecnico solo puede cambiar contraseña de usuarios con rol `Usuario`. Usuario solo puede cambiar su propia contraseña.

**DELETE /api/usuarios/:id** (Gerente)
Respuesta:
```
{ "id_usuario": 1, "nombre": "...", "email": "..." }
```

### 9.4 Ubicaciones
**GET /api/ubicaciones**  
Respuesta: lista de ubicaciones.

**GET /api/ubicaciones/:id**  
Respuesta:
```
{ "id_ubicacion": 1, "sede": "Norte", "piso": "Piso 1", "sala": "Recepcion" }
```

**POST /api/ubicaciones**  
Request:
```
{ "sede": "Norte", "piso": "Piso 1", "sala": "Recepcion" }
```
Respuesta: objeto creado.

**PUT /api/ubicaciones/:id**  
Request:
```
{ "sede": "Norte", "piso": "Piso 2", "sala": "Soporte" }
```
Respuesta: objeto actualizado.

**DELETE /api/ubicaciones/:id**  
Respuesta:
```
{ "message": "Ubicacion eliminada" }
```

### 9.5 Categorias
**GET /api/categorias**  
Respuesta: lista de categorias.

### 9.6 Proveedores
**GET /api/proveedores**  
Respuesta: lista de proveedores.

**GET /api/proveedores/:id**  
Respuesta: proveedor.

**POST /api/proveedores**  
Request:
```
{ "nombre": "Dell Colombia", "contacto": "Juan", "identificacion_legal": "900999123" }
```
Respuesta: proveedor creado.

**PUT /api/proveedores/:id**  
Request:
```
{ "nombre": "Dell Colombia", "contacto": "Juan" }
```
Respuesta: proveedor actualizado.

**DELETE /api/proveedores/:id**  
Respuesta:
```
{ "message": "Proveedor eliminado" }
```

### 9.7 Activos
**GET /api/activos**  
Query opcional: `limit`, `offset` (por defecto `limit=100`, `offset=0`, max `limit=500`).  
Respuesta: lista de activos.

**GET /api/activos/:id**  
Respuesta: activo.

**GET /api/activos/:id/historial**  
Respuesta: lista de historial.

**POST /api/activos**  
Request (requeridos: `serial`, `id_categoria`, `id_proveedor`, `fecha_compra`, `vida_util`):
```
{
  "serial": "SN-000001",
  "id_categoria": 1,
  "id_proveedor": 1,
  "fecha_compra": "2023-06-10",
  "vida_util": 48,
  "modelo": "Modelo X",
  "nivel_criticidad": "Media"
}
```
Respuesta: activo creado.

**PUT /api/activos/:id**  
Request: campos editables del activo.  
Respuesta: activo actualizado.

**DELETE /api/activos/:id**  
Request:
```
{ "motivo_baja": "Fin de vida útil", "certificado_borrado": "CERT-12345" }
```
Respuesta:
```
{ "message": "Activo dado de baja correctamente (ISO 27001)", "data": { ... } }
```

### 9.8 Tickets
**GET /api/tickets**  
Query opcional: `limit`, `offset` (por defecto `limit=100`, `offset=0`, max `limit=500`).
Respuesta: lista de tickets.

**GET /api/tickets/:id**  
Query opcional: `suggestions=true` para incluir sugerencias.  
Respuesta: ticket (y sugerencias si se solicita).

**GET /api/tickets/activo/:id_activo**  
Query opcional: `limit`, `offset` (por defecto `limit=100`, `offset=0`, max `limit=500`).
Respuesta: tickets del activo.

**GET /api/tickets/asignados/mis**  
Query opcional: `limit`, `offset` (por defecto `limit=100`, `offset=0`, max `limit=500`).
Respuesta: tickets asignados al tecnico autenticado.

**GET /api/tickets/metricas**  
Query opcional: `id_activo`.  
Respuesta:
```
{ "mttr_seconds": 0, "mttr_horas": 0, "mttr_dias": 0, "mtbf_seconds": 0, "mtbf_horas": 0, "mtbf_dias": 0 }
```

**GET /api/tickets/:id/suggestions**  
Respuesta:
```
{ "id_ticket": 1, "id_activo": 1, "suggestions": [ ... ] }
```
Nota: las sugerencias se generan automaticamente al crear el ticket y se guardan en cache.
Si `IA_PROVIDER=external` e `IA_SUGGESTIONS_ENABLED=true`, el backend también consulta IA externa
usando el ticket + historial para devolver soluciones sugeridas.
Campos comunes por sugerencia:
`titulo`, `causa`, `solucion`, `pasos[]`, `advertencias[]`, `confianza`.

**POST /api/tickets**  
Request (requeridos: `id_activo`, `descripcion`):
```
{ "id_activo": 1, "descripcion": "Falla de hardware" }
```
Respuesta:
```
{ "id_ticket": 41, "id_activo": 1, "id_usuario_reporta": 6, "estado": "Abierto", "fecha_creacion": "..." }
```
Nota: el usuario reporta se toma del token. El sistema intenta autoasignar tecnico si hay disponible.

**PUT /api/tickets/:id**  
Request: campos editables del ticket.  
Respuesta: ticket actualizado.

**PATCH /api/tickets/:id/estado**  
Request:
```
{
  "estado": "Cerrado",
  "consumos": [ { "id_repuesto": 1, "cantidad_usada": 2 } ],
  "diagnostico": "Causa y solución aplicada",
  "acciones_realizadas": "Pasos ejecutados por el técnico"
}
```
Respuesta: ticket actualizado/cerrado.
Nota: `diagnostico` y `acciones_realizadas` se guardan en `ordenes_mantenimiento` del ticket.

**DELETE /api/tickets/:id**  
Respuesta:
```
{ "message": "Ticket eliminado" }
```

### 9.9 Mantenimientos
**GET /api/mantenimientos**  
Query opcional: `limit`, `offset` (por defecto `limit=100`, `offset=0`, max `limit=500`).
Respuesta: lista de ordenes.

**GET /api/mantenimientos/:id**  
Respuesta: orden.

**GET /api/mantenimientos/tecnico/:id_tecnico**  
Query opcional: `limit`, `offset` (por defecto `limit=100`, `offset=0`, max `limit=500`).
Respuesta: ordenes del tecnico.

**GET /api/mantenimientos/:id/consumos**  
Respuesta: consumos de repuestos.

**POST /api/mantenimientos**  
Request:
```
{ "id_ticket": 10, "id_usuario_tecnico": 2, "diagnostico": "Revision inicial", "fecha_inicio": "..." }
```
Respuesta: orden creada.

**POST /api/mantenimientos/:id/consumos**  
Request:
```
{ "id_repuesto": 1, "cantidad_usada": 2, "estado_ticket": "En Proceso" }
```
Respuesta: consumo registrado.

**PUT /api/mantenimientos/:id**  
Request: campos editables.  
Respuesta: orden actualizada.

**DELETE /api/mantenimientos/:id**  
Respuesta:
```
{ "message": "Mantenimiento eliminado" }
```

### 9.10 Repuestos
**GET /api/repuestos**  
Respuesta: lista de repuestos.

**GET /api/repuestos/:id**  
Respuesta: repuesto.

**GET /api/repuestos/bajo-stock**  
Respuesta: lista bajo stock.

**POST /api/repuestos**  
Request:
```
{ "nombre": "Memoria RAM 16GB DDR4", "stock": 50, "stock_minimo": 10 }
```
Respuesta: repuesto creado.

**PUT /api/repuestos/:id**  
Request: campos editables (incluye `stock`, `stock_minimo`).  
Respuesta: repuesto actualizado.

**DELETE /api/repuestos/:id**  
Respuesta:
```
{ "message": "Repuesto eliminado" }
```

### 9.11 Licencias
**GET /api/licencias**  
Respuesta: lista de licencias.

**GET /api/licencias/:id**  
Respuesta: licencia.

**GET /api/licencias/:id/asignaciones**  
Respuesta: asignaciones.

**POST /api/licencias**  
Request:
```
{ "id_software": 1, "clave_producto": "XYZ-123", "fecha_expiracion": "2026-12-31", "asientos_totales": 10 }
```
Respuesta: licencia creada.

**POST /api/licencias/asignar**  
Request (requerido `id_licencia`):
```
{ "id_licencia": 1, "id_usuario": 2, "id_activo": null }
```
Respuesta: asignacion creada.

**PUT /api/licencias/:id**  
Request:
```
{ "fecha_expiracion": "2027-12-31", "asientos_totales": 20 }
```
Respuesta: licencia actualizada.

**DELETE /api/licencias/:id**  
Respuesta:
```
{ "message": "Licencia eliminada" }
```

**DELETE /api/licencias/asignacion/:id_asignacion**  
Respuesta:
```
{ "message": "Asignación revocada" }
```

### 9.12 Software
**GET /api/software**  
Respuesta: lista de software.

**GET /api/software/:id**  
Respuesta: software.

**POST /api/software**  
Request:
```
{ "nombre": "Office", "fabricante": "Microsoft" }
```
Respuesta: software creado.

**PUT /api/software/:id**  
Request:
```
{ "nombre": "Office 2", "fabricante": "Microsoft" }
```
Respuesta: software actualizado.

**DELETE /api/software/:id**  
Respuesta:
```
{ "message": "Software eliminado" }
```

### 9.13 Metricas
**GET /api/metricas/operacion**  
Respuesta:
```
{ "mttr_seconds": 0, "mttr_horas": 0, "mttr_dias": 0, "mtbf_seconds": 0, "mtbf_horas": 0, "mtbf_dias": 0 }
```

**GET /api/metricas/resumen**  
Respuesta:
```
{ "total_activos": 0, "activos_en_mantenimiento": 0, "tickets_abiertos": 0, "tickets_cerrados": 0, "consumo_repuestos": 0 }
```

**GET /api/metricas/latencia**  
Respuesta:
```
{ "latency_ms": 0 }
```

### 9.14 Auditoria
**GET /api/auditoria**  
Filtros: `from`, `to`, `entidad`, `entidad_id`, `accion`, `status`, `id_usuario_actor`, `limit`, `offset`.
Respuesta: lista de logs.

**GET /api/auditoria/:id**  
Respuesta: log de auditoria.

### 9.14.2 Reportes
**GET /api/reportes/activos**  
Respuesta: lista de activos (con filtros opcionales `categoria`, `sede`, `piso`, `sala`).

**GET /api/reportes/tickets**  
Respuesta: lista de tickets.

**GET /api/reportes/mantenimientos**  
Respuesta: lista de ordenes.

**GET /api/reportes/licencias**  
Respuesta: lista de licencias.

**GET /api/reportes/inventario**  
Respuesta: lista de repuestos.

**GET /api/reportes/consumo-repuestos**  
Respuesta: consumo agregado de repuestos.

### 9.14.1 Alertas
**GET /api/alertas** (Analista, Gerente, Auditor)  
Filtros: `estado`, `tipo`, `id_activo`, `id_repuesto`, `limit`, `offset`.  
Respuesta: lista de alertas.

**PATCH /api/alertas/:id/estado** (Analista, Gerente)  
Request:
```
{ "estado": "Resuelta" }
```
Respuesta: alerta actualizada.

### 9.15 Jobs IA
**POST /api/jobs/ia/repuestos/sugerencias**  
Request:
```
{ "windowDays": 60, "horizonDays": 30 }
```
Respuesta: sugerencias y alertas creadas.

**POST /api/jobs/ia/activos/baja-sugerida**  
Request:
```
{ "windowDays": 365, "thresholdPct": 0.6 }
```
Respuesta: sugerencias de baja y alertas creadas.

**POST /api/jobs/ia/activos/obsolescencia**  
Request:
```
{ "months": 48, "limit": 50 }
```
Respuesta: activos candidatos y alertas creadas.

**POST /api/jobs/ia/tickets/reprocess**  
Request:
```
{ "limit": 20, "sinceDays": 30 }
```
Respuesta: resumen de reproceso.

**POST /api/jobs/ia/mantenimientos/preventivos**  
Request:
```
{ "intervalDays": 180, "scheduleOffsetDays": 1, "limit": 20 }
```
Respuesta: resumen de tickets preventivos creados.

#### 9.15.1 Cron IA (ejecucion automatica)
Estas rutas se invocan por cron (Vercel) y requieren header `x-cron-secret`.
- `POST /api/cron/ia/tickets/reprocess`
- `POST /api/cron/ia/repuestos/sugerencias`
- `POST /api/cron/ia/activos/baja-sugerida`
- `POST /api/cron/ia/activos/obsolescencia`
- `POST /api/cron/ia/mantenimientos/preventivos`

Configurar en `.env` o variables de entorno:
- `CRON_SECRET` (obligatorio)
Nota: los horarios de cron en Vercel usan UTC.

## 10) Metricas MTTR y MTBF
- MTTR: promedio de `(fecha_fin - fecha_inicio)` en ordenes de mantenimiento asociadas a tickets `Resuelto` o `Cerrado`.
- MTBF: promedio del tiempo entre tickets `Resuelto` o `Cerrado` por `id_activo`.

Respuesta incluye segundos, horas y dias.

## 11) Flujos completos
### 11.1 Flujo Ticket -> Repuesto
1. Crear ticket.
2. Crear orden de mantenimiento (asignar tecnico).
3. Consultar stock inicial de repuesto.
4. Registrar consumo.
5. Consultar stock final y validar descuento.
6. Cerrar ticket.

### 11.2 Flujo de licencias
1. Crear licencia.
2. Asignar licencia a usuario o activo.
3. Ver asignaciones.
4. Revocar asignacion.

## 12) Errores comunes por ruta
- `401 Unauthorized`: token invalido o no enviado.
- `403 Forbidden`: rol no autorizado.
- `404 Not Found`: recurso inexistente.
- `400 Bad Request`: campos requeridos faltantes o estado invalido.
- `429 Too Many Requests`: demasiadas solicitudes (rate limit activo).

## 13) Casos de error concretos
- Intentar cerrar ticket con tecnico no asignado -> `403`.
- Enviar estado invalido en tickets -> `400`.
- Crear mantenimiento sin `id_ticket` o `id_usuario_tecnico` -> `400`.
- Registrar consumo sin `id_repuesto` o `cantidad_usada` -> `400`.

## 13.1 Reglas front (obligatorias)
- **Paginacion**: todas las listas grandes deben usar `limit` y `offset`. Ejemplo: `GET /api/activos?limit=50&offset=0`.
- **Filtros**: si el usuario filtra por `categoria`, `sede`, `piso` o `sala`, incluirlos en la query para reducir carga.
- **Rate limit**: si el API devuelve `429`, esperar (backoff) y mostrar mensaje; no reintentar en loop.
- **Errores auth**: si `401`, detener reintentos y pedir login nuevamente.
- **Refresh controlado**: evitar polling agresivo (no cada 1-2s); usar 10-30s o refresco manual.

## 14) Datos seed (referencia rapida)
- Usuarios: 1..15
  - Tecnico: `id_usuario=2`
  - Gerente: `id_usuario=3`
- Activos: 1..40
- Repuestos: 1..10
- Software: 1..5

## 15) Ejecucion local
```
# con pnpm
pnpm install
pnpm dev

```

## 16) Healthcheck
`GET /health` debe responder `200`.

## 17) Recomendacion de estudio
1. Lee `sql/01_schema.sql` para entidades.
2. Revisa `sql/03_views.sql` para consultas clave.
3. Sigue el flujo Controller -> Service -> Model en un recurso.
4. Ejecuta el flujo Ticket -> Repuesto con Postman.
