// Global runtime config for static pages.
// API base URL comes from runtime env or local storage, with a safe default.
const envApi = window.__ENV__ && window.__ENV__.SIGAM_API;
const globalApi = window.SIGAM_API;
const storedApi = window.localStorage ? window.localStorage.getItem('SIGAM_API') : '';
const apiBaseUrl = (envApi || globalApi || storedApi || '').trim();

if (!apiBaseUrl) {
  console.warn('SIGAM_CONFIG: API_BASE_URL is empty. Set SIGAM_API in the environment or localStorage.');
}

const SIGAM_CONFIG = {
  API_BASE_URL: apiBaseUrl,
  DASHBOARD_ENDPOINT: '/api/dashboard',
  TICKETS_ENDPOINT: '/api/tickets',
  ACTIVOS_ENDPOINT: '/api/activos',
  REPUESTOS_ENDPOINT: '/api/repuestos',
  SOFTWARE_ENDPOINT: '/api/software',
  LICENCIAS_ENDPOINT: '/api/licencias',
  CATEGORIAS_ENDPOINT: '/api/categorias',
  CATEGORIAS_TICKET_ENDPOINT: '/api/tickets/categorias',
  PROVEEDORES_ENDPOINT: '/api/proveedores',
  UBICACIONES_ENDPOINT: '/api/ubicaciones',
  USUARIOS_ENDPOINT: '/api/usuarios',
  MANTENIMIENTOS_ENDPOINT: '/api/mantenimientos'
};

export default SIGAM_CONFIG;
