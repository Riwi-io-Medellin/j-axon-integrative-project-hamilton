# SIGAM Frontend

Frontend estatico de SIGAM (HTML, CSS y JavaScript vanilla) migrado a SPA con Vite. Este repo consume un backend REST y se despliega como sitio estatico en Vercel.

---

## Sistema de Diseno

SIGAM utiliza un sistema de diseno estandarizado basado en CSS custom properties (variables CSS) para mantener consistencia visual en toda la aplicacion.

### Estructura de Archivos CSS

```
src/css/
├── variables.css          # Design tokens (colores, tipografia, espaciado, etc.)
├── global.css             # Estilos base y utilidades globales
├── navbar.css             # Estilos del navbar
├── components/
│   ├── buttons.css        # Sistema de botones
│   ├── cards.css          # Tarjetas y stat cards
│   ├── tables.css         # Tablas con paginacion y toolbar
│   ├── badges.css         # Badges y status indicators
│   ├── forms.css          # Formularios e inputs
│   ├── modals.css         # Modales, drawers y toasts
│   ├── sections.css       # Secciones y contenedores
│   ├── grid.css           # Sistema de grid y layout
│   ├── charts.css         # Configuracion de graficos Chart.js
│   └── footer.css         # Footer component
└── pages/
    ├── dashboard.css      # Estilos especificos del dashboard
    ├── tickets.css        # Estilos de tickets
    ├── inventory.css      # Estilos de inventario
    ├── calendar.css       # Estilos del calendario
    ├── reports.css        # Estilos de reportes
    ├── login.css          # Estilos de login
    ├── admin.css          # Estilos de admin
    └── profile.css        # Estilos de perfil
```

### Paleta de Colores

El sistema usa una paleta Azul/Slate:

| Variable | Uso |
|----------|-----|
| `--color-primary-*` | Color principal (azul) - 50 a 900 |
| `--color-slate-*` | Neutros (grises) - 50 a 900 |
| `--color-success` | Exito, completado |
| `--color-warning` | Advertencias, en progreso |
| `--color-danger` | Errores, urgente |
| `--color-info` | Informacion |

### Uso de Variables

```css
/* En lugar de valores hardcodeados */
.mi-componente {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  padding: var(--space-4);
  color: var(--text-primary);
}
```

### Clases de Componentes

#### Botones
```html
<button class="sigam-btn sigam-btn-primary sigam-btn-md">Primario</button>
<button class="sigam-btn sigam-btn-secondary sigam-btn-md">Secundario</button>
<button class="sigam-btn sigam-btn-outline sigam-btn-md">Outline</button>
<button class="sigam-btn sigam-btn-ghost sigam-btn-md">Ghost</button>
```

#### Badges
```html
<span class="sigam-badge sigam-badge-primary">Badge</span>
<span class="sigam-status-badge sigam-status-open">Abierto</span>
<span class="sigam-status-badge sigam-status-progress">En Progreso</span>
<span class="sigam-status-badge sigam-status-closed">Cerrado</span>
```

#### Cards
```html
<div class="sigam-card">
  <div class="sigam-card-header">
    <h3 class="sigam-card-title">Titulo</h3>
  </div>
  <div class="sigam-card-body">
    Contenido
  </div>
</div>
```

#### Tablas
```html
<div class="sigam-table-container">
  <table class="sigam-table sigam-table-striped">
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
</div>
```

#### Grid
```html
<div class="sigam-grid sigam-grid-cols-4 sigam-gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</div>
```

### Librerias Utilizadas

| Libreria | Version | Uso |
|----------|---------|-----|
| Bootstrap CSS | 5.3.2 | Grid base y utilidades |
| Bootstrap Icons | 1.11.1 | Iconografia |
| Chart.js | (incluido) | Graficos y visualizaciones |
| Calendar.js | (incluido) | Componente de calendario |

### Componentes JavaScript

| Componente | Archivo | Descripcion |
|------------|---------|-------------|
| Navbar | `src/components/Navbar.js` | Barra de navegacion principal |
| Footer | `src/components/Footer.js` | Pie de pagina (simple y completo) |
| Button | `src/components/Button.js` | Componente de boton reutilizable |
| AssetCard | `src/components/AssetCard.js` | Tarjeta de activo |
| TicketCard | `src/components/TicketCard.js` | Tarjeta de ticket |

---

## Requisitos
- Node.js solo para el build de Vercel.
- Backend accesible para pruebas de login, tickets e inventario.

## Estructura
- `index.html`: entrada unica de la SPA
- `src/main.js`: bootstrap de la app
- `src/router.js`: router SPA
- `src/pages`: vistas SPA (`*.page.js`)
- `src/components`: componentes reutilizables
- `src/css`: estilos
- `src/api-client.js`: cliente API ESM para SPA
- `src/config.js`: configuracion de endpoints
- `src/legacy`: HTML y JS anteriores (solo referencia, no usados por la SPA)
- `scripts`: scripts de build (inyeccion de entorno legacy)
- `test`: evidencia de pruebas por tarea

## Configuracion de entorno
- `VITE_SIGAM_API`: URL base del backend (por ejemplo `https://sigam-backend.vercel.app`).

En Vite, solo variables con prefijo `VITE_` estan disponibles en el frontend.
Para uso local puedes definir `window.SIGAM_API` en consola del navegador o guardar `SIGAM_API` en localStorage.

## Uso local rapido
1. Ejecuta `pnpm install` y luego `pnpm dev`.
2. Abre `http://localhost:5173`.

## Rutas
Las rutas se resuelven en el cliente con el router SPA. En Vercel se reescribe todo a `index.html`.

## Autenticacion y roles
- El token se guarda en localStorage (`sigam_token`).
- El usuario se guarda en localStorage (`sigam_user`).
- El router de la SPA valida sesion y rol antes de renderizar vistas protegidas.

## API y configuracion
- `src/config.js` define `SIGAM_CONFIG` con endpoints y `API_BASE_URL`.
- `src/api-client.js` centraliza `fetch`, tokens y manejo de errores para la SPA.

## Despliegue en Vercel
1. Configura la variable de entorno `VITE_SIGAM_API` en el proyecto de Vercel.
2. Vercel usa `package.json` con el script `build`.
3. El `distDir` configurado es `dist` y las rutas limpias se resuelven via `vercel.json`.

## Evidencia de pruebas
- Al terminar cada tarea, guardar evidencia en `test/` (capturas, logs o checklist).

## Tests automaticos
Este repo usa Vitest con entorno JSDOM para pruebas de DOM y funcionalidad.
Para ejecutar:
```
pnpm install
pnpm test
```

## Contribucion rapida
1. Trabaja por tarea e incluye evidencia en `test/`.
2. Un commit por tarea.
3. Actualiza `AI_WORKLOG.md` con el resumen de cambios y evidencia.
