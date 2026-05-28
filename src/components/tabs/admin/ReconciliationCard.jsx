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
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
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

const ReconciliationCard = () => {
  const { t } = useTranslation('overview');
  const theme = useTheme();
  const brand = theme.palette.brand?.green || '#009624';
  const errorRed = theme.palette.error.main;
  const warnOrange = theme.palette.warning?.main || '#ea580c';

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [detailDialog, setDetailDialog] = useState(null);
  const [breakdownCache, setBreakdownCache] = useState({});
  const [bdLoading, setBdLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

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

  const fetchBreakdown = async (account) => {
    if (breakdownCache[account]) return breakdownCache[account];
    setBdLoading(true);
    try {
      const result = await apiFetch(`/admin/reconciliation/breakdown/${account}`);
      setBreakdownCache((prev) => ({ ...prev, [account]: result }));
      return result;
    } catch (e) {
      console.error('Failed to fetch breakdown', e);
      setErrorMsg(t('reconciliation.loadError', { defaultValue: e?.message || 'Failed to load breakdown' }));
      return null;
    } finally {
      setBdLoading(false);
    }
  };

  const openDetail = async (account, type, title) => {
    if (type === 'stripeDeviation') {
      // Snapshot is the single source for Deviation — enriched db_only_subs.
      const row = data.find((r) => r.account === account);
      const rows = parseMaybeJson(row?.db_only_subs);
      setDetailDialog({ account, type, title, rows });
      return;
    }
    const bd = await fetchBreakdown(account);
    if (!bd) return;
    const rows = type === 'stripeActive' ? bd.stripeActive
      : type === 'stripeScheduled' ? bd.stripeScheduled
      : type === 'bankTransfer' ? bd.bankTransfer
      : type === 'dbActive' ? [...(bd.stripeActive || []), ...(bd.stripeScheduled || []), ...(bd.bankTransfer || [])]
      : [];
    setDetailDialog({ account, type, title, rows: Array.isArray(rows) ? rows : [] });
  };

  const metrics = (row) => {
    const overdue = row.stripe_past_due || 0;
    const stripe = (row.stripe_active || 0) + overdue;
    const scheduled = row.db_scheduled || 0;
    const bank = row.db_bank_transfer != null ? row.db_bank_transfer : 0;
    const dbActive = row.db_active || 0;
    const deviation = Math.max(0, dbActive - stripe - scheduled - bank);
    return { db: dbActive, stripe, scheduled, bank, deviation };
  };

  const getStatus = (row) => {
    if ((row.missing_invoice_count || 0) > 0) return 'error';
    const dbOnly = parseMaybeJson(row.db_only_subs);
    const stripeOnly = parseMaybeJson(row.stripe_only_subs);
    const m = metrics(row);
    return (m.deviation > 0 || dbOnly.length > 0 || stripeOnly.length > 0) ? 'warning' : 'success';
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

  const dialogLabel = type === 'stripeDeviation' ? 'DB active, Stripe cancelled'
    : type === 'stripeScheduled' ? 'Future-starting subs (sub_sched_*)'
    : type === 'bankTransfer' ? 'Bank-transfer subs'
    : type === 'dbActive' ? 'All active DB subs'
    : 'Live in Stripe';

  return (
    <>
      <Paper elevation={0} sx={{ borderRadius: `${tokens.radius.lg}px`, p: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.015em' }}>Subscription Reconciliation</Typography>
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
              const status = getStatus(row);
              const color = statusColor(status);
              const m = metrics(row);
              const dbOnlySubs = parseMaybeJson(row.db_only_subs);
              const stripeOnlyIds = parseMaybeJson(row.stripe_only_subs);
              const fullName = row.account === 'GT' ? 'GLOBALTECHNO OÜ' : row.account === 'PT' ? 'BeWorking Partners' : null;
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

                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0, py: 1 }}>
                    <Metric label="DB"        value={m.db}        onClick={() => openDetail(row.account, 'dbActive', `${row.account} — DB Active`)} />
                    <Metric label="Stripe"    value={m.stripe}    onClick={() => openDetail(row.account, 'stripeActive', `${row.account} — Stripe`)} />
                    <Metric label="Bank"      value={m.bank}      onClick={() => openDetail(row.account, 'bankTransfer', `${row.account} — Bank`)} />
                    <Metric label="Scheduled" value={m.scheduled} onClick={() => openDetail(row.account, 'stripeScheduled', `${row.account} — Scheduled`)} />
                    <Metric label="Deviation" value={m.deviation} color={m.deviation > 0 ? errorRed : undefined} onClick={() => openDetail(row.account, 'stripeDeviation', `${row.account} — Deviation`)} />
                  </Box>

                  {(dbOnlySubs.length > 0 || stripeOnlyIds.length > 0) && (
                    <Box sx={{ borderTop: '1px solid', borderTopColor: 'divider', px: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {dbOnlySubs.length > 0 && (
                        <Box onClick={() => openDetail(row.account, 'stripeDeviation', `${row.account} — Deviation`)} sx={{ cursor: 'pointer', borderRadius: 1, transition: 'background 0.15s', '&:hover': { bgcolor: alpha(warnOrange, 0.04) }, px: 1, py: 0.5 }}>
                          <Typography sx={{ color: warnOrange, fontWeight: 700, fontSize: '0.75rem', mb: 0.25 }}>Deviation — DB active, Stripe cancelled</Typography>
                          <Box sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.7rem', color: 'text.secondary', bgcolor: 'action.hover', borderRadius: 0.75, px: 1, py: 0.75, lineHeight: 1.7, wordBreak: 'break-all' }}>
                            {dbOnlySubs.map((s, i) => {
                              const subId = typeof s === 'string' ? s : (s.subscriptionId || '');
                              const name = typeof s === 'object' ? s.customerName : null;
                              return <div key={subId || i}>{subId}{name ? ` · ${name}` : ''}</div>;
                            })}
                          </Box>
                        </Box>
                      )}
                      {stripeOnlyIds.length > 0 && (
                        <Box sx={{ px: 1, py: 0.5 }}>
                          <Typography sx={{ color: warnOrange, fontWeight: 700, fontSize: '0.75rem', mb: 0.25 }}>Stripe-only subs</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>Active in Stripe, no record in DB.</Typography>
                          <Box sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '0.7rem', color: 'text.secondary', bgcolor: 'action.hover', borderRadius: 0.75, px: 1, py: 0.75, lineHeight: 1.7, wordBreak: 'break-all' }}>
                            {stripeOnlyIds.map((id) => <div key={id}>{typeof id === 'string' ? id : id.subscriptionId}</div>)}
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
        {!loading && data.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, fontStyle: 'italic' }}>
            * Deviation = DB active subs not present (or cancelled) in Stripe.
          </Typography>
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
              <Chip label={`${detailDialog?.rows?.length || 0} subs`} size="small" sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.15), color: accent }} />
              <IconButton size="small" aria-label="close" onClick={() => setDetailDialog(null)} sx={{ color: accent }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Stack>
        </Box>
        <DialogContent sx={{ p: 0 }}>
          {bdLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress sx={{ color: accent }} /></Box>
          ) : !detailDialog?.rows?.length ? (
            <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No subscriptions</Typography>
          ) : (
            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.04) }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.04) }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.04) }} align="right">Monthly</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.04) }}>Stripe Sub ID</TableCell>
                    {type === 'stripeDeviation' && <TableCell sx={{ fontWeight: 700, bgcolor: alpha(accent, 0.04) }}>Cancelled</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(detailDialog?.rows || []).map((row, i) => {
                    const name = row.name || row.customerName || '—';
                    const email = row.email_primary || row.customerEmail || '—';
                    const amount = Number(row.monthly_amount ?? row.monthlyAmount ?? row.amount ?? 0);
                    const subId = row.subscriptionId || row.stripe_subscription_id || '—';
                    const cancelledRaw = row.cancelledAt || row.cancelled_at;
                    const cancelled = cancelledRaw ? new Date(cancelledRaw).toLocaleDateString() : '—';
                    return (
                      <TableRow key={subId + i} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{name}</TableCell>
                        <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{email}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>€{amount.toFixed(2)}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'text.secondary' }}>{subId}</TableCell>
                        {type === 'stripeDeviation' && <TableCell sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>{cancelled}</TableCell>}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar open={!!errorMsg} autoHideDuration={5000} onClose={() => setErrorMsg(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="error" variant="filled" onClose={() => setErrorMsg(null)} sx={{ width: '100%' }}>{errorMsg}</Alert>
      </Snackbar>
    </>
  );
};

export default ReconciliationCard;
