import { apiFetch } from './client.js';

export const fetchInvoiceAudit = ({ month, cuentas }) => {
  const params = new URLSearchParams({ month, cuentas: cuentas.join(',') });
  return apiFetch(`/admin/reports/invoice-audit?${params.toString()}`);
};
