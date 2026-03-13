import { alpha, useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n.js';
import esOverview from '../../i18n/locales/es/overview.json';
import enOverview from '../../i18n/locales/en/overview.json';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingFlatRoundedIcon from '@mui/icons-material/TrendingFlatRounded';
import { useEffect, useState, useMemo } from 'react';
import { fetchInvoices } from '../../api/invoices.js';
import { fetchBloqueos, fetchBookingProductos, fetchBookingStats, cancelBloqueo } from '../../api/bookings.js';
import { listMailboxDocuments } from '../../api/mailbox.js';
import { apiFetch } from '../../api/client.js';
import { fetchSubscriptions } from '../../api/subscriptions.js';

if (!i18n.hasResourceBundle('es', 'overview')) {
  i18n.addResourceBundle('es', 'overview', esOverview);
  i18n.addResourceBundle('en', 'overview', enOverview);
}

// Color palette for data visualization
const dataColors = {
  income: '#009624',      // Brand green - money coming in
  pending: '#dc2626',     // Red - pending payment
  overdue: '#dc2626',     // Red - attention needed
  neutral: '#6b7280',     // Gray - neutral info
};

// Helper to format currency
const formatCurrency = (value) => {
  if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `€${(value / 1000).toFixed(1)}k`;
  return `€${Math.round(value)}`;
};

// Helper to calculate percentage change
const calcChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

// Clean Stat Card - minimal design with optional MTD/YTD
const StatCard = ({ label, value, sublabel, mtd, ytd, mtdLabel, ytdLabel, loading, theme }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: 3,
      p: 3,
      border: '1px solid',
      borderColor: 'divider',
      transition: 'border-color 0.2s',
      '&:hover': { borderColor: 'primary.main' }
    }}
  >
    {loading ? (
      <CircularProgress size={24} sx={{ color: 'primary.main' }} />
    ) : (
      <>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
        {sublabel && (
          <Typography variant="caption" color="text.disabled">
            {sublabel}
          </Typography>
        )}
        {(mtd !== undefined || ytd !== undefined) && (
          <Stack direction="row" spacing={1.5} sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            {mtd !== undefined && (
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                {mtdLabel || 'MTD'} {mtd}
              </Typography>
            )}
            {ytd !== undefined && (
              <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
                {ytdLabel || 'YTD'} {ytd}
              </Typography>
            )}
          </Stack>
        )}
      </>
    )}
  </Paper>
);

// Metric Card with color coding
const MetricCard = ({ label, value, change, trend, color, loading, theme }) => {
  const TrendIcon = trend === 'up' ? TrendingUpRoundedIcon :
                    trend === 'down' ? TrendingDownRoundedIcon :
                    TrendingFlatRoundedIcon;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: `4px solid ${color}`,
        transition: 'all 0.2s',
        '&:hover': { boxShadow: `0 4px 12px ${alpha(color, 0.15)}` }
      }}
    >
      {loading ? (
        <CircularProgress size={24} sx={{ color }} />
      ) : (
        <>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            {change && (
              <Stack direction="row" alignItems="center" spacing={0.25}>
                <TrendIcon sx={{ fontSize: 14, color }} />
                <Typography variant="caption" sx={{ fontWeight: 600, color }}>
                  {change}
                </Typography>
              </Stack>
            )}
          </Stack>
          <Typography variant="h4" sx={{ fontWeight: 700, color }}>
            {formatCurrency(value)}
          </Typography>
        </>
      )}
    </Paper>
  );
};

// Monthly Bar Chart
const BarChart = ({ data, loading, title, total, color, theme, selectedYear }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <CircularProgress sx={{ color }} />
      </Box>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
        <Typography variant="body2" color="text.secondary">{i18n.t('overview:charts.noData')}</Typography>
      </Box>
    );
  }

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const activeCount = selectedYear === currentYear ? currentMonth + 1 : data.length;
  const chartHeight = 160;
  const maxValue = Math.max(...data.slice(0, activeCount).map(d => d.value || 0), 100);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          {title}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, color }}>
          {formatCurrency(total)}
        </Typography>
      </Stack>

      <Box sx={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: chartHeight }}>
        {data.map((item, idx) => {
          const isActive = idx < activeCount;
          const barHeight = isActive && maxValue > 0
            ? Math.max(2, (item.value / maxValue) * (chartHeight - 20))
            : 2;
          const isHovered = hoveredIdx === idx;

          return (
            <Box
              key={idx}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
                position: 'relative',
                cursor: isActive ? 'pointer' : 'default',
              }}
              onMouseEnter={() => isActive && setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Value label on hover */}
              {isHovered && isActive && item.value > 0 && (
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color,
                    fontSize: '0.65rem',
                    mb: 0.5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatCurrency(item.value)}
                </Typography>
              )}
              {/* Bar */}
              <Box
                sx={{
                  width: '100%',
                  maxWidth: 48,
                  height: barHeight,
                  bgcolor: isActive ? color : theme.palette.divider,
                  opacity: isActive ? (isHovered ? 1 : 0.75) : 0.25,
                  borderRadius: '4px 4px 0 0',
                  transition: 'opacity 0.15s, height 0.3s',
                }}
              />
            </Box>
          );
        })}
      </Box>

      {/* Month labels */}
      <Box sx={{ display: 'flex', gap: '4px', mt: 0.75 }}>
        {data.map((item, idx) => (
          <Typography
            key={idx}
            variant="caption"
            sx={{
              flex: 1,
              textAlign: 'center',
              color: hoveredIdx === idx ? 'text.primary' : 'text.disabled',
              fontSize: '0.7rem',
              fontWeight: hoveredIdx === idx ? 600 : 400,
            }}
          >
            {item.month}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};

// Occupancy Bar
const OccupancyBar = ({ name, occupancy, bookedHours, totalHours, theme }) => {
  const color = occupancy >= 70 ? dataColors.income :
                occupancy >= 40 ? dataColors.pending :
                dataColors.neutral;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>{name}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, color }}>
          {occupancy}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={occupancy}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: alpha(color, 0.12),
          '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: color }
        }}
      />
      {bookedHours !== undefined && (
        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.25, display: 'block' }}>
          {i18n.t('overview:occupancy.bookedOf', { booked: bookedHours, total: totalHours })}
        </Typography>
      )}
    </Box>
  );
};

/* ═══════════════════════════════════════════
   Status chip helper for user tables
   ═══════════════════════════════════════════ */
const isFreeBooking = (b) => {
  const tarifa = b.tarifa;
  const nota = (b.nota || '').toLowerCase();
  return (tarifa == null || tarifa === 0) && !nota.includes('stripe');
};

const statusChipColor = (estado) => {
  const s = (estado || '').toLowerCase();
  if (s.includes('pag') || s.includes('paid')) return 'success';
  if (s.includes('venc') || s.includes('overdue')) return 'error';
  if (s.includes('pend') || s.includes('invoice') || s.includes('fact')) return 'warning';
  return 'default';
};

/* ═══════════════════════════════════════════
   USER OVERVIEW
   ═══════════════════════════════════════════ */
const UserOverview = ({ userProfile, setActiveTab }) => {
  const theme = useTheme();
  const { t } = useTranslation('overview');

  const [bookings, setBookings] = useState([]);
  const [bookingStats, setBookingStats] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [mailDocuments, setMailDocuments] = useState([]);
  const [tenantType, setTenantType] = useState('');
  const [loading, setLoading] = useState({ bookings: true, stats: true, invoices: true, mail: true });
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  useEffect(() => {
    if (!userProfile?.email) return;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const futureStr = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()).toISOString().split('T')[0];

    // 1. Fetch upcoming bookings
    fetchBloqueos({ from: todayStr, to: futureStr })
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        list.sort((a, b) => new Date(a.fechaIni) - new Date(b.fechaIni));
        setBookings(list);
      })
      .catch(err => console.error('Error fetching bookings:', err))
      .finally(() => setLoading(prev => ({ ...prev, bookings: false })));

    // 2. Fetch booking stats
    if (userProfile.tenantId) {
      fetchBookingStats(userProfile.tenantId)
        .then(data => setBookingStats(data))
        .catch(err => console.error('Error fetching booking stats:', err))
        .finally(() => setLoading(prev => ({ ...prev, stats: false })));

      // Fetch contact profile to get tenantType
      apiFetch(`/contact-profiles/${userProfile.tenantId}`)
        .then(data => setTenantType((data?.tenantType || '').toLowerCase()))
        .catch(() => {});
    } else {
      setLoading(prev => ({ ...prev, stats: false }));
    }

    // 3. Fetch invoices filtered by user email
    fetchInvoices({ page: 0, size: 10000, email: userProfile.email })
      .then(response => { if (response?.content) setInvoices(response.content); })
      .catch(err => console.error('Error fetching invoices:', err))
      .finally(() => setLoading(prev => ({ ...prev, invoices: false })));

    // 4. Fetch mailbox documents
    listMailboxDocuments({ contactEmail: userProfile.email })
      .then(data => {
        let list;
        if (Array.isArray(data)) list = data;
        else if (Array.isArray(data?.items)) list = data.items;
        else if (Array.isArray(data?.content)) list = data.content;
        else list = [];
        setMailDocuments(list);
      })
      .catch(() => setMailDocuments([]))
      .finally(() => setLoading(prev => ({ ...prev, mail: false })));
  }, [userProfile?.email, userProfile?.tenantId]);

  const reloadBookings = () => {
    if (!userProfile?.email) return;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const futureStr = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()).toISOString().split('T')[0];
    fetchBloqueos({ from: todayStr, to: futureStr })
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        list.sort((a, b) => new Date(a.fechaIni) - new Date(b.fechaIni));
        setBookings(list);
      })
      .catch(() => {});
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError('');
    try {
      await cancelBloqueo(cancelTarget.id);
      setCancelTarget(null);
      reloadBookings();
    } catch {
      setCancelError(t('user.upcomingBookings.cancelError'));
    } finally {
      setCancelling(false);
    }
  };

  const isVirtualUser = tenantType.includes('virtual');

  const upcomingCount = useMemo(() => {
    const now = new Date();
    const in30 = new Date(now);
    in30.setDate(in30.getDate() + 30);
    return bookings.filter(b => {
      const d = new Date(b.fechaIni);
      return d >= now && d <= in30;
    }).length;
  }, [bookings]);

  const pendingMailCount = useMemo(() =>
    mailDocuments.filter(d => d.status === 'scanned' || d.status === 'notified').length,
    [mailDocuments]
  );

  const invoiceMetrics = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    let pendingCount = 0, pendingTotal = 0, spentMonth = 0, spentYTD = 0, overdueCount = 0, overdueTotal = 0;

    invoices.forEach(inv => {
      const amount = parseFloat(inv.total || 0);
      const status = (inv.estado || '').toLowerCase();
      const d = new Date(inv.createdAt || inv.fechaFactura);
      const isPaid = status.includes('pag') || status.includes('paid');
      const isOverdue = status.includes('venc') || status.includes('overdue');
      const isPending = status.includes('pend') || status.includes('confir') || status.includes('fact') || status.includes('invoice');

      if (isPending) { pendingCount++; pendingTotal += amount; }
      if (isOverdue) { overdueCount++; overdueTotal += amount; }
      if (isPaid && !isNaN(d.getTime()) && d.getFullYear() === curYear) {
        spentYTD += amount;
        if (d.getMonth() === curMonth) spentMonth += amount;
      }
    });
    return { pendingCount, pendingTotal, spentMonth, spentYTD, overdueCount, overdueTotal };
  }, [invoices]);

  // Recent invoices (last 5, sorted desc)
  const recentInvoices = useMemo(() =>
    [...invoices].sort((a, b) => new Date(b.createdAt || b.fechaFactura) - new Date(a.createdAt || a.fechaFactura)).slice(0, 5),
    [invoices]
  );

  // Recent mail (last 5, sorted desc)
  const recentMail = useMemo(() =>
    [...mailDocuments].sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)).slice(0, 5),
    [mailDocuments]
  );

  const locale = i18n.language === 'es' ? 'es-ES' : 'en-US';

  return (
    <Stack spacing={3} sx={{ width: '100%', px: { xs: 2, md: 3 }, pb: 4 }}>
      {/* Row 1: Quick Stats */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
        <StatCard label={t('user.stats.upcomingBookings')} value={upcomingCount} sublabel={t('user.stats.next30days')} loading={loading.bookings} theme={theme} />
        <StatCard label={t('user.stats.bookingsThisMonth')} value={bookingStats?.totalBookingsMonth ?? 0} sublabel={t('user.stats.thisMonth')} loading={loading.stats} theme={theme} />
        {isVirtualUser ? (
          <StatCard label={t('user.stats.freeBookingsLeft')} value={bookingStats?.freeBookingsLeft ?? 0} sublabel={t('user.stats.remaining', { limit: bookingStats?.freeBookingsLimit ?? 5 })} loading={loading.stats} theme={theme} />
        ) : (
          <StatCard label={t('user.stats.bookingsYTD')} value={bookingStats?.totalBookingsYTD ?? 0} sublabel={t('user.stats.yearToDate')} loading={loading.stats} theme={theme} />
        )}
        <StatCard label={t('user.stats.pendingMail')} value={pendingMailCount} sublabel={t('user.stats.documentsWaiting')} loading={loading.mail} theme={theme} />
      </Box>

      {/* Row 2: Financial Summary */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' } }}>
        <MetricCard
          label={t('user.financial.pendingInvoices')}
          value={invoiceMetrics.pendingTotal}
          change={invoiceMetrics.pendingCount > 0 ? t('user.financial.pendingCount', { count: invoiceMetrics.pendingCount }) : null}
          trend="flat"
          color={dataColors.pending}
          loading={loading.invoices}
          theme={theme}
        />
        <MetricCard
          label={t('user.financial.spentThisMonth')}
          value={invoiceMetrics.spentMonth}
          change={null}
          trend="flat"
          color={dataColors.income}
          loading={loading.invoices}
          theme={theme}
        />
        <MetricCard
          label={t('user.financial.spentYTD')}
          value={invoiceMetrics.spentYTD}
          change={null}
          trend="flat"
          color={dataColors.income}
          loading={loading.invoices}
          theme={theme}
        />
        <MetricCard
          label={t('user.financial.overdue')}
          value={invoiceMetrics.overdueTotal}
          change={invoiceMetrics.overdueCount > 0 ? t('user.financial.overdueCount', { count: invoiceMetrics.overdueCount }) : null}
          trend={invoiceMetrics.overdueCount > 0 ? 'up' : 'flat'}
          color={dataColors.overdue}
          loading={loading.invoices}
          theme={theme}
        />
      </Box>

      {/* Row 3: Upcoming Bookings */}
      <Paper elevation={0} sx={{ borderRadius: 3, p: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('user.upcomingBookings.title')}</Typography>
          {setActiveTab && (
            <Button size="small" onClick={() => setActiveTab('Booking')} sx={{ textTransform: 'none', fontWeight: 600 }}>
              {t('user.upcomingBookings.viewAll')} →
            </Button>
          )}
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('user.upcomingBookings.date')}</TableCell>
                <TableCell>{t('user.upcomingBookings.time')}</TableCell>
                <TableCell>{t('user.upcomingBookings.room')}</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('user.upcomingBookings.center')}</TableCell>
                <TableCell>{t('user.upcomingBookings.status')}</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading.bookings ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
              ) : bookings.slice(0, 5).length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">{t('user.upcomingBookings.noBookings')}</Typography>
                </TableCell></TableRow>
              ) : bookings.slice(0, 5).map(b => {
                const start = new Date(b.fechaIni);
                const end = new Date(b.fechaFin);
                return (
                  <TableRow key={b.id} hover>
                    <TableCell>{start.toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</TableCell>
                    <TableCell>{start.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</TableCell>
                    <TableCell>{b.producto?.nombre || '-'}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{b.centro?.nombre || '-'}</TableCell>
                    <TableCell>
                      {isFreeBooking(b)
                        ? <Chip label={t('user.upcomingBookings.free')} size="small" sx={{ color: 'text.primary', borderColor: 'divider' }} variant="outlined" />
                        : <Chip label={b.estado || '-'} size="small" color={statusChipColor(b.estado)} variant="outlined" />
                      }
                    </TableCell>
                    <TableCell align="right">
                      {isFreeBooking(b) && (
                        <Button
                          size="small"
                          color="error"
                          startIcon={<CancelOutlinedIcon />}
                          onClick={() => setCancelTarget(b)}
                          sx={{ textTransform: 'none', fontWeight: 500, whiteSpace: 'nowrap' }}
                        >
                          {t('user.upcomingBookings.cancel')}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Cancel booking confirm dialog */}
      <Dialog open={Boolean(cancelTarget)} onClose={() => !cancelling && setCancelTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('user.upcomingBookings.confirmTitle')}</DialogTitle>
        <DialogContent>
          {cancelError && <Alert severity="error" sx={{ mb: 2 }}>{cancelError}</Alert>}
          <DialogContentText>
            {t('user.upcomingBookings.confirmBody', {
              space: cancelTarget?.producto?.nombre || '',
              date: cancelTarget ? new Date(cancelTarget.fechaIni).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) : ''
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCancelTarget(null)} disabled={cancelling}>
            {t('user.upcomingBookings.back')}
          </Button>
          <Button variant="contained" color="error" onClick={handleConfirmCancel} disabled={cancelling}>
            {cancelling ? <CircularProgress size={16} color="inherit" /> : t('user.upcomingBookings.confirmCancel')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Row 4: Recent Invoices */}
      <Paper elevation={0} sx={{ borderRadius: 3, p: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('user.recentInvoices.title')}</Typography>
          {setActiveTab && (
            <Button size="small" onClick={() => setActiveTab('Invoices')} sx={{ textTransform: 'none', fontWeight: 600 }}>
              {t('user.recentInvoices.viewAll')} →
            </Button>
          )}
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('user.recentInvoices.number')}</TableCell>
                <TableCell>{t('user.recentInvoices.date')}</TableCell>
                <TableCell align="right">{t('user.recentInvoices.amount')}</TableCell>
                <TableCell>{t('user.recentInvoices.status')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading.invoices ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
              ) : recentInvoices.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">{t('user.recentInvoices.noInvoices')}</Typography>
                </TableCell></TableRow>
              ) : recentInvoices.map(inv => (
                <TableRow key={inv.id} hover>
                  <TableCell>#{inv.idFactura || inv.id}</TableCell>
                  <TableCell>{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>€{parseFloat(inv.total || 0).toFixed(2)}</TableCell>
                  <TableCell><Chip label={inv.estado || '-'} size="small" color={statusChipColor(inv.estado)} variant="outlined" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Row 5: Mailbox Preview (conditional) */}
      {recentMail.length > 0 && (
        <Paper elevation={0} sx={{ borderRadius: 3, p: 3, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('user.mailbox.title')}</Typography>
            {setActiveTab && (
              <Button size="small" onClick={() => setActiveTab('Business Address')} sx={{ textTransform: 'none', fontWeight: 600 }}>
                {t('user.mailbox.viewAll')} →
              </Button>
            )}
          </Stack>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('user.mailbox.document')}</TableCell>
                  <TableCell>{t('user.mailbox.type')}</TableCell>
                  <TableCell>{t('user.mailbox.received')}</TableCell>
                  <TableCell>{t('user.mailbox.status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentMail.map(doc => (
                  <TableRow key={doc.id} hover>
                    <TableCell>{doc.title || doc.originalFileName || '-'}</TableCell>
                    <TableCell><Chip label={doc.type || 'mail'} size="small" variant="outlined" /></TableCell>
                    <TableCell>{new Date(doc.receivedAt).toLocaleDateString(locale, { day: 'numeric', month: 'short' })}</TableCell>
                    <TableCell><Chip label={doc.status || '-'} size="small" color={doc.status === 'picked_up' ? 'success' : doc.status === 'scanned' ? 'warning' : 'default'} variant="outlined" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Stack>
  );
};

/* ═══════════════════════════════════════════
   ADMIN OVERVIEW (existing, unchanged)
   ═══════════════════════════════════════════ */
const AdminOverview = () => {
  const theme = useTheme();
  const { t } = useTranslation('overview');
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Quick stats raw data
  const [subscriptions, setSubscriptions] = useState([]);
  const [todayBloqueos, setTodayBloqueos] = useState([]);
  const [registrationStats, setRegistrationStats] = useState({ today: 0, mtd: 0, ytd: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  // Occupancy
  const [occupancyData, setOccupancyData] = useState([]);
  const [occupancyLoading, setOccupancyLoading] = useState(true);

  // Reconciliation
  const [reconciliationData, setReconciliationData] = useState([]);
  const [reconciliationLoading, setReconciliationLoading] = useState(true);
  const [reconciliationRunning, setReconciliationRunning] = useState(false);

  // Calculate metrics from invoice data
  const metrics = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const lastYear = currentYear - 1;
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    // Same point in last year — for apples-to-apples YTD comparison
    const samePointLastYear = new Date(now);
    samePointLastYear.setFullYear(lastYear);

    let incomeYTD = 0, incomeLastYTD = 0;
    let pendingYTD = 0, pendingLastYTD = 0;
    let incomeMonth = 0, incomeLastMonth = 0;
    let pendingMonth = 0, pendingLastMonth = 0;
    let overdueTotal = 0, overdueCount = 0;

    invoices.forEach(invoice => {
      const rawDate = invoice.createdAt || invoice.fechaFactura;
      if (!rawDate) return;

      const invoiceDate = new Date(rawDate);
      const invoiceYear = invoiceDate.getFullYear();
      const invoiceMonth = invoiceDate.getMonth();
      const amount = parseFloat(invoice.total || invoice.importe || 0);
      const status = (invoice.estado || '').toLowerCase();

      const isCancelled = status.includes('cancel') || status.includes('void') || status.includes('anula');
      const isOverdue = status.includes('venc') || status.includes('overdue');
      const isPending = status.includes('pend') || status.includes('confir') || status.includes('fact') || status.includes('invoice') || status.includes('created');
      // Billed revenue = all non-cancelled invoices
      const isBilled = !isCancelled;

      if (invoiceYear === currentYear) {
        if (isBilled) incomeYTD += amount;
        if (isPending) pendingYTD += amount;
        if (invoiceMonth === currentMonth) {
          if (isBilled) incomeMonth += amount;
          if (isPending) pendingMonth += amount;
        }
      }

      // Compare same period last year (Jan 1 → same day last year), not full last year
      if (invoiceYear === lastYear && invoiceDate <= samePointLastYear) {
        if (isBilled) incomeLastYTD += amount;
        if (isPending) pendingLastYTD += amount;
      }

      if (invoiceYear === lastMonthYear && invoiceMonth === lastMonth) {
        if (isBilled) incomeLastMonth += amount;
        if (isPending) pendingLastMonth += amount;
      }

      if (isOverdue) {
        overdueTotal += amount;
        overdueCount++;
      }
    });

    return {
      incomeYTD, incomeLastYTD, pendingYTD, pendingLastYTD,
      incomeMonth, incomeLastMonth, pendingMonth, pendingLastMonth,
      overdueTotal, overdueCount
    };
  }, [invoices]);

  // Chart data
  const chartData = useMemo(() => {
    const months = Array(12).fill(null).map((_, i) => ({
      month: new Date(selectedYear, i, 1).toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', { month: 'short' }),
      revenue: 0,
      pending: 0,
      overdue: 0
    }));

    invoices.forEach(invoice => {
      const rawDate = invoice.createdAt || invoice.fechaFactura;
      if (!rawDate) return;
      const invoiceDate = new Date(rawDate);
      if (invoiceDate.getFullYear() !== selectedYear) return;

      const month = invoiceDate.getMonth();
      const amount = parseFloat(invoice.total || invoice.importe || 0);
      const status = (invoice.estado || '').toLowerCase();

      const isCancelled = status.includes('cancel') || status.includes('void') || status.includes('anula');
      if (!isCancelled) {
        months[month].revenue += amount;
      }
      if (status.includes('pend') || status.includes('confir') || status.includes('fact') || status.includes('invoice') || status.includes('created')) {
        months[month].pending += amount;
      }
    });

    const revenueMonthly = months.map(m => ({ month: m.month, value: m.revenue }));
    const pendingMonthly = months.map(m => ({ month: m.month, value: m.pending }));
    const revenueTotal = months.reduce((s, m) => s + m.revenue, 0);
    const pendingTotal = months.reduce((s, m) => s + m.pending, 0);

    return {
      revenue: revenueMonthly,
      pending: pendingMonthly,
      overdue: months.map(m => ({ month: m.month, value: m.overdue })),
      revenueTotal,
      pendingTotal,
      overdueTotal: months.reduce((s, m) => s + m.overdue, 0)
    };
  }, [invoices, selectedYear, i18n.language]);

  // Fetch quick stats (raw data for stat card computation)
  const fetchQuickStats = async () => {
    setStatsLoading(true);
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const firstOfYear = `${today.getFullYear()}-01-01`;

      const [todayBookingsData, subsData, regToday, regMTD, regYTD] = await Promise.all([
        fetchBloqueos({ from: todayStr, to: todayStr }),
        fetchSubscriptions(),
        apiFetch(`/contact-profiles?size=1&tenantType=Usuario+Virtual&startDate=${todayStr}&endDate=${todayStr}`),
        apiFetch(`/contact-profiles?size=1&tenantType=Usuario+Virtual&startDate=${firstOfMonth}&endDate=${todayStr}`),
        apiFetch(`/contact-profiles?size=1&tenantType=Usuario+Virtual&startDate=${firstOfYear}&endDate=${todayStr}`)
      ]);

      setTodayBloqueos(Array.isArray(todayBookingsData) ? todayBookingsData : []);
      setSubscriptions(Array.isArray(subsData) ? subsData : []);
      setRegistrationStats({
        today: regToday?.totalElements ?? 0,
        mtd: regMTD?.totalElements ?? 0,
        ytd: regYTD?.totalElements ?? 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Stat cards computed from invoices + subscriptions + today's bookings
  const statCards = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    const parseDate = (raw) => {
      if (!raw) return null;
      const d = new Date(raw);
      return isNaN(d.getTime()) ? null : d;
    };

    const isMeetingRoom = (inv) => {
      const p = (inv.products || inv.descripcion || '').toLowerCase();
      return p.includes('ma1a') || p.includes('aula') || p.includes('sala');
    };

    const isDesk = (inv) => {
      const p = (inv.products || inv.descripcion || '').toLowerCase();
      return p.includes('ma1o') || p.includes('mesa') || p.includes('desk') || p.includes('escritorio');
    };

    let meetingToday = 0, meetingMTD = 0, meetingYTD = 0;
    let deskToday = 0, deskMTD = 0, deskYTD = 0;

    const isRelevantInvoice = (inv) => {
      const amount = parseFloat(inv.total || inv.importe || 0);
      if (amount <= 0) return false;
      const status = (inv.estado || '').toLowerCase();
      if (status.includes('rect') || status.includes('cancel') || status.includes('anula')) return false;
      if (!status.includes('pag') && !status.includes('pend')) return false;
      return true;
    };

    invoices.forEach(inv => {
      if (!isRelevantInvoice(inv)) return;
      const d = parseDate(inv.createdAt || inv.fechaFactura);
      if (!d) return;
      const y = d.getFullYear();
      const m = d.getMonth();
      const ds = d.toISOString().split('T')[0];

      if (isMeetingRoom(inv)) {
        if (y === curYear) { meetingYTD++; if (m === curMonth) { meetingMTD++; if (ds === todayStr) meetingToday++; } }
      }
      if (isDesk(inv)) {
        if (y === curYear) { deskYTD++; if (m === curMonth) { deskMTD++; if (ds === todayStr) deskToday++; } }
      }
    });

    // Subscriptions created
    let subToday = 0, subMTD = 0, subYTD = 0;
    subscriptions.forEach(s => {
      const d = parseDate(s.createdAt || s.startDate);
      if (!d) return;
      const y = d.getFullYear();
      const m = d.getMonth();
      const ds = d.toISOString().split('T')[0];
      if (y === curYear) { subYTD++; if (m === curMonth) { subMTD++; if (ds === todayStr) subToday++; } }
    });

    // Active users: unique clients with booking or active subscription today
    const activeToday = new Set();
    todayBloqueos.forEach(b => { if (b.cliente?.id) activeToday.add(String(b.cliente.id)); });
    subscriptions.filter(s => s.active).forEach(s => { if (s.contactId) activeToday.add(String(s.contactId)); });

    // MTD: unique clients from invoices this month + active subscriptions
    const activeMTD = new Set();
    invoices.forEach(inv => {
      const d = parseDate(inv.createdAt || inv.fechaFactura);
      if (d && d.getFullYear() === curYear && d.getMonth() === curMonth && inv.idCliente) {
        activeMTD.add(String(inv.idCliente));
      }
    });
    subscriptions.filter(s => s.active).forEach(s => { if (s.contactId) activeMTD.add(String(s.contactId)); });

    // YTD: unique clients from invoices this year + all subscriptions
    const activeYTD = new Set();
    invoices.forEach(inv => {
      const d = parseDate(inv.createdAt || inv.fechaFactura);
      if (d && d.getFullYear() === curYear && inv.idCliente) {
        activeYTD.add(String(inv.idCliente));
      }
    });
    subscriptions.forEach(s => { if (s.contactId) activeYTD.add(String(s.contactId)); });

    return {
      meetingToday, meetingMTD, meetingYTD,
      deskToday, deskMTD, deskYTD,
      subToday, subMTD, subYTD,
      activeToday: activeToday.size,
      activeMTD: activeMTD.size,
      activeYTD: activeYTD.size
    };
  }, [invoices, subscriptions, todayBloqueos]);

  // Fetch occupancy
  const fetchOccupancy = async () => {
    setOccupancyLoading(true);
    try {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const [products, bookings] = await Promise.all([
        fetchBookingProductos(),
        fetchBloqueos({ from: firstDay.toISOString().split('T')[0], to: lastDay.toISOString().split('T')[0] })
      ]);

      const productList = Array.isArray(products) ? products : [];
      const bookingList = Array.isArray(bookings) ? bookings : [];

      // Fixed: 30 days × 8h = 240h per month per space
      const totalHours = 30 * 8;

      const getKey = (name) => {
        if (!name) return null;
        if (name.includes('MA1A')) return name.match(/MA1A\d+/)?.[0] || name;
        if (name.toUpperCase().includes('MA1O') || name.toUpperCase().includes('DESK') || name.toLowerCase().includes('mesa')) return 'MA1-DESKS';
        return null;
      };

      // Group by space
      const groups = {};
      productList.forEach(p => {
        const name = p.nombre || p.name || '';
        const key = getKey(name);
        if (!key) return;

        if (!groups[key]) groups[key] = { ids: [], booked: 0 };
        groups[key].ids.push(p.id);
      });

      bookingList.forEach(b => {
        const name = b.producto?.nombre || '';
        const key = getKey(name);

        if (key && groups[key] && b.fechaIni && b.fechaFin) {
          const hours = (new Date(b.fechaFin) - new Date(b.fechaIni)) / 3600000;
          if (hours > 0 && hours <= 24) groups[key].booked += hours;
        }
      });

      const results = Object.entries(groups)
        .map(([name, data]) => ({
          name,
          occupancy: Math.min(100, Math.round((data.booked / (totalHours * data.ids.length)) * 100)) || 0,
          bookedHours: Math.round(data.booked),
          totalHours: totalHours * data.ids.length
        }))
        .filter(r => r.totalHours > 0)
        .sort((a, b) => b.occupancy - a.occupancy)
        .slice(0, 6);

      setOccupancyData(results);
    } catch (error) {
      console.error('Error fetching occupancy:', error);
      setOccupancyData([]);
    } finally {
      setOccupancyLoading(false);
    }
  };

  // Fetch invoices
  const fetchAllInvoices = async () => {
    setLoading(true);
    try {
      const response = await fetchInvoices({ page: 0, size: 10000 });
      if (response?.content) setInvoices(response.content);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReconciliation = async () => {
    setReconciliationLoading(true);
    try {
      const data = await apiFetch('/admin/reconciliation/latest');
      setReconciliationData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching reconciliation:', error);
      setReconciliationData([]);
    } finally {
      setReconciliationLoading(false);
    }
  };

  const handleRunReconciliation = async () => {
    setReconciliationRunning(true);
    try {
      await apiFetch('/admin/reconciliation/run', { method: 'POST' });
      await fetchReconciliation();
    } catch (error) {
      console.error('Error triggering reconciliation:', error);
    } finally {
      setReconciliationRunning(false);
    }
  };

  useEffect(() => {
    fetchAllInvoices();
    fetchQuickStats();
    fetchOccupancy();
    fetchReconciliation();
  }, []);

  const getChange = (current, previous) => {
    const pct = calcChange(current, previous);
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`;
  };

  return (
    <Stack spacing={3} sx={{ width: '100%', px: { xs: 2, md: 3 }, pb: 4 }}>
      {/* Quick Stats Row */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
        <StatCard label={t('stats.businessAddresses')} value={registrationStats.today} sublabel={t('stats.today')} mtd={registrationStats.mtd} ytd={registrationStats.ytd} loading={statsLoading || loading} theme={theme} />
        <StatCard label={t('stats.meetingRooms')} value={statCards.meetingToday} sublabel={t('stats.today')} mtd={statCards.meetingMTD} ytd={statCards.meetingYTD} loading={statsLoading || loading} theme={theme} />
        <StatCard label={t('stats.deskBookings')} value={statCards.deskToday} sublabel={t('stats.today')} mtd={statCards.deskMTD} ytd={statCards.deskYTD} loading={statsLoading || loading} theme={theme} />
        <StatCard label={t('stats.activeUsers')} value={statCards.activeToday} sublabel={t('stats.withBookings')} mtd={statCards.activeMTD} ytd={statCards.activeYTD} mtdLabel={t('stats.mtdAvg')} ytdLabel={t('stats.ytdAvg')} loading={statsLoading || loading} theme={theme} />
      </Box>

      {/* Financial Metrics */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
        <MetricCard
          label={t('metrics.incomeYTD')}
          value={metrics.incomeYTD}
          change={getChange(metrics.incomeYTD, metrics.incomeLastYTD)}
          trend={metrics.incomeYTD >= metrics.incomeLastYTD ? 'up' : 'down'}
          color={dataColors.income}
          loading={loading}
          theme={theme}
        />
        <MetricCard
          label={t('metrics.incomeMonth')}
          value={metrics.incomeMonth}
          change={getChange(metrics.incomeMonth, metrics.incomeLastMonth)}
          trend={metrics.incomeMonth >= metrics.incomeLastMonth ? 'up' : 'down'}
          color={dataColors.income}
          loading={loading}
          theme={theme}
        />
        <MetricCard
          label={t('metrics.pendingYTD')}
          value={metrics.pendingYTD}
          change={getChange(metrics.pendingYTD, metrics.pendingLastYTD)}
          trend={metrics.pendingYTD >= metrics.pendingLastYTD ? 'up' : 'down'}
          color={dataColors.pending}
          loading={loading}
          theme={theme}
        />
        <MetricCard
          label={t('metrics.pendingMonth')}
          value={metrics.pendingMonth}
          change={getChange(metrics.pendingMonth, metrics.pendingLastMonth)}
          trend={metrics.pendingMonth >= metrics.pendingLastMonth ? 'up' : 'down'}
          color={dataColors.pending}
          loading={loading}
          theme={theme}
        />
      </Box>

      {/* Charts Section */}
      <Paper elevation={0} sx={{ borderRadius: 3, p: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('charts.financialOverview')}
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 90 }}>
              <InputLabel>{t('charts.year')}</InputLabel>
              <Select value={selectedYear} label={t('charts.year')} onChange={(e) => setSelectedYear(e.target.value)}>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Chip label={t('charts.invoicesCount', { count: invoices.filter(inv => new Date(inv.createdAt || inv.fechaFactura).getFullYear() === selectedYear).length })} size="small" sx={{ fontWeight: 600 }} />
          </Stack>
        </Stack>

        <Box sx={{ display: 'grid', gap: 4, gridTemplateColumns: '1fr' }}>
          <BarChart
            data={chartData.revenue}
            loading={loading}
            title={t('charts.revenue')}
            total={chartData.revenueTotal}
            color={dataColors.income}
            theme={theme}
            selectedYear={selectedYear}
          />
          <BarChart
            data={chartData.pending}
            loading={loading}
            title={t('charts.pending')}
            total={chartData.pendingTotal}
            color={dataColors.pending}
            theme={theme}
            selectedYear={selectedYear}
          />
        </Box>
      </Paper>

      {/* Workspace Occupancy */}
      <Paper elevation={0} sx={{ borderRadius: 3, p: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t('occupancy.title')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date().toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' })}
          </Typography>
        </Stack>

        {occupancyLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : occupancyData.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
            {t('occupancy.noData')}
          </Typography>
        ) : (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' } }}>
            {occupancyData.map((item) => (
              <OccupancyBar
                key={item.name}
                name={item.name}
                occupancy={item.occupancy}
                bookedHours={item.bookedHours}
                totalHours={item.totalHours}
                theme={theme}
              />
            ))}
          </Box>
        )}
      </Paper>

      {/* Subscription Reconciliation */}
      <ReconciliationCard data={reconciliationData} loading={reconciliationLoading} t={t} onRun={handleRunReconciliation} running={reconciliationRunning} />
    </Stack>
  );
};

/* ═══════════════════════════════════════════
   RECONCILIATION CARD
   ═══════════════════════════════════════════ */
const ReconciliationCard = ({ data, loading, t, onRun, running }) => {
  const getStatus = (row) => {
    if (row.missing_invoice_count > 0) return 'error';
    if (row.stripe_past_due > 0) return 'warning';
    return 'success';
  };

  const statusColor = (status) =>
    status === 'error' ? '#dc2626' : status === 'warning' ? '#f59e0b' : '#009624';

  const runDate = data.length > 0 ? data[0].run_date : null;

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, p: 3, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('reconciliation.title')}</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          {runDate && (
            <Typography variant="caption" color="text.secondary">
              {t('reconciliation.lastRun')}: {new Date(runDate).toLocaleDateString()}
            </Typography>
          )}
          <Button size="small" variant="outlined" onClick={onRun} disabled={running} sx={{ textTransform: 'none', fontWeight: 600, minWidth: 90 }}>
            {running ? <CircularProgress size={14} sx={{ mr: 1 }} /> : null}
            {running ? 'Running…' : 'Run now'}
          </Button>
        </Stack>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : data.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          {t('reconciliation.noData')}
        </Typography>
      ) : (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
          {data.map((row) => {
            const status = getStatus(row);
            const color = statusColor(status);
            return (
              <Box key={row.account} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, bgcolor: color }} />
                <Stack spacing={1.5} sx={{ pl: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{row.account}</Typography>
                    <Chip
                      label={t(`reconciliation.${status === 'error' ? 'alert' : status === 'warning' ? 'warning' : 'ok'}`)}
                      size="small"
                      sx={{ fontWeight: 600, bgcolor: alpha(color, 0.1), color }}
                    />
                  </Stack>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">{t('reconciliation.dbActive')}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.db_active}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">{t('reconciliation.stripeActive')}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.stripe_active}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: row.stripe_past_due > 0 ? '#f59e0b' : 'text.secondary' }}>
                        {t('reconciliation.pastDue')}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: row.stripe_past_due > 0 ? '#f59e0b' : 'inherit' }}>
                        {row.stripe_past_due}{row.past_due_amount > 0 ? ` (€${row.past_due_amount})` : ''}
                      </Typography>
                    </Box>
                  </Box>
                  {row.missing_invoice_count > 0 && (
                    <Typography variant="body2" sx={{ color: '#dc2626', fontWeight: 600 }}>
                      ⚠ {t('reconciliation.missingInvoices', { count: row.missing_invoice_count })}
                    </Typography>
                  )}
                </Stack>
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
};

/* ═══════════════════════════════════════════
   OVERVIEW ROUTER
   ═══════════════════════════════════════════ */
const Overview = ({ userType = 'admin', userProfile, setActiveTab }) => {
  if (userType === 'user') {
    return <UserOverview userProfile={userProfile} setActiveTab={setActiveTab} />;
  }
  return <AdminOverview />;
};

export default Overview;
