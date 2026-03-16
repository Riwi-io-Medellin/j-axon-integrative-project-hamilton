---
name: sigam-backend-execution
description: Usa este skill para ejecutar tareas del backend SIGAM con reglas unificadas para trabajo asistido por IA, enfocadas en Node.js, Express y PostgreSQL.
---

# SIGAM Backend Skill

## Objetivo
Estandarizar como el equipo implementa tareas del backend con ayuda de IA, manteniendo un alcance tecnico claro, criterios de calidad compartidos y prioridad por entregas funcionales.

## Alcance
- Incluye solo backend: API, base de datos, seguridad, testing, y deploy backend.
- Stack objetivo: Node.js, Express, PostgreSQL, JWT, bcrypt.
- Excluye frontend: HTML/CSS/JS de UI, vistas, componentes, deploy frontend.

## Reglas obligatorias para IA
1. No proponer ni editar archivos de frontend.
2. Trabajar por issue y cumplir sus criterios de aceptacion antes de pasar al siguiente.
3. Prohibido hacer commits en `main`.
4. La rama base de trabajo es `developer`.
5. Cada tarea/issue debe salir desde `developer` con nomenclatura `feature/task`.
6. Hacer commits por tarea/issue (cambios pequenos, trazables y con mensaje claro).
7. Mantener compatibilidad con configuracion ESM (`type: module`).
8. Nunca guardar passwords en texto plano; usar hash con bcrypt.
9. Todas las rutas sensibles deben usar autenticacion y autorizacion por rol.
10. Toda operacion critica de inventario/logistica debe validar integridad (ej. no stock negativo).
11. Priorizar cambios pequenos y verificables; incluir evidencia de prueba por cada issue.
12. No hardcodear secretos ni credenciales; usar variables de entorno.
13. Si una tarea toca DB, incluir script SQL/migracion y validacion de constraints.
14. Si hay ambiguedad funcional, documentar supuestos en el PR/commit.
15. Mantener enfoque POO en backend: clases separadas por capas (`Controller`, `Service`, `Model`) con responsabilidades claras.
16. Registrar obligatoriamente cada tarea/issue en `AI_WORKLOG.md` para evitar trabajo duplicado entre IAs.
17. Prohibido usar emojis en el codigo, logs, mensajes de error o respuestas de API.
18. Antes de escribir una sola linea de codigo relacionada con IA/automatizacion, leer obligatoriamente `planIA.md` y alinear el trabajo a ese plan (contratos, flags, datos y criterios de aceptacion).
19. Cada tarea/issue debe terminar con al menos 1 commit propio (no mezclar multiples issues en un mismo commit) y su PR hacia `developer`.

## Flujo de trabajo recomendado
1. Seleccionar 1 issue backend.
2. Crear rama desde `developer` con formato `feature/task`.
3. Definir contrato tecnico: endpoints, payloads, reglas de negocio, errores esperados.
4. Implementar por capas en POO: route -> controller -> service -> model.
5. Probar: healthcheck, casos exitosos, casos de error, permisos.
6. Verificar criterios de aceptacion del issue.
7. Crear commit del issue/tarea.
8. Registrar la tarea en `AI_WORKLOG.md` (incluyendo archivos, evidencia y commit).
9. Documentar resultado y pasar al siguiente issue.

## Backlog backend (filtrado)

### Alta prioridad
- ISSUE 1: Configuracion inicial del backend con Express
- ISSUE 2: Configurar conexion PostgreSQL con pool
- ISSUE 3: Crear script SQL completo segun MER
- ISSUE 4: Implementar autenticacion con JWT y bcrypt
- ISSUE 6: CRUD completo de Activos
- ISSUE 9: Sistema de Tickets con clasificacion basica NLP
- ISSUE 11: Descuento automatico de repuestos al cerrar ticket
- ISSUE 18: Testing flujo completo Ticket -> Repuesto

### Prioridad media
- ISSUE 5: Middleware de autorizacion RBAC
- ISSUE 7: Historial automatico de cambios de estado
- ISSUE 8: CRUD de Software y Licencias
- ISSUE 10: Balanceo de carga de tecnicos
- ISSUE 17: Metricas MTTR y MTBF
- ISSUE 19: Despliegue Backend en Render

### Fuera de alcance de este repositorio
- ISSUE 12, 13, 14, 15, 16, 20 (frontend o deploy frontend)

## Plan por sprint (solo backend)

### Sprint 1 - Base tecnica
- ISSUE 1, 2, 3, 4, 5, 6
- Objetivo: API base, seguridad inicial y gestion de activos operativa.

### Sprint 2 - Core operativo
- ISSUE 7, 8, 9, 10
- Objetivo: tickets y licencias operando con automatizaciones iniciales.

### Sprint 3 - Inteligencia y logistica
- ISSUE 11, 17
- Objetivo: cierre operativo con impacto real en inventario y metricas.

### Sprint 4 - Estabilizacion y release backend
- ISSUE 18, 19
- Objetivo: validacion end-to-end y despliegue productivo del backend.

## Definition of Done por issue
- Criterios de aceptacion del issue cumplidos.
- Endpoints probados (exito + error + permisos cuando aplique).
- Sin regresiones en modulos existentes.
- Configuracion por entorno documentada.
- Cambios listos para revision de equipo.
- Entrada actualizada en `AI_WORKLOG.md`.

## Justificacion tecnica del proyecto
- Vision: pasar de mantenimiento reactivo a proactivo con trazabilidad de ciclo de vida de activos TI.
- Arquitectura: backend en Node.js + Express, BD relacional PostgreSQL normalizada (3NF).
- Criterio de diseño DB: priorizar integridad referencial, constraints de negocio, trazabilidad historica y datos auditables.
- Seguridad: autenticacion JWT, hash de credenciales con bcrypt, manejo de secretos por variables de entorno.
- Calidad operativa: soporte a SLA (prioridades de ticket), control de stock y eventos de mantenimiento con evidencia historica.
- Cumplimiento orientativo: diseño alineado a principios de ISO 55000 (activos), ISO 20000-1 (servicio), ISO 27001 (seguridad), ISO 22301 (continuidad), GTC 62 (metricas de mantenimiento).

## Convenciones de implementacion backend
- POO por capas: `Route` (HTTP) -> `Controller` (orquestacion) -> `Service` (reglas) -> `Model` (persistencia SQL).
- SQL en MAYUSCULAS para objetos (tablas/vistas) y prefijo `fn_`/`trg_` para funciones y triggers.
- Cada regla de negocio critica debe vivir en DB (constraint/trigger) ademas de validacion en API cuando aplique.
- Toda mejora estructural para ambientes productivos existentes debe incluir archivo de migracion incremental.
