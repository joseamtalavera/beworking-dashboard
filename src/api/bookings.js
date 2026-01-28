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

export const createReserva = (payload, options = {}) =>
  apiFetch('/bookings', {
    method: 'POST',
    body: payload,
    ...options
  });

const buildQueryString = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, value);
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

export const fetchBookingContacts = (params = {}, options = {}) =>
  apiFetch(`/bookings/lookups/contacts${buildQueryString(params)}`, options);

export const fetchBookingCentros = (params = {}, options = {}) =>
  apiFetch(`/bookings/lookups/centros${buildQueryString(params)}`, options);

export const fetchBookingProductos = (params = {}, options = {}) =>
  apiFetch(`/bookings/lookups/productos${buildQueryString(params)}`, options);

export const fetchPublicCentros = (options = {}) => apiFetch('/public/centros', options);

export const fetchPublicProductos = (params = {}, options = {}) =>
  apiFetch(`/public/productos${buildQueryString(params)}`, options);

export const deleteBloqueo = (bloqueoId, options = {}) =>
  apiFetch(`/bloqueos/${bloqueoId}`, {
    method: 'DELETE',
    ...options
  });

export const fetchPublicAvailability = (params = {}, options = {}) => {
  const search = new URLSearchParams();
  if (params.date) {
    search.set('date', params.date);
  }
  if (Array.isArray(params.products)) {
    params.products.forEach((product) => {
      if (product) {
        search.append('products', product);
      }
    });
  }
  if (Array.isArray(params.centers)) {
    params.centers.forEach((center) => {
      if (center) {
        search.append('centers', center);
      }
    });
  }
  const query = search.toString();
  return apiFetch(`/public/availability${query ? `?${query}` : ''}`, options);
};

export const updateBloqueo = (bloqueoId, payload, options = {}) =>
  apiFetch(`/bloqueos/${bloqueoId}`, {
    method: 'PUT',
    body: payload,
    ...options
  });
