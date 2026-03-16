// Global runtime config for static pages.
// API base URL comes from runtime env or local storage.
(function initSigamConfig() {
  const envApi = window.__ENV__ && window.__ENV__.SIGAM_API;
  const globalApi = window.SIGAM_API;
  const storedApi = window.localStorage ? window.localStorage.getItem('SIGAM_API') : '';

  const apiBaseUrl = (envApi || globalApi || storedApi || '').trim();

  if (!apiBaseUrl) {
    console.warn('SIGAM_CONFIG: API_BASE_URL is empty. Set SIGAM_API in the environment or localStorage.');
  }

  window.SIGAM_CONFIG = {
    API_BASE_URL: apiBaseUrl,
    DASHBOARD_ENDPOINT: '/api/dashboard',
    TICKETS_ENDPOINT: '/api/tickets',
    ACTIVOS_ENDPOINT: '/api/activos',
    REPUESTOS_ENDPOINT: '/api/repuestos',
    CATEGORIAS_ENDPOINT: '/api/categorias'
  };
})();
