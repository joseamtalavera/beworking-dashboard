import { apiFetch } from './client.js';

// GET /api/bekey/me -> { devices: [{ id, name, online, ... }], pin: string | null }
export const fetchMyAccess = (options = {}) => apiFetch('/bekey/me', options);

// POST /api/bekey/open/{deviceId} -> { opened: true, deviceId, name }
export const openDoor = (deviceId, options = {}) =>
  apiFetch(`/bekey/open/${deviceId}`, { method: 'POST', ...options });
