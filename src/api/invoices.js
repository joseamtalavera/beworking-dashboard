import { apiFetch, resolveApiUrl } from './client.js';

export const fetchInvoices = ({ page = 0, size = 25 } = {}, options = {}) => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('size', String(size));
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


