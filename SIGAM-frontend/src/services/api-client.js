import SIGAM_CONFIG from './config.js';
import { getToken, setToken, setUser, clearStorage } from '../state/storage.js';

const baseUrl = (SIGAM_CONFIG.API_BASE_URL || '').replace(/\/+$/, '');

const buildQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.append(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

const normalizeUser = (payload, fallbackEmail) => {
  const userPayload = payload && typeof payload === 'object' ? payload : {};
  if (!userPayload.email && fallbackEmail) userPayload.email = fallbackEmail;
  if (!userPayload.nombre && payload && payload.nombre) userPayload.nombre = payload.nombre;
  if (!userPayload.name && payload && payload.name) userPayload.name = payload.name;
  if (!userPayload.rol && payload && payload.rol) userPayload.rol = payload.rol;
  if (!userPayload.role && payload && payload.role) userPayload.role = payload.role;
  return userPayload;
};

const apiRequest = async (path, options = {}) => {
  if (!baseUrl) {
    throw new Error('API base URL is not configured.');
  }
  const query = options.query ? buildQuery(options.query) : '';
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}${query}`;
  const method = (options.method || 'GET').toUpperCase();
  const headers = Object.assign({}, options.headers || {});
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let body;
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  const cache = options.cache ?? 'no-store';
  const response = await fetch(url, { method, headers, body, cache });
  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (response.ok) {
    return payload;
  }

  if (response.status === 401) {
    clearStorage();
  }

  const message = isJson && payload && payload.message
    ? payload.message
    : `Request failed (${response.status})`;
  const error = new Error(message);
  error.status = response.status;
  error.payload = payload;
  throw error;
};

const auth = {
  login: async (email, password) => {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    if (data && data.token) {
      setToken(data.token);
    }
    const rawUser = data && (data.user || data.usuario || data.profile || data);
    const user = normalizeUser(rawUser, email);
    setUser(user);
    return { user, token: data && data.token };
  }
};

export const api = { apiRequest, auth };
