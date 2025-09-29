import { apiFetch } from './client.js';

export const fetchCurrentUser = (options = {}) => apiFetch('/auth/me', options);
