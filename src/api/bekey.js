import { apiFetch } from './client.js';

// GET /api/bekey/me -> { devices: [{ id, name, online, ... }], pin: string | null }
export const fetchMyAccess = (options = {}) => apiFetch('/bekey/me', options);

// POST /api/bekey/open/{deviceId} -> { opened: true, deviceId, name }
export const openDoor = (deviceId, options = {}) =>
  apiFetch(`/bekey/open/${deviceId}`, { method: 'POST', ...options });

// --- Admin endpoints (ROLE_ADMIN) -> AdminBeKeyController ---

// GET /api/admin/bekey/devices -> BeKeyDevice[]
export const fetchDevices = (options = {}) => apiFetch('/admin/bekey/devices', options);

// GET /api/admin/bekey/access[?contactId=] -> BeKeyAccess[]
export const fetchAccessGrants = (contactId, options = {}) => {
  const qs = contactId ? `?contactId=${contactId}` : '';
  return apiFetch(`/admin/bekey/access${qs}`, options);
};

// POST /api/admin/bekey/access { contactId, memberGroupId, expiresAt } -> created BeKeyAccess
export const grantAccess = (body, options = {}) =>
  apiFetch('/admin/bekey/access', { method: 'POST', body, ...options });

// DELETE /api/admin/bekey/access/{id}[?reason=] -> revoked BeKeyAccess
export const revokeAccess = (id, reason, options = {}) => {
  const qs = reason ? `?reason=${encodeURIComponent(reason)}` : '';
  return apiFetch(`/admin/bekey/access/${id}${qs}`, { method: 'DELETE', ...options });
};

// GET /api/admin/bekey/events -> BeKeyEvent[]
export const fetchEvents = (options = {}) => apiFetch('/admin/bekey/events', options);
