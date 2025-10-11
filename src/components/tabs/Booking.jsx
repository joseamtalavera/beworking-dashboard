import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContentText from '@mui/material/DialogContentText';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import Autocomplete from '@mui/material/Autocomplete';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Switch from '@mui/material/Switch';
import IconButton from '@mui/material/IconButton';

import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import EventRepeatRoundedIcon from '@mui/icons-material/EventRepeatRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import CalendarViewWeekRoundedIcon from '@mui/icons-material/CalendarViewWeekRounded';
import StickyNote2RoundedIcon from '@mui/icons-material/StickyNote2Rounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import SettingsSuggestRoundedIcon from '@mui/icons-material/SettingsSuggestRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import EuroRoundedIcon from '@mui/icons-material/EuroRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';

import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';

import {
  createReserva,
  fetchBloqueos,
  fetchBookingContacts,
  fetchBookingCentros,
  fetchBookingProductos,
  deleteBloqueo,
  updateBloqueo
} from '../../api/bookings.js';
import { createInvoice, fetchInvoicePdfUrl } from '../../api/invoices.js';
import { CANONICAL_USER_TYPES } from './admin/contactConstants.js';

const DEFAULT_START_HOUR = 6;
const DEFAULT_END_HOUR = 24;
const DEFAULT_RESERVATION_TYPE = 'Por Horas';
const RESERVATION_TYPE_OPTIONS = ['Por Horas', 'Diaria', 'Mensual'];
const STATUS_FORM_OPTIONS = ['Created', 'Invoiced', 'Paid'];
const WEEKDAY_OPTIONS = [
  { value: 'monday', label: 'Monday', shortLabel: 'Mon' },
  { value: 'tuesday', label: 'Tuesday', shortLabel: 'Tue' },
  { value: 'wednesday', label: 'Wednesday', shortLabel: 'Wed' },
  { value: 'thursday', label: 'Thursday', shortLabel: 'Thu' },
  { value: 'friday', label: 'Friday', shortLabel: 'Fri' },
  { value: 'saturday', label: 'Saturday', shortLabel: 'Sat' },
  { value: 'sunday', label: 'Sunday', shortLabel: 'Sun' }
];

const TENANT_TYPE_OVERRIDES = {
  'cesar manuel del castillo rivero': 'Usuario Virtual',
  'francisca granados ballesteros': 'Usuario Virtual',
  horums: 'Usuario Virtual',
  'juan lopez garcia': 'Usuario Virtual',
  'osguese business, sociedad limitada': 'Usuario Virtual',
  'moderniza & actua consultores s.l.': 'Usuario Aulas',
  'p2 formacion y empleo sl': 'Usuario Aulas',
  'jose a molina-talavera': 'Usuario Mesa'
};

const LEGACY_TENANT_TYPE_MAP = {
  'Usuario Oficinas Virtuales': 'Usuario Virtual'
};

const normalizeName = (value = '') =>
  value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const resolveTenantType = (bloqueo) => {
  const nameKey = normalizeName(bloqueo?.cliente?.nombre || '');
  const override = nameKey ? TENANT_TYPE_OVERRIDES[nameKey] : undefined;
  const rawType = override || bloqueo?.cliente?.tipoTenant || '';
  return LEGACY_TENANT_TYPE_MAP[rawType] || rawType;
};

const statusStyles = {
  available: {
    bgcolor: 'rgba(229, 231, 235, 0.45)',
    borderColor: '#cbd5f5',
    color: '#64748b'
  },
  paid: {
    bgcolor: 'rgba(0, 255, 0, 0.18)',
    borderColor: '#00b300',
    color: '#006600'
  },
  invoiced: {
    bgcolor: 'rgba(255, 234, 128, 0.25)',
    borderColor: '#facc15',
    color: '#92400e'
  },
  created: {
    bgcolor: 'rgba(255, 102, 102, 0.18)',
    borderColor: '#f87171',
    color: '#991b1b'
  }
};

const statusLabels = {
  available: 'Available',
  paid: 'Paid',
  invoiced: 'Invoiced',
  created: 'Created'
};

const LEGEND_STATUSES = ['available', 'paid', 'invoiced', 'created'];

const Legend = () => (
  <Stack direction="row" spacing={2} flexWrap="wrap">
    {LEGEND_STATUSES.map((status) => (
      <Stack key={status} direction="row" spacing={1} alignItems="center">
        <Box
          sx={{
            width: 16,
            height: 16,
            borderRadius: 1,
            border: '1px solid',
            borderColor: statusStyles[status].borderColor,
            bgcolor: statusStyles[status].bgcolor
          }}
        />
        <Typography variant="caption" color="text.secondary">
          {statusLabels[status]}
        </Typography>
      </Stack>
    ))}
  </Stack>
);

const getInitials = (value) => {
  if (!value || typeof value !== 'string') {
    return 'NA';
  }
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'NA';
};

const filterFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    backgroundColor: '#fff'
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: '#1d4ed8'
  },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: '#94a3b8'
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: '#cbd5f5'
  },
  '& .MuiInputAdornment-root': {
    color: '#64748b'
  }
};

const formatDate = (isoDate) => {
  if (!isoDate) {
    return '—';
  }
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

const formatDateTime = (isoString) => {
  if (!isoString) {
    return '—';
  }
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const formatDateRange = (from, to) => {
  if (!from && !to) {
    return '—';
  }
  if (from && to && from !== to) {
    return `${formatDate(from)} – ${formatDate(to)}`;
  }
  return formatDate(from ?? to);
};

const formatEuro = (value) => {
  if (value == null) {
    return '—';
  }
  const number = Number(value);
  if (Number.isNaN(number)) {
    return String(value);
  }
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(number);
};

const buildInvoiceDescription = (bloqueo) => {
  if (!bloqueo) {
    return '';
  }
  const parts = [];
  if (bloqueo.producto?.nombre) {
    parts.push(bloqueo.producto.nombre);
  }
  if (bloqueo.centro?.nombre) {
    parts.push(bloqueo.centro.nombre);
  }
  const startDate = bloqueo.fechaIni ? bloqueo.fechaIni.split('T')[0] : null;
  const endDate = bloqueo.fechaFin ? bloqueo.fechaFin.split('T')[0] : startDate;
  if (startDate) {
    if (endDate && endDate !== startDate) {
      parts.push(`${startDate} – ${endDate}`);
    } else {
      parts.push(startDate);
    }
  }
  return parts.filter(Boolean).join(' · ');
};

const formatTimeRange = (from, to) => {
  if (!from && !to) {
    return '—';
  }
  if (from && to) {
    if (from === to) {
      return from;
    }
    return `${from} – ${to}`;
  }
  return from ?? to ?? '—';
};

const getWeekdayKey = (isoDate) => {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const keys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return keys[date.getUTCDay()];
};

const timeStringToMinutes = (value) => {
  if (!value) {
    return null;
  }
  const [hourPart, minutePart = '0'] = value.split(':');
  const hour = Number.parseInt(hourPart, 10);
  const minute = Number.parseInt(minutePart, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }
  return hour * 60 + minute;
};

const buildDefaultSlots = () => {
  const slots = [];
  for (let minutes = DEFAULT_START_HOUR * 60; minutes <= DEFAULT_END_HOUR * 60; minutes += 30) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const label = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    slots.push({ id: label, label });
  }
  return slots;
};

const buildTimeSlots = (bloqueos) => {
  if (!Array.isArray(bloqueos) || bloqueos.length === 0) {
    return buildDefaultSlots();
  }
  let minMinutes = DEFAULT_START_HOUR * 60;
  let maxMinutes = DEFAULT_END_HOUR * 60;
  let hasTimeData = false;

  bloqueos.forEach((bloqueo) => {
    const startTime = bloqueo.fechaIni ? bloqueo.fechaIni.split('T')[1] : null;
    const endTime = bloqueo.fechaFin ? bloqueo.fechaFin.split('T')[1] : null;

    const start = timeStringToMinutes(startTime);
    const end = timeStringToMinutes(endTime);
    if (start != null) {
      hasTimeData = true;
      minMinutes = Math.min(minMinutes, start);
    }
    if (end != null) {
      hasTimeData = true;
      maxMinutes = Math.max(maxMinutes, end);
    }
  });

  if (!hasTimeData) {
    return buildDefaultSlots();
  }

  if (maxMinutes <= minMinutes) {
    maxMinutes = Math.min(23 * 60 + 30, minMinutes + 8 * 60);
  }

  minMinutes = Math.max(DEFAULT_START_HOUR * 60, Math.min(minMinutes, 23 * 60 + 30));
  maxMinutes = Math.max(minMinutes + 30, Math.min(maxMinutes, 23 * 60 + 30));

  const slots = [];
  for (let minutes = minMinutes; minutes <= maxMinutes; minutes += 30) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const label = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    slots.push({ id: label, label });
  }
  return slots;
};

const bloqueoAppliesToDate = (bloqueo, isoDate) => {
  if (!isoDate || !bloqueo.fechaIni) {
    return false;
  }
  const dateKey = isoDate;
  const from = bloqueo.fechaIni.split('T')[0];
  const to = bloqueo.fechaFin ? bloqueo.fechaFin.split('T')[0] : from;

  if (from > dateKey || to < dateKey) {
    return false;
  }

  return true;
};

const coversBloqueoSlot = (bloqueo, slot) => {
  const slotMinutes = timeStringToMinutes(slot.id);
  const startTime = bloqueo.fechaIni ? bloqueo.fechaIni.split('T')[1] : '00:00';
  const endTime = bloqueo.fechaFin ? bloqueo.fechaFin.split('T')[1] : '23:59';
  
  const startMinutes = timeStringToMinutes(startTime) ?? 0;
  const endMinutes = timeStringToMinutes(endTime) ?? 24 * 60;

  return slotMinutes != null && slotMinutes >= startMinutes && slotMinutes < endMinutes;
};

const mapStatusKey = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized.includes('pag') || normalized.includes('paid')) {
    return 'paid';
  }
  if (normalized.includes('fact')) {
    return 'invoiced';
  }
  return 'created';
};

const describeBloqueo = (bloqueo) => {
  const pieces = [];
  if (bloqueo.cliente?.nombre) {
    pieces.push(bloqueo.cliente.nombre);
  }
  if (bloqueo.centro?.nombre) {
    pieces.push(bloqueo.centro.nombre);
  }
  if (bloqueo.producto?.nombre) {
    pieces.push(bloqueo.producto.nombre);
  }
  return pieces.join(' · ');
};

const ALLOWED_PRODUCT_NAMES = new Set(['MA1A1', 'MA1A2', 'MA1A3', 'MA1A4', 'MA1A5']);

const isAulaProduct = (bloqueo) => {
  const productName = bloqueo?.producto?.nombre || '';
  return ALLOWED_PRODUCT_NAMES.has(productName);
};

const resolveDisplayTenantType = (bloqueo) => {
  const tenantType = resolveTenantType(bloqueo);
  if (isAulaProduct(bloqueo)) {
    return 'Usuario Aulas';
  }
  return tenantType;
};

const composeRooms = (bloqueos) => {
  const map = new Map();

  ALLOWED_PRODUCT_NAMES.forEach((roomName) => {
    map.set(roomName, {
      id: roomName,
      label: roomName,
      productId: null,
      centerName: null,
      centerCode: null
    });
  });

  if (!Array.isArray(bloqueos) || bloqueos.length === 0) {
    return Array.from(map.values()).sort((a, b) => (a.label || '').localeCompare(b.label || ''));
  }

  bloqueos.forEach((bloqueo) => {
    if (!bloqueo.producto?.id) {
      return;
    }
    const productName = bloqueo.producto?.nombre || '';
    if (!ALLOWED_PRODUCT_NAMES.has(productName)) {
      return;
    }

    const existing = map.get(productName) || {
      id: productName || bloqueo.producto.id,
      label: productName || `Room ${bloqueo.producto.id}`,
      productId: null,
      centerName: null,
      centerCode: null
    };

    map.set(productName, {
      ...existing,
      id: existing.id,
      label: productName || existing.label,
      productId: bloqueo.producto.id,
      centerName: bloqueo.centro?.nombre || existing.centerName,
      centerCode: bloqueo.centro?.codigo || existing.centerCode
    });
  });

  return Array.from(map.values()).sort((a, b) => (a.label || '').localeCompare(b.label || ''));
};

const BookingsTable = ({ bookings, onSelect }) => {
  const [page, setPage] = useState(0);
  const rowsPerPage = 25;

  const sortedBookings = useMemo(() => {
    const clone = [...bookings];
    clone.sort((a, b) => {
      // Sort newest first by creation timestamp, falling back to start date/time.
      const createdA = toTimestamp(a.createdAt);
      const createdB = toTimestamp(b.createdAt);
      if (createdA != null || createdB != null) {
        if (createdA == null) {
          return 1;
        }
        if (createdB == null) {
          return -1;
        }
        if (createdA !== createdB) {
          return createdB - createdA;
        }
      }
      const dateCompare = (b.dateFrom || '').localeCompare(a.dateFrom || '');
      if (dateCompare !== 0) {
        return dateCompare;
      }
      return (b.timeFrom || '').localeCompare(a.timeFrom || '');
    });
    return clone;
  }, [bookings]);

  const paginated = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedBookings.slice(start, start + rowsPerPage);
  }, [sortedBookings, page, rowsPerPage]);

  const handleChangePage = (_event, newPage) => {
    setPage(newPage);
  };

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <TableContainer>
        <Table size="small">
          <TableHead
            sx={{
              bgcolor: '#e6ffe8',
              boxShadow: 'inset 0 -1px 0 rgba(15, 118, 110, 0.35)',
              '& .MuiTableCell-head': {
                bgcolor: '#d9fbe5',
                color: '#14532d',
                fontWeight: 800,
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                borderBottom: 'none',
                py: 1.4,
                px: 3
              },
              '& .MuiTableCell-head:first-of-type': {
                borderTopLeftRadius: 14,
                pl: 3
              },
              '& .MuiTableCell-head:last-of-type': {
                borderTopRightRadius: 14,
                pr: 3
              }
            }}
          >
            <TableRow
            >
              <TableCell>User</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>Finish</TableCell>
              <TableCell align="center">People</TableCell>
              <TableCell>Payment status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((booking) => {
              const statusKey = mapStatusKey(booking.status);
              const statusStyle = statusStyles[statusKey] || statusStyles.created;
              const statusLabel = booking.status || statusLabels[statusKey] || 'Created';
              const centerLabel = booking.centerName || booking.centerCode || '—';
              const productLabel = booking.productName || booking.productType || '—';
              const startHour = booking.timeFrom ? booking.timeFrom : 'All day';
              const finishHour = booking.timeTo
                ? booking.timeTo
                : booking.timeFrom
                ? '—'
                : 'All day';
              return (
                <TableRow
                  key={booking.id}
                  hover
                  onClick={() => onSelect(booking)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{booking.clientName || '—'}</TableCell>
                  <TableCell>{centerLabel}</TableCell>
                  <TableCell>{booking.clientTenantType || '—'}</TableCell>
                  <TableCell>{productLabel}</TableCell>
                  <TableCell>{startHour}</TableCell>
                  <TableCell>{finishHour}</TableCell>
                  <TableCell>
                    <Chip
                      label={statusLabel}
                      size="small"
                      sx={{
                        bgcolor: statusStyle.bgcolor,
                        color: statusStyle.color,
                        border: '1px solid',
                        borderColor: statusStyle.borderColor
                      }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    No bookings found for this range.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={sortedBookings.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[rowsPerPage]}
      />
    </Paper>
  );
};

const AgendaTable = ({ bloqueos, onSelect, onDelete, deletingId }) => {
  const sortedBloqueos = useMemo(() => {
    const clone = [...bloqueos];
    clone.sort((a, b) => {
      const timeA = a.fechaIni ? timeStringToMinutes(a.fechaIni.split('T')[1]) : null;
      const timeB = b.fechaIni ? timeStringToMinutes(b.fechaIni.split('T')[1]) : null;
      const normalizedA = timeA != null ? timeA : -1;
      const normalizedB = timeB != null ? timeB : -1;
      if (normalizedA !== normalizedB) {
        return normalizedA - normalizedB;
      }
      return (a.cliente?.nombre || '').localeCompare(b.cliente?.nombre || '');
    });
    return clone;
  }, [bloqueos]);

  if (sortedBloqueos.length === 0) {
    return (
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', py: 6 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          No bloqueos scheduled for this date.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      <TableContainer>
        <Table size="small" sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: '#dcfce7',
                '& .MuiTableCell-head': {
                  position: 'relative',
                  fontWeight: 700,
                  textTransform: 'capitalize',
                  letterSpacing: '0.04em',
                  fontSize: '0.85rem',
                  color: '#166534',
                  borderBottom: '1px solid #bbf7d0',
                  py: 1.6,
                  px: 3,
                  backgroundColor: '#dcfce7'
                },
                '& .MuiTableCell-head:first-of-type': {
                  pl: 3,
                  pr: 4,
                  borderTopLeftRadius: 12
                },
                '& .MuiTableCell-head:nth-of-type(2)': {
                  pl: 2.5,
                  pr: 3
                },
                '& .MuiTableCell-head:last-of-type': {
                  pr: 3,
                  borderTopRightRadius: 12
                }
              }}
            >
              <TableCell
                sx={{
                  minWidth: 260,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                User
              </TableCell>
              <TableCell align="right" sx={{ width: 140 }}>Product</TableCell>
              <TableCell align="right" sx={{ width: 120 }}>Start</TableCell>
              <TableCell align="right" sx={{ width: 120 }}>Finish</TableCell>
              <TableCell align="right" sx={{ width: 90 }}>People</TableCell>
              <TableCell align="right" sx={{ width: 160 }}>Payment status</TableCell>
              {onDelete ? <TableCell align="right" sx={{ width: 72 }}>Actions</TableCell> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedBloqueos.map((bloqueo) => {
              const statusKey = mapStatusKey(bloqueo.estado);
              const statusStyle = statusStyles[statusKey] || statusStyles.created;
              const statusLabel = statusLabels[statusKey] || 'Created';
              const rawStatusLabel = bloqueo.estado || '';
              const startHour = bloqueo.fechaIni ? bloqueo.fechaIni.split('T')[1] : 'All day';
              const finishHour = bloqueo.fechaFin
                ? bloqueo.fechaFin.split('T')[1]
                : bloqueo.fechaIni
                ? '—'
                : 'All day';
              const attendees = Number.isFinite(bloqueo.asistentes)
                ? bloqueo.asistentes
                : bloqueo.asistentes != null
                ? bloqueo.asistentes
                : null;
              const chip = (
                <Chip
                  label={statusLabel}
                  size="small"
                  sx={{
                    bgcolor: statusStyle.bgcolor,
                    color: statusStyle.color,
                    border: '1px solid',
                    borderColor: statusStyle.borderColor,
                    width: 108,
                    justifyContent: 'center',
                    fontWeight: 600,
                    px: 1.5
                  }}
                />
              );

              const chipContent =
                rawStatusLabel && rawStatusLabel.toLowerCase() !== statusLabel.toLowerCase() ? (
                  <Tooltip title={rawStatusLabel}>{chip}</Tooltip>
                ) : (
                  chip
                );

              const isDeleting = deletingId === bloqueo.id;

              return (
                <TableRow
                  key={`agenda-${bloqueo.id}`}
                  hover
                  onClick={() => onSelect(bloqueo)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 320
                    }}
                  >
                    {bloqueo.cliente?.nombre || '—'}
                  </TableCell>
                  <TableCell align="right" sx={{ width: 140 }}>{bloqueo.producto?.nombre || '—'}</TableCell>
                  <TableCell align="right" sx={{ width: 120 }}>{startHour}</TableCell>
                  <TableCell align="right" sx={{ width: 120 }}>{finishHour}</TableCell>
                  <TableCell align="right" sx={{ width: 90 }}>{attendees ?? '—'}</TableCell>
                  <TableCell align="right" sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    {chipContent}
                  </TableCell>
                  {onDelete ? (
                    <TableCell align="right" sx={{ width: 72 }}>
                      <Tooltip title="Delete bloqueo">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={isDeleting}
                            onClick={(event) => {
                              event.stopPropagation();
                              onDelete(bloqueo.id);
                            }}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  ) : null}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

const DEFAULT_TIME_RANGE = { start: '09:00', end: '10:00' };
const DEFAULT_USER_TYPE = 'Usuario Aulas';
const ALLOWED_CENTRO_IDS = new Set([1, 8]);

const ReservaDialog = ({
  open,
  mode = 'create',
  onClose,
  onCreated,
  onUpdated,
  defaultDate,
  initialBloqueo
}) => {
  const isEditMode = mode === 'edit';
    const fieldStyles = {
      '& .MuiOutlinedInput-root': {
        minHeight: '48px',
        '& input': {
          color: '#1a1a1a',
          fontWeight: 500
        },
        '& input::placeholder': {
          color: '#666666',
          opacity: 1
        }
      },
      '& .MuiInputLabel-root': {
        color: '#666666',
        '&.Mui-focused': {
          color: '#fb923c'
        }
      }
    };
  const dialogTitle = isEditMode ? 'Edit bloqueo' : 'Create reserva';
  const dialogSubtitle = isEditMode
    ? 'Update the bloqueo details before saving.'
    : 'Add a new reservation to the system';
  const primaryActionLabel = isEditMode ? 'Save changes' : 'Create reserva';
  const DialogIcon = isEditMode ? EditRoundedIcon : AddRoundedIcon;

  const buildInitialState = useCallback(() => {
    const fallbackDate = defaultDate || initialDateISO();
    const extractDate = (isoString, fallback) => {
      if (!isoString) {
        return fallback;
      }
      const [datePart] = isoString.split('T');
      return datePart || fallback;
    };
    const extractTime = (isoString) => {
      if (!isoString) {
        return '';
      }
      const timePart = isoString.split('T')[1] || '';
      return timePart.slice(0, 5);
    };

    if (isEditMode && initialBloqueo) {
      const startDate = extractDate(initialBloqueo.fechaIni, fallbackDate);
      const endDate = extractDate(initialBloqueo.fechaFin, startDate);
      const startTimeRaw = extractTime(initialBloqueo.fechaIni);
      const endTimeRaw = extractTime(initialBloqueo.fechaFin);

      const contact = initialBloqueo.cliente
        ? {
            id: initialBloqueo.cliente.id,
            name: initialBloqueo.cliente.nombre || initialBloqueo.cliente.name || '',
            email: initialBloqueo.cliente.email || '',
            tenantType:
              initialBloqueo.cliente.tipoTenant ||
              initialBloqueo.cliente.tenantType ||
              resolveDisplayTenantType(initialBloqueo)
          }
        : null;

      const centro = initialBloqueo.centro
        ? {
            id: initialBloqueo.centro.id,
            name: initialBloqueo.centro.nombre || initialBloqueo.centro.name || '',
            code:
              initialBloqueo.centro.code ||
              initialBloqueo.centro.codigo ||
              initialBloqueo.centro.centroCode ||
              initialBloqueo.centro.codeCenter ||
              ''
          }
        : null;

      const reservationTypeRaw =
        initialBloqueo.tipoReserva ||
        initialBloqueo.reservationType ||
        initialBloqueo.tipo ||
        DEFAULT_RESERVATION_TYPE;

      const reservationType =
        RESERVATION_TYPE_OPTIONS.find(
          (option) => option.toLowerCase() === String(reservationTypeRaw || '').toLowerCase()
        ) || DEFAULT_RESERVATION_TYPE;
      const normalizedReservationType = reservationType.toLowerCase();

      const producto = initialBloqueo.producto
        ? {
            id: initialBloqueo.producto.id,
            name: initialBloqueo.producto.nombre || initialBloqueo.producto.name || '',
            type: initialBloqueo.producto.tipo || initialBloqueo.producto.type,
            centerCode:
              initialBloqueo.producto.centerCode ||
              initialBloqueo.producto.centroCodigo ||
              initialBloqueo.producto.centroCode ||
              (centro?.code ? centro.code.toLowerCase() : undefined)
          }
        : null;

      const weekSources =
        initialBloqueo.weekdays || initialBloqueo.dias || initialBloqueo.days || initialBloqueo.semana;
      const weekdays = Array.isArray(weekSources)
        ? weekSources
            .map((day) => (typeof day === 'string' ? day.toLowerCase() : day?.value || ''))
            .filter(Boolean)
        : [];

      const statusOption = (() => {
        const rawStatus = initialBloqueo.estado;
        if (STATUS_FORM_OPTIONS.includes(rawStatus)) {
          return rawStatus;
        }
        const key = mapStatusKey(rawStatus);
        if (key === 'paid') {
          return 'Paid';
        }
        if (key === 'invoiced') {
          return 'Invoiced';
        }
        return 'Created';
      })();

      return {
        contact,
        centro,
        producto,
        userType: contact?.tenantType || DEFAULT_USER_TYPE,
        reservationType,
        dateFrom: startDate,
        dateTo: endDate,
        startTime: startTimeRaw || (normalizedReservationType === 'por horas' ? DEFAULT_TIME_RANGE.start : ''),
        endTime: endTimeRaw || (normalizedReservationType === 'por horas' ? DEFAULT_TIME_RANGE.end : ''),
        weekdays,
        openEnded: Boolean(initialBloqueo.openEnded),
        tarifa:
          initialBloqueo.tarifa != null && initialBloqueo.tarifa !== ''
            ? String(initialBloqueo.tarifa)
            : '',
        attendees:
          initialBloqueo.asistentes != null && initialBloqueo.asistentes !== ''
            ? String(initialBloqueo.asistentes)
            : '',
        configuracion: initialBloqueo.configuracion ?? '',
        note: initialBloqueo.nota ?? '',
        status: statusOption
      };
    }

    return {
      contact: null,
      centro: null,
      producto: null,
      userType: DEFAULT_USER_TYPE,
      reservationType: DEFAULT_RESERVATION_TYPE,
      dateFrom: fallbackDate,
      dateTo: fallbackDate,
      startTime: DEFAULT_TIME_RANGE.start,
      endTime: DEFAULT_TIME_RANGE.end,
      weekdays: [],
      openEnded: false,
      tarifa: '',
      attendees: '',
      configuracion: '',
      note: '',
      status: STATUS_FORM_OPTIONS[0]
    };
  }, [defaultDate, initialBloqueo, isEditMode]);

  const [formState, setFormState] = useState(() => buildInitialState());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [contactOptions, setContactOptions] = useState([]);
  const [contactInputValue, setContactInputValue] = useState('');
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactFetchError, setContactFetchError] = useState('');

  const [centroOptions, setCentroOptions] = useState([]);
  const [productOptions, setProductOptions] = useState([]);
  const [lookupError, setLookupError] = useState('');
  const [lookupsLoading, setLookupsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setFormState(buildInitialState());
    setError('');
    setContactInputValue('');
  }, [open, buildInitialState]);

  useEffect(() => {
    if (!open) {
      return;
    }
    let active = true;
    setLookupsLoading(true);
    setLookupError('');
    Promise.all([fetchBookingCentros(), fetchBookingProductos()])
      .then(([centers, products]) => {
        if (!active) {
          return;
        }
        const filteredCenters = Array.isArray(centers)
          ? centers.filter((center) => ALLOWED_CENTRO_IDS.has(Number(center?.id)))
          : [];

        if (isEditMode && initialBloqueo?.centro?.id) {
          const exists = filteredCenters.some((center) => center?.id === initialBloqueo.centro.id);
          if (!exists) {
            filteredCenters.push({
              id: initialBloqueo.centro.id,
              name: initialBloqueo.centro.nombre || initialBloqueo.centro.name || '',
              code:
                initialBloqueo.centro.code ||
                initialBloqueo.centro.codigo ||
                initialBloqueo.centro.centroCode ||
                initialBloqueo.centro.codeCenter ||
                ''
            });
          }
        }

        const productList = Array.isArray(products) ? products.slice() : [];
        if (isEditMode && initialBloqueo?.producto?.id) {
          const exists = productList.some((product) => product?.id === initialBloqueo.producto.id);
          if (!exists) {
            productList.push({
              id: initialBloqueo.producto.id,
              name: initialBloqueo.producto.nombre || initialBloqueo.producto.name || '',
              type: initialBloqueo.producto.tipo || initialBloqueo.producto.type,
              centerCode:
                initialBloqueo.producto.centerCode ||
                initialBloqueo.producto.centroCodigo ||
                initialBloqueo.producto.centroCode ||
                (initialBloqueo.centro?.code ||
                  initialBloqueo.centro?.codigo ||
                  initialBloqueo.centro?.centroCode ||
                  '')
            });
          }
        }

        setCentroOptions(filteredCenters);
        setProductOptions(productList);
      })
      .catch((lookupErr) => {
        if (active) {
          setLookupError(lookupErr.message || 'Unable to load centros and productos.');
        }
      })
      .finally(() => {
        if (active) {
          setLookupsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [open, initialBloqueo, isEditMode]);

  useEffect(() => {
    if (!open) {
      return;
    }
    let active = true;
    setContactsLoading(true);
    setContactFetchError('');
    const handler = setTimeout(() => {
      const params = {};
      if (contactInputValue) {
        params.search = contactInputValue;
      }
      if (formState.userType) {
        params.tenantType = formState.userType;
      }

      fetchBookingContacts(params)
        .then((contacts) => {
          if (!active) {
            return;
          }
          const list = Array.isArray(contacts) ? contacts.slice() : [];
          if (isEditMode && initialBloqueo?.cliente?.id) {
            const exists = list.some((contact) => contact?.id === initialBloqueo.cliente.id);
            if (!exists) {
              list.push({
                id: initialBloqueo.cliente.id,
                name: initialBloqueo.cliente.nombre || initialBloqueo.cliente.name || '',
                email: initialBloqueo.cliente.email || '',
                tenantType:
                  initialBloqueo.cliente.tipoTenant ||
                  initialBloqueo.cliente.tenantType ||
                  resolveDisplayTenantType(initialBloqueo)
              });
            }
          }
          setContactOptions(list);
        })
        .catch((fetchError) => {
          if (active) {
            setContactFetchError(fetchError.message || 'Unable to load contacts.');
          }
        })
        .finally(() => {
          if (active) {
            setContactsLoading(false);
          }
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(handler);
    };
  }, [open, contactInputValue, formState.userType, initialBloqueo, isEditMode]);

  const userTypeOptions = useMemo(() => {
    const next = new Set([DEFAULT_USER_TYPE, ...CANONICAL_USER_TYPES]);
    contactOptions.forEach((option) => {
      if (option?.tenantType) {
        next.add(option.tenantType);
      }
    });
    if (formState.userType) {
      next.add(formState.userType);
    }
    return Array.from(next)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [contactOptions, formState.userType]);

  const filteredContactOptions = useMemo(() => {
    if (!formState.userType) {
      return contactOptions;
    }
    return contactOptions.filter((option) =>
      option?.tenantType?.toLowerCase() === formState.userType.toLowerCase()
    );
  }, [contactOptions, formState.userType]);

  const availableProducts = useMemo(() => {
    if (!formState.centro || !formState.centro.code) {
      return productOptions;
    }
    return productOptions.filter(
      (product) =>
        !product.centerCode ||
        product.centerCode.toLowerCase() === formState.centro.code.toLowerCase()
    );
  }, [formState.centro, productOptions]);

  const handleFieldChange = (field) => (event) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleToggleOpenEnded = (event) => {
    setFormState((prev) => ({ ...prev, openEnded: event.target.checked }));
  };

  const handleWeekdayToggle = (value) => () => {
    setFormState((prev) => {
      const hasValue = prev.weekdays.includes(value);
      const nextWeekdays = hasValue
        ? prev.weekdays.filter((day) => day !== value)
        : [...prev.weekdays, value];
      return { ...prev, weekdays: nextWeekdays };
    });
  };

  const handleUserTypeChange = (event) => {
    const value = event.target.value;
    setFormState((prev) => {
      const next = { ...prev, userType: value };
      if (value && prev.contact?.tenantType && prev.contact.tenantType.toLowerCase() !== value.toLowerCase()) {
        next.contact = null;
      }
      return next;
    });
  };

  const normalizedReservationType = (formState.reservationType || '').toLowerCase();
  const isPerHour = normalizedReservationType === 'por horas';
  const showWeekdays = normalizedReservationType === 'por horas' || normalizedReservationType === 'diaria';

  const handleReservationTypeChange = (event) => {
    const value = event.target.value;
    const normalized = (value || '').toLowerCase();
    const nextIsPerHour = normalized === 'por horas';
    const nextShowWeekdays = normalized === 'por horas' || normalized === 'diaria';

    setFormState((prev) => ({
      ...prev,
      reservationType: value,
      startTime: nextIsPerHour ? prev.startTime || DEFAULT_TIME_RANGE.start : '',
      endTime: nextIsPerHour ? prev.endTime || DEFAULT_TIME_RANGE.end : '',
      weekdays: nextShowWeekdays ? prev.weekdays : [],
      openEnded: nextShowWeekdays ? prev.openEnded : false
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const contactId = formState.contact?.id;
    const centroId = formState.centro?.id;
    const productoId = formState.producto?.id;

    if (!contactId) {
      setError('Please select a contact.');
      return;
    }
    if (!centroId) {
      setError('Please select a centro.');
      return;
    }
    if (!productoId) {
      setError('Please select a producto.');
      return;
    }

    if (!formState.dateFrom || !formState.dateTo) {
      setError('Both start and end dates are required.');
      return;
    }

    if (formState.dateFrom > formState.dateTo) {
      setError('Start date must be before end date.');
      return;
    }

    const attendees = attendeesValue === '' ? null : Number(attendeesValue);
    if (attendeesValue !== '' && !Number.isInteger(attendees)) {
      setError('Attendees must be a whole number.');
      return;
    }

    if (
      formState.centro?.code &&
      formState.producto?.centerCode &&
      formState.producto.centerCode.toLowerCase() !== formState.centro.code.toLowerCase()
    ) {
      setError('Selected product does not belong to the chosen centro.');
      return;
    }

    const orderedWeekdays = WEEKDAY_OPTIONS.map((option) => option.value).filter((value) =>
      formState.weekdays.includes(value)
    );

    const payload = {
      contactId,
      centroId,
      productoId,
      reservationType: formState.reservationType,
      dateFrom: formState.dateFrom,
      dateTo: formState.dateTo,
      timeSlots: isPerHour
        ? [
            {
              from: formState.startTime,
              to: formState.endTime
            }
          ]
        : [],
      weekdays: showWeekdays ? orderedWeekdays : [],
      openEnded: formState.openEnded,
      tarifa,
      attendees,
      configuracion: formState.configuracion || null,
      note: formState.note || null,
      status: formState.status
    };

    setSubmitting(true);
    try {
      if (isEditMode && initialBloqueo?.id) {
        const response = await updateBloqueo(initialBloqueo.id, payload);
        onUpdated?.(response);
      } else {
        const response = await createReserva(payload);
        onCreated?.(response);
      }
    } catch (apiError) {
      setError(
        apiError.message || (isEditMode ? 'Unable to update bloqueo.' : 'Unable to create reserva.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDialogClose = () => {
    if (!submitting) {
      onClose?.();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleDialogClose} 
      fullWidth 
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          maxWidth: '900px'
        }
      }}
    >
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogTitle 
          sx={{ 
            pb: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <DialogIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Stack>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                {dialogTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {dialogSubtitle}
              </Typography>
            </Stack>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            {lookupError ? <Alert severity="warning">{lookupError}</Alert> : null}
            {contactFetchError ? <Alert severity="warning">{contactFetchError}</Alert> : null}
            <Paper
              elevation={0}
              variant="outlined"
              sx={{ 
                p: { xs: 2, md: 3 }, 
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                '&:hover': {
                  borderColor: '#fb923c',
                  boxShadow: '0 4px 12px rgba(251, 146, 60, 0.1)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <Stack spacing={2.25}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                  sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)'
                    }}
                  />
                  <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                    Who &amp; where
                  </Typography>
                </Stack>
                <Grid container spacing={3} sx={{ width: '100%' }}>
                  {/* Contact field - full width */}
                  <Grid item xs={12} sx={{ display: 'block' }}>
                    <Autocomplete
                      options={filteredContactOptions}
                      value={formState.contact}
                      loading={contactsLoading}
                      onChange={(_event, newValue) =>
                        setFormState((prev) => ({
                          ...prev,
                          contact: newValue || null,
                          userType: prev.userType || newValue?.tenantType || ''
                        }))
                      }
                      onInputChange={(_event, newInputValue) => setContactInputValue(newInputValue)}
                      getOptionLabel={(option) => option?.name || option?.code || ''}
                      isOptionEqualToValue={(option, value) => option?.id === value?.id}
                      noOptionsText={formState.userType ? 'No contacts for this user type' : 'No contacts found'}
                      clearOnEscape
                      fullWidth
                      ListboxProps={{
                        style: {
                          maxHeight: '300px',
                          minWidth: '100%'
                        }
                      }}
                      renderOption={(props, option) => (
                        <li {...props} key={option.id} style={{ 
                          whiteSpace: 'nowrap', 
                          overflow: 'visible',
                          padding: '12px 16px',
                          minHeight: '48px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <Typography variant="body2" sx={{ 
                            overflow: 'visible',
                            whiteSpace: 'nowrap',
                            width: '100%',
                            fontWeight: 500,
                            color: '#1a1a1a'
                          }}>
                            {option.name || option.code || '—'}
                          </Typography>
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Contact"
                          placeholder="Search contact"
                          required
                          sx={{
                            ...fieldStyles,
                            '& .MuiOutlinedInput-root': {
                              ...fieldStyles['& .MuiOutlinedInput-root'],
                              fontSize: '16px',
                              minHeight: '56px'
                            }
                          }}
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <InputAdornment position="start">
                                  <SearchRoundedIcon fontSize="small" />
                                </InputAdornment>
                                {params.InputProps.startAdornment}
                              </>
                            ),
                            endAdornment: (
                              <>
                                {contactsLoading ? <CircularProgress color="inherit" size={18} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            )
                          }}
                        />
                      )}
                      disabled={submitting}
                    />
                  </Grid>
                  
                  {/* Centro field - full width */}
                  <Grid item xs={12} sx={{ display: 'block' }}>
                    <Autocomplete
                      fullWidth
                      options={centroOptions}
                      value={formState.centro}
                      loading={lookupsLoading}
                      onChange={(_event, newValue) => setFormState((prev) => ({ ...prev, centro: newValue || null }))}
                      getOptionLabel={(option) => option?.name || ''}
                      isOptionEqualToValue={(option, value) => option?.id === value?.id}
                      openOnFocus
                      autoHighlight
                      loadingText="Loading centros..."
                      noOptionsText="No centros found"
                      ListboxProps={{
                        style: {
                          maxHeight: '300px',
                          minWidth: '100%'
                        }
                      }}
                      renderOption={(props, option) => (
                        <li {...props} key={option.id} style={{ 
                          whiteSpace: 'nowrap', 
                          overflow: 'visible',
                          padding: '12px 16px',
                          minHeight: '48px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <Typography variant="body2" sx={{ 
                            overflow: 'visible',
                            whiteSpace: 'nowrap',
                            width: '100%',
                            fontWeight: 500,
                            color: '#1a1a1a'
                          }}>
                            {option.code ? `${option.code} · ` : ''}
                            {option.name || option.code || '—'}
                          </Typography>
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Centro"
                          fullWidth
                          required
                          sx={{
                            ...fieldStyles,
                            '& .MuiOutlinedInput-root': {
                              ...fieldStyles['& .MuiOutlinedInput-root'],
                              minHeight: '56px'
                            }
                          }}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {lookupsLoading ? <CircularProgress color="inherit" size={18} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            )
                          }}
                        />
                      )}
                      disabled={submitting}
                    />
                  </Grid>
                  
                  {/* Other fields in 2-column layout */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      label="User type"
                      value={formState.userType}
                      onChange={handleUserTypeChange}
                      fullWidth
                      disabled={submitting}
                      sx={fieldStyles}
                    >
                      <MenuItem value="">All user types</MenuItem>
                      {userTypeOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      fullWidth
                      options={availableProducts}
                      value={formState.producto}
                      loading={lookupsLoading}
                      onChange={(_event, newValue) => setFormState((prev) => ({ ...prev, producto: newValue || null }))}
                      getOptionLabel={(option) => option?.name || ''}
                      isOptionEqualToValue={(option, value) => option?.id === value?.id}
                      openOnFocus
                      autoHighlight
                      loadingText="Loading productos..."
                      noOptionsText="No productos found"
                      renderOption={(props, option) => (
                        <li {...props} key={option.id}>
                          <Typography variant="body2">
                            {option.name || '—'}
                            {option.type ? ` · ${option.type}` : ''}
                          </Typography>
                        </li>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Producto"
                          fullWidth
                          required
                          sx={fieldStyles}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {lookupsLoading ? <CircularProgress color="inherit" size={18} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            )
                          }}
                        />
                      )}
                      disabled={submitting}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      label="Reservation type"
                      value={formState.reservationType}
                      onChange={handleFieldChange('reservationType')}
                      fullWidth
                      disabled={submitting}
                      sx={fieldStyles}
                    >
                      {RESERVATION_TYPE_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      label="Status"
                      value={formState.status}
                      onChange={handleFieldChange('status')}
                      fullWidth
                      disabled={submitting}
                      sx={fieldStyles}
                    >
                      {STATUS_FORM_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              variant="outlined"
              sx={{ 
                p: { xs: 2, md: 3 }, 
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                '&:hover': {
                  borderColor: '#3b82f6',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <Stack spacing={2.25}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                    }}
                  />
                  <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                  Schedule &amp; status
                </Typography>
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      type="date"
                      label="Date from"
                      value={formState.dateFrom}
                      onChange={handleFieldChange('dateFrom')}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      required
                      disabled={submitting}
                      sx={fieldStyles}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      type="date"
                      label="Date to"
                      value={formState.dateTo}
                      onChange={handleFieldChange('dateTo')}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      required
                      disabled={submitting}
                      sx={fieldStyles}
                    />
                  </Grid>
                  {isPerHour ? (
                    <>
                      <Grid item xs={12} md={3}>
                        <TextField
                          type="time"
                          label="Start time"
                          value={formState.startTime}
                          onChange={handleFieldChange('startTime')}
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                          required
                          disabled={submitting}
                          inputProps={{ step: 3600 }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              minHeight: '48px'
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          type="time"
                          label="End time"
                          value={formState.endTime}
                          onChange={handleFieldChange('endTime')}
                          InputLabelProps={{ shrink: true }}
                          fullWidth
                          required
                          disabled={submitting}
                          inputProps={{ step: 3600 }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              minHeight: '48px'
                            }
                          }}
                        />
                      </Grid>
                    </>
                  ) : null}
                  <Grid item xs={12} md={isPerHour ? 4 : 6}>
                    <TextField
                      label="Tarifa (€)"
                      value={formState.tarifa}
                      onChange={handleFieldChange('tarifa')}
                      fullWidth
                      disabled={submitting}
                      sx={fieldStyles}
                    />
                  </Grid>
                </Grid>

                {showWeekdays ? (
                  <Box
                    sx={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 1.5
                    }}
                  >
                    <Typography variant="overline" color="text.secondary">
                      Weekdays
                    </Typography>
                    <FormGroup
                      row
                      sx={{
                        gap: 1,
                        flexWrap: 'wrap'
                      }}
                    >
                      {WEEKDAY_OPTIONS.map((day) => (
                        <FormControlLabel
                          key={day.value}
                          control={
                            <Checkbox
                              size="small"
                              checked={formState.weekdays.includes(day.value)}
                              onChange={handleWeekdayToggle(day.value)}
                              disabled={submitting}
                            />
                          }
                          label={day.shortLabel}
                        />
                      ))}
                    </FormGroup>
                    <Box sx={{ flexGrow: 1 }} />
                    <FormControlLabel
                      sx={{ ml: 'auto' }}
                      control={
                        <Switch
                          size="small"
                          checked={formState.openEnded}
                          onChange={handleToggleOpenEnded}
                          disabled={submitting}
                        />
                      }
                      label="Open ended"
                    />
                  </Box>
                ) : null}
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              variant="outlined"
              sx={{ 
                p: { xs: 2, md: 3 }, 
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                '&:hover': {
                  borderColor: '#10b981',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              <Stack spacing={2.25}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                    }}
                  />
                  <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                  Additional details
                </Typography>
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Attendees"
                      value={formState.attendees}
                      onChange={handleFieldChange('attendees')}
                      fullWidth
                      disabled={submitting}
                      sx={fieldStyles}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Configuración"
                      value={formState.configuracion}
                      onChange={handleFieldChange('configuracion')}
                      fullWidth
                      disabled={submitting}
                      sx={fieldStyles}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Note"
                      value={formState.note}
                      onChange={handleFieldChange('note')}
                      fullWidth
                      disabled={submitting}
                      multiline
                      minRows={2}
                      sx={fieldStyles}
                    />
                  </Grid>
                </Grid>
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions 
          sx={{ 
            px: 3, 
            py: 3,
            borderTop: '1px solid',
            borderColor: 'divider',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
          }}
        >
          <Button 
            onClick={handleDialogClose} 
            disabled={submitting}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                color: 'text.primary'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={submitting}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 8px 25px rgba(251, 146, 60, 0.3)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {submitting ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : primaryActionLabel}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

const DetailTile = ({ icon, label, primary, secondary, children }) => {
  const shouldShowDash =
    primary === undefined ||
    primary === null ||
    (typeof primary === 'string' && primary.trim() === '');

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        height: '100%',
        borderColor: 'rgba(148, 163, 184, 0.3)',
        backgroundColor: '#fff',
        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)'
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.75} alignItems="center">
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'rgba(29, 78, 216, 0.1)',
              color: '#1d4ed8'
            }}
          >
            {icon}
          </Box>
          <Stack spacing={0.25}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, letterSpacing: 0.6 }}
            >
              {label}
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {shouldShowDash ? '—' : primary}
            </Typography>
          </Stack>
        </Stack>
        {secondary ? (
          <Typography variant="body2" color="text.secondary">
            {secondary}
          </Typography>
        ) : null}
        {children}
      </Stack>
    </Paper>
  );
};

const BookingDetailsDialog = ({ booking, onClose }) => {
  const open = Boolean(booking);
  const statusKey = mapStatusKey(booking?.status);
  const statusColor = statusStyles[statusKey] || statusStyles.created;
  const statusLabel = statusLabels[statusKey] || booking?.status || 'Created';
  const clientInitials = useMemo(() => getInitials(booking?.clientName), [booking]);
  const attendees =
    typeof booking?.attendees === 'number' ? booking.attendees : booking?.attendees || '—';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 40px 80px rgba(15, 23, 42, 0.25)'
        }
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box
          sx={{
            px: 3,
            pt: 3,
            pb: 2,
            background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.16) 0%, rgba(14, 116, 144, 0.12) 100%)',
            borderBottom: '1px solid rgba(148, 163, 184, 0.25)'
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: '#1d4ed8',
                  color: '#fff',
                  width: 48,
                  height: 48,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}
              >
                {clientInitials}
              </Avatar>
              <Stack spacing={0.5}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {booking?.clientName || 'Booking details'}
                </Typography>
                {booking?.clientEmail ? (
                  <Typography variant="body2" color="text.secondary">
                    {booking.clientEmail}
                  </Typography>
                ) : null}
              </Stack>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              {booking ? (
                <Chip
                  label={statusLabel}
                  size="small"
                  sx={{
                    bgcolor: statusColor.bgcolor,
                    color: statusColor.color,
                    borderRadius: 1.5,
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: statusColor.borderColor
                  }}
                />
              ) : null}
              <IconButton
                aria-label="Close booking details"
                edge="end"
                onClick={onClose}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.6)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)'
                  }
                }}
              >
                <CloseRoundedIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Box>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          px: 3,
          py: 3,
          backgroundColor: 'rgba(248, 250, 252, 0.9)'
        }}
      >
        {booking ? (
          <Stack spacing={2.5}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <DetailTile
                  icon={<LocationOnRoundedIcon fontSize="small" />}
                  label="Center / Room"
                  primary={booking.centerName || booking.centerCode}
                  secondary={booking.productName || booking.productType || '—'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailTile
                  icon={<CalendarMonthRoundedIcon fontSize="small" />}
                  label="Date range"
                  primary={formatDateRange(booking.dateFrom, booking.dateTo)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailTile
                  icon={<AccessTimeRoundedIcon fontSize="small" />}
                  label="Time"
                  primary={formatTimeRange(booking.timeFrom, booking.timeTo)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailTile
                  icon={<EventRepeatRoundedIcon fontSize="small" />}
                  label="Reservation type"
                  primary={booking.reservationType}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailTile
                  icon={<CalendarViewWeekRoundedIcon fontSize="small" />}
                  label="Days"
                  primary={
                    booking.days && booking.days.length
                      ? `${booking.days.length} selected`
                      : 'No days selected'
                  }
                >
                  {booking.days && booking.days.length ? (
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1,
                        flexWrap: 'wrap'
                      }}
                    >
                      {booking.days.map((day) => {
                        const chipLabel = day.charAt(0).toUpperCase() + day.slice(1);
                        return (
                          <Chip
                            key={day}
                            label={chipLabel}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(79, 70, 229, 0.16)',
                              color: '#4338ca',
                              fontWeight: 600
                            }}
                          />
                        );
                      })}
                    </Box>
                  ) : null}
                </DetailTile>
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailTile
                  icon={<PeopleAltRoundedIcon fontSize="small" />}
                  label="Attendees"
                  primary={attendees}
                />
              </Grid>
            </Grid>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 2,
                borderColor: 'rgba(148, 163, 184, 0.3)',
                backgroundColor: '#fff',
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)'
              }}
            >
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1.75} alignItems="center">
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: 'rgba(14, 116, 144, 0.1)',
                      color: '#0e7490'
                    }}
                  >
                    <StickyNote2RoundedIcon fontSize="small" />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Notes
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {booking.notes && booking.notes.trim()
                    ? booking.notes
                    : 'No notes have been added for this booking.'}
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          py: 2.5,
          bgcolor: 'rgba(241, 245, 249, 0.8)'
        }}
      >
        {canEdit ? (
          <Button
            onClick={() => {
              if (bloqueo) {
                onEdit?.(bloqueo);
              }
              onClose?.();
            }}
            variant="outlined"
            startIcon={<EditRoundedIcon fontSize="small" />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Edit bloqueo
          </Button>
        ) : null}
        <Button onClick={onClose} variant="contained" sx={{ textTransform: 'none', fontWeight: 600 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const BloqueoDetailsDialog = ({ bloqueo, onClose, onEdit, onInvoice, invoiceLoading = false }) => {
  const open = Boolean(bloqueo);
  const canEdit = Boolean(onEdit);
  const statusKey = mapStatusKey(bloqueo?.estado);
  const statusColor = statusStyles[statusKey] || statusStyles.created;
  const statusLabel = bloqueo?.estado || statusLabels[statusKey] || 'Created';
  const canInvoice = Boolean(onInvoice) && statusKey !== 'invoiced';
  const infoChips = useMemo(() => {
    if (!bloqueo) {
      return [];
    }
    const items = [];
    if (bloqueo.tarifa != null && bloqueo.tarifa !== '') {
      items.push({ label: `Rate €${bloqueo.tarifa}`, color: statusStyles.paid });
    }
    if (Number.isFinite(bloqueo.asistentes)) {
      items.push({ label: `${bloqueo.asistentes} attendees`, color: statusStyles.available });
    }
    if (bloqueo.configuracion) {
      items.push({ label: `Setup ${bloqueo.configuracion}`, color: statusStyles.invoiced });
    }
    return items;
  }, [bloqueo]);
  const clientInitials = useMemo(
    () => getInitials(bloqueo?.cliente?.nombre || bloqueo?.producto?.nombre || 'B'),
    [bloqueo]
  );
  const attendeesLabel =
    bloqueo && (Number.isFinite(bloqueo.asistentes) || bloqueo.asistentes === 0)
      ? bloqueo.asistentes
      : bloqueo?.asistentes || '—';
  const tarifaLabel = useMemo(() => {
    if (!bloqueo || bloqueo.tarifa == null || bloqueo.tarifa === '') {
      return '—';
    }
    const numeric = Number(bloqueo.tarifa);
    if (!Number.isNaN(numeric)) {
      return `€${numeric.toLocaleString()}`;
    }
    return bloqueo.tarifa;
  }, [bloqueo]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 40px 80px rgba(15, 23, 42, 0.22)'
        }
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box
          sx={{
            px: 3,
            pt: 3,
            pb: 2,
            background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.18) 0%, rgba(56, 189, 248, 0.18) 100%)',
            borderBottom: '1px solid rgba(148, 163, 184, 0.25)'
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: '#1d4ed8',
                  color: '#fff',
                  width: 48,
                  height: 48,
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}
              >
                {clientInitials}
              </Avatar>
              <Stack spacing={0.5}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {bloqueo?.cliente?.nombre || bloqueo?.producto?.nombre || 'Bloqueo details'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {[bloqueo?.centro?.nombre, bloqueo?.producto?.nombre].filter(Boolean).join(' · ') || '—'}
                </Typography>
                {bloqueo?.cliente?.email ? (
                  <Typography variant="caption" color="text.secondary">
                    {bloqueo.cliente.email}
                  </Typography>
                ) : null}
              </Stack>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              {bloqueo ? (
                <Chip
                  label={statusLabel}
                  size="small"
                  sx={{
                    bgcolor: statusColor.bgcolor,
                    color: statusColor.color,
                    borderRadius: 1.5,
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: statusColor.borderColor
                  }}
                />
              ) : null}
              <IconButton
                aria-label="Close bloqueo details"
                edge="end"
                onClick={onClose}
                size="small"
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.6)',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)'
                  }
                }}
              >
                <CloseRoundedIcon />
              </IconButton>
            </Stack>
          </Stack>
        </Box>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{
          px: 3,
          py: 3,
          backgroundColor: 'rgba(248, 250, 252, 0.9)'
        }}
      >
        {bloqueo ? (
          <Stack spacing={2.5}>
            {infoChips.length ? (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {infoChips.map((chip) => (
                  <Chip
                    key={chip.label}
                    label={chip.label}
                    size="small"
                    sx={{
                      bgcolor: chip.color.bgcolor,
                      color: chip.color.color,
                      borderRadius: 1.5,
                      fontWeight: 600,
                      border: '1px solid',
                      borderColor: chip.color.borderColor
                    }}
                  />
                ))}
              </Stack>
            ) : null}
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <DetailTile
                  icon={<PersonRoundedIcon fontSize="small" />}
                  label="Client"
                  primary={bloqueo.cliente?.nombre}
                  secondary={bloqueo.cliente?.email}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailTile
                  icon={<LocationOnRoundedIcon fontSize="small" />}
                  label="Center / Product"
                  primary={bloqueo.centro?.nombre}
                  secondary={bloqueo.producto?.nombre}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailTile
                  icon={<PlayArrowRoundedIcon fontSize="small" />}
                  label="Start"
                  primary={formatDateTime(bloqueo.fechaIni)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailTile
                  icon={<FlagRoundedIcon fontSize="small" />}
                  label="End"
                  primary={formatDateTime(bloqueo.fechaFin)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailTile
                  icon={<SettingsSuggestRoundedIcon fontSize="small" />}
                  label="Configuration"
                  primary={bloqueo.configuracion}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailTile
                  icon={<GroupRoundedIcon fontSize="small" />}
                  label="Attendees"
                  primary={attendeesLabel}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailTile
                  icon={<EuroRoundedIcon fontSize="small" />}
                  label="Rate"
                  primary={tarifaLabel}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailTile
                  icon={<CalendarTodayRoundedIcon fontSize="small" />}
                  label="Created"
                  primary={formatDateTime(bloqueo.creacionFecha)}
                />
              </Grid>
            </Grid>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 2,
                borderColor: 'rgba(148, 163, 184, 0.3)',
                backgroundColor: '#fff',
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)'
              }}
            >
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1.75} alignItems="center">
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1.5,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: 'rgba(14, 116, 144, 0.1)',
                      color: '#0e7490'
                    }}
                  >
                    <StickyNote2RoundedIcon fontSize="small" />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Note
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {bloqueo.nota && bloqueo.nota.trim()
                    ? bloqueo.nota
                    : 'No notes have been added for this bloqueo.'}
                </Typography>
              </Stack>
            </Paper>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions
        sx={{
          px: 3,
          py: 2.5,
          bgcolor: 'rgba(241, 245, 249, 0.8)'
        }}
      >
        {canInvoice ? (
          <Button
            onClick={() => {
              if (bloqueo) {
                onInvoice?.(bloqueo);
              }
            }}
            variant="contained"
            color="primary"
            disabled={invoiceLoading}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Invoice bloqueo
          </Button>
        ) : null}
        {canEdit ? (
          <Button
            onClick={() => {
              if (bloqueo) {
                onEdit?.(bloqueo);
              }
              onClose?.();
            }}
            variant="outlined"
            startIcon={<EditRoundedIcon fontSize="small" />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Edit bloqueo
          </Button>
        ) : null}
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const InvoicePreviewDialog = ({ open, invoice, pdfUrl, loading, onClose }) => {
  return (
    <Dialog open={Boolean(open)} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Invoice preview</DialogTitle>
      <DialogContent sx={{ minHeight: 480 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : pdfUrl ? (
          <iframe title="Invoice PDF" src={pdfUrl} style={{ width: '100%', height: '600px', border: 'none' }} />
        ) : (
          <Stack spacing={2}>
            <Typography variant="body1">Invoice has been created.</Typography>
            <Typography variant="body2" color="text.secondary">
              No preview available. Use the Invoices tab to download or open the PDF.
            </Typography>
            {invoice?.id ? (
              <Button
                variant="contained"
                onClick={() => {
                  // open the invoice page in a new tab
                  const url = `/admin/invoices/${invoice.id}`;
                  window.open(url, '_blank');
                }}
              >
                Open invoice page
              </Button>
            ) : null}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const initialDateISO = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, '0');
  const day = `${today.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Booking = ({ mode = 'user' }) => {
  const isAdmin = mode === 'admin';
  const defaultAgendaUserType = '';
  const [view, setView] = useState('calendar');
  const [calendarDate, setCalendarDate] = useState(initialDateISO());
  const [agendaDate, setAgendaDate] = useState(initialDateISO());
  const [bloqueos, setBloqueos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedBloqueo, setSelectedBloqueo] = useState(null);
  const [filterUser, setFilterUser] = useState('');
  const [filterCenter, setFilterCenter] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterUserType, setFilterUserType] = useState(defaultAgendaUserType);
  const [deletingBloqueoId, setDeletingBloqueoId] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editBloqueo, setEditBloqueo] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, bloqueoId: null });
  const [invoiceDialog, setInvoiceDialog] = useState({ open: false, bloqueo: null });
  const [invoicePreview, setInvoicePreview] = useState({ open: false, invoice: null, pdfUrl: null, loading: false });
  const [invoiceForm, setInvoiceForm] = useState({ description: '', vat: '21', reference: '' });
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');

  const handleOpenCreateDialog = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const handleCloseCreateDialog = useCallback(() => {
    setCreateDialogOpen(false);
  }, []);

  const handleStartEditBloqueo = useCallback(
    (bloqueo) => {
      if (!bloqueo) {
        return;
      }
      setSelectedBloqueo(null);
      setEditBloqueo(bloqueo);
    },
    [setSelectedBloqueo]
  );

  const handleStartInvoice = useCallback(
    (bloqueo) => {
      if (!bloqueo) {
        return;
      }
      setSelectedBloqueo(null);
      setInvoiceDialog({ open: true, bloqueo });
      setInvoiceForm({
        description: buildInvoiceDescription(bloqueo),
        vat: '21',
        reference: ''
      });
      setInvoiceError('');
    },
    []
  );

  const handleCloseInvoiceDialog = useCallback(() => {
    if (invoiceSubmitting) {
      return;
    }
    setInvoiceDialog({ open: false, bloqueo: null });
    setInvoiceForm({ description: '', vat: '21', reference: '' });
    setInvoiceError('');
  }, [invoiceSubmitting]);

  const handleInvoiceFieldChange = useCallback(
    (field) => (event) => {
      const value = event.target.value;
      setInvoiceForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );
  function handleBloqueoUpdated(result) {
    const updated =
      (Array.isArray(result?.bloqueos) && result.bloqueos[0]) ||
      result?.bloqueo ||
      result;

    if (updated?.id) {
      setBloqueos((prev) => {
        if (!Array.isArray(prev)) {
          return prev;
        }
        let matched = false;
        const next = prev.map((entry) => {
          if (entry?.id === updated.id) {
            matched = true;
            return { ...entry, ...updated };
          }
          return entry;
        });
        return matched ? next : [...next, updated];
      });
      setSelectedBloqueo(updated);
    }
    setEditBloqueo(null);
  }


  const handleInvoiceSubmit = useCallback(async () => {
    if (!invoiceDialog.bloqueo || invoiceSubmitting) return;
    setInvoiceSubmitting(true);
    setInvoiceError('');
    try {
      const payload = { bloqueoIds: [invoiceDialog.bloqueo.id] };
      const vatValueRaw = invoiceForm.vat?.trim();
      if (vatValueRaw) {
        const parsed = Number(vatValueRaw.replace(',', '.'));
        if (!Number.isNaN(parsed)) payload.vatPercent = parsed;
      }
      if (invoiceForm.description && invoiceForm.description.trim()) {
        payload.description = invoiceForm.description.trim();
      }
      if (invoiceForm.reference && invoiceForm.reference.trim()) {
        payload.reference = invoiceForm.reference.trim();
      }

      console.log('Creating invoice payload:', payload);
      const response = await createInvoice(payload);

      // Update bloqueo state to reflect invoiced status
      const updatedBloqueo = {
        ...invoiceDialog.bloqueo,
        estado: 'Invoiced',
        edicionFecha: response?.issuedAt ?? new Date().toISOString()
      };
      handleBloqueoUpdated(updatedBloqueo);

      // Reset invoice form and close dialog
      setInvoiceForm({ description: '', vat: '21', reference: '' });
      setInvoiceDialog({ open: false, bloqueo: null });

      // Open invoice preview dialog and try to fetch PDF url
      try {
        setInvoicePreview((p) => ({ ...p, loading: true, open: true, invoice: response }));
        const url = await fetchInvoicePdfUrl(response.id);
        setInvoicePreview({ open: true, invoice: response, pdfUrl: url, loading: false });
      } catch (err) {
        console.error('Failed to fetch invoice PDF url:', err);
        setInvoicePreview({ open: true, invoice: response, pdfUrl: null, loading: false });
      }
    } catch (err) {
      setInvoiceError(err.message || 'Unable to create invoice.');
    } finally {
      setInvoiceSubmitting(false);
    }
  }, [invoiceDialog, invoiceForm, invoiceSubmitting, handleBloqueoUpdated]);

  const handleCloseEditDialog = useCallback(() => {
    setEditBloqueo(null);
  }, []);

  const handleReservaCreated = useCallback(
    (result) => {
      if (result?.bloqueos?.length) {
        setBloqueos((prev) => {
          const previous = Array.isArray(prev) ? prev : [];
          const existingIds = new Set(previous.map((entry) => entry?.id));
          const appended = result.bloqueos.filter((entry) => entry && !existingIds.has(entry.id));
          if (appended.length === 0) {
            return previous;
          }
          return [...previous, ...appended];
        });

        const primaryDate = result.bloqueos[0]?.fechaIni?.split?.('T')?.[0];
        if (primaryDate) {
          setCalendarDate(primaryDate);
          setAgendaDate(primaryDate);
        }
      }
      setCreateDialogOpen(false);
    },
    [setAgendaDate, setCalendarDate, setBloqueos]
  );

  

  const handleDeleteBloqueo = useCallback(
    (bloqueoId) => {
      if (!isAdmin || !bloqueoId) {
        return;
      }
      setConfirmDialog({ open: true, bloqueoId });
    },
    [isAdmin]
  );

  const handleConfirmDelete = useCallback(async () => {
    const bloqueoId = confirmDialog.bloqueoId;
    if (!bloqueoId) {
      setConfirmDialog({ open: false, bloqueoId: null });
      return;
    }
    setDeletingBloqueoId(bloqueoId);
    try {
      await deleteBloqueo(bloqueoId);
      setBloqueos((prev) => (Array.isArray(prev) ? prev.filter((item) => item?.id !== bloqueoId) : prev));
    } catch (deleteError) {
      console.error('Failed to delete bloqueo', deleteError);
      setError(deleteError.message || 'Unable to delete bloqueo');
    } finally {
      setDeletingBloqueoId(null);
      setConfirmDialog({ open: false, bloqueoId: null });
    }
  }, [confirmDialog, setBloqueos, setError]);

  const handleCloseConfirm = useCallback(() => {
    setConfirmDialog({ open: false, bloqueoId: null });
  }, []);

  const monthKey = useMemo(() => calendarDate.slice(0, 7), [calendarDate]);

  useEffect(() => {
    const [year, month] = monthKey.split('-').map((value) => Number.parseInt(value, 10));
    if (!year || !month) {
      return undefined;
    }

    const rangeStart = new Date(Date.UTC(year, month - 1, 1));
    const rangeEnd = new Date(Date.UTC(year, month, 0));

    const from = `${rangeStart.getUTCFullYear()}-${`${rangeStart.getUTCMonth() + 1}`.padStart(2, '0')}-${`${rangeStart.getUTCDate()}`.padStart(2, '0')}`;
    const to = `${rangeEnd.getUTCFullYear()}-${`${rangeEnd.getUTCMonth() + 1}`.padStart(2, '0')}-${`${rangeEnd.getUTCDate()}`.padStart(2, '0')}`;

    const controller = new AbortController();
    setLoading(true);
    setError('');

    fetchBloqueos({ from, to }, { signal: controller.signal })
      .then((data) => {
        setBloqueos(Array.isArray(data) ? data : []);
      })
      .catch((fetchError) => {
        if (fetchError.name === 'AbortError') {
          return;
        }
        console.error('Error fetching bloqueos:', fetchError);
        // If the API endpoint doesn't exist yet, show a helpful message
        if (fetchError.status === 404) {
          setError('Bloqueos API endpoint not yet implemented. Please check backend configuration.');
        } else {
          setError(fetchError.message || 'Unable to load bloqueos');
        }
        setBloqueos([]);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [monthKey, mode]);

  const filteredBloqueos = useMemo(() => {
    try {
      return (bloqueos || []).filter((bloqueo) => {
        const userLabel = bloqueo?.cliente?.nombre || '';
        if (filterUser && userLabel !== filterUser) {
          return false;
        }

        const centerLabel = bloqueo?.centro?.nombre || '';
        if (filterCenter && centerLabel !== filterCenter) {
          return false;
        }

        const productLabel = bloqueo?.producto?.nombre || '';
        if (filterProduct && productLabel !== filterProduct) {
          return false;
        }

        if (filterUserType) {
          const tenantType = resolveTenantType(bloqueo);
          const displayType = resolveDisplayTenantType(bloqueo);
          if (tenantType !== filterUserType && displayType !== filterUserType) {
            return false;
          }
        }

        if (filterEmail) {
          const email = (bloqueo?.cliente?.email || '').toLowerCase();
          if (!email.includes(filterEmail.toLowerCase())) {
            return false;
          }
        }

        return true;
      });
    } catch (error) {
      console.error('Error filtering bloqueos:', error);
      return [];
    }
  }, [bloqueos, filterUser, filterCenter, filterProduct, filterUserType, filterEmail]);

  const calendarBloqueos = useMemo(() => {
    try {
      return (filteredBloqueos || []).filter((bloqueo) => {
        const productName = bloqueo?.producto?.nombre || '';
        if (!ALLOWED_PRODUCT_NAMES.has(productName)) {
          return false;
        }
        return bloqueoAppliesToDate(bloqueo, calendarDate);
      });
    } catch (error) {
      console.error('Error filtering day bloqueos:', error);
      return [];
    }
  }, [filteredBloqueos, calendarDate]);

  const timeSlots = useMemo(() => {
    try {
      return buildTimeSlots(calendarBloqueos || []);
    } catch (error) {
      console.error('Error building time slots:', error);
      return [];
    }
  }, [calendarBloqueos]);

  const rooms = useMemo(() => {
    try {
      return composeRooms(calendarBloqueos || []);
    } catch (error) {
      console.error('Error composing rooms:', error);
      return [];
    }
  }, [calendarBloqueos]);

  const filterOptions = useMemo(() => {
    const users = new Set();
    const centers = new Set();
    const products = new Set();
    const userTypes = new Set();

    (bloqueos || []).forEach((bloqueo) => {
      if (bloqueo.cliente?.nombre) {
        users.add(bloqueo.cliente.nombre);
      }
      if (bloqueo.centro?.nombre) {
        centers.add(bloqueo.centro.nombre);
      }
      if (bloqueo.producto?.nombre) {
        products.add(bloqueo.producto.nombre);
      }
      const resolvedType = resolveTenantType(bloqueo);
      if (resolvedType) {
        userTypes.add(resolvedType);
      }
      const displayType = resolveDisplayTenantType(bloqueo);
      if (displayType) {
        userTypes.add(displayType);
      }
    });

    const sorter = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' });

    userTypes.add('Usuario Aulas');

    return {
      users: Array.from(users).sort(sorter),
      centers: Array.from(centers).sort(sorter),
      products: Array.from(products).sort(sorter),
      userTypes: Array.from(userTypes).sort(sorter)
    };
  }, [bloqueos]);

  const agendaBloqueos = useMemo(() => {
    if (!agendaDate) {
      return filteredBloqueos || [];
    }
    return (filteredBloqueos || []).filter((bloqueo) => bloqueoAppliesToDate(bloqueo, agendaDate));
  }, [filteredBloqueos, agendaDate]);

  const agendaRangeLabel = useMemo(() => {
    if (!agendaDate) {
      return 'Showing all bloqueos.';
    }
    return `Showing bloqueos on ${formatDate(agendaDate)}.`;
  }, [agendaDate]);

  const getSlotStatus = (room, slot) => {
    try {
      const bloqueo = (calendarBloqueos || []).find(
        (entry) => entry?.producto?.id === room.productId && coversBloqueoSlot(entry, slot)
      );
      if (!bloqueo) {
        return { status: 'available', bloqueo: null };
      }
      return { status: mapStatusKey(bloqueo.estado), bloqueo };
    } catch (error) {
      console.error('Error getting slot status:', error);
      return { status: 'available', bloqueo: null };
    }
  };

  const handleViewChange = (_event, newValue) => {
    if (newValue) {
      setView(newValue);
    }
  };

  const handleCalendarDateChange = (event) => {
    setCalendarDate(event.target.value);
  };

  const handleAgendaDateChange = (event) => {
    setAgendaDate(event.target.value);
  };

  const handleSelectBloqueo = (bloqueo) => {
    if (bloqueo) {
      setSelectedBloqueo(bloqueo);
    }
  };

  const calendarDateLabel = useMemo(() => formatDate(calendarDate), [calendarDate]);

  const noDataMessage = isAdmin
    ? `No bloqueos found for ${calendarDateLabel}. Try a different range or center.`
    : `No bloqueos registered for your account on ${calendarDateLabel}.`;

  return (
    <Stack spacing={4}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
      >
        <Stack spacing={1}>
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            {isAdmin ? 'Workspace bloqueos' : 'My bloqueos'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isAdmin
              ? 'Browse every bloqueo across BeWorking locations. Switch between calendar and agenda views to review occupancy, statuses, and tenants.'
              : 'Track your bloqueos, check upcoming slots, and review bloqueo details from the calendar or agenda views.'}
          </Typography>
        </Stack>
        {isAdmin ? (
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={handleOpenCreateDialog}
            disableElevation
            sx={{
              minWidth: 160,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1,
              background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 8px 25px rgba(251, 146, 60, 0.3)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            New reserva
          </Button>
        ) : null}
      </Stack>

      <Tabs value={view} onChange={handleViewChange} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tab label="Calendar" value="calendar" disableRipple />
        <Tab label="Agenda" value="agenda" disableRipple />
      </Tabs>

      {error && <Alert severity="error">{error}</Alert>}

      {view === 'calendar' ? (
        <Stack spacing={3}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                type="date"
                label="Select date"
                value={calendarDate}
                onChange={handleCalendarDateChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={8}>
              <Legend />
            </Grid>
          </Grid>

          {loading ? (
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', py: 8 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={32} />
              </Box>
            </Paper>
          ) : rooms.length === 0 ? (
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', py: 6 }}>
              <Typography variant="body2" color="text.secondary" align="center">
                {noDataMessage}
              </Typography>
            </Paper>
          ) : (
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflowX: 'auto' }}>
              <TableContainer sx={{ minWidth: 800 }}>
                <Table
                  size="small"
                  stickyHeader
                  sx={{
                    '& .MuiTableCell-root': {
                      borderRight: '1px solid rgba(148, 163, 184, 0.12)'
                    },
                    '& .MuiTableRow-root': {
                      borderBottom: '1px solid rgba(148, 163, 184, 0.12)'
                    }
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          width: 220,
                          position: 'sticky',
                          left: 0,
                          backgroundColor: 'background.paper',
                          zIndex: 2,
                          borderRight: '1px solid rgba(148, 163, 184, 0.32)',
                          boxShadow: '4px 0 12px rgba(15, 23, 42, 0.06)'
                        }}
                      >
                        Room
                      </TableCell>
                      {timeSlots.map((slot) => (
                        <TableCell key={slot.id} align="center">
                          <Typography variant="subtitle2" fontWeight="bold">
                            {slot.label}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow key={room.id} hover>
                        <TableCell
                          sx={{
                            position: 'sticky',
                            left: 0,
                            backgroundColor: 'background.paper',
                            zIndex: 1,
                            borderRight: '1px solid rgba(148, 163, 184, 0.24)',
                            boxShadow: '2px 0 8px rgba(15, 23, 42, 0.04)'
                          }}
                        >
                          <Stack spacing={0.5}>
                            <Typography variant="body2" fontWeight="medium">
                              {room.label}
                            </Typography>
                          </Stack>
                        </TableCell>
                        {timeSlots.map((slot) => {
                          const { status, bloqueo } = getSlotStatus(room, slot);
                          const styles = status ? (statusStyles[status] || statusStyles.created) : statusStyles.available;
                          return (
                            <TableCell
                              key={`${room.id}-${slot.id}`}
                              align="center"
                              sx={{ p: 0.75, width: 64, maxWidth: 64 }}
                            >
                              <Tooltip
                                arrow
                                title={bloqueo ? describeBloqueo(bloqueo) : 'Available slot'}
                              >
                                <Box
                                  onClick={() => bloqueo && handleSelectBloqueo(bloqueo)}
                                  sx={{
                                    height: 52,
                                    width: '100%',
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: styles.borderColor,
                                    bgcolor: styles.bgcolor,
                                    color: styles.color,
                                    cursor: bloqueo ? 'pointer' : 'default',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: (theme) => theme.transitions.create('transform'),
                                    '&:hover': {
                                      transform: bloqueo ? 'scale(1.03)' : 'none'
                                    }
                                  }}
                                >
                                  {bloqueo ? (
                                    <Typography variant="caption" fontWeight={600} noWrap>
                                      {getInitials(bloqueo.cliente?.nombre || bloqueo.producto?.nombre || 'Bloqueado')}
                                    </Typography>
                                  ) : null}
                                </Box>
                              </Tooltip>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </Stack>
      ) : (
        <Stack spacing={3}>
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, minmax(0, 1fr))',
                lg: 'repeat(3, minmax(0, 1fr))'
              }
            }}
          >
            <TextField
              type="date"
              label="Agenda date"
              value={agendaDate}
              onChange={handleAgendaDateChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <Autocomplete
              options={filterOptions.users || []}
              value={filterUser || null}
              onChange={(_event, newValue) => setFilterUser(newValue || '')}
              isOptionEqualToValue={(option, value) => option === value}
              noOptionsText="No contacts found"
              clearOnEscape
              fullWidth
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Contact"
                  placeholder="Search contact"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <SearchRoundedIcon fontSize="small" />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    )
                  }}
                />
              )}
            />
            <TextField
              label="Filter by email"
              value={filterEmail}
              onChange={(event) => setFilterEmail(event.target.value)}
              placeholder="Search by email"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                )
              }}
            />
            <TextField
              select
              label="Centro"
              value={filterCenter}
              onChange={(event) => setFilterCenter(event.target.value)}
              fullWidth
            >
              <MenuItem value="">All centros</MenuItem>
              {(filterOptions.centers || []).map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="User type"
              value={filterUserType}
              onChange={(event) => setFilterUserType(event.target.value)}
              fullWidth
            >
              <MenuItem value="">All user types</MenuItem>
              {(filterOptions.userTypes || []).map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Producto"
              value={filterProduct}
              onChange={(event) => setFilterProduct(event.target.value)}
              fullWidth
            >
              <MenuItem value="">All productos</MenuItem>
              {(filterOptions.products || []).map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {agendaRangeLabel}
          </Typography>
          <Legend />

          {loading ? (
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', py: 8 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={32} />
              </Box>
            </Paper>
          ) : (
            <AgendaTable
              bloqueos={agendaBloqueos}
              onSelect={handleSelectBloqueo}
              onDelete={isAdmin ? handleDeleteBloqueo : undefined}
              deletingId={deletingBloqueoId}
            />
          )}
        </Stack>
      )}
      {isAdmin ? (
        <ReservaDialog
          open={createDialogOpen}
          mode="create"
          onClose={handleCloseCreateDialog}
          onCreated={handleReservaCreated}
          defaultDate={calendarDate}
        />
      ) : null}

      {isAdmin ? (
        <ReservaDialog
          open={Boolean(editBloqueo)}
          mode="edit"
          onClose={handleCloseEditDialog}
          onUpdated={handleBloqueoUpdated}
          initialBloqueo={editBloqueo}
          defaultDate={calendarDate}
        />
      ) : null}

      <BloqueoDetailsDialog
        bloqueo={selectedBloqueo}
        onClose={() => setSelectedBloqueo(null)}
        onEdit={isAdmin ? handleStartEditBloqueo : undefined}
        onInvoice={isAdmin ? handleStartInvoice : undefined}
        invoiceLoading={invoiceSubmitting}
      />
      <InvoicePreviewDialog
        open={invoicePreview.open}
        invoice={invoicePreview.invoice}
        pdfUrl={invoicePreview.pdfUrl}
        loading={invoicePreview.loading}
        onClose={() => setInvoicePreview({ open: false, invoice: null, pdfUrl: null, loading: false })}
      />
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseConfirm}
        aria-labelledby="delete-bloqueo-title"
      >
        <DialogTitle id="delete-bloqueo-title">Delete bloqueo</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will remove the bloqueo from the agenda. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirm}>Cancel</Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={Boolean(deletingBloqueoId)}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
export default Booking;
