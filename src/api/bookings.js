import { apiFetch } from './client.js';

export const fetchBookings = (params = {}, options = {}) => {
  const search = new URLSearchParams();

  if (params.from) {
    search.set('from', params.from);
  }
  if (params.to) {
    search.set('to', params.to);
  }
  if (params.centerId) {
    search.set('centerId', params.centerId);
  }
  if (params.view) {
    search.set('view', params.view);
  }
  if (params.tenantId) {
    search.set('tenantId', params.tenantId);
  }

  const query = search.toString();
  return apiFetch(`/bookings${query ? `?${query}` : ''}`, options);
};

export const fetchBloqueos = (params = {}, options = {}) => {
  const search = new URLSearchParams();

  if (params.from) {
    search.set('from', params.from);
  }
  if (params.to) {
    search.set('to', params.to);
  }
  if (params.centerId) {
    search.set('centerId', params.centerId);
  }
  if (params.contactId) {
    search.set('contactId', params.contactId);
  }
  if (params.productId) {
    search.set('productId', params.productId);
  }
  if (params.tenantId) {
    search.set('tenantId', params.tenantId);
  }

  const query = search.toString();
  return apiFetch(`/bloqueos${query ? `?${query}` : ''}`, options);
};
