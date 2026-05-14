import Reconciliation from './Reconciliation.jsx';

// Legacy shim. The Reports surface was split into two top-level sidebar items
// (Reconciliation, InvoiceAudit) wired directly in AdminApp.jsx via DEPT_TABS.
// This default fallback renders the most useful page if anything still routes
// to "Reports" by id — typically only stale local state.
const Reports = () => <Reconciliation />;

export default Reports;
