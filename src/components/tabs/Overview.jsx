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
import PlanUpgradeDialog from '../PlanUpgradeDialog.jsx';
import WebsiteAdBanner from '../WebsiteAdBanner.jsx';

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
const LineChart = ({ data, loading, title, total, color, theme, selectedYear }) => {
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

  const chartHeight = 140;
  const padding = { left: 50, right: 8, top: 12, bottom: 4 };
  const maxValue = Math.max(...data.map(d => d.value || 0), 100);
  const activeCount = data.length;

  // Y-axis ticks (4 ticks) — round to nice numbers
  const tickCount = 4;
  const rawStep = maxValue / tickCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
  const niceStep = Math.ceil(rawStep / magnitude) * magnitude;
  const niceMax = niceStep * tickCount;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => niceStep * i);
  const chartMax = niceMax || maxValue;

  // Build SVG path
  const chartW = 100; // percentage-based, will use viewBox
  const svgW = 600;
  const svgH = chartHeight;
  const plotW = svgW - padding.left - padding.right;
  const plotH = svgH - padding.top - padding.bottom;

  // Points for SVG path (in viewBox coordinates, 0 to plotW)
  const plotPoints = data.map((item, idx) => {
    const val = item.value || 0;
    const svgX = (idx / (data.length - 1)) * plotW;
    const svgY = chartMax > 0
      ? padding.top + plotH - (val / chartMax) * plotH
      : padding.top + plotH;
    const pctX = (idx / (data.length - 1)) * 100;
    const pctY = chartMax > 0
      ? ((1 - val / chartMax) * plotH + padding.top) / svgH * 100
      : (plotH + padding.top) / svgH * 100;
    return { svgX, svgY, pctX, pctY, value: val };
  });

  const linePath2 = plotPoints.length > 1
    ? plotPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.svgX},${p.svgY}`).join(' ')
    : '';
  const baselineY = padding.top + plotH;
  const areaPath2 = linePath2 && plotPoints.length > 1
    ? `${linePath2} L${plotPoints[plotPoints.length - 1].svgX},${baselineY} L${plotPoints[0].svgX},${baselineY} Z`
    : '';

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

      <Box sx={{ display: 'flex' }}>
        {/* Y-axis labels */}
        <Box sx={{ width: 44, flexShrink: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: chartHeight, py: `${padding.top}px` }}>
          {[...ticks].reverse().map((tick, i) => (
            <Typography key={i} variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled', textAlign: 'right', pr: 0.5, lineHeight: 1 }}>
              {tick >= 1000 ? `€${(tick / 1000).toFixed(1)}k` : `€${tick}`}
            </Typography>
          ))}
        </Box>

        {/* Chart area */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          <svg viewBox={`0 0 ${plotW} ${svgH}`} width="100%" height={chartHeight} preserveAspectRatio="none" style={{ display: 'block' }}>
            {/* Grid lines */}
            {ticks.map((tick, i) => {
              const y = padding.top + plotH - (tick / chartMax) * plotH;
              return <line key={i} x1={0} y1={y} x2={plotW} y2={y} stroke={theme.palette.divider} strokeWidth={0.5} />;
            })}

            {/* Area fill */}
            {areaPath2 && <path d={areaPath2} fill={`${color}15`} />}

            {/* Line */}
            {linePath2 && <path d={linePath2} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
          </svg>

          {/* Dots overlay (absolute positioned to avoid SVG scaling issues) */}
          {plotPoints.map((p, idx) => {
            const isHovered = hoveredIdx === idx;
            const hasDot = p.value > 0;
            return (
              <Box
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                sx={{
                  position: 'absolute',
                  left: `${p.pctX}%`,
                  top: `${p.pctY}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {hasDot && (
                  <Box sx={{
                    width: isHovered ? 12 : 8,
                    height: isHovered ? 12 : 8,
                    borderRadius: '50%',
                    bgcolor: color,
                    border: '2px solid #fff',
                    boxShadow: isHovered ? `0 0 0 3px ${color}30` : 'none',
                    transition: 'all 0.15s',
                  }} />
                )}
                {/* Tooltip */}
                {isHovered && p.value > 0 && (
                  <Typography sx={{
                    position: 'absolute',
                    bottom: '100%',
                    mb: 0.5,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color,
                    whiteSpace: 'nowrap',
                    bgcolor: 'background.paper',
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 1,
                    boxShadow: 1,
                  }}>
                    {formatCurrency(p.value)}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Month labels */}
      <Box sx={{ display: 'flex', pl: '44px', mt: 0.5 }}>
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
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
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
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' } }}>
        <StatCard label={t('user.stats.upcomingBookings')} value={upcomingCount} sublabel={t('user.stats.next30days')} loading={loading.bookings} theme={theme} />
        <StatCard label={t('user.stats.bookingsThisMonth')} value={bookingStats?.totalBookingsMonth ?? 0} sublabel={t('user.stats.thisMonth')} loading={loading.stats} theme={theme} />
        {isVirtualUser ? (
          <StatCard label={t('user.stats.freeBookingsLeft')} value={bookingStats?.freeBookingsLeft ?? 0} sublabel={t('user.stats.remaining', { limit: bookingStats?.freeBookingsLimit ?? 5 })} loading={loading.stats} theme={theme} />
        ) : (
          <StatCard label={t('user.stats.bookingsYTD')} value={bookingStats?.totalBookingsYTD ?? 0} sublabel={t('user.stats.yearToDate')} loading={loading.stats} theme={theme} />
        )}
        <StatCard label={t('user.stats.pendingMail')} value={pendingMailCount} sublabel={t('user.stats.documentsWaiting')} loading={loading.mail} theme={theme} />
      </Box>

      {/* PRO Upgrade Banner with device mockups */}
      <WebsiteAdBanner onViewPlans={() => setPlanDialogOpen(true)} />

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

      {/* Plan Upgrade Dialog */}
      <PlanUpgradeDialog
        open={planDialogOpen}
        onClose={() => setPlanDialogOpen(false)}
        currentPlan={tenantType?.toLowerCase().includes('free') ? 'free' : 'basic'}
        onSelectPlan={(plan) => {
          window.open(`https://be-working.com/malaga/oficina-virtual?plan=${plan.key}`, '_blank');
        }}
      />
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

      const isCancelled = status.includes('cancel') || status.includes('void') || status.includes('anula') || status.includes('rectificad');
      const isOverdue = status.includes('venc') || status.includes('overdue');
      const isPending = status.includes('pend') || status.includes('confir') || status.includes('fact') || status.includes('invoice') || status.includes('created');
      // Billed revenue = all non-cancelled, non-rectified invoices
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

      const isCancelled = status.includes('cancel') || status.includes('void') || status.includes('anula') || status.includes('rectificad');
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
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' } }}>
        <StatCard label={t('stats.businessAddresses')} value={registrationStats.today} sublabel={t('stats.today')} mtd={registrationStats.mtd} ytd={registrationStats.ytd} loading={statsLoading || loading} theme={theme} />
        <StatCard label={t('stats.meetingRooms')} value={statCards.meetingToday} sublabel={t('stats.today')} mtd={statCards.meetingMTD} ytd={statCards.meetingYTD} loading={statsLoading || loading} theme={theme} />
        <StatCard label={t('stats.deskBookings')} value={statCards.deskToday} sublabel={t('stats.today')} mtd={statCards.deskMTD} ytd={statCards.deskYTD} loading={statsLoading || loading} theme={theme} />
        <StatCard label={t('stats.activeUsers')} value={statCards.activeToday} sublabel={t('stats.withBookings')} mtd={statCards.activeMTD} ytd={statCards.activeYTD} mtdLabel={t('stats.mtdAvg')} ytdLabel={t('stats.ytdAvg')} loading={statsLoading || loading} theme={theme} />
      </Box>

      {/* Financial Metrics */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' } }}>
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
          <LineChart
            data={chartData.revenue}
            loading={loading}
            title={t('charts.revenue')}
            total={chartData.revenueTotal}
            color={dataColors.income}
            theme={theme}
            selectedYear={selectedYear}
          />
          <LineChart
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
  const [detailDialog, setDetailDialog] = useState(null);
  const [breakdownCache, setBreakdownCache] = useState({});
  const [bdLoading, setBdLoading] = useState(false);

  const fetchBreakdown = async (account) => {
    if (breakdownCache[account]) return breakdownCache[account];
    setBdLoading(true);
    try {
      const result = await apiFetch(`/admin/reconciliation/breakdown/${account}`);
      setBreakdownCache((prev) => ({ ...prev, [account]: result }));
      return result;
    } catch (e) {
      console.error('Failed to fetch breakdown', e);
      return null;
    } finally {
      setBdLoading(false);
    }
  };

  const openDetail = async (account, type, title) => {
    const bd = await fetchBreakdown(account);
    if (!bd) return;
    const rows = type === 'stripeActive' ? bd.stripeActive
      : type === 'stripeScheduled' ? bd.stripeScheduled
      : type === 'bankTransfer' ? bd.bankTransfer
      : type === 'pastDue' ? bd.pastDueSubs
      : [];
    setDetailDialog({ account, type, title, rows: Array.isArray(rows) ? rows : [] });
  };

  const getStatus = (row) => {
    if (row.missing_invoice_count > 0) return 'error';
    if (row.stripe_past_due > 0) return 'warning';
    return 'success';
  };

  const statusColor = (s) => s === 'error' ? '#dc2626' : s === 'warning' ? '#f59e0b' : '#009624';

  const Metric = ({ label, value, color, sub, onClick }) => (
    <Box onClick={onClick} sx={{ textAlign: 'center', px: 1, py: 1.5, cursor: onClick ? 'pointer' : 'default', borderRadius: 1, transition: 'background 0.15s', '&:hover': onClick ? { bgcolor: 'action.hover' } : {} }}>
      <Typography sx={{ color: color || 'text.secondary', fontWeight: 500, textTransform: 'uppercase', fontSize: '0.6rem', letterSpacing: '0.05em', display: 'block' }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700, color: color || 'text.primary', mt: 0.25, fontSize: '1.25rem' }}>
        {value}
      </Typography>
      {sub && <Typography sx={{ color: color || 'text.secondary', fontSize: '0.65rem' }}>{sub}</Typography>}
    </Box>
  );

  const runDate = data.length > 0 ? data[0].run_date : null;

  const metrics = (row) => {
    const bd = breakdownCache[row.account];
    if (bd) return { stripe: bd.stripeActiveCount, sched: bd.stripeScheduledCount, bank: bd.bankTransferCount, total: bd.totalActive, pastDue: row.stripe_past_due, pastAmt: row.past_due_amount };
    return { stripe: row.stripe_active, sched: 0, bank: row.db_active - row.stripe_active, total: row.db_active, pastDue: row.stripe_past_due, pastAmt: row.past_due_amount };
  };

  return (
    <>
    <Paper elevation={0} sx={{ borderRadius: 3, p: 3, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('reconciliation.title')}</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          {runDate && <Typography variant="caption" color="text.secondary">{t('reconciliation.lastRun')}: {new Date(runDate).toLocaleDateString()}</Typography>}
          <Button size="small" variant="outlined" onClick={onRun} disabled={running} sx={{ textTransform: 'none', fontWeight: 600, minWidth: 90 }}>
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
            return (
              <Box key={row.account} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2, py: 1.5, bgcolor: alpha(color, 0.04), borderBottom: '1px solid', borderBottomColor: 'divider' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{row.account}</Typography>
                    <Typography variant="caption" color="text.secondary">{m.total} total</Typography>
                  </Stack>
                  <Chip label={t(`reconciliation.${status === 'error' ? 'alert' : status === 'warning' ? 'warning' : 'ok'}`)} size="small" sx={{ fontWeight: 600, fontSize: '0.65rem', height: 22, bgcolor: alpha(color, 0.1), color }} />
                </Stack>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, py: 1, borderBottom: (row.missing_invoice_count > 0) ? '1px solid' : 'none', borderBottomColor: 'divider' }}>
                  <Metric label="Stripe" value={m.stripe} onClick={() => openDetail(row.account, 'stripeActive', `${row.account} — Stripe Active`)} />
                  <Metric label="Scheduled" value={m.sched} color={m.sched > 0 ? '#6366f1' : undefined} onClick={() => openDetail(row.account, 'stripeScheduled', `${row.account} — Scheduled`)} />
                  <Metric label="Bank Transfer" value={m.bank} onClick={() => openDetail(row.account, 'bankTransfer', `${row.account} — Bank Transfer`)} />
                  <Metric label="Past Due" value={m.pastDue} color={m.pastDue > 0 ? '#dc2626' : undefined} sub={m.pastAmt > 0 ? `€${Number(m.pastAmt).toFixed(0)}` : undefined} onClick={() => openDetail(row.account, 'pastDue', `${row.account} — Past Due`)} />
                </Box>

                {row.missing_invoice_count > 0 && (
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography variant="body2" sx={{ color: '#dc2626', fontWeight: 600, fontSize: '0.8rem' }}>
                      {t('reconciliation.missingInvoices', { count: row.missing_invoice_count })}
                    </Typography>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>

    <Dialog open={!!detailDialog} onClose={() => setDetailDialog(null)} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {detailDialog?.title}
        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>{detailDialog?.rows?.length || 0} subscriptions</Typography>
      </DialogTitle>
      <DialogContent>
        {bdLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : !detailDialog?.rows?.length ? (
          <Typography color="text.secondary" sx={{ py: 2 }}>No subscriptions</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Interval</TableCell>
                  {detailDialog?.type === 'pastDue'
                    ? <TableCell sx={{ fontWeight: 700 }} align="right">Amount Due</TableCell>
                    : <TableCell sx={{ fontWeight: 700 }}>Since</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {(detailDialog?.rows || []).map((row, i) => (
                  <TableRow key={i} hover>
                    <TableCell>{row.name || row.customerName || '—'}</TableCell>
                    <TableCell>{row.email_primary || row.emailPrimary || row.customerEmail || '—'}</TableCell>
                    <TableCell align="right">€{Number(row.monthly_amount ?? row.monthlyAmount ?? row.amount ?? 0).toFixed(2)}</TableCell>
                    <TableCell>{row.billing_interval || row.billingInterval || '—'}</TableCell>
                    {detailDialog?.type === 'pastDue'
                      ? <TableCell align="right" sx={{ color: '#dc2626', fontWeight: 600 }}>€{Number(row.amountDue ?? 0).toFixed(2)}</TableCell>
                      : <TableCell>{row.start_date || row.startDate || '—'}</TableCell>}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
    </Dialog>
    </>
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
