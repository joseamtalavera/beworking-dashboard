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
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingFlatRoundedIcon from '@mui/icons-material/TrendingFlatRounded';
import { useEffect, useState, useMemo } from 'react';
import { fetchInvoices } from '../../api/invoices.js';
import { fetchBloqueos, fetchBookingProductos, fetchBookingStats } from '../../api/bookings.js';
import { listMailboxDocuments } from '../../api/mailbox.js';
import { apiFetch } from '../../api/client.js';

if (!i18n.hasResourceBundle('es', 'overview')) {
  i18n.addResourceBundle('es', 'overview', esOverview);
  i18n.addResourceBundle('en', 'overview', enOverview);
}

// Color palette for data visualization
const dataColors = {
  income: '#009624',      // Brand green - money coming in
  pending: '#64748b',     // Slate gray - awaiting action
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

// Clean Stat Card - minimal design
const StatCard = ({ label, value, sublabel, loading, theme }) => (
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

// Clean Area Chart
const AreaChart = ({ data, loading, title, total, color, theme, gradientId }) => {
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
  const chartWidth = 400;
  const padding = { top: 10, right: 10, bottom: 30, left: 10 };
  const maxValue = Math.max(...data.map(d => d.value || 0), 100);

  const points = data.map((item, index) => {
    const x = padding.left + (index * (chartWidth - padding.left - padding.right) / (data.length - 1));
    const y = padding.top + chartHeight - ((item.value / maxValue) * chartHeight);
    return { x, y, value: item.value, month: item.month };
  });

  const linePath = points.map((point, index) =>
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          {title}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, color }}>
          {formatCurrency(total)}
        </Typography>
      </Stack>

      <Box sx={{ width: '100%', height: chartHeight + padding.top + padding.bottom }}>
        <svg width="100%" height={chartHeight + padding.top + padding.bottom} viewBox={`0 0 ${chartWidth} ${chartHeight + padding.top + padding.bottom}`} preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          <path d={areaPath} fill={`url(#${gradientId})`} />
          <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          {points.map((point, index) => (
            <g key={index}>
              <circle cx={point.x} cy={point.y} r={3} fill={color} />
              <text x={point.x} y={chartHeight + padding.top + 20} fontSize="9" fill={theme.palette.text.disabled} textAnchor="middle">
                {point.month}
              </text>
            </g>
          ))}
        </svg>
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
      const d = new Date(inv.fechaFactura);
      const isPaid = status.includes('pag') || status.includes('paid');
      const isOverdue = status.includes('venc') || status.includes('overdue');
      const isPending = status.includes('pend') || status.includes('confir') || status.includes('fact') || status.includes('invoice');

      if (isPending) { pendingCount++; pendingTotal += amount; }
      if (isOverdue) { overdueCount++; overdueTotal += amount; }
      if (isPaid && d.getFullYear() === curYear) {
        spentYTD += amount;
        if (d.getMonth() === curMonth) spentMonth += amount;
      }
    });
    return { pendingCount, pendingTotal, spentMonth, spentYTD, overdueCount, overdueTotal };
  }, [invoices]);

  // Recent invoices (last 5, sorted desc)
  const recentInvoices = useMemo(() =>
    [...invoices].sort((a, b) => new Date(b.fechaFactura) - new Date(a.fechaFactura)).slice(0, 5),
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
              </TableRow>
            </TableHead>
            <TableBody>
              {loading.bookings ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><CircularProgress size={24} /></TableCell></TableRow>
              ) : bookings.slice(0, 5).length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>
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
                    <TableCell><Chip label={b.estado || '-'} size="small" color={statusChipColor(b.estado)} variant="outlined" /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

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
                  <TableCell>{new Date(inv.fechaFactura).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
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
                  <TableCell>{t('user.mailbox.sender')}</TableCell>
                  <TableCell>{t('user.mailbox.type')}</TableCell>
                  <TableCell>{t('user.mailbox.received')}</TableCell>
                  <TableCell>{t('user.mailbox.status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentMail.map(doc => (
                  <TableRow key={doc.id} hover>
                    <TableCell>{doc.sender || doc.title || '-'}</TableCell>
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

  // Quick stats
  const [todayBookings, setTodayBookings] = useState(0);
  const [todayDeskBookings, setTodayDeskBookings] = useState(0);
  const [activeBusinessAddresses, setActiveBusinessAddresses] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);

  // Occupancy
  const [occupancyData, setOccupancyData] = useState([]);
  const [occupancyLoading, setOccupancyLoading] = useState(true);

  // Calculate metrics from invoice data
  const metrics = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const lastYear = currentYear - 1;
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    let incomeYTD = 0, incomeLastYTD = 0;
    let pendingYTD = 0, pendingLastYTD = 0;
    let incomeMonth = 0, incomeLastMonth = 0;
    let pendingMonth = 0, pendingLastMonth = 0;
    let overdueTotal = 0, overdueCount = 0;

    invoices.forEach(invoice => {
      if (!invoice.fechaFactura) return;

      const invoiceDate = new Date(invoice.fechaFactura);
      const invoiceYear = invoiceDate.getFullYear();
      const invoiceMonth = invoiceDate.getMonth();
      const amount = parseFloat(invoice.total || invoice.importe || 0);
      const status = (invoice.estado || '').toLowerCase();

      const isPaid = status.includes('pag') || status.includes('paid') || status.includes('approved');
      const isOverdue = status.includes('venc') || status.includes('overdue');
      const isPending = status.includes('pend') || status.includes('confir') || status.includes('fact') || status.includes('invoice') || status.includes('created');

      if (invoiceYear === currentYear) {
        if (isPaid) incomeYTD += amount;
        if (isPending) pendingYTD += amount;
        if (invoiceMonth === currentMonth) {
          if (isPaid) incomeMonth += amount;
          if (isPending) pendingMonth += amount;
        }
      }

      if (invoiceYear === lastYear) {
        if (isPaid) incomeLastYTD += amount;
        if (isPending) pendingLastYTD += amount;
      }

      if (invoiceYear === lastMonthYear && invoiceMonth === lastMonth) {
        if (isPaid) incomeLastMonth += amount;
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
      if (!invoice.fechaFactura) return;
      const invoiceDate = new Date(invoice.fechaFactura);
      if (invoiceDate.getFullYear() !== selectedYear) return;

      const month = invoiceDate.getMonth();
      const amount = parseFloat(invoice.total || invoice.importe || 0);
      const status = (invoice.estado || '').toLowerCase();

      if (status.includes('pag') || status.includes('paid') || status.includes('approved')) {
        months[month].revenue += amount;
      } else if (status.includes('venc') || status.includes('overdue')) {
        months[month].overdue += amount;
      } else if (status.includes('pend') || status.includes('confir') || status.includes('fact') || status.includes('invoice')) {
        months[month].pending += amount;
      }
    });

    return {
      revenue: months.map(m => ({ month: m.month, value: m.revenue })),
      pending: months.map(m => ({ month: m.month, value: m.pending })),
      overdue: months.map(m => ({ month: m.month, value: m.overdue })),
      revenueTotal: months.reduce((s, m) => s + m.revenue, 0),
      pendingTotal: months.reduce((s, m) => s + m.pending, 0),
      overdueTotal: months.reduce((s, m) => s + m.overdue, 0)
    };
  }, [invoices, selectedYear]);

  // Fetch quick stats
  const fetchQuickStats = async () => {
    setStatsLoading(true);
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const [todayBookingsData, futureBookings, contactsResponse] = await Promise.all([
        fetchBloqueos({ from: todayStr, to: todayStr }),
        fetchBloqueos({ from: todayStr, to: '2030-12-31' }),
        apiFetch('/contact-profiles?page=0&size=10000')
      ]);

      const meetingRooms = Array.isArray(todayBookingsData)
        ? todayBookingsData.filter(b => (b.producto?.nombre || '').includes('MA1A')).length : 0;

      const desks = Array.isArray(todayBookingsData)
        ? todayBookingsData.filter(b => {
            const name = b.producto?.nombre || '';
            return name.includes('MA1O') || name.toLowerCase().includes('desk');
          }).length : 0;

      const businessAddrs = Array.isArray(contactsResponse?.items)
        ? contactsResponse.items.filter(c => {
            const status = (c.status || c.estado || '').toLowerCase();
            return (status === 'activo' || status === 'active') && (c.virtualOffice || c.businessAddress);
          }).length : 0;

      const userIds = new Set();
      (Array.isArray(futureBookings) ? futureBookings : []).forEach(b => {
        if (b.cliente?.id) userIds.add(b.cliente.id);
      });

      setTodayBookings(meetingRooms);
      setTodayDeskBookings(desks);
      setActiveBusinessAddresses(businessAddrs);
      setActiveUsers(userIds.size);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

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

      // Calculate working days
      let workingDays = 0;
      for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        if (d.getDay() !== 0 && d.getDay() !== 6) workingDays++;
      }
      const hoursPerDay = 10;
      const totalHours = workingDays * hoursPerDay;

      // Group by space
      const groups = {};
      productList.forEach(p => {
        const name = p.nombre || p.name || '';
        if (!name) return;

        let key = name;
        if (name.includes('MA1A')) key = name.match(/MA1A\d+/)?.[0] || name;
        else if (name.includes('MA1O')) key = 'Coworking';

        if (!groups[key]) groups[key] = { ids: [], booked: 0 };
        groups[key].ids.push(p.id);
      });

      bookingList.forEach(b => {
        const name = b.producto?.nombre || '';
        let key = null;
        if (name.includes('MA1A')) key = name.match(/MA1A\d+/)?.[0] || name;
        else if (name.includes('MA1O')) key = 'Coworking';

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

  useEffect(() => {
    fetchAllInvoices();
    fetchQuickStats();
    fetchOccupancy();
  }, []);

  const getChange = (current, previous) => {
    const pct = calcChange(current, previous);
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`;
  };

  return (
    <Stack spacing={3} sx={{ width: '100%', px: { xs: 2, md: 3 }, pb: 4 }}>
      {/* Quick Stats Row */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
        <StatCard label={t('stats.meetingRooms')} value={todayBookings} sublabel={t('stats.today')} loading={statsLoading} theme={theme} />
        <StatCard label={t('stats.deskBookings')} value={todayDeskBookings} sublabel={t('stats.today')} loading={statsLoading} theme={theme} />
        <StatCard label={t('stats.businessAddresses')} value={activeBusinessAddresses} sublabel={t('stats.active')} loading={statsLoading} theme={theme} />
        <StatCard label={t('stats.activeUsers')} value={activeUsers} sublabel={t('stats.withBookings')} loading={statsLoading} theme={theme} />
      </Box>

      {/* Financial Metrics */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' } }}>
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
          label={t('metrics.pendingYTD')}
          value={metrics.pendingYTD}
          change={getChange(metrics.pendingYTD, metrics.pendingLastYTD)}
          trend={metrics.pendingYTD >= metrics.pendingLastYTD ? 'up' : 'down'}
          color={dataColors.pending}
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
          label={t('metrics.pendingMonth')}
          value={metrics.pendingMonth}
          change={getChange(metrics.pendingMonth, metrics.pendingLastMonth)}
          trend={metrics.pendingMonth >= metrics.pendingLastMonth ? 'up' : 'down'}
          color={dataColors.pending}
          loading={loading}
          theme={theme}
        />
        <MetricCard
          label={t('metrics.overdue', { count: metrics.overdueCount })}
          value={metrics.overdueTotal}
          change={null}
          trend="flat"
          color={dataColors.overdue}
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
            <Chip label={t('charts.invoicesCount', { count: invoices.length })} size="small" sx={{ fontWeight: 600 }} />
          </Stack>
        </Stack>

        <Box sx={{ display: 'grid', gap: 4, gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' } }}>
          <AreaChart
            data={chartData.revenue}
            loading={loading}
            title={t('charts.revenue')}
            total={chartData.revenueTotal}
            color={dataColors.income}
            theme={theme}
            gradientId="revenueGrad"
          />
          <AreaChart
            data={chartData.pending}
            loading={loading}
            title={t('charts.pending')}
            total={chartData.pendingTotal}
            color={dataColors.pending}
            theme={theme}
            gradientId="pendingGrad"
          />
          <AreaChart
            data={chartData.overdue}
            loading={loading}
            title={t('charts.overdue')}
            total={chartData.overdueTotal}
            color={dataColors.overdue}
            theme={theme}
            gradientId="overdueGrad"
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
