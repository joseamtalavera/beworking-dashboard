import { apiFetch } from './client.js';

export const fetchSubscriptions = (params = {}, options = {}) => {
  const search = new URLSearchParams();
  if (params.contactId) search.set('contactId', params.contactId);
  const query = search.toString();
  return apiFetch(`/subscriptions${query ? `?${query}` : ''}`, options);
};

export const createSubscription = (payload, options = {}) =>
  apiFetch('/subscriptions', {
    method: 'POST',
    body: payload,
    ...options
  });

export const updateSubscription = (id, payload, options = {}) =>
  apiFetch(`/subscriptions/${id}`, {
    method: 'PUT',
    body: payload,
    ...options
  });

export const deleteSubscription = (id, options = {}) =>
  apiFetch(`/subscriptions/${id}`, {
    method: 'DELETE',
    ...options
  });
