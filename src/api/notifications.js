import { apiFetch } from './client.js';

const BASE = '/notifications';

// Admin: pass contactEmail to scope to one contact, omit to get all.
// User: contactEmail is ignored by the backend (always scoped to own email).
export const listNotifications = ({ contactEmail } = {}) => {
  if (contactEmail) {
    const params = new URLSearchParams({ contactEmail });
    return apiFetch(`${BASE}?${params.toString()}`);
  }
  return apiFetch(BASE);
};

// Admin only — creates the notification and emails the client a nudge.
export const createNotification = ({ contactEmail, subject, body, tenantId } = {}) =>
  apiFetch(BASE, {
    method: 'POST',
    body: { contactEmail, subject, body, ...(tenantId ? { tenantId } : {}) },
  });

export const markNotificationRead = (id) =>
  apiFetch(`${BASE}/${id}/read`, { method: 'POST' });

export const acknowledgeNotification = (id) =>
  apiFetch(`${BASE}/${id}/acknowledge`, { method: 'POST' });

export const deleteNotification = (id) =>
  apiFetch(`${BASE}/${id}`, { method: 'DELETE' });
