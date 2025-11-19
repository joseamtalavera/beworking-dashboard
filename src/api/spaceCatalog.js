import { apiFetch } from './client.js';

const BASE_PATH = '/catalog/spaces';

const buildQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, value);
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

export const listSpaces = (params = {}, options = {}) =>
  apiFetch(`${BASE_PATH}${buildQuery(params)}`, options);

export const fetchSpace = (id, options = {}) =>
  apiFetch(`${BASE_PATH}/${encodeURIComponent(id)}`, options);

export const upsertSpace = (payload, options = {}) => {
  if (payload?.id) {
    return apiFetch(`${BASE_PATH}/${encodeURIComponent(payload.id)}`, {
      method: 'PUT',
      body: payload,
      ...options
    });
  }

  return apiFetch(BASE_PATH, {
    method: 'POST',
    body: payload,
    ...options
  });
};

export const deleteSpace = (id, options = {}) =>
  apiFetch(`${BASE_PATH}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    ...options
  });
