import { apiFetch } from './client.js';

export const fetchLeads = ({ q = '', page = 0, size = 25 } = {}, options = {}) => {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  params.set('page', String(page));
  params.set('size', String(size));
  return apiFetch(`/leads?${params.toString()}`, options);
};

export const fetchLead = (id, options = {}) =>
  apiFetch(`/leads/${id}`, options);

export const deleteLead = (id, options = {}) =>
  apiFetch(`/leads/${id}`, { method: 'DELETE', ...options });
