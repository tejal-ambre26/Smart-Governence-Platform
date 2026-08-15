import axios from 'axios';
import keycloak from './keycloak.js';

// Authenticated API — sends Bearer token with every request
const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || (window.location.hostname === 'localhost' ? 'http://localhost:8080' : '');

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(async (config) => {
  if (keycloak.isTokenExpired?.(30)) {
    try { await keycloak.updateToken(30); } catch (e) { keycloak.login(); }
  }
  if (keycloak.token) {
    config.headers.Authorization = `Bearer ${keycloak.token}`;
  }
  return config;
});

export default api;
