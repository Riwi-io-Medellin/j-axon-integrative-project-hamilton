const apiFromEnv = (import.meta.env && import.meta.env.VITE_SIGAM_API) || '';

if (apiFromEnv) {
  window.SIGAM_API = apiFromEnv;
  window.__ENV__ = Object.assign({}, window.__ENV__ || {}, { SIGAM_API: apiFromEnv });
}

export const ENV = {
  SIGAM_API: apiFromEnv
};
