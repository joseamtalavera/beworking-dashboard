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
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingFlatRoundedIcon from '@mui/icons-material/TrendingFlatRounded';
import { useEffect, useState, useMemo } from 'react';
import { fetchInvoices, fetchOverviewMetrics } from '../../api/invoices.js';
import { fetchBloqueos, fetchBookingProductos, fetchBookingStats, cancelBloqueo } from '../../api/bookings.js';
import { listMailboxDocuments } from '../../api/mailbox.js';
import { apiFetch } from '../../api/client.js';
import { fetchSubscriptions, fetchDeskOccupancySummary } from '../../api/subscriptions.js';
import PlanUpgradeDialog from '../PlanUpgradeDialog.jsx';
import WebsiteAdBanner from '../WebsiteAdBanner.jsx';
import { tokens } from '../../theme/tokens.js';

if (!i18n.hasResourceBundle('es', 'overview')) {
  i18n.addResourceBundle('es', 'overview', esOverview);
  i18n.addResourceBundle('en', 'overview', enOverview);
}

// Color palette for data visualization — pulled from the theme so dark mode tracks.
const getDataColors = (theme) => ({
  income: theme.palette.brand?.green || '#009624',
  pending: theme.palette.error.main,
  overdue: theme.palette.error.main,
  neutral: theme.palette.text.disabled,
});

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
const StatCard = ({ label, value, sublabel, mtd, ytd, mtdLabel, ytdLabel, change, trend, loading, theme }) => {
  const TrendIcon = trend === 'down' ? TrendingDownRoundedIcon
                  : trend === 'up' ? TrendingUpRoundedIcon
                  : TrendingFlatRoundedIcon;
  const trendColor = trend === 'down' ? 'error.main' : trend === 'up' ? 'brand.green' : 'text.disabled';
  return (
  <Paper
    elevation={0}
    sx={{
      borderRadius: `${tokens.radius.md}px`,
      p: 3,
      border: '1px solid',
      borderColor: 'divider',
      transition: `border-color ${tokens.motion.durationFast} ${tokens.motion.ease}`,
      '&:hover': { borderColor: 'brand.green' }
    }}
  >
    {loading ? (
      <CircularProgress size={24} sx={{ color: 'brand.green' }} />
    ) : (
      <>
        <Typography variant="h3" sx={{ fontWeight: 600, letterSpacing: '-0.025em', mb: 0.5, lineHeight: 1 }}>
          {value}
        </Typography>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {label}
          </Typography>
          {change && (
            <Stack direction="row" alignItems="center" spacing={0.25}>
              <TrendIcon sx={{ fontSize: 14, color: trendColor }} />
              <Typography variant="caption" sx={{ fontWeight: 600, color: trendColor }}>
                {change}
              </Typography>
            </Stack>
          )}
        </Stack>
        {sublabel && (
          <Typography variant="caption" color="text.disabled">
            {sublabel}
          </Typography>
        )}
        {(mtd !== undefined || ytd !== undefined) && (
          <Stack direction="row" spacing={1.5} sx={{ mt: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
            {mtd !== undefined && (
              <Typography variant="caption" sx={{ color: 'brand.green', fontWeight: 600 }}>
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
};

// Metric Card with color coding
const MetricCard = ({ label, value, change, trend, color, loading, theme }) => {
  const TrendIcon = trend === 'up' ? TrendingUpRoundedIcon :
                    trend === 'down' ? TrendingDownRoundedIcon :
                    TrendingFlatRoundedIcon;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: `${tokens.radius.md}px`,
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: `3px solid ${color}`,
        transition: `box-shadow ${tokens.motion.durationFast} ${tokens.motion.ease}`,
        '&:hover': { boxShadow: `0 6px 18px ${alpha(color, 0.15)}` }
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
          <Typography variant="h4" sx={{ fontWeight: 600, letterSpacing: '-0.02em', color }}>
            {formatCurrency(value)}
          </Typography>
        </>
      )}
    </Paper>
  );
};

// Monthly Bar Chart
const LineChart = ({ data, loading, title, total, color, theme, selectedYear, compareData, compareLabel, currentLabel }) => {
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
  const hasCompare = Array.isArray(compareData) && compareData.some(v => Number(v) > 0);
  const maxValue = Math.max(
    ...data.map(d => d.value || 0),
    ...(hasCompare ? compareData.map(v => Number(v) || 0) : []),
    100
  );
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

  // Points centered in each month slot so dots align with month labels below.
  // value === null marks a month that hasn't happened yet — kept as a slot for
  // the x-axis label, but excluded from the line so it doesn't crash to €0.
  const plotPoints = data.map((item, idx) => {
    const isEmpty = item.value == null;
    const val = item.value || 0;
    const centerFrac = (idx + 0.5) / data.length;
    const svgX = centerFrac * plotW;
    const svgY = chartMax > 0
      ? padding.top + plotH - (val / chartMax) * plotH
      : padding.top + plotH;
    const pctX = centerFrac * 100;
    const pctY = chartMax > 0
      ? ((1 - val / chartMax) * plotH + padding.top) / svgH * 100
      : (plotH + padding.top) / svgH * 100;
    return { svgX, svgY, pctX, pctY, value: val, isEmpty };
  });

  // Line/area span only the months that have actually happened.
  const realPoints = plotPoints.filter(p => !p.isEmpty);
  const linePath2 = realPoints.length > 1
    ? realPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.svgX},${p.svgY}`).join(' ')
    : '';
  const baselineY = padding.top + plotH;
  const areaPath2 = linePath2 && realPoints.length > 1
    ? `${linePath2} L${realPoints[realPoints.length - 1].svgX},${baselineY} L${realPoints[0].svgX},${baselineY} Z`
    : '';

  // Last-year comparison line — full 12 months, dashed, no fill.
  const comparePath = hasCompare
    ? compareData.map((v, idx) => {
        const centerFrac = (idx + 0.5) / data.length;
        const x = centerFrac * plotW;
        const y = chartMax > 0
          ? padding.top + plotH - ((Number(v) || 0) / chartMax) * plotH
          : padding.top + plotH;
        return `${idx === 0 ? 'M' : 'L'}${x},${y}`;
      }).join(' ')
    : '';

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
            {title}
          </Typography>
          {hasCompare && (
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Box sx={{ width: 14, height: 2, bgcolor: color, borderRadius: 1 }} />
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>{currentLabel}</Typography>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Box sx={{ width: 14, height: 0, borderTop: '1.5px dashed', borderColor: 'text.disabled' }} />
                <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>{compareLabel}</Typography>
              </Stack>
            </Stack>
          )}
        </Stack>
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

            {/* Last-year comparison line (dashed, behind current year) */}
            {comparePath && <path d={comparePath} fill="none" stroke={theme.palette.text.disabled} strokeWidth={1.5} strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}

            {/* Line */}
            {linePath2 && <path d={linePath2} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />}
          </svg>

          {/* Dots overlay (absolute positioned to avoid SVG scaling issues) */}
          {plotPoints.map((p, idx) => {
            const isHovered = hoveredIdx === idx;
            const hasDot = p.value > 0;
            const lastYearVal = hasCompare ? Number(compareData[idx] || 0) : null;
            // Vertical position of the dashed line at this month, for the marker.
            const compareTop = hasCompare && chartMax > 0
              ? ((1 - lastYearVal / chartMax) * plotH + padding.top) / svgH * 100
              : null;
            const showTooltip = isHovered && (p.value > 0 || (lastYearVal != null && lastYearVal > 0));
            return (
              <Box key={idx}>
                {/* Comparison-line marker dot on hover */}
                {hasCompare && lastYearVal > 0 && (
                  <Box
                    sx={{
                      position: 'absolute',
                      left: `${p.pctX}%`,
                      top: `${compareTop}%`,
                      transform: 'translate(-50%, -50%)',
                      width: isHovered ? 9 : 6,
                      height: isHovered ? 9 : 6,
                      borderRadius: '50%',
                      bgcolor: theme.palette.text.disabled,
                      border: '2px solid #fff',
                      pointerEvents: 'none',
                      transition: 'all 0.15s',
                    }}
                  />
                )}
                {/* Hover hotspot (covers the month column) */}
                <Box
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
                  {/* Tooltip — current year + (optionally) last year */}
                  {showTooltip && (
                    <Box sx={{
                      position: 'absolute',
                      bottom: '100%',
                      mb: 0.5,
                      whiteSpace: 'nowrap',
                      bgcolor: 'background.paper',
                      px: 0.75,
                      py: 0.5,
                      borderRadius: 1,
                      boxShadow: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.25,
                    }}>
                      {p.value > 0 && (
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color, lineHeight: 1.2 }}>
                          {currentLabel || ''} {formatCurrency(p.value)}
                        </Typography>
                      )}
                      {hasCompare && lastYearVal > 0 && (
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'text.disabled', lineHeight: 1.2 }}>
                          {compareLabel || ''} {formatCurrency(lastYearVal)}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
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
const OccupancyBar = ({ name, occupancy, bookedHours, totalHours, subtitleKey, subtitleVars, theme }) => {
  const dataColors = getDataColors(theme);
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
      {(subtitleKey || bookedHours !== undefined) && (
        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.25, display: 'block' }}>
          {subtitleKey
            ? i18n.t(`overview:${subtitleKey}`, subtitleVars)
            : i18n.t('overview:occupancy.bookedOf', { booked: bookedHours, total: totalHours })}
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
  const [userSubscription, setUserSubscription] = useState(null);
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
        .then(data => {
          setTenantType((data?.tenantType || '').toLowerCase());
          // Also fetch subscriptions for this contact
          return fetchSubscriptions({ contactId: data?.id });
        })
        .then(subs => {
          const list = Array.isArray(subs) ? subs : Array.isArray(subs?.content) ? subs.content : [];
          const active = list.find(s => s.active);
          if (active) setUserSubscription(active);
        })
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
      const d = new Date(inv.fechaFactura || inv.createdAt);
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
      <Dialog
        open={Boolean(cancelTarget)}
        onClose={() => !cancelling && setCancelTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: `${tokens.radius.lg}px` } }}
      >
        <DialogTitle sx={{ fontWeight: 600, letterSpacing: '-0.015em' }}>{t('user.upcomingBookings.confirmTitle')}</DialogTitle>
        <DialogContent>
          {cancelError && <Alert severity="error" sx={{ mb: 2 }}>{cancelError}</Alert>}
          <DialogContentText>
            {t('user.upcomingBookings.confirmBody', {
              space: cancelTarget?.producto?.nombre || '',
              date: cancelTarget ? new Date(cancelTarget.fechaIni).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) : ''
            })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => setCancelTarget(null)}
            disabled={cancelling}
            sx={{ borderRadius: 999, px: 3, py: 1, textTransform: 'none', fontWeight: 600, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}
          >
            {t('user.upcomingBookings.back')}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmCancel}
            disabled={cancelling}
            sx={{ borderRadius: 999, px: 3, py: 1, textTransform: 'none', fontWeight: 600, boxShadow: 'none', '&:hover': { boxShadow: 'none' } }}
          >
            {cancelling ? <CircularProgress size={16} color="inherit" /> : t('user.upcomingBookings.confirmCancel')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Plan Upgrade Dialog */}
      <PlanUpgradeDialog
        open={planDialogOpen}
        onClose={() => setPlanDialogOpen(false)}
        currentPlan={
          !userSubscription ? 'free'
          : userSubscription.monthlyAmount >= 25 ? 'pro'
          : 'basic'
        }
        subscriptionId={userSubscription?.id}
        userProfile={userProfile}
        onUpgraded={() => {
          // Refresh subscription data after upgrade
          if (userProfile?.tenantId) {
            apiFetch(`/contact-profiles/${userProfile.tenantId}`)
              .then(data => data?.id ? fetchSubscriptions({ contactId: data.id }) : null)
              .then(subs => { if (subs?.length) setUserSubscription(subs.find(s => s.active) || null); });
          }
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
  const dataColors = getDataColors(theme);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [compareEnabled, setCompareEnabled] = useState(false);

  // Server-computed metrics (single source of truth — see OverviewMetricsService.java).
  // All headline numbers, the 5 revenue cards, and the chart series come from
  // one /api/admin/overview/metrics?year=N call. The frontend no longer
  // reduces invoice arrays — that was the source of YoY drift.
  const [serverMetrics, setServerMetrics] = useState(null);

  // Occupancy
  const [occupancyData, setOccupancyData] = useState([]);
  const [occupancyLoading, setOccupancyLoading] = useState(true);

  // Headline metric cards
  const metrics = useMemo(() => {
    const r = serverMetrics?.revenue || {};
    const p = serverMetrics?.pending || {};
    const o = serverMetrics?.overdue || {};
    return {
      incomeYTD: Number(r.ytd || 0),
      incomeLastYTD: Number(r.lastYtd || 0),
      incomeMonth: Number(r.month || 0),
      incomeLastMonth: Number(r.prevMonth || 0),
      pendingYTD: Number(p.ytd || 0),
      pendingMonth: Number(p.month || 0),
      overdueTotal: Number(o.total || 0),
      overdueCount: Number(o.count || 0),
    };
  }, [serverMetrics]);

  // 5 revenue cards by tenant_type bucket
  const lineRevenue = useMemo(() => {
    const blank = () => ({ mtd: 0, ytd: 0, lastMonth: 0 });
    const acc = {
      meeting_room: blank(),
      coworking: blank(),
      virtual_office: blank(),
      app: blank(),
      extra: blank(),
    };
    (serverMetrics?.byCategory || []).forEach(row => {
      const k = (row.category || 'extra').toLowerCase();
      if (acc[k]) {
        acc[k] = {
          mtd: Number(row.mtd || 0),
          ytd: Number(row.ytd || 0),
          lastMonth: Number(row.prev_month || row.prevMonth || 0),
        };
      }
    });
    return acc;
  }, [serverMetrics]);

  // Chart series — server returns 12 cells, future months get value=null
  // so the line stops cleanly instead of plotting a €0 cliff.
  const chartData = useMemo(() => {
    const blank = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, revenue: 0, pending: 0, overdue: 0 }));
    const cells = serverMetrics?.byMonth || blank;
    const lastYearCells = serverMetrics?.byMonthLastYear || blank;
    const now = new Date();
    const futureFrom = selectedYear === now.getFullYear() ? now.getMonth() + 1 : 12;
    const series = (key) => cells.map((cell, i) => ({
      month: new Date(selectedYear, i, 1).toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US', { month: 'short' }),
      value: i >= futureFrom ? null : Number(cell[key] || 0),
    }));
    // Last-year comparison line spans the full 12 months (last year is complete).
    const lastYearRevenue = lastYearCells.map((cell) => Number(cell.revenue || 0));
    const sum = (key) => cells.reduce((s, c) => s + Number(c[key] || 0), 0);
    return {
      revenue: series('revenue'),
      pending: series('pending'),
      overdue: series('overdue'),
      revenueLastYear: lastYearRevenue,
      revenueTotal: sum('revenue'),
      pendingTotal: sum('pending'),
      overdueTotal: sum('overdue'),
    };
  }, [serverMetrics, selectedYear, i18n.language]);

  const totalInvoicesForYear = Number(serverMetrics?.totalInvoices || 0);

  // Fetch occupancy
  const fetchOccupancy = async () => {
    setOccupancyLoading(true);
    try {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const [products, bookings, deskSummary] = await Promise.all([
        fetchBookingProductos(),
        fetchBloqueos({ from: firstDay.toISOString().split('T')[0], to: lastDay.toISOString().split('T')[0] }),
        fetchDeskOccupancySummary().catch(() => null)
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

      // Group by space — meeting rooms only here; desks are handled below
      const groups = {};
      productList.forEach(p => {
        const name = p.nombre || p.name || '';
        const key = getKey(name);
        if (!key || key === 'MA1-DESKS') return;

        if (!groups[key]) groups[key] = { ids: [], booked: 0 };
        groups[key].ids.push(p.id);
      });

      bookingList.forEach(b => {
        const name = b.producto?.nombre || '';
        const key = getKey(name);
        if (!key || key === 'MA1-DESKS') return;

        if (groups[key] && b.fechaIni && b.fechaFin) {
          const hours = (new Date(b.fechaFin) - new Date(b.fechaIni)) / 3600000;
          if (hours > 0 && hours <= 24) groups[key].booked += hours;
        }
      });

      const meetingRoomResults = Object.entries(groups)
        .map(([name, data]) => ({
          name,
          occupancy: Math.min(100, Math.round((data.booked / (totalHours * data.ids.length)) * 100)) || 0,
          bookedHours: Math.round(data.booked),
          totalHours: totalHours * data.ids.length
        }))
        .filter(r => r.totalHours > 0)
        .sort((a, b) => b.occupancy - a.occupancy);

      // Desks: backend summary counts MA1O* products as total capacity and
      // active subs with producto_id as occupied. Each active sub = full month.
      const totalDesks = Number(deskSummary?.totalDesks) || 0;
      const occupiedDesks = Number(deskSummary?.occupiedDesks) || 0;

      const deskRow = totalDesks > 0
        ? [{
            name: 'MA1-DESKS',
            occupancy: Math.min(100, Math.round((occupiedDesks / totalDesks) * 100)),
            bookedHours: occupiedDesks * totalHours,
            totalHours: totalDesks * totalHours,
            subtitleKey: 'occupancy.desksSubtitle',
            subtitleVars: { occupied: occupiedDesks, total: totalDesks }
          }]
        : [];

      setOccupancyData([...meetingRoomResults, ...deskRow].slice(0, 6));
    } catch (error) {
      console.error('Error fetching occupancy:', error);
      setOccupancyData([]);
    } finally {
      setOccupancyLoading(false);
    }
  };

  // Server-computed metrics — one query, applies to selected year.
  // Refetches when the chart's year selector changes so the cards and
  // the chart always agree.
  const fetchMetrics = async (year) => {
    setLoading(true);
    try {
      const data = await fetchOverviewMetrics(year);
      setServerMetrics(data || null);
    } catch (error) {
      console.error('Error fetching overview metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    fetchOccupancy();
  }, []);

  const getChange = (current, previous) => {
    // Hide noisy badges when the prior-period base is too small —
    // a comparison vs €0 or €50 produces meaningless +259%/+208% deltas.
    if (!previous || Math.abs(previous) < 1000) return undefined;
    const pct = calcChange(current, previous);
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`;
  };

  return (
    <Stack spacing={3} sx={{ width: '100%', px: { xs: 2, md: 3 }, pb: 4 }}>
      {/* Revenue by business line */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' } }}>
        {[
          { key: 'meeting_room', label: t('stats.meetingRooms') },
          { key: 'coworking', label: t('stats.coworking') },
          { key: 'virtual_office', label: t('stats.virtualOffices') },
          { key: 'app', label: t('stats.app') },
          { key: 'extra', label: t('stats.extra') },
        ].map(({ key, label }) => {
          const r = lineRevenue[key];
          return (
            <StatCard
              key={key}
              label={label}
              value={formatCurrency(r.mtd)}
              change={r.lastMonth > 0 ? getChange(r.mtd, r.lastMonth) : undefined}
              trend={r.mtd >= r.lastMonth ? 'up' : 'down'}
              mtd={formatCurrency(r.mtd)}
              ytd={formatCurrency(r.ytd)}
              loading={loading}
              theme={theme}
            />
          );
        })}
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
          color={dataColors.pending}
          loading={loading}
          theme={theme}
        />
        <MetricCard
          label={t('metrics.pendingMonth')}
          value={metrics.pendingMonth}
          color={dataColors.pending}
          loading={loading}
          theme={theme}
        />
      </Box>

      {/* Charts Section */}
      <Paper elevation={0} sx={{ borderRadius: `${tokens.radius.lg}px`, p: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.015em' }}>
            {t('charts.financialOverview')}
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControlLabel
              control={<Switch size="small" checked={compareEnabled} onChange={(e) => setCompareEnabled(e.target.checked)} />}
              label={t('charts.compareYear', { year: selectedYear - 1, defaultValue: `vs ${selectedYear - 1}` })}
              slotProps={{ typography: { variant: 'caption', sx: { color: 'text.secondary', fontWeight: 500 } } }}
              sx={{ mr: 0 }}
            />
            <FormControl size="small" sx={{ minWidth: 90 }}>
              <InputLabel>{t('charts.year')}</InputLabel>
              <Select value={selectedYear} label={t('charts.year')} onChange={(e) => setSelectedYear(e.target.value)}>
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Chip label={t('charts.invoicesCount', { count: totalInvoicesForYear })} size="small" sx={{ fontWeight: 600 }} />
          </Stack>
        </Stack>

        <Box sx={{ display: 'grid', gap: 4, gridTemplateColumns: '1fr' }}>
          <LineChart
            data={chartData.revenue}
            compareData={compareEnabled ? chartData.revenueLastYear : null}
            compareLabel={String(selectedYear - 1)}
            currentLabel={String(selectedYear)}
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
      <Paper elevation={0} sx={{ borderRadius: `${tokens.radius.lg}px`, p: 3, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.015em' }}>
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
                subtitleKey={item.subtitleKey}
                subtitleVars={item.subtitleVars}
                theme={theme}
              />
            ))}
          </Box>
        )}
      </Paper>

    </Stack>
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
