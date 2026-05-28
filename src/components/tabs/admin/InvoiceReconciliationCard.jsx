import { useEffect, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n/i18n.js';
import esOverview from '../../../i18n/locales/es/overview.json';
import enOverview from '../../../i18n/locales/en/overview.json';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { apiFetch } from '../../../api/client.js';
import { tokens } from '../../../theme/tokens.js';

if (!i18n.hasResourceBundle('es', 'overview')) {
  i18n.addResourceBundle('es', 'overview', esOverview);
  i18n.addResourceBundle('en', 'overview', enOverview);
}

const parseMaybeJson = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { return []; } }
  if (v && typeof v === 'object' && typeof v.value === 'string') {
    try { return JSON.parse(v.value); } catch { return []; }
  }
  return [];
};

const InvoiceReconciliationCard = () => {
  const { t } = useTranslation('overview');
  const theme = useTheme();
  const brand = theme.palette.brand?.green || '#009624';
  const errorRed = theme.palette.error.main;
  const warnOrange = theme.palette.warning?.main || '#ea580c';

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [detailDialog, setDetailDialog] = useState(null);

  const fetchReconciliation = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/admin/reconciliation/latest');
      setData(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error('Error fetching reconciliation:', e);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    try {
      await apiFetch('/admin/reconciliation/run', { method: 'POST' });
      await fetchReconciliation();
    } catch (e) {
      console.error('Error triggering reconciliation:', e);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => { fetchReconciliation(); }, []);

  const metrics = (row) => {
    const overdueCount = row.stripe_past_due || 0;
    const overdueAmt = Number(row.past_due_amount || 0);
    const unpaidCount = row.pendiente_count || 0;
    const unpaidAmt = Number(row.pendiente_amount || 0);
    const missing = parseMaybeJson(row.missing_invoices);
    const stuckPending = parseMaybeJson(row.stripe_paid_db_pending);
    const closedPending = parseMaybeJson(row.stripe_closed_db_pending);
    const deviationCount = missing.length + stuckPending.length + closedPending.length;
    return { overdueCount, overdueAmt, unpaidCount, unpaidAmt, deviationCount, missing, stuckPending, closedPending };
  };

  const getStatus = (row, m) => {
    if (m.missing.length > 0 || m.stuckPending.length > 0) return 'error';
    if (m.overdueCount > 0 || m.unpaidCount > 0) return 'warning';
    return 'success';
  };

  const statusColor = (status) => {
    if (status === 'error') return errorRed;
    if (status === 'warning') return warnOrange;
    return brand;
  };

  const statusLabel = (status) => {
    if (status === 'error') return t('reconciliation.alert');
    if (status === 'warning') return t('reconciliation.warning');
    return t('reconciliation.ok');
  };

  const openDetail = (account, type, title) => {
    const row = data.find((r) => r.account === account);
    if (!row) return;
    let rows = [];
    if (type === 'overdue')       rows = parseMaybeJson(row.past_due_subs);
    else if (type === 'unpaid')   rows = parseMaybeJson(row.pending_invoices);
    else if (type === 'deviation') {
      const missing = parseMaybeJson(row.missing_invoices).map((m) => ({ ...m, _kind: 'missing' }));
      const stuck   = parseMaybeJson(row.stripe_paid_db_pending).map((m) => ({ ...m, _kind: 'stuck' }));
      const closed  = parseMaybeJson(row.stripe_closed_db_pending).map((m) => ({ ...m, _kind: 'closed' }));
      rows = [...missing, ...stuck, ...closed];
    }
    setDetailDialog({ account, type, title, rows });
  };

  const Metric = ({ label, value, color, sub, onClick }) => (
    <Box onClick={onClick} sx={{ textAlign: 'center', px: 1, py: 1.5, cursor: onClick ? 'pointer' : 'default', borderRadius: 1, transition: 'background 0.15s', '&:hover': onClick ? { bgcolor: 'action.hover' } : {} }}>
      <Typography sx={{ color: color || 'text.secondary', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.05em', display: 'block' }}>{label}</Typography>
      <Typography sx={{ fontWeight: 700, color: color || 'text.primary', mt: 0.25, fontSize: '1.25rem' }}>{value}</Typography>
      {sub && <Typography sx={{ color: color || 'text.secondary', fontSize: '0.65rem' }}>{sub}</Typography>}
    </Box>
  );

  const runDate = data.length > 0 ? data[0].run_date : null;
  const type = detailDialog?.type;
  const accent = brand;

  const dialogLabel = type === 'overdue' ? 'Stripe past_due'
    : type === 'unpaid' ? 'DB facturas Pendiente (subscriptions)'
    : type === 'deviation' ? 'Stripe ↔ DB mismatches'
    : '';

  return (
    <>
      <Paper elevation={0} sx={{ borderRadius: `${tokens.radius.lg}px`, p: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.015em' }}>Invoice Reconciliation</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            {runDate && <Typography variant="caption" color="text.secondary">{t('reconciliation.lastRun')}: {new Date(runDate).toLocaleDateString()}</Typography>}
            <Button size="small" variant="outlined" onClick={handleRun} disabled={running} sx={{ textTransform: 'none', fontWeight: 600, minWidth: 90 }}>
              {running ? <CircularProgress size={14} sx={{ mr: 1 }} /> : null}{running ? 'Running...' : 'Run now'}
            </Button>
          </Stack>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={24} /></Box>
        ) : data.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>{t('reconciliation.noData')}</Typography>
        ) : (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
            {data.map((row) => {
              const m = metrics(row);
              const status = getStatus(row, m);
              const color = statusColor(status);
              const fullName = row.account === 'GT' ? 'GLOBALTECHNO OÜ' : row.account === 'PT' ? 'BeWorking Partners' : null;
              const pastDueSubs = parseMaybeJson(row.past_due_subs);
              const pendingInv = parseMaybeJson(row.pending_invoices);
              return (
                <Box key={row.account} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1.5, bgcolor: alpha(color, 0.04), borderBottom: '1px solid', borderBottomColor: 'divider' }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{row.account}</Typography>
                      {fullName && <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>· {fullName}</Typography>}
                    </Stack>
                    <Chip label={statusLabel(status)} size="small" sx={{ fontWeight: 600, fontSize: '0.65rem', height: 22, bgcolor: alpha(color, 0.1), color }} />
                  </Stack>

                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, py: 1 }}>
                    <Metric label="Overdue"
                      value={m.overdueCount}
                      color={m.overdueCount > 0 ? errorRed : undefined}
                      sub={m.overdueAmt > 0 ? `€${m.overdueAmt.toFixed(0)}` : undefined}
                      onClick={m.overdueCount > 0 ? () => openDetail(row.account, 'overdue', `${row.account} — Overdue`) : undefined} />
                    <Metric label="Unpaid"
                      value={m.unpaidCount}
                      color={m.unpaidCount > 0 ? errorRed : undefined}
                      sub={m.unpaidAmt > 0 ? `€${m.unpaidAmt.toFixed(0)}` : undefined}
                      onClick={m.unpaidCount > 0 ? () => openDetail(row.account, 'unpaid', `${row.account} — Unpaid`) : undefined} />
                    <Metric label="Deviation"
                      value={m.deviationCount}
                      color={m.deviationCount > 0 ? errorRed : undefined}
                      onClick={m.deviationCount > 0 ? () => openDetail(row.account, 'deviation', `${row.account} — Deviation`) : undefined} />
                  </Box>

                  {(pastDueSubs.length > 0 || pendingInv.length > 0 || m.deviationCount > 0) && (
                    <Box sx={{ borderTop: '1px solid', borderTopColor: 'divider', px: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {pastDueSubs.length > 0 && (
                        <Box onClick={() => openDetail(row.account, 'overdue', `${row.account} — Overdue`)} sx={{ cursor: 'pointer', borderRadius: 1, '&:hover': { bgcolor: alpha(errorRed, 0.04) }, px: 1, py: 0.5 }}>
                          <Typography sx={{ color: errorRed, fontWeight: 700, fontSize: '0.75rem', mb: 0.5 }}>Overdue — Stripe past_due</Typography>
                          <Box sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.7rem', color: 'text.secondary', bgcolor: 'action.hover', borderRadius: 0.75, px: 1, py: 0.75, lineHeight: 1.7 }}>
                            {pastDueSubs.map((s, i) => (
                              <div key={s.subscriptionId || i}>
                                {s.latestInvoiceId || '—'} · <span style={{ color: 'rgba(0,0,0,0.55)' }}>{s.customerName || '—'}</span> · {s.subscriptionId}
                              </div>
                            ))}
                          </Box>
                        </Box>
                      )}
                      {pendingInv.length > 0 && (
                        <Box onClick={() => openDetail(row.account, 'unpaid', `${row.account} — Unpaid`)} sx={{ cursor: 'pointer', borderRadius: 1, '&:hover': { bgcolor: alpha(errorRed, 0.04) }, px: 1, py: 0.5 }}>
                          <Typography sx={{ color: errorRed, fontWeight: 700, fontSize: '0.75rem', mb: 0.5 }}>Unpaid — DB Pendiente (subs)</Typography>
                          <Box sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.7rem', color: 'text.secondary', bgcolor: 'action.hover', borderRadius: 0.75, px: 1, py: 0.75, lineHeight: 1.7 }}>
                            {pendingInv.map((inv, i) => (
                              <div key={inv.id || i}>
                                {(inv.cuenta || '') + (inv.idfactura || '')} · <span style={{ color: 'rgba(0,0,0,0.55)' }}>{inv.clientName || '—'}</span> · €{Number(inv.total || 0).toFixed(2)}
                                {inv.stripeInvoiceId && <> · <span style={{ color: 'rgba(0,0,0,0.4)' }}>{inv.stripeInvoiceId}</span></>}
                              </div>
                            ))}
                          </Box>
                        </Box>
                      )}
                      {m.deviationCount > 0 && (
                        <Box onClick={() => openDetail(row.account, 'deviation', `${row.account} — Deviation`)} sx={{ cursor: 'pointer', borderRadius: 1, '&:hover': { bgcolor: alpha(errorRed, 0.04) }, px: 1, py: 0.5 }}>
                          <Typography sx={{ color: errorRed, fontWeight: 700, fontSize: '0.75rem', mb: 0.5 }}>Deviation — Stripe vs DB</Typography>
                          <Box sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.7rem', color: 'text.secondary', bgcolor: 'action.hover', borderRadius: 0.75, px: 1, py: 0.75, lineHeight: 1.7, wordBreak: 'break-all' }}>
                            {m.missing.map((inv, i) => (
                              <div key={'m' + i}>{inv.stripeInvoiceId} · <span style={{ color: 'rgba(0,0,0,0.55)' }}>paid in Stripe, missing in DB</span></div>
                            ))}
                            {m.stuckPending.map((inv, i) => (
                              <div key={'s' + i}>{inv.stripeInvoiceId} · <span style={{ color: 'rgba(0,0,0,0.55)' }}>{inv.clientName || '—'} — DB still Pendiente</span></div>
                            ))}
                            {m.closedPending.map((inv, i) => (
                              <div key={'c' + i}>{inv.stripeInvoiceId} · <span style={{ color: 'rgba(0,0,0,0.55)' }}>{inv.clientName || '—'} — Stripe void, DB {(inv.cuenta || '') + (inv.idfactura || '')} still Pendiente</span></div>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>

      <Dialog open={!!detailDialog} onClose={() => setDetailDialog(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: `${tokens.radius.md}px`, overflow: 'hidden' } }}>
        <Box sx={{ bgcolor: alpha(accent, 0.08), borderBottom: '3px solid', borderBottomColor: accent, px: 3, py: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: accent }} />
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: accent }}>{detailDialog?.title}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{dialogLabel}</Typography>
              </Box>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Chip label={`${detailDialog?.rows?.length || 0} ${type === 'overdue' ? 'subs' : 'invoices'}`} size="small" sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.15), color: accent }} />
              <IconButton size="small" aria-label="close" onClick={() => setDetailDialog(null)} sx={{ color: accent }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          {!detailDialog?.rows?.length ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No invoices</Typography>
          ) : type === 'overdue' ? (
            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.04) }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.04) }}>Stripe Invoice</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.04) }}>Sub</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.04) }} align="right">Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.04) }}>WhatsApp</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(detailDialog?.rows || []).map((row, i) => {
                    const phone = row.customerPhone;
                    const wa = phone ? `https://wa.me/${String(phone).replace(/[^0-9]/g, '')}` : null;
                    const invUrl = row.latestInvoiceId ? `https://dashboard.stripe.com/invoices/${row.latestInvoiceId}` : null;
                    return (
                      <TableRow key={row.subscriptionId || i} hover>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {row.customerName || '—'}
                          {row.customerEmail && <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>{row.customerEmail}</Typography>}
                        </TableCell>
                        <TableCell>
                          {invUrl ? <a href={invUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontFamily: 'monospace', fontSize: '0.75rem' }}>{row.latestInvoiceId}</a> : '—'}
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'text.secondary' }}>{row.subscriptionId}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: accent }}>€{Number(row.amountDue || 0).toFixed(2)}</TableCell>
                        <TableCell>
                          {wa ? (
                            <Button size="small" component="a" href={wa} target="_blank" rel="noopener noreferrer"
                              sx={{ textTransform: 'none', bgcolor: '#25D366', color: '#fff', fontSize: '0.75rem', fontWeight: 600, borderRadius: 999, px: 1.5, py: 0.25, minWidth: 0, '&:hover': { bgcolor: '#1ebe5a' } }}>
                              WhatsApp
                            </Button>
                          ) : <Typography variant="caption" color="text.secondary">—</Typography>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : type === 'unpaid' ? (
            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.04) }}>Nº</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.04) }}>Cliente</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.04) }}>Stripe Invoice</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.04) }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.04) }}>Fecha</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.04) }} align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(detailDialog?.rows || []).map((inv, i) => {
                    const dateStr = inv.fechaFactura;
                    const dateFormatted = dateStr ? new Date(dateStr).toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US') : '—';
                    const stripeId = inv.stripeInvoiceId;
                    return (
                      <TableRow key={inv.id || i} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{inv.idfactura ? `${inv.cuenta || 'PT'}${inv.idfactura}` : '—'}</TableCell>
                        <TableCell>{inv.clientName || '—'}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {stripeId
                            ? <a href={`https://dashboard.stripe.com/invoices/${stripeId}`} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'none' }}>{stripeId}</a>
                            : <span style={{ color: 'rgba(0,0,0,0.4)' }}>—</span>}
                        </TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{inv.estado || '—'}</TableCell>
                        <TableCell sx={{ color: 'text.secondary' }}>{dateFormatted}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: accent }}>€{Number(inv.total || 0).toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.04) }}>Stripe Invoice</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.04) }}>Mismatch</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.04) }}>Cliente</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.04) }} align="right">Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(detailDialog?.rows || []).map((inv, i) => {
                    const invId = inv.stripeInvoiceId;
                    const mismatch = inv._kind === 'missing' ? 'Paid in Stripe, missing in DB'
                      : inv._kind === 'closed' ? 'Stripe void, DB still Pendiente'
                      : 'Paid in Stripe, DB still Pendiente';
                    return (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{invId}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                          {mismatch}
                        </TableCell>
                        <TableCell>{inv.clientName || '—'}</TableCell>
                        <TableCell align="right">
                          <Button size="small" variant="outlined" component="a" href={`https://dashboard.stripe.com/invoices/${invId}`} target="_blank" rel="noopener" sx={{ textTransform: 'none', borderColor: accent, color: accent }}>
                            Abrir en Stripe
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceReconciliationCard;
