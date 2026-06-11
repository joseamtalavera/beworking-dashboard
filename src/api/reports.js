import { apiFetch } from './client.js';

export const fetchInvoiceAudit = ({ month, cuentas }) => {
  const params = new URLSearchParams({ month, cuentas: cuentas.join(',') });
  return apiFetch(`/admin/reports/invoice-audit?${params.toString()}`);
};

export const fetchPriceDiscrepancies = () =>
  apiFetch('/admin/reports/price-discrepancies');

// Kick off a fresh DB-vs-Stripe scan in the background (returns immediately —
// the scan does one Stripe call per paid invoice and would otherwise overrun
// the gateway timeout). Poll fetchPriceDiscrepancies for the updated snapshot.
export const runPriceDiscrepancies = () =>
  apiFetch('/admin/reports/price-discrepancies/run', { method: 'POST' });

export const fetchMeetingRoomPastDue = () =>
  apiFetch('/admin/reconciliation/meeting-rooms');
