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

export const linkStripeSubscription = (id, stripeSubscriptionId, options = {}) =>
  apiFetch(`/subscriptions/${id}/link-stripe`, {
    method: 'POST',
    body: { stripeSubscriptionId },
    ...options
  });

export const fetchDeskOccupancy = (options = {}) =>
  apiFetch('/subscriptions/desk-occupancy', options);

export const fetchDeskOccupancySummary = (options = {}) =>
  apiFetch('/subscriptions/desk-occupancy/summary', options);

// All desk-slot products (MA1O1-N) for the Add-Subscription desk picker.
export const fetchDeskProducts = (options = {}) =>
  apiFetch('/subscriptions/desk-products', options);
