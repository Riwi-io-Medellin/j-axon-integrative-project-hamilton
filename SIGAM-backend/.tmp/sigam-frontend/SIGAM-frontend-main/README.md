# SIGAM Frontend

Frontend estatico de SIGAM (HTML, CSS y JavaScript vanilla). Este repo consume un backend REST y se despliega como sitio estatico en Vercel.

## Requisitos
- Node.js solo para el build de Vercel.
- Backend accesible para pruebas de login, tickets e inventario.

## Estructura
- `src/view/pages`: paginas HTML
- `src/view/css`: estilos
- `src/view/js`: logica de UI, estado y consumo de API
- `src/view/services`: auth-guard y navbar compartido
- `scripts`: scripts de build (inyeccion de entorno)
- `test`: evidencia de pruebas por tarea

## Configuracion de entorno
- `SIGAM_API`: URL base del backend (por ejemplo `https://sigam-backend.vercel.app`).

En Vercel este valor se inyecta en build y se escribe en `src/view/js/runtime-env.js`.
Para uso local puedes definir `window.SIGAM_API` en consola del navegador o guardar `SIGAM_API` en localStorage.

## Uso local rapido
1. Abre `src/view/pages/login.html` en el navegador.
2. Si necesitas rutas limpias, levanta un servidor estatico y navega a `/login` u otras rutas.

## Rutas
Las paginas son HTML independientes. Con `vercel.json` se habilitan rutas limpias:
- `/` y `/login`
- `/register`
- `/dashboard`
- `/tickets`
- `/inventory`
- `/calendar`
- `/reports`
- `/admin`

## Autenticacion y roles
- El token se guarda en localStorage (`sigam_token`).
- El usuario se guarda en localStorage (`sigam_user`).
- `src/view/services/auth-guard.js` valida sesion y rol antes de renderizar vistas protegidas.
- Cada pagina protegida define `window.SIGAM_PAGE_ROLES`.

## API y configuracion
- `src/view/js/config.js` define `window.SIGAM_CONFIG` con endpoints y `API_BASE_URL`.
- `src/view/js/api.js` centraliza `fetch`, tokens y manejo de errores.
- `src/view/js/runtime-env.js` se genera en build con `SIGAM_API`.

## Despliegue en Vercel
1. Configura la variable de entorno `SIGAM_API` en el proyecto de Vercel.
2. Vercel usa `package.json` con el script `build` para generar `src/view/js/runtime-env.js`.
3. El `distDir` configurado es `src/view` y las rutas limpias se resuelven via `vercel.json`.

## Evidencia de pruebas
- Al terminar cada tarea, guardar evidencia en `test/` (capturas, logs o checklist).

## Contribucion rapida
1. Trabaja por tarea e incluye evidencia en `test/`.
2. Un commit por tarea.
3. Actualiza `AI_WORKLOG.md` con el resumen de cambios y evidencia.
