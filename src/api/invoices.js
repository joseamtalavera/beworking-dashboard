import { apiFetch, resolveApiUrl } from './client.js';

export const fetchInvoices = (
  { page = 0, size = 25, name, email, idFactura, status, tenantType, product } = {},
  options = {}
) => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
  if (name) params.set('name', name);
  if (email) params.set('email', email);
  if (idFactura) params.set('idFactura', idFactura);
  if (status) params.set('status', status);
  if (tenantType) params.set('tenantType', tenantType);
  if (product) params.set('product', product);
  return apiFetch(`/invoices?${params.toString()}`, options);
};

export const fetchInvoicePdfUrl = (id, options = {}) => {
  const params = new URLSearchParams();
  params.set('id', String(id));
  return apiFetch(`/invoices/pdf-url?${params.toString()}`, { ...options, parse: 'text' });
};

export const fetchInvoicePdfBlob = async (id, options = {}) => {
  return apiFetch(`/invoices/${String(id)}/pdf`, { ...options, parse: 'blob' });
};

export const createInvoice = (payload, options = {}) =>
  apiFetch('/invoices', {
    method: 'POST',
    body: payload,
    ...options
  });

export const creditInvoice = (id, payload = {}, options = {}) =>
  apiFetch(`/invoices/${String(id)}/credit`, {
    method: 'POST',
    body: payload,
    ...options
  });
