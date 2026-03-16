---
name: sigam-frontend-execution
description: Usa este skill para ejecutar tareas del frontend SIGAM con reglas unificadas para trabajo asistido por IA, enfocadas en HTML, CSS y JavaScript vanilla.
---

# SIGAM Frontend Skill

## Objetivo
Estandarizar como el equipo implementa tareas del frontend con ayuda de IA, manteniendo un alcance tecnico claro, criterios de calidad compartidos y prioridad por entregas funcionales.

## Alcance
- Incluye solo frontend: vistas, navegacion, estado UI, validaciones, consumo de API y deploy frontend.
- Stack objetivo: HTML5, CSS3, JavaScript vanilla, Fetch API, localStorage.
- Excluye backend: modelos de datos, reglas de negocio core, SQL, seguridad de servidor y deploy backend.

## Reglas obligatorias para IA
1. No proponer ni editar archivos de backend ni scripts SQL.
2. Trabajar por issue y cumplir sus criterios de aceptacion antes de pasar al siguiente.
3. Prohibido hacer commits en `main`.
4. La rama base de trabajo es `developer`.
5. Cada tarea/issue debe salir desde `developer` con nomenclatura `feature/task`.
6. Hacer commits por tarea/issue (cambios pequenos, trazables y con mensaje claro).
7. Centralizar consumo HTTP en una capa comun (cliente `fetch`) con manejo uniforme de errores.
8. No hardcodear URLs de API, secretos o credenciales; usar configuracion central en `src/view/js/config.js` (objeto `SIGAM_CONFIG`) y variables de entorno/config.
9. Toda vista protegida debe validar sesion/token y rol antes de renderizar acciones sensibles.
10. Toda accion de mutacion debe mostrar feedback visual (`loading`, `success`, `error`) y evitar doble envio.
11. Priorizar cambios pequenos y verificables; incluir evidencia de prueba por cada issue.
12. Si hay ambiguedad funcional, documentar supuestos en el PR/commit.
13. Mantener arquitectura modular en frontend: `views`, `components`, `services`, `state`, `utils`.
14. Implementar validaciones de formulario antes del request y mostrar mensajes claros al usuario.
15. Mantener accesibilidad basica: etiquetas de formulario, foco visible y contraste legible.
16. Registrar obligatoriamente cada tarea/issue en `AI_WORKLOG.md` para evitar trabajo duplicado entre IAs.
17. Prohibido usar emojis en codigo, logs, mensajes de error o textos tecnicos del proyecto.
18. Hacer pruebas al terminar cada tarea y guardar la evidencia en `test/` (crear la carpeta si no existe).
19. Crear un commit por tarea (un commit por issue).

## Flujo de trabajo recomendado
1. Seleccionar 1 issue frontend.
2. Crear rama desde `developer` con formato `feature/task`.
3. Definir contrato tecnico con backend: endpoint, payload, respuesta, errores esperados.
4. Implementar por capas en frontend: view -> component -> service -> state.
5. Probar: carga inicial, casos exitosos, casos de error, permisos por rol y responsive.
6. Guardar evidencia de pruebas en `test/`.
7. Verificar criterios de aceptacion del issue.
8. Crear commit del issue/tarea.
9. Registrar la tarea en `AI_WORKLOG.md` (incluyendo archivos, evidencia y commit).
10. Documentar resultado y pasar al siguiente issue.

## Backlog frontend (filtrado)

### Alta prioridad
- ISSUE 12: Vista Login y autenticacion frontend
- ISSUE 13: Vista Inventario (Listado y Formulario)
- ISSUE 14: Dashboard Tecnico y Gestion de Tickets
- ISSUE 15: Vista Gestion de Repuestos y Alertas
- ISSUE 16: Calendario de Mantenimiento basico

### Prioridad media
- ISSUE 20: Despliegue Frontend en Vercel
- Mejoras UX de sprint final (toasts, validaciones, estados vacios/errores)

### Fuera de alcance de este repositorio
- ISSUE 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 17, 18, 19 (backend, DB, testing backend, deploy backend)

## Plan por sprint (solo frontend)

### Sprint 1 - Base tecnica de UI
- ISSUE 12, ISSUE 13
- Objetivo: acceso al sistema y gestion visual de inventario operativa.

### Sprint 2 - Core operativo
- ISSUE 14
- Objetivo: tecnico gestiona ciclo de vida de tickets desde interfaz.

### Sprint 3 - Logistica y planificacion
- ISSUE 15, ISSUE 16
- Objetivo: control de repuestos y agenda visual de mantenimiento.

### Sprint 4 - Estabilizacion y release frontend
- ISSUE 20 + mejoras UX
- Objetivo: experiencia estable, responsive y despliegue productivo.

## Definition of Done por issue
- Criterios de aceptacion del issue cumplidos.
- Flujo UI probado (exito + error + permisos cuando aplique).
- Sin errores de consola en los flujos cubiertos.
- Responsive validado en desktop y movil.
- Configuracion por entorno documentada.
- Cambios listos para revision de equipo.
- Entrada actualizada en `AI_WORKLOG.md`.

## Justificacion tecnica del proyecto
- Vision: pasar de mantenimiento reactivo a proactivo con trazabilidad del ciclo de vida de activos TI.
- Arquitectura: frontend desacoplado consumiendo API REST de Node.js/Express.
- Criterio UI: priorizar claridad operativa, feedback inmediato y flujo guiado por estado.
- Seguridad en cliente: manejo de sesion por token, control visual por rol y cierre de sesion seguro.
- Calidad operativa: soporte visual a prioridades/SLA de tickets, alertas de stock y agenda de mantenimiento.
- Cumplimiento orientativo: interfaz alineada a trazabilidad y control operacional definidos por el proyecto.

## Convenciones de implementacion frontend
- Estructura por responsabilidades: `views` (pantallas), `components` (UI reutilizable), `services` (HTTP), `state` (estado), `utils` (helpers).
- Nombres de funciones en `camelCase`; constantes globales en `UPPER_SNAKE_CASE`.
- Manejar serializacion de fechas y numeros en una utilidad comun para evitar inconsistencias de formato.
- En tablas criticas, usar estados visuales consistentes para prioridad, criticidad y disponibilidad.
- Centralizar HTTP en `src/view/js/api.js` y leer la base URL desde `src/view/js/config.js`.
