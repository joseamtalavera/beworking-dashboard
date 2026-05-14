import { apiFetch } from './client.js';

export const fetchInvoiceAudit = ({ month, cuentas }) => {
  const params = new URLSearchParams({ month, cuentas: cuentas.join(',') });
  return apiFetch(`/admin/reports/invoice-audit?${params.toString()}`);
};

export const fetchPriceDiscrepancies = () =>
  apiFetch('/admin/reports/price-discrepancies');

export const fetchMeetingRoomPastDue = () =>
  apiFetch('/admin/reconciliation/meeting-rooms');
