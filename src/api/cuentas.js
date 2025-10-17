import { apiFetch } from './client.js';

/**
 * Fetch all active cuentas
 */
export const fetchCuentas = (options = {}) =>
  apiFetch('/cuentas', options);

/**
 * Fetch next invoice number for a specific cuenta
 */
export const fetchNextInvoiceNumber = (cuentaId, options = {}) =>
  apiFetch(`/cuentas/${cuentaId}/next-invoice-number`, options);

/**
 * Fetch next invoice number by cuenta codigo
 */
export const fetchNextInvoiceNumberByCodigo = (codigo, options = {}) =>
  apiFetch(`/cuentas/codigo/${codigo}/next-invoice-number`, options);
