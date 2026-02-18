import { useCallback, useEffect, useMemo, useState } from 'react';
import { TimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, parseISO } from 'date-fns';
import { alpha, useTheme } from '@mui/material/styles';
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
import InputAdornment from '@mui/material/InputAdornment';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import IconButton from '@mui/material/IconButton';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';

import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SettingsSuggestRoundedIcon from '@mui/icons-material/SettingsSuggestRounded';
import EventRepeatRoundedIcon from '@mui/icons-material/EventRepeatRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import EuroRoundedIcon from '@mui/icons-material/EuroRounded';
import GroupRoundedIcon from '@mui/icons-material/GroupRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import CalendarViewWeekRoundedIcon from '@mui/icons-material/CalendarViewWeekRounded';
import StickyNote2RoundedIcon from '@mui/icons-material/StickyNote2Rounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';

import {
  createReserva,
  fetchBloqueos,
  fetchBookingContacts,
  fetchBookingCentros,
  fetchBookingProductos,
  deleteBloqueo,
  updateBloqueo,
  fetchPublicAvailability,
  fetchPublicCentros,
  fetchPublicProductos
} from '../../api/bookings.js';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Divider from '@mui/material/Divider';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import DeskRoundedIcon from '@mui/icons-material/DeskRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import IosShareOutlinedIcon from '@mui/icons-material/IosShareOutlined';
import { createInvoice, fetchInvoicePdfUrl } from '../../api/invoices.js';
import {
  fetchCustomerPaymentMethods,
  chargeCustomer,
  createStripeInvoice,
} from '../../api/stripe.js';
import { CANONICAL_USER_TYPES } from './admin/contactConstants.js';
import BookingFlowPage from '../booking/BookingFlowPage';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n.js';
import esBooking from '../../i18n/locales/es/booking.json';
import enBooking from '../../i18n/locales/en/booking.json';
if (!i18n.hasResourceBundle('es', 'booking')) {
  i18n.addResourceBundle('es', 'booking', esBooking);
  i18n.addResourceBundle('en', 'booking', enBooking);
}

const DEFAULT_START_HOUR = 6;
const DEFAULT_END_HOUR = 24;

// Colors are now defined in theme.js - use theme.palette.brand.green/greenHover and theme.palette.brand.green/orangeHover
const DEFAULT_RESERVATION_TYPE = 'Por Horas';
const RESERVATION_TYPE_OPTIONS = ['Por Horas', 'Diaria', 'Mensual'];
const STATUS_FORM_OPTIONS = ['Booked', 'Invoiced', 'Paid'];
const WEEKDAY_OPTIONS = [
  { value: 'monday', label: 'Monday', shortLabel: 'Mon' },
  { value: 'tuesday', label: 'Tuesday', shortLabel: 'Tue' },
  { value: 'wednesday', label: 'Wednesday', shortLabel: 'Wed' },
  { value: 'thursday', label: 'Thursday', shortLabel: 'Thu' },
  { value: 'friday', label: 'Friday', shortLabel: 'Fri' },
  { value: 'saturday', label: 'Saturday', shortLabel: 'Sat' },
  { value: 'sunday', label: 'Sunday', shortLabel: 'Sun' }
];

// Calendar utilities for user booking flow
// Hardcoded calendar status colors to match beworking-booking palette
// (the dashboard theme maps warning/secondary/error to green shades,
//  but the calendar needs distinct colors for each status).
// Hardcoded calendar status colors (shared across admin + user views).
// available = light gray | paid = green | invoiced = red | created = orange
const CALENDAR_COLORS = {
  available: { bg: '#a1a1aa', border: '#a1a1aa', text: '#52525b' },
  paid:      { bg: '#009624', border: '#009624', text: '#007a1d' },
  invoiced:  { bg: '#ef4444', border: '#dc2626', text: '#b91c1c' },
  created:   { bg: '#f59e0b', border: '#f59e0b', text: '#d97706' }
};

const userCalendarStatusStyles = () => ({
  available: {
    bgcolor: alpha(CALENDAR_COLORS.available.bg, 0.15),
    borderColor: CALENDAR_COLORS.available.border,
    color: CALENDAR_COLORS.available.text
  },
  paid: {
    bgcolor: alpha(CALENDAR_COLORS.paid.bg, 0.18),
    borderColor: CALENDAR_COLORS.paid.border,
    color: CALENDAR_COLORS.paid.text
  },
  invoiced: {
    bgcolor: alpha(CALENDAR_COLORS.invoiced.bg, 0.18),
    borderColor: CALENDAR_COLORS.invoiced.border,
    color: CALENDAR_COLORS.invoiced.text
  },
  created: {
    bgcolor: alpha(CALENDAR_COLORS.created.bg, 0.15),
    borderColor: CALENDAR_COLORS.created.border,
    color: CALENDAR_COLORS.created.text
  }
});

// Booking flow step labels
const BOOKING_STEP_LABELS = ['stepper.selectDetails', 'stepper.contactBilling', 'stepper.reviewPayment'];

// Unified view toggle tabs style (used by both admin and user views)
const getViewToggleTabsStyle = (theme) => ({
  minHeight: 36,
  bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.05) : alpha(theme.palette.common.black, 0.04),
  borderRadius: 2,
  p: 0.5,
  '& .MuiTabs-indicator': { display: 'none' },
  '& .MuiTabs-flexContainer': { gap: 0.5 },
  '& .MuiTab-root': {
    minHeight: 32,
    minWidth: 'auto',
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.875rem',
    borderRadius: 1.5,
    px: 2,
    py: 0.75,
    color: 'text.secondary',
    transition: 'all 0.15s ease',
    '&.Mui-selected': {
      color: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.primary.main,
      bgcolor: theme.palette.mode === 'dark' ? theme.palette.primary.main : theme.palette.background.paper,
      boxShadow: theme.palette.mode === 'dark' ? 'none' : theme.shadows[1],
    },
    '&:hover:not(.Mui-selected)': {
      bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.08) : alpha(theme.palette.common.black, 0.04),
    }
  }
});

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

const getStatusStyles = () => ({
  available: {
    bgcolor: alpha(CALENDAR_COLORS.available.bg, 0.15),
    borderColor: CALENDAR_COLORS.available.border,
    color: CALENDAR_COLORS.available.text
  },
  paid: {
    bgcolor: alpha(CALENDAR_COLORS.paid.bg, 0.18),
    borderColor: CALENDAR_COLORS.paid.border,
    color: CALENDAR_COLORS.paid.text
  },
  invoiced: {
    bgcolor: alpha(CALENDAR_COLORS.invoiced.bg, 0.18),
    borderColor: CALENDAR_COLORS.invoiced.border,
    color: CALENDAR_COLORS.invoiced.text
  },
  created: {
    bgcolor: alpha(CALENDAR_COLORS.created.bg, 0.15),
    borderColor: CALENDAR_COLORS.created.border,
    color: CALENDAR_COLORS.created.text
  }
});

const statusLabels = {
  available: 'Available',
  paid: 'Paid',
  invoiced: 'Invoiced',
  created: 'Booked'
};

const LEGEND_STATUSES = ['available', 'paid', 'invoiced', 'created'];

const Legend = () => {
  const theme = useTheme();
  const { t } = useTranslation('booking');
  const statusStyles = getStatusStyles(theme);
  const statusToTranslationKey = { available: 'available', paid: 'paid', invoiced: 'invoiced', created: 'booked' };

  return (
    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
      {LEGEND_STATUSES.map((status) => (
        <Stack key={status} direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 16,
              height: 16,
              borderRadius: 2,
              border: '1px solid',
              borderColor: statusStyles[status].borderColor,
              bgcolor: statusStyles[status].bgcolor
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {t('status.' + (statusToTranslationKey[status] || status))}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
};

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

const getFilterFieldSx = (theme) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    backgroundColor: theme.palette.background.paper
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.info.main
  },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.grey[400]
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.grey[300]
  },
  '& .MuiInputAdornment-root': {
    color: theme.palette.text.disabled
  }
});

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

// Helper functions for TimePicker
const timeStringToDate = (timeString) => {
  if (!timeString) return null;
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const dateToTimeString = (date) => {
  if (!date) return '';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
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

// User booking helper functions
const padTimeUser = (minutes) => {
  const hour = Math.floor(minutes / 60).toString().padStart(2, '0');
  const minute = (minutes % 60).toString().padStart(2, '0');
  return `${hour}:${minute}`;
};

const buildTimeSlotsWithBoundsUser = (minMinutes, maxMinutes) => {
  const slots = [];
  for (let minutes = minMinutes; minutes <= maxMinutes; minutes += 30) {
    slots.push({ id: padTimeUser(minutes), label: padTimeUser(minutes) });
  }
  return slots;
};

const buildTimeSlotsUser = (startHour = 6, endHour = 22) => buildTimeSlotsWithBoundsUser(startHour * 60, endHour * 60);

const extractTimeFromISO = (isoString) => {
  if (!isoString) return null;
  const parts = isoString.split('T');
  if (parts.length < 2) return null;
  return parts[1].slice(0, 5);
};

const mapUserStatusKey = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized.includes('pag') || normalized.includes('paid')) return 'paid';
  if (normalized.includes('fact') || normalized.includes('invoice')) return 'invoiced';
  return 'created';
};

const describeBloqueoUser = (bloqueo) => {
  if (!bloqueo) return i18n.t('admin.availableSlot', { ns: 'booking' });
  const pieces = [];
  if (bloqueo.cliente?.nombre) pieces.push(bloqueo.cliente.nombre);
  if (bloqueo.centro?.nombre) pieces.push(bloqueo.centro.nombre);
  if (bloqueo.producto?.nombre) pieces.push(bloqueo.producto.nombre);
  const from = extractTimeFromISO(bloqueo.fechaIni);
  const to = extractTimeFromISO(bloqueo.fechaFin);
  if (from && to) pieces.push(`${from} – ${to}`);
  return pieces.join(' · ');
};

const bloqueoCoversSlotUser = (bloqueo, slotId) => {
  const slotMinutes = timeStringToMinutes(slotId);
  if (slotMinutes == null) return false;
  const startMinutes = timeStringToMinutes(extractTimeFromISO(bloqueo.fechaIni)) ?? 0;
  const endMinutes = timeStringToMinutes(extractTimeFromISO(bloqueo.fechaFin)) ?? 24 * 60;
  return slotMinutes >= startMinutes && slotMinutes < endMinutes;
};

const buildTimeSlotsFromBloqueosUser = (bloqueos = []) => {
  if (!Array.isArray(bloqueos) || bloqueos.length === 0) return buildTimeSlotsUser();
  let min = 6 * 60;
  let max = 22 * 60;
  let hasData = false;
  bloqueos.forEach((bloqueo) => {
    const start = timeStringToMinutes(extractTimeFromISO(bloqueo.fechaIni));
    const end = timeStringToMinutes(extractTimeFromISO(bloqueo.fechaFin));
    if (start != null) { min = Math.min(min, start); hasData = true; }
    if (end != null) { max = Math.max(max, end); hasData = true; }
  });
  if (!hasData) return buildTimeSlotsUser();
  const clampedMin = Math.max(0, Math.min(min, 22 * 60));
  const clampedMax = Math.min(Math.max(clampedMin + 30, max), 23 * 60 + 30);
  return buildTimeSlotsWithBoundsUser(clampedMin, clampedMax);
};

const getInitialsUser = (value) => {
  if (!value) return '';
  const normalized = value.trim();
  if (!normalized) return '';
  const parts = normalized.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const [first, second] = parts;
  return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
};

const addMinutesToTime = (timeString, minutesToAdd) => {
  const minutes = timeStringToMinutes(timeString);
  if (minutes == null) return timeString;
  const total = minutes + minutesToAdd;
  const normalized = Math.max(0, Math.min(total, 24 * 60));
  return padTimeUser(normalized);
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
  // recognize both legacy spanish 'fact' and english 'invoice' / 'invoiced'
  if (normalized.includes('fact') || normalized.includes('invoice') || normalized.includes('invoiced')) {
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
  const theme = useTheme();
  const { t } = useTranslation('booking');
  const statusStyles = getStatusStyles(theme);
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
            bgcolor: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.success.main, 0.1)
                : alpha(theme.palette.success.main, 0.08),
              boxShadow: `inset 0 -1px 0 ${alpha(theme.palette.success.main, 0.25)}`,
              '& .MuiTableCell-head': {
                bgcolor: theme.palette.mode === 'dark'
                  ? alpha(theme.palette.success.main, 0.15)
                  : alpha(theme.palette.success.main, 0.12),
                color: theme.palette.success.dark,
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
              <TableCell>{t('admin.user')}</TableCell>
              <TableCell>{t('admin.product')}</TableCell>
              <TableCell>{t('admin.start')}</TableCell>
              <TableCell>{t('admin.finish')}</TableCell>
              <TableCell align="center">{t('admin.people')}</TableCell>
              <TableCell>{t('admin.paymentStatus')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((booking) => {
              const statusKey = mapStatusKey(booking.status);
              const statusStyle = statusStyles[statusKey] || statusStyles.created;
              const statusLabel = booking.status || t('status.' + (statusKey === 'created' ? 'booked' : statusKey)) || t('status.booked');
              const centerLabel = booking.centerName || booking.centerCode || '—';
              const productLabel = booking.productName || booking.productType || '—';
              const startHour = booking.timeFrom ? booking.timeFrom : t('admin.allDay');
              const finishHour = booking.timeTo
                ? booking.timeTo
                : booking.timeFrom
                ? '—'
                : t('admin.allDay');
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
  const theme = useTheme();
  const { t } = useTranslation('booking');
  const statusStyles = getStatusStyles(theme);
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
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell
                sx={{
                  minWidth: 260,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontWeight: 'bold'
                }}
              >
                {t('admin.user')}
              </TableCell>
              <TableCell align="right" sx={{ width: 140, fontWeight: 'bold' }}>{t('admin.product')}</TableCell>
              <TableCell align="right" sx={{ width: 120, fontWeight: 'bold' }}>{t('admin.start')}</TableCell>
              <TableCell align="right" sx={{ width: 120, fontWeight: 'bold' }}>{t('admin.finish')}</TableCell>
              <TableCell align="right" sx={{ width: 90, fontWeight: 'bold' }}>{t('admin.people')}</TableCell>
              <TableCell align="right" sx={{ width: 160, fontWeight: 'bold' }}>{t('admin.paymentStatus')}</TableCell>
              {onDelete ? <TableCell align="right" sx={{ width: 72, fontWeight: 'bold' }}>{t('userView.actions')}</TableCell> : null}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedBloqueos.map((bloqueo) => {
              const statusKey = mapStatusKey(bloqueo.estado);
              const statusStyle = statusStyles[statusKey] || statusStyles.created;
              const statusLabel = t('status.' + (statusKey === 'created' ? 'booked' : statusKey));
              const rawStatusLabel = bloqueo.estado || '';
              const startHour = bloqueo.fechaIni ? bloqueo.fechaIni.split('T')[1] : t('admin.allDay');
              const finishHour = bloqueo.fechaFin
                ? bloqueo.fechaFin.split('T')[1]
                : bloqueo.fechaIni
                ? '—'
                : t('admin.allDay');
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
                      <Tooltip title={t('admin.deleteBloqueo')}>
                        <span>
                          <IconButton
                            size="small"
                            disabled={isDeleting}
                            onClick={(event) => {
                              event.stopPropagation();
                              onDelete(bloqueo.id);
                            }}
                            sx={{ color: 'secondary.main', '&:hover': { color: 'secondary.dark', bgcolor: (theme) => theme.palette.brand.greenSoft } }}
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
  const theme = useTheme();
  const { t } = useTranslation('booking');
  const isEditMode = mode === 'edit';
    const baseInputStyles = {
      minHeight: 40,
      borderRadius: 8,
      backgroundColor: theme.palette.common.white,
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.grey[300]
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.grey[400]
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main
      },
      '& input': {
        fontSize: 14,
        fontWeight: 500,
        color: theme.palette.text.primary
      },
      '& .MuiSvgIcon-root': {
        color: theme.palette.text.disabled
      }
    };

    const baseLabelStyles = {
      fontSize: 13,
      fontWeight: 600,
      color: theme.palette.text.secondary,
      '&.Mui-focused': {
        color: theme.palette.primary.main
      }
    };

    const fieldStyles = {
      '& .MuiOutlinedInput-root': baseInputStyles,
      '& .MuiInputLabel-root': baseLabelStyles
    };

    const selectFieldStyles = {
      '& .MuiOutlinedInput-root': {
        ...baseInputStyles,
        '& .MuiSelect-select': {
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontWeight: 500
        }
      },
      '& .MuiInputLabel-root': baseLabelStyles
    };
  const dialogTitle = isEditMode ? t('admin.editBloqueo') : t('dialog.createReserva');
  const dialogSubtitle = isEditMode
    ? t('admin.editReservation')
    : t('dialog.addReservation');
  const primaryActionLabel = isEditMode ? t('admin.saveChanges') : t('dialog.createReserva');
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
        return 'Booked';
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
  const [selectedContact, setSelectedContact] = useState(null);

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
    setSelectedContact(null);
  }, [open, buildInitialState]);

  // Handle contact search
  useEffect(() => {
    if (!contactInputValue.trim()) {
      setContactOptions([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      setContactsLoading(true);
      setContactFetchError('');
      
      const params = {
        search: contactInputValue.trim()
      };
      if (formState.userType) {
        params.tenantType = formState.userType;
      }

      fetchBookingContacts(params)
        .then((contacts) => {
          const list = Array.isArray(contacts) ? contacts.slice() : [];
          setContactOptions(list);
        })
        .catch((fetchError) => {
          setContactFetchError(fetchError.message || t('admin.unableToLoadContacts'));
        })
        .finally(() => {
          setContactsLoading(false);
        });
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [contactInputValue, formState.userType]);

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
          setLookupError(lookupErr.message || t('admin.unableToLoadCentrosProductos'));
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


  const availableProducts = useMemo(() => {
    let filtered = productOptions;
    
    // Filter by center
    if (formState.centro && formState.centro.code) {
      filtered = filtered.filter(
        (product) =>
          !product.centerCode ||
          product.centerCode.toLowerCase() === formState.centro.code.toLowerCase()
      );
    }
    
    // Filter by user type - if "Usuario Aulas" is selected, only show aula products
    if (formState.userType === 'Usuario Aulas') {
      filtered = filtered.filter((product) => 
        ALLOWED_PRODUCT_NAMES.has(product.name)
      );
    }
    
    return filtered;
  }, [formState.centro, formState.userType, productOptions]);

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
      // Clear selected product when user type changes to ensure consistency
      next.producto = null;
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

    const contactId = selectedContact?.id;
    const centroId = formState.centro?.id;
    const productoId = formState.producto?.id;

    if (!contactId) {
      setError(t('steps.pleaseSelectContact'));
      return;
    }
    if (!centroId) {
      setError(t('admin.pleaseSelectCentro'));
      return;
    }
    if (!productoId) {
      setError(t('admin.pleaseSelectProducto'));
      return;
    }

    if (!formState.dateFrom || !formState.dateTo) {
      setError(t('steps.datesRequired'));
      return;
    }

    if (formState.dateFrom > formState.dateTo) {
      setError(t('steps.startDateBeforeEnd'));
      return;
    }

    const attendees = formState.attendees === '' ? null : Number(formState.attendees);
    if (formState.attendees !== '' && !Number.isInteger(attendees)) {
      setError(t('admin.attendeesWholeNumber'));
      return;
    }

    if (
      formState.centro?.code &&
      formState.producto?.centerCode &&
      formState.producto.centerCode.toLowerCase() !== formState.centro.code.toLowerCase()
    ) {
      setError(t('admin.productNotInCentro'));
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
        apiError.message || (isEditMode ? t('admin.unableToUpdateBloqueo') : t('admin.unableToCreateReserva'))
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
          boxShadow: theme.shadows[6],
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
            backgroundColor: 'background.paper'
          }}
        >
            <Stack>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                {dialogTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {dialogSubtitle}
              </Typography>
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
                backgroundColor: 'background.paper'
              }}
            >
              <Stack spacing={2.25}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                  sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main'
                    }}
                  />
                  <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                    Who &amp; where
                </Typography>
                </Stack>
                <Grid container spacing={2}>
                  {/* Contact search */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ position: 'relative' }}>
                      <TextField
                        fullWidth
                        label={t('admin.searchByName')}
                        value={contactInputValue}
                        onChange={(e) => setContactInputValue(e.target.value)}
                        placeholder={t('admin.searchByName')}
                        required
                        size="small"
                        sx={fieldStyles}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <SearchRoundedIcon sx={{ color: 'text.disabled' }} />
                            </InputAdornment>
                          ),
                          endAdornment: contactsLoading ? (
                            <CircularProgress color="inherit" size={18} />
                          ) : selectedContact ? (
                            <InputAdornment position="end">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedContact(null);
                                  setContactInputValue('');
                                }}
                                sx={{ color: 'text.disabled' }}
                              >
                                <CloseRoundedIcon fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          ) : null
                        }}
                      />
                      {contactInputValue && contactOptions.length > 0 && !selectedContact && (
                        <Paper
                          elevation={3}
                          sx={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            zIndex: 1000,
                            maxHeight: 200,
                            overflow: 'auto',
                            mt: 1
                          }}
                        >
                          {contactOptions.map((contact) => (
                            <Box
                              key={contact.id}
                              onClick={() => {
                                setSelectedContact(contact);
                                setContactInputValue(contact.name || contact.code || '');
                                setFormState(prev => ({
                                  ...prev,
                                  userType: prev.userType || contact.tenantType || ''
                                }));
                              }}
                              sx={{
                                p: 2,
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: 'grey.100' }
                              }}
                            >
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {contact.name || contact.code || '—'}
                              </Typography>
                            </Box>
                          ))}
                        </Paper>
                      )}
                    </Box>
                  </Grid>

                  {/* Centro */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t('admin.centro')}
                      value={formState.centro?.name || ''}
                      onChange={(e) => {
                        const selectedCentro = centroOptions.find(c => c.name === e.target.value);
                        setFormState((prev) => ({ ...prev, centro: selectedCentro || null }));
                      }}
                      placeholder={t('admin.selectCentro')}
                      required
                      size="small"
                      select
                      SelectProps={{
                        displayEmpty: true,
                        renderValue: (value) => value === '' ? t('admin.allCentros') : value
                      }}
                      sx={selectFieldStyles}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationOnRoundedIcon sx={{ color: 'text.disabled' }} />
                          </InputAdornment>
                        ),
                      }}
                    >
                      <MenuItem value="">{t('admin.allCentros')}</MenuItem>
                      {centroOptions.map((option) => (
                        <MenuItem key={option.id} value={option.name}>
                          {option.code ? `${option.code} · ` : ''}
                          {option.name || option.code || '—'}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* User Type */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label={t('admin.userType')}
                      value={formState.userType}
                      onChange={handleUserTypeChange}
                      placeholder={t('admin.selectUserType')}
                      required
                      size="small"
                      select
                      SelectProps={{
                        displayEmpty: true,
                        renderValue: (value) => value === '' ? t('admin.allUserTypes') : value
                      }}
                      sx={selectFieldStyles}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonRoundedIcon sx={{ color: 'text.disabled' }} />
                          </InputAdornment>
                        ),
                      }}
                    >
                      <MenuItem value="">{t('admin.allUserTypes')}</MenuItem>
                      {userTypeOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Producto */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label={t('admin.producto')}
                      value={formState.producto?.name || ''}
                      onChange={(e) => {
                        const selectedProduct = availableProducts.find(p => p.name === e.target.value);
                        setFormState((prev) => ({ ...prev, producto: selectedProduct || null }));
                      }}
                      placeholder={t('admin.selectProducto')}
                      required
                      size="small"
                      select
                      SelectProps={{
                        displayEmpty: true,
                        renderValue: (value) => value === '' ? t('admin.allProducts') : value
                      }}
                      sx={selectFieldStyles}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SettingsSuggestRoundedIcon sx={{ color: 'text.disabled' }} />
                          </InputAdornment>
                        ),
                      }}
                    >
                      <MenuItem value="">{t('admin.allProducts')}</MenuItem>
                      {availableProducts.map((option) => (
                        <MenuItem key={option.id} value={option.name}>
                          {option.name || '—'}
                          {option.type ? ` · ${option.type}` : ''}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Reservation Type */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label={t('admin.reservationType')}
                      value={formState.reservationType}
                      onChange={handleReservationTypeChange}
                      placeholder={t('admin.selectReservationType')}
                      required
                      size="small"
                      select
                      SelectProps={{
                        displayEmpty: true,
                        renderValue: (value) => value === '' ? t('admin.allReservationTypes') : t('reservationType.' + value)
                      }}
                      sx={selectFieldStyles}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EventRepeatRoundedIcon sx={{ color: 'text.disabled' }} />
                          </InputAdornment>
                        ),
                      }}
                    >
                      <MenuItem value="">{t('admin.allReservationTypes')}</MenuItem>
                      {RESERVATION_TYPE_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {t('reservationType.' + option)}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  {/* Status */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label={t('admin.status')}
                      value={formState.status}
                      onChange={handleFieldChange('status')}
                      placeholder={t('admin.selectStatus')}
                      required
                      size="small"
                      select
                      SelectProps={{
                        displayEmpty: true,
                        renderValue: (value) => value === '' ? t('admin.allStatuses') : t('status.' + value.toLowerCase())
                      }}
                      sx={selectFieldStyles}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <FlagRoundedIcon sx={{ color: 'text.disabled' }} />
                          </InputAdornment>
                        ),
                      }}
                    >
                      <MenuItem value="">{t('admin.allStatuses')}</MenuItem>
                      <MenuItem value="Booked">{t('status.booked')}</MenuItem>
                      <MenuItem value="Pendiente">{t('status.pending')}</MenuItem>
                      <MenuItem value="Paid">{t('status.paid')}</MenuItem>
                    </TextField>
                  </Grid>

                  {/* Tarifa */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label={t('admin.tarifaLabel')}
                      value={formState.tarifa}
                      onChange={handleFieldChange('tarifa')}
                      placeholder={t('admin.enterTarifa')}
                      required
                      size="small"
                      sx={fieldStyles}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EuroRoundedIcon sx={{ color: 'text.disabled' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
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
                backgroundColor: 'background.paper'
              }}
            >
              <Stack spacing={2.25}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'info.main'
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
                      label={t('admin.dateFrom')}
                      value={formState.dateFrom}
                      onChange={handleFieldChange('dateFrom')}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      required
                      disabled={submitting}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      type="date"
                      label={t('admin.dateTo')}
                      value={formState.dateTo}
                      onChange={handleFieldChange('dateTo')}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      required
                      disabled={submitting}
                      size="small"
                    />
                  </Grid>
                  {isPerHour ? (
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <Grid item xs={12} md={3}>
                        <TimePicker
                          label={t('admin.startTime')}
                          value={timeStringToDate(formState.startTime)}
                          onChange={(newValue) => {
                            const timeString = dateToTimeString(newValue);
                            setFormState((prev) => ({ ...prev, startTime: timeString }));
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              required: true,
                              disabled: submitting,
                              size: 'small',
                              InputLabelProps: { shrink: true }
                            }
                          }}
                          minutesStep={30}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TimePicker
                          label={t('admin.endTime')}
                          value={timeStringToDate(formState.endTime)}
                          onChange={(newValue) => {
                            const timeString = dateToTimeString(newValue);
                            setFormState((prev) => ({ ...prev, endTime: timeString }));
                          }}
                          slotProps={{
                            textField: {
                              fullWidth: true,
                              required: true,
                              disabled: submitting,
                              size: 'small',
                              InputLabelProps: { shrink: true }
                            }
                          }}
                          minutesStep={30}
                        />
                      </Grid>
                    </LocalizationProvider>
                  ) : null}
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
                          label={t('days.' + day.value.slice(0, 3))}
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
                      label={t('admin.openEnded')}
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
                backgroundColor: 'background.paper'
              }}
            >
              <Stack spacing={2.25}>
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'success.light'
                    }}
                  />
                  <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                  Additional details
                </Typography>
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label={t('admin.attendees')}
                      value={formState.attendees}
                      onChange={handleFieldChange('attendees')}
                      fullWidth
                      disabled={submitting}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PeopleAltRoundedIcon sx={{ color: 'text.disabled' }} />
                          </InputAdornment>
                        )
                      }}
                    />
              </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label={t('admin.configuracion')}
                      value={formState.configuracion}
                      onChange={handleFieldChange('configuracion')}
                      fullWidth
                      disabled={submitting}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MeetingRoomRoundedIcon sx={{ color: 'text.disabled' }} />
                          </InputAdornment>
                        )
                      }}
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
            backgroundColor: 'background.paper'
          }}
        >
          <Button 
            onClick={handleDialogClose} 
            disabled={submitting}
            variant="outlined"
            sx={{
              minWidth: 120,
              height: 36,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                color: 'primary.dark',
                backgroundColor: (theme) => `${theme.palette.primary.main}14`,
                transform: 'translateY(-1px)',
                boxShadow: (theme) => `0 4px 12px ${theme.palette.primary.main}33`
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            CANCEL
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={submitting}
            sx={{
              minWidth: 120,
              height: 36,
              textTransform: 'none',
              fontWeight: 600,
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.dark'
              }
            }}
          >
            {submitting ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : primaryActionLabel.toUpperCase()}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

const DetailTile = ({ icon, label, primary, secondary, children }) => {
  const theme = useTheme();
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
        borderColor: alpha(theme.palette.divider, 0.6),
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[3]
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
              bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
              color: 'info.main'
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
  const theme = useTheme();
  const { t } = useTranslation('booking');
  const statusStyles = getStatusStyles(theme);
  const open = Boolean(booking);
  const statusKey = mapStatusKey(booking?.status);
  const statusColor = statusStyles[statusKey] || statusStyles.created;
  const statusLabel = t('status.' + (statusKey === 'created' ? 'booked' : statusKey));
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
          boxShadow: theme.shadows[8]
        }
      }}
    >
      <DialogTitle sx={{ p: 0 }}>
        <Box
          sx={{
            px: 3,
            pt: 3,
            pb: 2,
            background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.16)} 0%, ${alpha(
              theme.palette.secondary.main,
              0.12
            )} 100%)`,
            borderBottom: '1px solid',
            borderBottomColor: alpha(theme.palette.divider, 0.6)
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                      bgcolor: 'info.main',
                      color: 'info.contrastText',
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
                  {booking?.clientName || t('admin.bookingDetails')}
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
                aria-label={t('admin.closeBookingDetails')}
                edge="end"
                onClick={onClose}
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.common.white, 0.6),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.common.white, 0.9)
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
          backgroundColor: alpha(theme.palette.background.default, 0.9)
        }}
      >
        {booking ? (
          <Stack spacing={2.5}>
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <DetailTile
                  icon={<LocationOnRoundedIcon fontSize="small" />}
                  label={t('admin.centro') + ' / ' + t('userView.room')}
                  primary={booking.centerName || booking.centerCode}
                  secondary={booking.productName || booking.productType || '—'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailTile
                  icon={<CalendarMonthRoundedIcon fontSize="small" />}
                  label={t('admin.dateRange')}
                  primary={formatDateRange(booking.dateFrom, booking.dateTo)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailTile
                  icon={<AccessTimeRoundedIcon fontSize="small" />}
                  label={t('admin.time')}
                  primary={formatTimeRange(booking.timeFrom, booking.timeTo)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailTile
                  icon={<EventRepeatRoundedIcon fontSize="small" />}
                  label={t('admin.reservationType')}
                  primary={booking.reservationType ? t('reservationType.' + booking.reservationType) : '—'}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DetailTile
                  icon={<CalendarViewWeekRoundedIcon fontSize="small" />}
                  label={t('admin.days')}
                  primary={
                    booking.days && booking.days.length
                      ? `${booking.days.length} selected`
                      : t('admin.noDaysSelected')
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
                        const chipLabel = t('days.' + day);
                        return (
                          <Chip
                            key={day}
                            label={chipLabel}
                            size="small"
                            sx={{
                              bgcolor: (theme) => alpha(theme.palette.info.main, 0.16),
                              color: 'info.dark',
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
                  label={t('admin.attendees')}
                  primary={attendees}
                />
              </Grid>
            </Grid>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 2,
                borderColor: alpha(theme.palette.divider, 0.6),
                backgroundColor: 'background.paper',
                boxShadow: theme.shadows[3]
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
                      bgcolor: alpha(theme.palette.info.dark, 0.1),
                      color: 'info.dark'
                    }}
                  >
                    <StickyNote2RoundedIcon fontSize="small" />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {t('admin.notes')}
                </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {booking.notes && booking.notes.trim()
                    ? booking.notes
                    : t('admin.noNotesAdded')}
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
          bgcolor: alpha(theme.palette.background.default, 0.8)
        }}
      >
            {canInvoice ? (
              <Button
                onClick={() => {
                  // start invoice flow (parent provided handler will set invoiceDialog state)
                  onInvoice?.(bloqueo);
                }}
                variant="contained"
                color="primary"
                disableElevation
                sx={{ textTransform: 'none', fontWeight: 600, mr: 1 }}
                startIcon={<EuroRoundedIcon fontSize="small" />}
                disabled={invoiceLoading}
              >
                {t('admin.invoice')}
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
                sx={{ textTransform: 'none', fontWeight: 600, mr: 1 }}
              >
                {t('admin.editBloqueo')}
              </Button>
            ) : null}
            <Button onClick={onClose} variant="contained" sx={{ textTransform: 'none', fontWeight: 600 }}>
              {t('steps.close')}
            </Button>
      </DialogActions>
    </Dialog>
  );
};

    const InvoiceFormDialog = ({ open, bloqueo, form, onFieldChange, onClose, onSubmit, submitting, error }) => {
      const { t } = useTranslation('booking');
      const tarifaLabel = bloqueo?.tarifa ? `€${Number(bloqueo.tarifa).toLocaleString()}` : '—';
      return (
        <Dialog open={Boolean(open)} onClose={onClose} maxWidth="md" fullWidth>
          <DialogTitle>{t('admin.createInvoice')}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2}>
              <Typography variant="subtitle1">{t('admin.contact')}: {bloqueo?.cliente?.nombre || '—'}</Typography>
              <Typography variant="body2" color="text.secondary">{t('admin.centro')} / {t('admin.producto')}: {bloqueo?.producto?.nombre || bloqueo?.producto?.centerCode || '—'}</Typography>
              <Typography variant="body2">{t('admin.start')}: {bloqueo ? formatDateTime(bloqueo.fechaInicio || bloqueo.start) : '—'}</Typography>
              <Typography variant="body2">{t('admin.end')}: {bloqueo ? formatDateTime(bloqueo.fechaFin || bloqueo.end) : '—'}</Typography>
              <Typography variant="body2">{t('admin.tarifaLabel')}: {tarifaLabel}</Typography>
              <TextField label={t('admin.description')} fullWidth multiline minRows={2} value={form.description} onChange={onFieldChange('description')} />
              <TextField label={t('admin.reference')} fullWidth value={form.reference} onChange={onFieldChange('reference')} />
              <TextField label={`${t('steps.vat')} %`} value={form.vat} onChange={onFieldChange('vat')} sx={{ width: 140 }} />
              <Alert severity="warning">
                {t('admin.invoiceWarning')}
              </Alert>
              {error ? <Alert severity="error">{error}</Alert> : null}
            </Stack>
      </DialogContent>
      <DialogActions>
            <Button onClick={onClose}>{t('admin.cancel')}</Button>
            <Button onClick={onSubmit} variant="contained" disabled={submitting}>
              {submitting ? <CircularProgress size={18} /> : t('admin.createInvoice')}
            </Button>
      </DialogActions>
    </Dialog>
  );
};

const BloqueoDetailsDialog = ({ bloqueo, onClose, onEdit, onInvoice, invoiceLoading = false }) => {
  const theme = useTheme();
  const { t } = useTranslation('booking');
  const open = Boolean(bloqueo);
  const canEdit = Boolean(onEdit);
  const canInvoice = Boolean(onInvoice);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formState, setFormState] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Payment state
  const [paymentOption, setPaymentOption] = useState('');
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState('');
  const [cardsLoading, setCardsLoading] = useState(false);
  const [invoiceDueDays, setInvoiceDueDays] = useState(30);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const buildFormState = (b) => {
    const reservationTypeRaw =
      b.tipoReserva || b.reservationType || b.tipo || 'Por Horas';
    return {
      cliente: b.cliente?.nombre || '',
      clienteId: b.cliente?.id || null,
      clienteEmail: b.cliente?.email || '',
      centro: b.centro?.nombre || '',
      centroId: b.centro?.id || null,
      producto: b.producto?.nombre || '',
      productoId: b.producto?.id || null,
      dateFrom: b.fechaIni ? format(parseISO(b.fechaIni), 'yyyy-MM-dd') : '',
      dateTo: b.fechaFin ? format(parseISO(b.fechaFin), 'yyyy-MM-dd') : '',
      horaIni: b.fechaIni ? format(parseISO(b.fechaIni), 'HH:mm') : '',
      horaFin: b.fechaFin ? format(parseISO(b.fechaFin), 'HH:mm') : '',
      asistentes: b.asistentes ?? '',
      tarifa: b.tarifa ?? '',
      configuracion: b.configuracion || '',
      nota: b.nota || '',
      userType: b.cliente?.tipoTenant || '',
      reservationType: reservationTypeRaw,
      status: b.estado || 'Booked',
      openEnded: Boolean(b.openEnded)
    };
  };

  useEffect(() => {
    if (bloqueo) {
      setFormState(buildFormState(bloqueo));
      setIsEditMode(false);
      setError('');
      setPaymentOption('');
      setSavedCards([]);
      setSelectedCard('');
    }
  }, [bloqueo]);

  // Fetch saved cards when dialog opens for a "Booked" bloqueo
  const contactEmail = bloqueo?.cliente?.email || '';
  const isBooked = bloqueo && mapStatusKey(bloqueo.estado) === 'created';

  useEffect(() => {
    if (!open || !isBooked || !contactEmail) return;
    setCardsLoading(true);
    fetchCustomerPaymentMethods(contactEmail)
      .then((res) => {
        const methods = res.paymentMethods || [];
        setSavedCards(methods);
        if (methods.length > 0) {
          setSelectedCard(methods[0].id);
          setPaymentOption('charge');
        } else {
          setPaymentOption('invoice');
        }
      })
      .catch(() => {
        setSavedCards([]);
        setPaymentOption('invoice');
      })
      .finally(() => setCardsLoading(false));
  }, [open, isBooked, contactEmail]);

  const handleEditClick = () => setIsEditMode(true);

  const handleSave = async () => {
    if (!bloqueo) return;
    setSaving(true);
    setError('');
    try {
      await updateBloqueo(bloqueo.id, {
        contactId: formState.clienteId,
        centroId: formState.centroId,
        productoId: formState.productoId,
        reservationType: formState.reservationType || 'Por Horas',
        dateFrom: formState.dateFrom,
        dateTo: formState.dateTo,
        timeSlots: [{ from: formState.horaIni, to: formState.horaFin }],
        status: formState.status || 'Booked',
        tarifa: formState.tarifa ? Number(formState.tarifa) : null,
        attendees: formState.asistentes ? Number(formState.asistentes) : null,
        configuracion: formState.configuracion,
        note: formState.nota,
        openEnded: formState.openEnded || false
      });
      setIsEditMode(false);
      onClose?.();
    } catch (saveError) {
      setError(saveError.message || t('admin.unableToUpdateBloqueo'));
    } finally {
      setSaving(false);
    }
  };

  const handlePayment = async () => {
    if (!bloqueo) return;
    setPaymentSubmitting(true);
    setError('');
    try {
      const contactName = bloqueo.cliente?.nombre || '';
      const tarifaNum = Number(formState.tarifa) || 0;
      const amountCents = Math.round(tarifaNum * 100);
      const description = `Reserva: ${formState.producto || ''} (${formState.dateFrom})`;

      if (paymentOption === 'charge') {
        if (!selectedCard) {
          setError(t('steps.pleaseSelectCard'));
          setPaymentSubmitting(false);
          return;
        }
        await chargeCustomer({
          customerEmail: contactEmail,
          paymentMethodId: selectedCard,
          amount: amountCents,
          currency: 'eur',
          description,
          reference: String(formState.productoId || ''),
        });
        await updateBloqueo(bloqueo.id, {
          contactId: formState.clienteId,
          centroId: formState.centroId,
          productoId: formState.productoId,
          reservationType: formState.reservationType || 'Por Horas',
          dateFrom: formState.dateFrom,
          dateTo: formState.dateTo,
          timeSlots: [{ from: formState.horaIni, to: formState.horaFin }],
          status: 'Paid',
          tarifa: formState.tarifa ? Number(formState.tarifa) : null,
          attendees: formState.asistentes ? Number(formState.asistentes) : null,
          configuracion: formState.configuracion,
          note: formState.nota,
          openEnded: formState.openEnded || false
        });
      } else if (paymentOption === 'invoice') {
        await createStripeInvoice({
          customerEmail: contactEmail,
          customerName: contactName,
          amount: amountCents,
          currency: 'eur',
          description,
          reference: String(formState.productoId || ''),
          dueDays: invoiceDueDays,
        });
        await updateBloqueo(bloqueo.id, {
          contactId: formState.clienteId,
          centroId: formState.centroId,
          productoId: formState.productoId,
          reservationType: formState.reservationType || 'Por Horas',
          dateFrom: formState.dateFrom,
          dateTo: formState.dateTo,
          timeSlots: [{ from: formState.horaIni, to: formState.horaFin }],
          status: 'Invoiced',
          tarifa: formState.tarifa ? Number(formState.tarifa) : null,
          attendees: formState.asistentes ? Number(formState.asistentes) : null,
          configuracion: formState.configuracion,
          note: formState.nota,
          openEnded: formState.openEnded || false
        });
      }
      onClose?.();
    } catch (payError) {
      setError(payError.message || 'Payment failed.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditMode(false);
    setError('');
    if (bloqueo) setFormState(buildFormState(bloqueo));
  };

  const handleFieldChange = (field, value) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  // Use theme defaults for field styling — no borderRadius override
  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      minHeight: 40,
      backgroundColor: theme.palette.common.white,
    },
  };

  const dialogTitle = isEditMode ? t('admin.editBloqueo') : t('admin.bloqueoDetails');
  const dialogSubtitle = isEditMode
    ? t('admin.editReservation')
    : t('admin.viewReservation');

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[200]} 100%)`,
          boxShadow: theme.shadows[6]
        }
      }}
    >
      <Box component="form" noValidate>
        <DialogTitle sx={{
          pb: 0,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'common.white',
          borderRadius: '12px 12px 0 0',
          p: 3
        }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: alpha(theme.palette.common.white, 0.2), width: 40, height: 40 }}>
              <CalendarMonthRoundedIcon />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={700}>
                {dialogTitle}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {dialogSubtitle}
              </Typography>
            </Box>
            <IconButton
              onClick={onClose}
              sx={{
                color: alpha(theme.palette.common.white, 0.8),
                '&:hover': {
                  backgroundColor: alpha(theme.palette.common.white, 0.15),
                  color: 'common.white'
                }
              }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 4 }}>
            <Stack spacing={4}>
              {error ? <Alert severity="error">{error}</Alert> : null}

              {bloqueo ? (
                <>
                  {/* Section 1: Booking Information */}
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      overflow: 'hidden',
                      background: 'background.paper'
                    }}
                  >
                    <Box sx={{
                      p: 3,
                      background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                      borderBottom: '1px solid',
                      borderBottomColor: 'divider'
                    }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: 'success.light', width: 36, height: 36 }}>
                          <PersonRoundedIcon />
                        </Avatar>
                        <Typography variant="h6" fontWeight={600} color="text.primary">
                          {t('admin.bookingDetails')}
                        </Typography>
                      </Stack>
                    </Box>
                    <Box sx={{ p: 3 }}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label={t('admin.contact')} value={formState.cliente || ''} onChange={(e) => handleFieldChange('cliente', e.target.value)} disabled={!isEditMode} variant="outlined" size="small" sx={fieldSx} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label={t('admin.centro')} value={formState.centro || ''} onChange={(e) => handleFieldChange('centro', e.target.value)} disabled={!isEditMode} variant="outlined" size="small" sx={fieldSx} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label={t('admin.userType')} value={formState.userType || ''} onChange={(e) => handleFieldChange('userType', e.target.value)} disabled={!isEditMode} variant="outlined" size="small" select sx={fieldSx}>
                            <MenuItem value="">—</MenuItem>
                            <MenuItem value="Usuario Aulas">Usuario Aulas</MenuItem>
                            <MenuItem value="Usuario Mesa">Usuario Mesa</MenuItem>
                            <MenuItem value="Usuario Virtual">Usuario Virtual</MenuItem>
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label={t('admin.producto')} value={formState.producto || ''} onChange={(e) => handleFieldChange('producto', e.target.value)} disabled={!isEditMode} variant="outlined" size="small" sx={fieldSx} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField fullWidth label={t('admin.reservationType')} value={formState.reservationType || 'Por Horas'} onChange={(e) => handleFieldChange('reservationType', e.target.value)} disabled={!isEditMode} variant="outlined" size="small" select sx={fieldSx}>
                            <MenuItem value="Por Horas">{t('reservationType.Por Horas')}</MenuItem>
                            <MenuItem value="Diaria">{t('reservationType.Diaria')}</MenuItem>
                            <MenuItem value="Mensual">{t('reservationType.Mensual')}</MenuItem>
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField fullWidth label={t('admin.status')} value={formState.status || 'Booked'} onChange={(e) => handleFieldChange('status', e.target.value)} disabled={!isEditMode} variant="outlined" size="small" select sx={fieldSx}>
                            <MenuItem value="Booked">{t('status.booked')}</MenuItem>
                            <MenuItem value="Pendiente">{t('status.pending')}</MenuItem>
                            <MenuItem value="Paid">{t('status.paid')}</MenuItem>
                            <MenuItem value="Invoiced">{t('status.invoiced')}</MenuItem>
                          </TextField>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField fullWidth label={t('admin.tarifaLabel')} value={formState.tarifa ?? ''} onChange={(e) => handleFieldChange('tarifa', e.target.value)} disabled={!isEditMode} variant="outlined" size="small" sx={fieldSx} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label={t('admin.attendees')} value={formState.asistentes ?? ''} onChange={(e) => handleFieldChange('asistentes', e.target.value)} disabled={!isEditMode} variant="outlined" size="small" sx={fieldSx} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField fullWidth label={t('admin.configuracion')} value={formState.configuracion || ''} onChange={(e) => handleFieldChange('configuracion', e.target.value)} disabled={!isEditMode} variant="outlined" size="small" sx={fieldSx} />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField fullWidth label={t('admin.notes')} value={formState.nota || ''} onChange={(e) => handleFieldChange('nota', e.target.value)} disabled={!isEditMode} variant="outlined" size="small" multiline minRows={2} maxRows={4} sx={fieldSx} />
                        </Grid>
                      </Grid>
                    </Box>
                  </Paper>

                  {/* Section 2: Schedule */}
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      overflow: 'hidden',
                      background: 'background.paper'
                    }}
                  >
                    <Box sx={{
                      p: 3,
                      background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                      borderBottom: '1px solid',
                      borderBottomColor: 'divider'
                    }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                          <AccessTimeRoundedIcon />
                        </Avatar>
                        <Typography variant="h6" fontWeight={600} color="text.primary">
                          {t('steps.date')}
                        </Typography>
                      </Stack>
                    </Box>
                    <Box sx={{ p: 3 }}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <Grid container spacing={3}>
                          <Grid item xs={12} sm={3}>
                            <TextField type="date" label={t('admin.dateFrom')} value={formState.dateFrom || ''} onChange={(e) => handleFieldChange('dateFrom', e.target.value)} InputLabelProps={{ shrink: true }} fullWidth disabled={!isEditMode} variant="outlined" size="small" sx={fieldSx} />
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <TextField type="date" label={t('admin.dateTo')} value={formState.dateTo || ''} onChange={(e) => handleFieldChange('dateTo', e.target.value)} InputLabelProps={{ shrink: true }} fullWidth disabled={!isEditMode} variant="outlined" size="small" sx={fieldSx} />
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <TimePicker
                              label={t('admin.startTime')}
                              value={formState.horaIni ? timeStringToDate(formState.horaIni) : null}
                              onChange={(time) => handleFieldChange('horaIni', time ? dateToTimeString(time) : '')}
                              slotProps={{ textField: { fullWidth: true, disabled: !isEditMode, size: 'small', variant: 'outlined', InputLabelProps: { shrink: true }, sx: fieldSx } }}
                              minutesStep={30}
                            />
                          </Grid>
                          <Grid item xs={12} sm={3}>
                            <TimePicker
                              label={t('admin.endTime')}
                              value={formState.horaFin ? timeStringToDate(formState.horaFin) : null}
                              onChange={(time) => handleFieldChange('horaFin', time ? dateToTimeString(time) : '')}
                              slotProps={{ textField: { fullWidth: true, disabled: !isEditMode, size: 'small', variant: 'outlined', InputLabelProps: { shrink: true }, sx: fieldSx } }}
                              minutesStep={30}
                            />
                          </Grid>
                        </Grid>

                      </LocalizationProvider>
                    </Box>
                  </Paper>

                  {/* Section 3: Payment — only for "Booked" status */}
                  {isBooked && canInvoice && !isEditMode ? (
                    <Paper
                      elevation={0}
                      sx={{
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        overflow: 'hidden',
                        background: 'background.paper'
                      }}
                    >
                      <Box sx={{
                        p: 3,
                        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                        borderBottom: '1px solid',
                        borderBottomColor: 'divider'
                      }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                            <EuroRoundedIcon />
                          </Avatar>
                          <Typography variant="h6" fontWeight={600} color="text.primary">
                            {t('steps.payment')}
                          </Typography>
                        </Stack>
                      </Box>
                      <Box sx={{ p: 3 }}>
                        <Stack spacing={2}>
                          {cardsLoading && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                              <CircularProgress size={24} />
                            </Box>
                          )}

                          {!cardsLoading && (
                            <RadioGroup value={paymentOption} onChange={(e) => setPaymentOption(e.target.value)}>
                              <FormControlLabel
                                value="charge"
                                control={<Radio size="small" />}
                                label={t('admin.chargeSavedCard')}
                                disabled={savedCards.length === 0}
                              />
                              {savedCards.length === 0 && contactEmail && (
                                <Typography variant="caption" sx={{ pl: 4, color: 'text.secondary' }}>
                                  {t('steps.noSavedCards', { email: contactEmail })}
                                </Typography>
                              )}
                              <FormControlLabel
                                value="invoice"
                                control={<Radio size="small" />}
                                label={t('admin.sendStripeInvoice')}
                                disabled={!contactEmail}
                              />
                              {!contactEmail && (
                                <Typography variant="caption" sx={{ pl: 4, color: 'text.secondary' }}>
                                  No email found for this contact
                                </Typography>
                              )}
                            </RadioGroup>
                          )}

                          {paymentOption === 'charge' && savedCards.length > 0 && (
                            <Box sx={{ pl: 4 }}>
                              <TextField
                                fullWidth
                                label={t('admin.selectCard')}
                                value={selectedCard}
                                onChange={(e) => setSelectedCard(e.target.value)}
                                select
                                size="small"
                                sx={fieldSx}
                              >
                                {savedCards.map((card) => (
                                  <MenuItem key={card.id} value={card.id}>
                                    {card.brand?.toUpperCase()} **** {card.last4} — exp {card.expMonth}/{card.expYear}
                                  </MenuItem>
                                ))}
                              </TextField>
                            </Box>
                          )}

                          {paymentOption === 'invoice' && (
                            <Box sx={{ pl: 4 }}>
                              <TextField
                                label={t('admin.daysUntilDue')}
                                type="number"
                                value={invoiceDueDays}
                                onChange={(e) => setInvoiceDueDays(Number(e.target.value))}
                                size="small"
                                sx={{ ...fieldSx, maxWidth: 200 }}
                              />
                            </Box>
                          )}
                        </Stack>
                      </Box>
                    </Paper>
                  ) : null}
                </>
              ) : null}
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{
          p: 3,
          background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[200]} 100%)`,
          borderRadius: '0 0 12px 12px'
        }}>
          {/* Payment action for Booked bloqueos */}
          {isBooked && canInvoice && !isEditMode && paymentOption ? (
            <Button
              onClick={handlePayment}
              variant="contained"
              disabled={paymentSubmitting || invoiceLoading}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                }
              }}
            >
              {paymentSubmitting ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : (paymentOption === 'charge' ? t('admin.chargeCard') : t('admin.sendInvoice'))}
            </Button>
          ) : null}
          {/* Legacy invoice button for non-Booked statuses */}
          {!isBooked && canInvoice && !isEditMode ? (
            <Button
              onClick={() => { if (bloqueo) onInvoice?.(bloqueo); }}
              variant="contained"
              disabled={invoiceLoading}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                }
              }}
            >
              {invoiceLoading ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : t('admin.invoice')}
            </Button>
          ) : null}
          {canEdit && !isEditMode ? (
            <Button
              onClick={handleEditClick}
              variant="outlined"
              startIcon={<EditRoundedIcon fontSize="small" />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                color: 'text.secondary',
                borderColor: 'divider',
                '&:hover': {
                  borderColor: theme.palette.grey[300],
                  backgroundColor: 'background.default'
                }
              }}
            >
              {t('admin.editBloqueo')}
            </Button>
          ) : null}
          {isEditMode ? (
            <>
              <Button
                onClick={handleCancel}
                startIcon={<CloseRoundedIcon />}
                variant="outlined"
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  color: 'text.secondary',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: theme.palette.grey[300],
                    backgroundColor: 'background.default'
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                variant="contained"
                disabled={saving}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  '&:hover': {
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
                  }
                }}
              >
                {saving ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : t('admin.saveChanges')}
              </Button>
            </>
          ) : null}
        </DialogActions>
      </Box>
    </Dialog>
  );
};

const InvoicePreviewDialog = ({ open, invoice, pdfUrl, loading, onClose }) => {
  const { t } = useTranslation('booking');
  return (
    <Dialog open={Boolean(open)} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>{t('admin.invoicePdf')}</DialogTitle>
      <DialogContent sx={{ minHeight: 480 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : pdfUrl ? (
          <iframe title="Invoice PDF" src={pdfUrl} style={{ width: '100%', height: '600px', border: 'none' }} />
        ) : (
          <Stack spacing={2}>
            <Typography variant="body1">{t('admin.invoiceCreated')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('admin.noPreviewAvailable')}
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
                {t('admin.openInvoicePage')}
              </Button>
            ) : null}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('admin.close')}</Button>
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

// Calendar Legend for user booking
const UserCalendarLegendItem = ({ label, color }) => (
  <Stack direction="row" spacing={1} alignItems="center">
    <Box sx={{ width: 16, height: 16, borderRadius: 2, border: '1px solid', borderColor: color.borderColor, bgcolor: color.bgcolor }} />
    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
  </Stack>
);

const UserCalendarLegend = ({ styles }) => {
  const { t } = useTranslation('booking');
  return (
    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
      <UserCalendarLegendItem label={t('status.available')} color={styles.available} />
      <UserCalendarLegendItem label={t('status.paid')} color={styles.paid} />
      <UserCalendarLegendItem label={t('status.invoiced')} color={styles.invoiced} />
      <UserCalendarLegendItem label={t('status.booked')} color={styles.created} />
    </Stack>
  );
};

// Room Calendar Grid for user booking
const UserRoomCalendarGrid = ({ dateLabel, room, bloqueos = [], selectedSlotKey, onSelectSlot }) => {
  const theme = useTheme();
  const { t } = useTranslation('booking');
  const timeSlots = useMemo(() => buildTimeSlotsFromBloqueosUser(bloqueos), [bloqueos]);
  const tableMinWidth = useMemo(() => Math.max(720, 220 + timeSlots.length * 64 + 32), [timeSlots.length]);
  const resolvedUserCalendarStatusStyles = useMemo(() => userCalendarStatusStyles(theme), [theme]);

  const getSlotStatus = (slotId) => {
    const bloqueo = bloqueos.find((entry) => bloqueoCoversSlotUser(entry, slotId));
    if (!bloqueo) return { status: 'available', bloqueo: null };
    return { status: mapUserStatusKey(bloqueo.estado), bloqueo };
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        width: '100%',
        maxWidth: 1240,
        mx: 'auto',
        overflow: 'hidden',
        backgroundColor: 'background.paper'
      }}
    >
      <Stack spacing={3} sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between">
          <Stack spacing={0.5}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{t('userView.availability')} · {room?.name || t('userView.meetingRoom')}</Typography>
            {dateLabel && <Typography variant="body2" sx={{ color: 'text.secondary' }}>{dateLabel}</Typography>}
          </Stack>
          <UserCalendarLegend styles={resolvedUserCalendarStatusStyles} />
        </Stack>
        <TableContainer sx={{ maxHeight: 420, overflowX: 'auto', overflowY: 'hidden', width: '100%', WebkitOverflowScrolling: 'touch' }}>
          <Table
            size="small"
            sx={{
              minWidth: tableMinWidth,
              tableLayout: 'fixed',
              '& .MuiTableCell-root': {
                borderRight: '1px solid',
                borderRightColor: (theme) => alpha(theme.palette.divider, 0.6)
              },
              '& .MuiTableRow-root': {
                borderBottom: '1px solid',
                borderBottomColor: (theme) => alpha(theme.palette.divider, 0.6)
              }
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    width: 220,
                    position: 'sticky',
                    top: 0,
                    left: 0,
                    backgroundColor: 'background.paper',
                    zIndex: 4,
                    borderRight: '1px solid',
                    borderRightColor: (theme) => alpha(theme.palette.divider, 0.8),
                    boxShadow: (theme) => `4px 0 12px ${alpha(theme.palette.common.black, 0.06)}`
                  }}
                >
                  {t('userView.room')}
                </TableCell>
                {timeSlots.map((slot) => (
                  <TableCell key={slot.id} align="center" sx={{ position: 'sticky', top: 0, width: 64, maxWidth: 64, backgroundColor: 'background.paper', zIndex: 3 }}>
                    <Typography variant="subtitle2" fontWeight="bold">{slot.label}</Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell
                  sx={{
                    position: 'sticky',
                    left: 0,
                    width: 220,
                    maxWidth: 220,
                    backgroundColor: 'background.paper',
                    zIndex: 2,
                    borderRight: '1px solid',
                    borderRightColor: (theme) => alpha(theme.palette.divider, 0.7),
                    boxShadow: (theme) => `2px 0 8px ${alpha(theme.palette.common.black, 0.04)}`
                  }}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="body2" fontWeight="medium">{room?.name || room?.label || t('userView.meetingRoom')}</Typography>
                    {room?.capacity && <Typography variant="caption" sx={{ color: 'text.disabled' }}>{t('detail.capacityGuests', { capacity: room.capacity })}</Typography>}
                  </Stack>
                </TableCell>
                {timeSlots.map((slot) => {
                  const slotKey = `${room?.id || 'room'}-${slot.id}`;
                  const { status, bloqueo } = getSlotStatus(slot.id);
                  const styles = resolvedUserCalendarStatusStyles[status] || resolvedUserCalendarStatusStyles.created;
                  const isSelected = selectedSlotKey === slotKey;
                  return (
                    <TableCell key={`${room?.id ?? 'room'}-${slot.id}`} align="center" sx={{ p: 0.75, width: 64, maxWidth: 64 }}>
                      <Tooltip arrow title={describeBloqueoUser(bloqueo)}>
                        <Box
                          role="button"
                          tabIndex={0}
                          onClick={() => onSelectSlot?.(slot, bloqueo)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectSlot?.(slot, bloqueo); } }}
                          sx={{
                            height: 52, width: '100%', borderRadius: 2, border: '2px solid',
                            borderColor: isSelected ? theme.palette.primary.main : styles.borderColor,
                            bgcolor: styles.bgcolor, color: styles.color, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'transform 0.15s, border-color 0.15s',
                            '&:hover': { transform: 'scale(1.05)' }, outline: 'none'
                          }}
                        >
                          {bloqueo && <Typography variant="caption" fontWeight={600} noWrap>{getInitialsUser(bloqueo.cliente?.nombre || bloqueo.producto?.nombre || 'Reservado')}</Typography>}
                        </Box>
                      </Tooltip>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>
    </Paper>
  );
};

// Booking Stepper Component
const UserBookingStepper = ({ activeStep }) => {
  const { t } = useTranslation('booking');
  return (
    <Stepper activeStep={activeStep} alternativeLabel sx={{ bgcolor: 'background.paper', borderRadius: 2, p: 2 }}>
      {BOOKING_STEP_LABELS.map((label) => (
        <Step key={label}><StepLabel>{t(label)}</StepLabel></Step>
      ))}
    </Stepper>
  );
};

// Select Booking Details Step
const UserSelectBookingDetails = ({ room, schedule, setSchedule, onContinue, centroOptions, productOptions }) => {
  const theme = useTheme();
  const { t } = useTranslation('booking');
  const [formState, setFormState] = useState({
    customerName: '',
    centro: null,
    userType: 'Usuario Aulas',
    reservationType: 'Por Horas',
    status: 'Booked',
    tarifa: room?.priceFrom || '',
    producto: room ? { id: room.id, name: room.productName || room.name, type: 'Aula' } : null,
    configuracion: '',
    note: '',
    weekdays: [],
    openEnded: false
  });
  const [bloqueos, setBloqueos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!schedule.startTime) setSchedule(prev => ({ ...prev, startTime: '09:00' }));
    if (!schedule.endTime) setSchedule(prev => ({ ...prev, endTime: '10:00' }));
    if (!schedule.date) {
      const today = new Date().toISOString().split('T')[0];
      setSchedule(prev => ({ ...prev, date: today, dateTo: today }));
    }
  }, []);

  useEffect(() => {
    if (centroOptions.length && !formState.centro) {
      const first = centroOptions.find(c => !c.isAllOption);
      if (first) setFormState(prev => ({ ...prev, centro: { id: first.id, name: first.label, code: first.code } }));
    }
  }, [centroOptions]);

  useEffect(() => {
    if (room && !formState.producto) {
      setFormState(prev => ({ ...prev, producto: { id: room.id, name: room.productName || room.name, type: 'Aula' }, tarifa: room.priceFrom || '' }));
    }
  }, [room]);

  useEffect(() => {
    if (!schedule.date || !room?.productName) return;
    let active = true;
    setLoading(true);
    setError('');
    fetchPublicAvailability({ date: schedule.date, products: [room.productName] })
      .then(data => { if (active) setBloqueos(Array.isArray(data) ? data : []); })
      .catch(err => { if (active) setError(err.message || t('admin.failedToLoadAvailability')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [schedule.date, room?.productName]);

  const roomBloqueos = useMemo(() => {
    if (!room?.productName) return bloqueos;
    return bloqueos.filter(b => (b?.producto?.nombre || '').toLowerCase() === room.productName.toLowerCase());
  }, [bloqueos, room?.productName]);

  const selectedSlotKey = useMemo(() => schedule.startTime ? `${room?.id || 'room'}-${schedule.startTime}` : '', [room?.id, schedule.startTime]);

  const handleSlotSelect = (slot, bloqueo) => {
    if (!schedule.date || bloqueo) return;
    const nextEnd = addMinutesToTime(slot.id, 60);
    setSchedule(prev => ({ ...prev, startTime: slot.id, endTime: nextEnd }));
  };

  const handleWeekdayToggle = (weekday) => (_event, checked) => {
    setFormState(prev => {
      const set = new Set(prev.weekdays);
      if (checked) set.add(weekday); else set.delete(weekday);
      return { ...prev, weekdays: Array.from(set) };
    });
  };

  const isContinueDisabled = !schedule.date || !schedule.startTime || !schedule.endTime;

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1,
      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.background.default
    }
  };

  return (
    <Stack spacing={4}>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t('steps.whoAndWhere')}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('steps.whoAndWhereDesc')}</Typography>
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label={t('form.yourName')} placeholder={t('form.yourName')} fullWidth value={formState.customerName} onChange={(e) => setFormState(prev => ({ ...prev, customerName: e.target.value }))}
              InputProps={{ startAdornment: <InputAdornment position="start"><PersonRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }} sx={inputStyles} />
            <TextField label={t('admin.centro')} select fullWidth value={formState.centro?.name || ''} onChange={(e) => {
              const selected = centroOptions.find(c => c.label === e.target.value);
              if (selected) setFormState(prev => ({ ...prev, centro: { id: selected.id, name: selected.label, code: selected.code } }));
            }} InputProps={{ startAdornment: <InputAdornment position="start"><LocationOnRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }} sx={inputStyles}>
              {centroOptions.filter(c => !c.isAllOption).map(opt => <MenuItem key={opt.id} value={opt.label}>{opt.label}</MenuItem>)}
            </TextField>
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label={t('admin.userType')} select fullWidth value={formState.userType} onChange={(e) => setFormState(prev => ({ ...prev, userType: e.target.value }))}
              InputProps={{ startAdornment: <InputAdornment position="start"><PersonRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }} sx={inputStyles}>
              {['Usuario Aulas', 'Usuario Virtual', 'Usuario Mesa'].map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
            </TextField>
            <TextField label={t('admin.producto')} fullWidth value={formState.producto?.name || room?.name || ''} disabled
              InputProps={{ startAdornment: <InputAdornment position="start"><SettingsSuggestRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }} sx={inputStyles} />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label={t('admin.reservationType')} select fullWidth value={formState.reservationType} onChange={(e) => setFormState(prev => ({ ...prev, reservationType: e.target.value }))}
              InputProps={{ startAdornment: <InputAdornment position="start"><EventRepeatRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }} sx={inputStyles}>
              {RESERVATION_TYPE_OPTIONS.map(opt => <MenuItem key={opt} value={opt}>{t('reservationType.' + opt)}</MenuItem>)}
            </TextField>
            <TextField label={t('admin.status')} fullWidth value={formState.status} disabled InputProps={{ startAdornment: <InputAdornment position="start"><FlagRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }} sx={inputStyles} />
            <TextField label={t('admin.tarifaLabel')} fullWidth value={formState.tarifa} disabled InputProps={{ startAdornment: <InputAdornment position="start"><EuroRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }} sx={inputStyles} />
          </Stack>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t('steps.scheduleAndStatus')}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('steps.scheduleAndStatusDesc')}</Typography>
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label={t('admin.dateFrom')} type="date" value={schedule.date || ''} onChange={(e) => setSchedule(prev => ({ ...prev, date: e.target.value, dateTo: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }} sx={inputStyles} />
            <TextField label={t('admin.dateTo')} type="date" value={schedule.dateTo || schedule.date || ''} onChange={(e) => setSchedule(prev => ({ ...prev, dateTo: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><CalendarMonthRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }} sx={inputStyles} />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label={t('admin.startTime')} type="time" value={schedule.startTime || '09:00'} onChange={(e) => setSchedule(prev => ({ ...prev, startTime: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><AccessTimeRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }} sx={inputStyles} />
            <TextField label={t('admin.endTime')} type="time" value={schedule.endTime || '10:00'} onChange={(e) => setSchedule(prev => ({ ...prev, endTime: e.target.value }))} InputLabelProps={{ shrink: true }} fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><AccessTimeRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }} sx={inputStyles} />
          </Stack>
          <FormGroup row sx={{ gap: 1 }}>
            {WEEKDAY_OPTIONS.map(wd => (
              <FormControlLabel key={wd.value} control={<Checkbox checked={formState.weekdays.includes(wd.value)} onChange={handleWeekdayToggle(wd.value)} />} label={t('days.' + wd.value.slice(0, 3))} />
            ))}
            <FormControlLabel control={<Switch checked={formState.openEnded} onChange={(_, checked) => setFormState(prev => ({ ...prev, openEnded: checked }))} />} label={t('admin.openEnded')} />
          </FormGroup>
          <Divider sx={{ my: 1 }} />
          {error && <Alert severity="error">{error}</Alert>}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={28} /></Box>
          ) : (
            <UserRoomCalendarGrid room={room} dateLabel={schedule.date ? new Date(schedule.date).toLocaleDateString() : ''} bloqueos={roomBloqueos} selectedSlotKey={selectedSlotKey} onSelectSlot={handleSlotSelect} />
          )}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t('steps.additionalDetails')}</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField label={t('admin.attendees')} type="number" value={schedule.attendees || ''} onChange={(e) => setSchedule(prev => ({ ...prev, attendees: parseInt(e.target.value) || 1 }))} fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><PeopleAltRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }} sx={inputStyles} />
            <TextField label={t('admin.configuracion')} value={formState.configuracion} onChange={(e) => setFormState(prev => ({ ...prev, configuracion: e.target.value }))} fullWidth sx={inputStyles} />
          </Stack>
          <TextField label={t('form.notas')} value={formState.note} onChange={(e) => setFormState(prev => ({ ...prev, note: e.target.value }))} fullWidth multiline minRows={2} sx={inputStyles} />
        </Stack>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={() => onContinue(formState)} disabled={isContinueDisabled} sx={{ textTransform: 'none', fontWeight: 600 }}>{t('steps.continue')}</Button>
      </Box>
    </Stack>
  );
};

// Contact & Billing Step
const UserContactBillingStep = ({ room, schedule, onBack, onContinue }) => {
  const { t } = useTranslation('booking');
  const [formState, setFormState] = useState({
    firstName: '', lastName: '', email: '', phone: '', company: '', taxId: '',
    addressLine1: '', addressLine2: '', city: '', postalCode: '', country: 'Spain'
  });
  const [errors, setErrors] = useState({});

  const summaryItems = useMemo(() => {
    const items = [];
    if (room?.name) items.push({ label: t('userView.room'), value: room.name });
    if (schedule?.date) items.push({ label: t('userView.date'), value: new Date(schedule.date).toLocaleDateString() });
    if (schedule?.startTime && schedule?.endTime) items.push({ label: t('userView.time'), value: `${schedule.startTime} – ${schedule.endTime}` });
    if (schedule?.attendees) items.push({ label: t('userView.attendees'), value: `${schedule.attendees}` });
    return items;
  }, [room?.name, schedule]);

  const validate = () => {
    const errs = {};
    if (!formState.firstName.trim()) errs.firstName = t('form.firstNameRequired');
    if (!formState.lastName.trim()) errs.lastName = t('form.lastNameRequired');
    if (!formState.email.trim()) errs.email = t('form.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) errs.email = t('form.emailInvalid');
    if (!formState.phone.trim()) errs.phone = t('form.phoneRequired');
    if (!formState.addressLine1.trim()) errs.addressLine1 = t('form.addressRequired');
    if (!formState.city.trim()) errs.city = t('form.cityRequired');
    if (!formState.postalCode.trim()) errs.postalCode = t('form.postalCodeRequired');
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) onContinue?.({ contact: formState });
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={3}>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack spacing={1}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('steps.contactDetailsHeader')}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('steps.contactDetailsDesc')}</Typography>
          </Stack>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}><TextField label={t('form.firstName')} value={formState.firstName} onChange={(e) => setFormState(prev => ({ ...prev, firstName: e.target.value }))} required error={Boolean(errors.firstName)} helperText={errors.firstName} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField label={t('form.lastName')} value={formState.lastName} onChange={(e) => setFormState(prev => ({ ...prev, lastName: e.target.value }))} required error={Boolean(errors.lastName)} helperText={errors.lastName} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField label={t('form.email')} type="email" value={formState.email} onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))} required error={Boolean(errors.email)} helperText={errors.email} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField label={t('form.phone')} value={formState.phone} onChange={(e) => setFormState(prev => ({ ...prev, phone: e.target.value }))} required error={Boolean(errors.phone)} helperText={errors.phone} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField label={t('form.company')} value={formState.company} onChange={(e) => setFormState(prev => ({ ...prev, company: e.target.value }))} fullWidth /></Grid>
            <Grid item xs={12} sm={6}><TextField label={t('steps.taxId')} value={formState.taxId} onChange={(e) => setFormState(prev => ({ ...prev, taxId: e.target.value }))} fullWidth /></Grid>
          </Grid>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack spacing={1}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('steps.billingAddress')}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('steps.billingAddressDesc')}</Typography>
          </Stack>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}><TextField label={t('form.addressLine1')} value={formState.addressLine1} onChange={(e) => setFormState(prev => ({ ...prev, addressLine1: e.target.value }))} required error={Boolean(errors.addressLine1)} helperText={errors.addressLine1} fullWidth /></Grid>
            <Grid item xs={12}><TextField label={t('form.addressLine2')} value={formState.addressLine2} onChange={(e) => setFormState(prev => ({ ...prev, addressLine2: e.target.value }))} fullWidth /></Grid>
            <Grid item xs={12} sm={4}><TextField label={t('form.city')} value={formState.city} onChange={(e) => setFormState(prev => ({ ...prev, city: e.target.value }))} required error={Boolean(errors.city)} helperText={errors.city} fullWidth /></Grid>
            <Grid item xs={12} sm={4}><TextField label={t('form.postalCode')} value={formState.postalCode} onChange={(e) => setFormState(prev => ({ ...prev, postalCode: e.target.value }))} required error={Boolean(errors.postalCode)} helperText={errors.postalCode} fullWidth /></Grid>
            <Grid item xs={12} sm={4}><TextField label={t('form.country')} value={formState.country} onChange={(e) => setFormState(prev => ({ ...prev, country: e.target.value }))} fullWidth /></Grid>
          </Grid>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack spacing={1}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('steps.reservationSummary')}</Typography>
          </Stack>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {summaryItems.map(item => (
              <Stack key={item.label} direction="row" justifyContent="space-between">
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.label}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{item.value}</Typography>
              </Stack>
            ))}
          </Stack>
        </Paper>

        <Stack direction="row" spacing={1} justifyContent="space-between">
          <Button onClick={onBack} sx={{ textTransform: 'none' }}>{t('steps.back')}</Button>
          <Button type="submit" variant="contained" sx={{ textTransform: 'none', fontWeight: 600 }}>{t('steps.continueToPayment')}</Button>
        </Stack>
      </Stack>
    </Box>
  );
};

// Review & Payment Step
const UserReviewPaymentStep = ({ room, schedule, contact, onBack, onComplete }) => {
  const { t } = useTranslation('booking');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const calculateTotal = () => {
    if (!room?.priceFrom || !schedule?.startTime || !schedule?.endTime) return '—';
    const startMins = timeStringToMinutes(schedule.startTime);
    const endMins = timeStringToMinutes(schedule.endTime);
    if (startMins == null || endMins == null) return '—';
    const hours = (endMins - startMins) / 60;
    return `€${(hours * room.priceFrom).toFixed(2)}`;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        cliente: { nombre: `${contact.firstName} ${contact.lastName}`, email: contact.email, telefono: contact.phone, empresa: contact.company, nif: contact.taxId },
        centro: { nombre: room?.centro || 'Málaga Workspace' },
        producto: { nombre: room?.productName || room?.name },
        fechaIni: `${schedule.date}T${schedule.startTime}:00`,
        fechaFin: `${schedule.dateTo || schedule.date}T${schedule.endTime}:00`,
        asistentes: schedule.attendees || 1,
        estado: 'Booked',
        direccion: { linea1: contact.addressLine1, linea2: contact.addressLine2, ciudad: contact.city, codigoPostal: contact.postalCode, pais: contact.country }
      };
      await createReserva(payload);
      setSuccess(true);
    } catch (err) {
      setError(err.message || t('form.failedToCreate'));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
        <Stack spacing={3} alignItems="center">
          <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: 'success.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h4">✓</Typography>
          </Box>
          <Typography variant="h5" fontWeight={700}>{t('steps.bookingSubmitted')}</Typography>
          <Typography variant="body1" color="text.secondary">
            {t('steps.bookingSubmittedDesc')}
          </Typography>
          <Button variant="contained" onClick={onComplete} sx={{ textTransform: 'none', fontWeight: 600, backgroundColor: 'primary.main', '&:hover': { backgroundColor: 'primary.dark' } }}>
            {t('steps.backToSpaces')}
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>{t('steps.reviewYourBooking')}</Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Typography variant="subtitle2" fontWeight={600}>{t('steps.space')}</Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box sx={{ width: 80, height: 60, borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={room?.image || room?.heroImage} alt={room?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight={600}>{room?.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{room?.centro || 'Málaga Workspace'}</Typography>
                </Box>
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" fontWeight={600}>{t('steps.schedule')}</Typography>
              <Typography variant="body2">{t('userView.date')}: {schedule?.date ? new Date(schedule.date).toLocaleDateString() : '—'}</Typography>
              <Typography variant="body2">{t('userView.time')}: {schedule?.startTime} – {schedule?.endTime}</Typography>
              <Typography variant="body2">{t('userView.attendees')}: {schedule?.attendees || 1}</Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" fontWeight={600}>{t('steps.contact')}</Typography>
              <Typography variant="body2">{contact?.firstName} {contact?.lastName}</Typography>
              <Typography variant="body2">{contact?.email}</Typography>
              <Typography variant="body2">{contact?.phone}</Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack spacing={1}>
              <Typography variant="subtitle2" fontWeight={600}>{t('steps.billingAddress')}</Typography>
              <Typography variant="body2">{contact?.addressLine1}</Typography>
              {contact?.addressLine2 && <Typography variant="body2">{contact.addressLine2}</Typography>}
              <Typography variant="body2">{contact?.city}, {contact?.postalCode}</Typography>
              <Typography variant="body2">{contact?.country}</Typography>
            </Stack>
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700}>{t('steps.estimatedTotal')}</Typography>
          <Typography variant="h5" fontWeight={700} color="primary">{calculateTotal()}</Typography>
        </Stack>
      </Paper>

      <Alert severity="info">
        {t('steps.afterSubmitInfo')}
      </Alert>

      {error && <Alert severity="error">{error}</Alert>}

      <Stack direction="row" spacing={1} justifyContent="space-between">
        <Button onClick={onBack} disabled={submitting} sx={{ textTransform: 'none' }}>{t('steps.back')}</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting} sx={{ textTransform: 'none', fontWeight: 600, backgroundColor: 'primary.main', '&:hover': { backgroundColor: 'primary.dark' } }}>
          {submitting ? <CircularProgress size={20} color="inherit" /> : t('form.submitBooking')}
        </Button>
      </Stack>
    </Stack>
  );
};

// Room Detail View with Gallery
const UserRoomDetailView = ({ room, onBack, onStartBooking }) => {
  const theme = useTheme();
  const { t } = useTranslation('booking');
  const [galleryOpen, setGalleryOpen] = useState(false);
  
  const galleryImages = useMemo(() => {
    const gallery = Array.isArray(room?.gallery) ? room.gallery.filter(Boolean) : [];
    if (gallery.length) return gallery;
    return room?.heroImage || room?.image ? [room.heroImage || room.image] : [];
  }, [room]);

  const featureImage = galleryImages[0];
  const secondaryImages = galleryImages.slice(1, 5);
  const amenities = room?.amenities || room?.tags || [];

  const cancellationPolicy = [
    t('detail.cancellationPolicy1'),
    t('detail.cancellationPolicy2'),
    t('detail.cancellationPolicy3')
  ];

  const bookingInstructions = [
    t('detail.instruction1'),
    t('detail.instruction2'),
    t('detail.instruction3')
  ];

  return (
    <Box>
      <Button startIcon={<ArrowBackRoundedIcon />} onClick={onBack} sx={{ mb: 2, textTransform: 'none', color: 'text.secondary' }}>
        {t('detail.backToSpaces')}
      </Button>

      <Stack spacing={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Stack spacing={1}>
            <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: 1.2 }}>{room?.centro || 'Málaga Workspace'}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>{room?.name}</Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              {t('detail.capacityLine', { capacity: room?.capacity, price: `€${room?.priceFrom || '—'}`, unit: '/h' })}
            </Typography>
          </Stack>
          <Button size="small" startIcon={<IosShareOutlinedIcon />} variant="text" onClick={() => navigator.clipboard?.writeText(window.location.href)} sx={{ textTransform: 'none', fontWeight: 700, color: 'text.primary' }}>
            {t('detail.share')}
          </Button>
        </Stack>

        {featureImage && (
          <Box sx={{ position: 'relative' }}>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gridTemplateRows: { md: 'repeat(2, 200px)' }, gridTemplateAreas: { xs: '"hero"', md: '"hero hero thumb1 thumb2" "hero hero thumb3 thumb4"' } }}>
              <Box component="img" src={featureImage} alt={room?.name} sx={{ gridArea: 'hero', width: '100%', height: { xs: 260, md: '100%' }, objectFit: 'cover', borderRadius: 3 }} />
              {secondaryImages.map((img, i) => (
                <Box key={i} component="img" src={img} alt={`${room?.name} ${i + 2}`} sx={{ gridArea: `thumb${i + 1}`, width: '100%', height: { xs: 180, md: '100%' }, objectFit: 'cover', borderRadius: 3 }} />
              ))}
            </Box>
            {galleryImages.length > 5 && (
              <Button
                onClick={() => setGalleryOpen(true)}
                startIcon={<PhotoLibraryOutlinedIcon />}
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                  borderRadius: 999,
                  backgroundColor: 'background.paper',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2.5,
                  boxShadow: theme.shadows[6]
                }}
              >
                {t('detail.showAllPhotos')}
              </Button>
            )}
          </Box>
        )}

        <Grid container spacing={5}>
          <Grid item xs={12} md={7}>
            <Stack spacing={4}>
              <section>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{t('detail.description')}</Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.65 }}>{room?.description}</Typography>
              </section>

              {amenities.length > 0 && (
                <section>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>{t('detail.includedServices')}</Typography>
                  <Grid container spacing={1.5}>
                    {amenities.map(amenity => (
                      <Grid item xs={12} sm={6} md={4} key={amenity}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.25,
                            p: 1.5,
                            borderRadius: 2,
                            backgroundColor: alpha(theme.palette.primary.light, 0.08),
                            border: '1px solid',
                            borderColor: alpha(theme.palette.primary.light, 0.5),
                            minHeight: 68
                          }}
                        >
                          <Box
                            sx={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              backgroundColor: alpha(theme.palette.primary.main, 0.18),
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'primary.main',
                              flexShrink: 0
                            }}
                          >
                            <BusinessRoundedIcon fontSize="small" />
                          </Box>
                          <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 600 }}>{amenity}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </section>
              )}

              <section>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{t('detail.cancellationPolicy')}</Typography>
                <Stack spacing={1.25}>
                  {cancellationPolicy.map(item => (
                    <Stack direction="row" spacing={1.5} key={item}>
                      <FlagRoundedIcon sx={{ color: 'primary.main', mt: 0.35, flexShrink: 0 }} fontSize="small" />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{item}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </section>

              <section>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{t('detail.instructions')}</Typography>
                <Stack spacing={1.25}>
                  {bookingInstructions.map(item => (
                    <Stack direction="row" spacing={1.5} key={item}>
                      <CalendarTodayRoundedIcon sx={{ color: 'primary.main', mt: 0.35, flexShrink: 0 }} fontSize="small" />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{item}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </section>
            </Stack>
          </Grid>

          <Grid item xs={12} md={5}>
            <Stack spacing={3} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 3, p: 3, bgcolor: 'background.paper' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('detail.readyToBook')}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('detail.readyToBookDesc')}</Typography>
              <Divider />
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">{t('detail.priceFrom')}</Typography>
                  <Typography variant="body1" fontWeight={600}>€{room?.priceFrom || '—'}/h</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">{t('detail.capacity')}</Typography>
                  <Typography variant="body1" fontWeight={600}>{room?.capacity} {t('detail.persons')}</Typography>
                </Stack>
              </Stack>
              <Button onClick={onStartBooking} variant="contained" size="large" sx={{ textTransform: 'none', fontWeight: 700, backgroundColor: 'primary.main', '&:hover': { backgroundColor: 'primary.dark' }, borderRadius: 999 }}>
                {t('detail.startBooking')}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Stack>

      <Dialog open={galleryOpen} onClose={() => setGalleryOpen(false)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3, p: 2 } }}>
        <IconButton onClick={() => setGalleryOpen(false)} sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'background.paper' }}><CloseRoundedIcon /></IconButton>
        <DialogContent sx={{ pt: 4 }}>
          <Grid container spacing={2}>
            {galleryImages.map((img, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Box component="img" src={img} alt={`${room?.name} gallery ${i + 1}`} sx={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

// Booking Flow View (multi-step)
const UserBookingFlowView = ({ room, centroOptions, productOptions, onBack, onComplete }) => {
  const { t } = useTranslation('booking');
  const [activeStep, setActiveStep] = useState(0);
  const [schedule, setSchedule] = useState({ date: '', dateTo: '', startTime: '09:00', endTime: '10:00', attendees: 1 });
  const [contact, setContact] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);

  const handleDetailsComplete = (details) => {
    setBookingDetails(details);
    setActiveStep(1);
  };

  const handleContactComplete = ({ contact: contactData }) => {
    setContact(contactData);
    setActiveStep(2);
  };

  return (
    <Box>
      <Button startIcon={<ArrowBackRoundedIcon />} onClick={activeStep === 0 ? onBack : () => setActiveStep(prev => prev - 1)} sx={{ mb: 2, textTransform: 'none', color: 'text.secondary' }}>
        {activeStep === 0 ? t('dialog.backToRoom') : t('steps.back')}
      </Button>

      <Stack spacing={4}>
        <Box>
          <Typography variant="overline" sx={{ color: 'text.disabled' }}>{t('dialog.booking')} · {room?.centro || 'Málaga Workspace'}</Typography>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>{room?.name}</Typography>
        </Box>

        <Paper variant="outlined" sx={{ px: 3, py: 2, borderRadius: 3 }}>
          <UserBookingStepper activeStep={activeStep} />
        </Paper>

        {activeStep === 0 && (
          <UserSelectBookingDetails room={room} schedule={schedule} setSchedule={setSchedule} onContinue={handleDetailsComplete} centroOptions={centroOptions} productOptions={productOptions} />
        )}
        {activeStep === 1 && (
          <UserContactBillingStep room={room} schedule={schedule} onBack={() => setActiveStep(0)} onContinue={handleContactComplete} />
        )}
        {activeStep === 2 && (
          <UserReviewPaymentStep room={room} schedule={schedule} contact={contact} onBack={() => setActiveStep(1)} onComplete={onComplete} />
        )}
      </Stack>
    </Box>
  );
};

// Space card component for user booking view
const SpaceCardUser = ({ space, onBookNow }) => {
  const theme = useTheme();
  const { t } = useTranslation('booking');
  if (!space) return null;

  const handleClick = () => {
    if (typeof onBookNow === 'function') {
      onBookNow(space);
    }
  };

  const isMeetingRoom = space.type === 'meeting_room';
  const deskLabel = space.availableCount ? ` (${space.availableCount} available)` : '';

  return (
    <Box sx={{ display: 'flex', minWidth: 0 }}>
      <Card
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: (theme) => `0 4px 6px -1px ${alpha(theme.palette.common.black, 0.1)}`,
          transition: 'transform 0.2s, box-shadow 0.2s',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          maxWidth: '100%',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: (theme) => `0 10px 25px -3px ${alpha(theme.palette.common.black, 0.1)}`
          }
        }}
      >
        <Box sx={{ position: 'relative', flexShrink: 0, height: '160px', overflow: 'hidden' }}>
          <CardMedia
            component="img"
            image={space.image}
            alt={space.name}
            sx={{ objectFit: 'cover', width: '100%', height: '100%', display: 'block' }}
          />
          <Stack direction="row" spacing={1} sx={{ position: 'absolute', top: 10, left: 10 }}>
            {space.instantBooking && (
              <Chip
                label={t('card.instantBooking')}
                size="small"
                sx={{ backgroundColor: alpha(theme.palette.common.white, 0.9), color: 'text.primary', fontWeight: 500, fontSize: '0.75rem' }}
              />
            )}
          </Stack>
          <IconButton
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              backgroundColor: alpha(theme.palette.common.white, 0.8),
              '&:hover': { backgroundColor: alpha(theme.palette.common.white, 0.9) }
            }}
          >
            <FavoriteBorderRoundedIcon />
          </IconButton>
        </Box>

        <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, justifyContent: 'space-between', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
          <Box sx={{ flex: '1 1 auto', minHeight: 0, width: '100%', maxWidth: '100%' }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 0.75, lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {space.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25, minHeight: '2rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', width: '100%' }}>
              {space.subtitle || space.description}
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ mb: 1.25, minHeight: '1.5rem', flexWrap: 'wrap', alignItems: 'center', width: '100%' }}>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
                <PeopleAltRoundedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                  {space.capacity}
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
                <BusinessRoundedIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                  {space.typeLabel || (isMeetingRoom ? t('card.meetingRoom') : `${t('card.desk')}${deskLabel}`)}
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 'auto', width: '100%', gap: 1 }}>
            <Typography variant="subtitle1" fontWeight={600} color="primary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: '0 1 auto', minWidth: 0 }}>
              {t('card.from')} {space.price}{space.priceUnit}
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={handleClick}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                backgroundColor: 'primary.main',
                flexShrink: 0,
                '&:hover': { backgroundColor: 'primary.dark' }
              }}
              disabled={!space.isBookable}
            >
              {t('card.bookNow')}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

// User Bookings Table - shows the user's own bookings
const UserBookingsTable = ({ bloqueos, loading, onViewDetails }) => {
  const theme = useTheme();
  const { t } = useTranslation('booking');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getStatusChip = (status) => {
    const statusLower = (status || '').toLowerCase();
    if (statusLower.includes('paid') || statusLower.includes('pag')) {
      return (
        <Chip
          label={t('status.paid')}
          size="small"
          sx={{ bgcolor: alpha(theme.palette.success.main, 0.15), color: theme.palette.success.dark, fontWeight: 600 }}
        />
      );
    }
    if (statusLower.includes('invoice') || statusLower.includes('fact')) {
      return (
        <Chip
          label={t('status.invoiced')}
          size="small"
          sx={{ bgcolor: alpha(theme.palette.warning.main, 0.2), color: theme.palette.warning.dark, fontWeight: 600 }}
        />
      );
    }
    return (
      <Chip
        label={t('userView.pending')}
        size="small"
        sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.15), color: theme.palette.secondary.dark, fontWeight: 600 }}
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!bloqueos || bloqueos.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" color="text.secondary">{t('form.noBookingsFound')}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('form.noBookingsDesc')}
        </Typography>
      </Paper>
    );
  }

  const paginatedBloqueos = bloqueos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'background.default' }}>
              <TableCell sx={{ fontWeight: 600 }}>{t('userView.space')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('userView.date')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('userView.time')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('userView.location')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('userView.status')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">{t('userView.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedBloqueos.map((bloqueo) => {
              const startDate = bloqueo.fechaIni ? new Date(bloqueo.fechaIni) : null;
              const endDate = bloqueo.fechaFin ? new Date(bloqueo.fechaFin) : null;
              const dateStr = startDate ? startDate.toLocaleDateString() : '—';
              const startTime = startDate ? startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
              const endTime = endDate ? endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
              const timeStr = startTime && endTime ? `${startTime} - ${endTime}` : '—';

              return (
                <TableRow key={bloqueo.id} hover sx={{ '&:last-child td': { borderBottom: 0 } }}>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 40, height: 40 }}>
                        <MeetingRoomRoundedIcon fontSize="small" />
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{bloqueo.producto?.nombre || '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{bloqueo.centro?.nombre || '—'}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>{dateStr}</TableCell>
                  <TableCell>{timeStr}</TableCell>
                  <TableCell>{bloqueo.centro?.nombre || '—'}</TableCell>
                  <TableCell>{getStatusChip(bloqueo.estado)}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => onViewDetails?.(bloqueo)} sx={{ textTransform: 'none' }}>
                      {t('userView.viewDetails')}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={bloqueos.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Paper>
  );
};

// User Booking Details Dialog
const UserBookingDetailsDialog = ({ bloqueo, onClose }) => {
  const { t } = useTranslation('booking');
  const open = Boolean(bloqueo);
  if (!bloqueo) return null;

  const startDate = bloqueo.fechaIni ? new Date(bloqueo.fechaIni) : null;
  const endDate = bloqueo.fechaFin ? new Date(bloqueo.fechaFin) : null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={600}>{t('userView.bookingDetails')}</Typography>
        <IconButton onClick={onClose} size="small"><CloseRoundedIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Box>
            <Typography variant="overline" color="text.secondary">{t('userView.space')}</Typography>
            <Typography variant="h6" fontWeight={600}>{bloqueo.producto?.nombre || '—'}</Typography>
            <Typography variant="body2" color="text.secondary">{bloqueo.centro?.nombre || '—'}</Typography>
          </Box>
          <Divider />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="overline" color="text.secondary">{t('userView.date')}</Typography>
              <Typography variant="body1">{startDate ? startDate.toLocaleDateString() : '—'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="overline" color="text.secondary">{t('userView.time')}</Typography>
              <Typography variant="body1">
                {startDate ? startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''} - {endDate ? endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="overline" color="text.secondary">{t('userView.attendees')}</Typography>
              <Typography variant="body1">{bloqueo.asistentes || '—'}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="overline" color="text.secondary">{t('userView.status')}</Typography>
              <Typography variant="body1">{bloqueo.estado || t('userView.pending')}</Typography>
            </Grid>
          </Grid>
          {bloqueo.nota && (
            <>
              <Divider />
              <Box>
                <Typography variant="overline" color="text.secondary">{t('userView.notes')}</Typography>
                <Typography variant="body2">{bloqueo.nota}</Typography>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>{t('userView.close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

// User booking view component
const UserBookingView = () => {
  const theme = useTheme();
  const { t } = useTranslation('booking');
  const [mainView, setMainView] = useState('spaces'); // 'spaces' or 'bookings'
  const [spaceTypeTab, setSpaceTypeTab] = useState(0);
  const [cityFilter, setCityFilter] = useState('');
  const [cityOptions, setCityOptions] = useState([{ id: 'all', label: t('userView.allLocations'), isAllOption: true }]);
  const [location, setLocation] = useState('');
  const [people, setPeople] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [centros, setCentros] = useState([]);
  const [centrosLoading, setCentrosLoading] = useState(false);
  const [productos, setProductos] = useState([]);
  const [productosLoading, setProductosLoading] = useState(false);
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [userBloqueos, setUserBloqueos] = useState([]);
  const [bloqueosLoading, setBloqueosLoading] = useState(false);
  const [selectedBloqueo, setSelectedBloqueo] = useState(null);
  // Room data now comes from the API (Room entity via /public/productos)

  const spaceTypes = [
    { value: 'all', label: t('userView.allSpaces'), icon: <BusinessRoundedIcon /> },
    { value: 'meeting_room', label: t('userView.meetingRoomsFilter'), icon: <MeetingRoomRoundedIcon /> },
    { value: 'desk', label: t('userView.desks'), icon: <DeskRoundedIcon /> }
  ];

  // Load user's bookings
  useEffect(() => {
    if (mainView !== 'bookings') return;
    let active = true;
    setBloqueosLoading(true);
    
    const loadUserBloqueos = async () => {
      try {
        // Fetch bloqueos for the user (without specific filters to get all their bookings)
        const today = new Date();
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        const threeMonthsAhead = new Date(today);
        threeMonthsAhead.setMonth(today.getMonth() + 3);
        
        const data = await fetchBloqueos({
          from: threeMonthsAgo.toISOString().split('T')[0],
          to: threeMonthsAhead.toISOString().split('T')[0]
        });
        if (!active) return;
        setUserBloqueos(Array.isArray(data) ? data : []);
      } catch (error) {
        if (active) setUserBloqueos([]);
      } finally {
        if (active) setBloqueosLoading(false);
      }
    };
    loadUserBloqueos();
    return () => { active = false; };
  }, [mainView]);

  // Load centros and cities
  useEffect(() => {
    let active = true;
    setCentrosLoading(true);
    
    const loadCentros = async () => {
      try {
        const data = await fetchPublicCentros();
        if (!active) return;

        const options = Array.isArray(data) ? data.map((c) => {
          const code = (c.codigo ?? c.code ?? '').toUpperCase();
          const city = (c.localidad ?? c.city ?? '').trim();
          return {
            ...c, 
            id: c.id ?? c.codigo ?? c.code ?? c.nombre ?? c.name ?? code, 
            label: c.nombre ?? c.name ?? '',
            code,
            city
          };
        }) : [];
        
        const centrosWithAll = [{ id: 'all', label: t('userView.allCentros'), isAllOption: true }, ...options];
        setCentros(centrosWithAll);

        const uniqueCities = Array.from(new Set(options
          .map(option => option.city)
          .filter(city => typeof city === 'string' && city.trim() !== '')
          .map(city => city.trim())));
        const cityList = [
          { id: 'all', label: t('userView.allLocations'), isAllOption: true },
          ...uniqueCities.map(city => ({ id: city.toLowerCase(), label: city }))
        ];
        setCityOptions(cityList);
      } catch (error) {
        if (active) {
          setCentros([]);
          setCityOptions([{ id: 'all', label: t('userView.allLocations'), isAllOption: true }]);
        }
      } finally {
        if (active) {
          setCentrosLoading(false);
        }
      }
    };
    loadCentros();
    
    return () => { active = false; };
  }, []);

  // Load productos
  useEffect(() => {
    if (mainView !== 'spaces') return;
    let active = true;
    setProductosLoading(true);

    const loadProductos = async () => {
      try {
        const params = { centerCode: 'MA1' };
        if (spaceTypeTab === 1) {
          params.type = 'Aula';
        } else if (spaceTypeTab === 2) {
          params.type = 'Mesa';
        }
        
        const data = await fetchPublicProductos(params);
        if (!active) return;
        setProductos(Array.isArray(data) ? data : []);
      } catch (error) {
        if (active) {
          setProductos([]);
        }
      } finally {
        if (active) {
          setProductosLoading(false);
        }
      }
    };
    
    loadProductos();
    return () => { active = false; };
  }, [spaceTypeTab, mainView]);

  const standardFieldStyles = {
    width: '100%',
    '& .MuiOutlinedInput-root': {
      borderRadius: 1,
      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.background.default,
      height: '40px',
      '& fieldset': { borderColor: theme.palette.divider },
      '& input': { fontSize: '0.9375rem !important', fontWeight: 500, padding: '8.5px 14px !important', height: '100%' }
    },
    '& .MuiInputLabel-root': { fontSize: '0.75rem', color: 'text.secondary' },
    '& .MuiAutocomplete-input': { padding: '8.5px 14px !important' }
  };

  const filteredSpaces = useMemo(() => {
    if (!productos || !Array.isArray(productos)) return [];

    const filteredProductos = productos.filter((producto) => {
      const type = (producto.type ?? producto.tipo ?? '').trim().toLowerCase();
      const name = (producto.name ?? producto.nombre ?? '').trim();
      const centerCode = (producto.centerCode ?? producto.centroCodigo ?? '').trim().toUpperCase();

      if (!name || centerCode !== 'MA1') return false;

      const upperName = name.toUpperCase();
      if (type === 'aula') return upperName.startsWith('MA1A');
      if (type === 'mesa') {
        const deskMatch = upperName.match(/^MA1[-_]?O1[-_ ]?(\d{1,2})$/);
        if (!deskMatch) return false;
        const numero = parseInt(deskMatch[1], 10);
        return numero >= 1 && numero <= 16;
      }
      return false;
    });
    
    const aulas = filteredProductos.filter((producto) => {
      const typeLower = (producto.type ?? producto.tipo ?? '').trim().toLowerCase();
      return typeLower === 'aula';
    });

    const mesas = filteredProductos.filter((producto) => {
      const typeLower = (producto.type ?? producto.tipo ?? '').trim().toLowerCase();
      return typeLower === 'mesa';
    });

    const aulaSpaces = aulas.map((producto) => {
      const rawType = (producto.type ?? producto.tipo ?? '').trim();
      const name = (producto.name ?? producto.nombre ?? '').trim();
      const productCenter = (producto.centerCode ?? producto.centroCodigo ?? '').trim();
      const productCenterUpper = productCenter.toUpperCase();
      const matchingCentro = centros.find((c) => (c.code ?? '').toUpperCase() === productCenterUpper);
      const centerName = matchingCentro?.label ?? productCenter;
      const city = matchingCentro?.city ?? '';
      const roomSlug = name.toLowerCase();

      return {
        id: producto.id,
        name,
        productName: name,
        slug: roomSlug,
        type: 'meeting_room',
        typeLabel: rawType || 'Meeting room',
        image: producto.heroImage || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop',
        capacity: producto.capacity != null ? String(producto.capacity) : '—',
        rating: producto.ratingAverage != null ? Number(producto.ratingAverage) : 4.8,
        reviewCount: producto.ratingCount != null ? producto.ratingCount : 0,
        priceFrom: producto.priceFrom,
        price: producto.priceFrom != null ? `€ ${producto.priceFrom}` : '€ —',
        priceUnit: producto.priceUnit || '/h',
        description: producto.description || producto.subtitle || `${rawType} - ${name}`,
        subtitle: producto.subtitle || '',
        gallery: Array.isArray(producto.images) ? producto.images : [],
        amenities: Array.isArray(producto.amenities) ? producto.amenities : [],
        tags: Array.isArray(producto.tags) ? producto.tags : [],
        location: city || centerName || 'Málaga',
        instantBooking: producto.instantBooking !== false,
        centroCode: productCenter || undefined,
        centerName: centerName || undefined,
        isBookable: true
      };
    });

    const deskCard = (() => {
      if (mesas.length === 0) return null;

      const sample = mesas[0];
      const rawType = (sample.type ?? sample.tipo ?? '').trim();
      const productCenter = (sample.centerCode ?? sample.centroCodigo ?? '').trim();
      const productCenterUpper = productCenter.toUpperCase();
      const matchingCentro = centros.find((c) => (c.code ?? '').toUpperCase() === productCenterUpper);
      const centerName = matchingCentro?.label ?? productCenter;
      const city = matchingCentro?.city ?? '';
      const deskCount = mesas.length;
      const samplePrice = sample.priceFrom;

      return {
        id: `desks-${productCenterUpper || 'ma1'}`,
        name: centerName ? `${centerName} Desks` : 'MA1 Desks',
        description: sample.description || `${deskCount} desk${deskCount === 1 ? '' : 's'} available for booking`,
        productName: 'MA1 Desks',
        slug: 'ma1-desks',
        type: 'desk',
        image: sample.heroImage || 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=400&h=300&fit=crop',
        capacity: '1',
        rating: sample.ratingAverage != null ? Number(sample.ratingAverage) : 4.8,
        reviewCount: sample.ratingCount != null ? sample.ratingCount : 0,
        price: samplePrice != null ? `€ ${samplePrice}` : '€ 15',
        priceUnit: sample.priceUnit || '/day',
        location: city || centerName || 'Málaga',
        tags: Array.isArray(sample.tags) ? sample.tags : [],
        instantBooking: true,
        centroCode: productCenter || undefined,
        availableCount: deskCount,
        centerName: centerName || undefined,
        isBookable: true
      };
    })();

    const mappedSpaces = deskCard ? [...aulaSpaces, deskCard] : aulaSpaces;
    
    let filtered = [...mappedSpaces];
    
    if (cityFilter && cityFilter.trim() !== '') {
      const cityFilterLower = cityFilter.trim().toLowerCase();
      filtered = filtered.filter(space => (space.location ?? '').toLowerCase() === cityFilterLower);
    }
    
    if (people && people.trim() !== '') {
      const userCount = parseInt(people);
      if (!isNaN(userCount)) {
        filtered = filtered.filter(space => {
          if (!space.capacity) return false;
          const capacityParts = space.capacity.split('-');
          if (capacityParts.length === 1) {
            const singleCapacity = parseInt(capacityParts[0]);
            return !isNaN(singleCapacity) && userCount <= singleCapacity;
          } else {
            const [minCapacity, maxCapacity] = capacityParts.map(num => parseInt(num));
            return !isNaN(minCapacity) && !isNaN(maxCapacity) && userCount >= minCapacity && userCount <= maxCapacity;
          }
        });
      }
    }
    
    return filtered;
  }, [productos, centros, cityFilter, people]);

  // View states: 'list', 'detail', 'booking'
  const [currentView, setCurrentView] = useState('list');

  const handleBookNow = useCallback((space) => {
    setSelectedSpace(space);
    setCurrentView('detail');
  }, []);

  const handleSpaceTypeTabChange = (event, newValue) => {
    setSpaceTypeTab(newValue);
  };

  const handleMainViewChange = (event, newValue) => {
    if (newValue !== null) {
      setMainView(newValue);
      setCurrentView('list');
      setSelectedSpace(null);
    }
  };

  const handleBackToList = () => {
    setSelectedSpace(null);
    setCurrentView('list');
  };

  const handleStartBooking = () => {
    setCurrentView('booking');
  };

  const handleBookingComplete = () => {
    setSelectedSpace(null);
    setCurrentView('list');
    // Refresh bookings list
    setMainView('bookings');
  };

  const handleViewBookingDetails = (bloqueo) => {
    setSelectedBloqueo(bloqueo);
  };

  // Room Detail View
  if (currentView === 'detail' && selectedSpace) {
    return (
      <Box sx={{ minHeight: '100vh' }}>
        <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
          <UserRoomDetailView 
            room={selectedSpace} 
            onBack={handleBackToList} 
            onStartBooking={handleStartBooking} 
          />
        </Box>
      </Box>
    );
  }

  // Booking Flow View
  if (currentView === 'booking' && selectedSpace) {
    return (
      <Box sx={{ minHeight: '100vh' }}>
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
          <UserBookingFlowView 
            room={selectedSpace} 
            centroOptions={centros}
            productOptions={productos}
            onBack={() => setCurrentView('detail')} 
            onComplete={handleBookingComplete} 
          />
        </Box>
      </Box>
    );
  }

  // Main View with Spaces/Bookings toggle
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
        {/* Header with title and view toggle */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 3 }}>
          <Stack spacing={1}>
            <Typography variant="h5" fontWeight="bold" color="text.primary">
              {mainView === 'spaces' ? t('userView.meetingRooms') : t('userView.myBookings')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {mainView === 'spaces'
                ? t('steps.spacesSubtitle')
                : t('steps.bookingsSubtitle')}
            </Typography>
          </Stack>
          <Tabs
            value={mainView}
            onChange={handleMainViewChange}
            sx={getViewToggleTabsStyle(theme)}
          >
            <Tab value="spaces" icon={<MeetingRoomRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={t('userView.spacesTab')} />
            <Tab value="bookings" icon={<CalendarTodayRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={t('userView.bookingsTab')} />
          </Tabs>
        </Stack>

        {/* Bookings View */}
        {mainView === 'bookings' && (
          <>
            <UserBookingsTable 
              bloqueos={userBloqueos} 
              loading={bloqueosLoading} 
              onViewDetails={handleViewBookingDetails} 
            />
            <UserBookingDetailsDialog 
              bloqueo={selectedBloqueo} 
              onClose={() => setSelectedBloqueo(null)} 
            />
          </>
        )}

        {/* Spaces View */}
        {mainView === 'spaces' && (
          <>
            {/* Space Type Tabs */}
            <Tabs 
              value={spaceTypeTab} 
              onChange={handleSpaceTypeTabChange}
              sx={{ 
                mb: 4,
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 48 }
              }}
            >
              {spaceTypes.map((type, index) => (
                <Tab key={type.value} icon={type.icon} label={type.label} iconPosition="start" />
              ))}
            </Tabs>

        {/* Search and Filter Section */}
        <Paper
          elevation={0}
          sx={{
            p: 3, 
            mb: 4, 
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: theme.palette.background.paper,
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <Grid container spacing={1.5} sx={{ mb: 2, display: 'flex' }}>
            <Grid item xs={12} sm={6} md sx={{ flex: '1 1 0%', minWidth: 0 }}>
              <Autocomplete
                size="small"
                options={cityOptions}
                getOptionLabel={(option) => option?.label ?? ''}
                value={
                  cityFilter === ''
                    ? (cityOptions.find(option => option.id === 'all') || null)
                    : (cityOptions.find(option => option.label?.toLowerCase() === cityFilter.toLowerCase()) || null)
                }
                onChange={(_, value) => setCityFilter(value && value.id !== 'all' ? value.label : '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label={t('userView.location')}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <BusinessRoundedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={standardFieldStyles}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} sx={{ fontSize: '0.9375rem', fontWeight: 500 }}>
                    {option.label}
                  </Box>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md sx={{ flex: '1 1 0%', minWidth: 0 }}>
              <Autocomplete
                size="small"
                options={centros}
                loading={centrosLoading}
                getOptionLabel={(option) => option?.label ?? ''}
                value={
                  location === '' 
                    ? (centros.find(c => c.id === 'all') || null)
                    : (centros.find((c) => c.id !== 'all' && c.label?.toLowerCase() === (location || '').toLowerCase()) || null)
                }
                onChange={(_, value) => setLocation(value && value.id !== 'all' ? value.label : '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label={t('userView.centro')}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOnRoundedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={standardFieldStyles}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} sx={{ fontSize: '0.9375rem', fontWeight: 500 }}>
                    {option.label}
                  </Box>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6} md sx={{ flex: '1 1 0%', minWidth: 0 }}>
              <TextField
                fullWidth
                label={t('userView.numberOfUsers')}
                type="number"
                value={people}
                onChange={(e) => setPeople(e.target.value)}
                placeholder={t('userView.numberOfUsers')}
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <PeopleAltRoundedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={standardFieldStyles}
              />
            </Grid>
            <Grid item xs={12} sm={6} md sx={{ flex: '1 1 0%', minWidth: 0 }}>
              <TextField
                fullWidth
                label={t('userView.checkIn')}
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <CalendarTodayRoundedIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={standardFieldStyles}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="contained"
                size="small"
                sx={{
                  height: 40,
                  borderRadius: 1,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  backgroundColor: 'primary.main',
                  '&:hover': { backgroundColor: 'primary.dark' }
                }}
              >
                {t('catalog.searchSpaces').toUpperCase()}
              </Button>
            </Grid>
          </Grid>

          {/* Results Count */}
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {productosLoading ? t('userView.loadingSpaces') : t('userView.showingSpaces', { count: filteredSpaces.length })}
            </Typography>
          </Stack>
        </Paper>

        {/* Space Listings */}
        {productosLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : filteredSpaces.length === 0 ? (
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h6" color="text.secondary">{t('userView.noSpacesFound')}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('userView.noSpacesFoundDesc')}
            </Typography>
          </Paper>
        ) : (
          <Box
            sx={{
              width: '100%',
              display: 'grid',
              gap: 3,
              gridTemplateColumns: {
                xs: 'repeat(1, minmax(0, 1fr))',
                sm: 'repeat(2, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
                lg: 'repeat(4, minmax(0, 1fr))'
              },
              alignItems: 'stretch'
            }}
          >
            {filteredSpaces.map((space) => (
              <SpaceCardUser key={space.id} space={space} onBookNow={handleBookNow} />
            ))}
          </Box>
        )}
          </>
        )}
      </Box>
    </Box>
  );
};

const Booking = ({ mode = 'user', userProfile }) => {
  const theme = useTheme();
  const { t } = useTranslation('booking');
  const statusStyles = getStatusStyles(theme);
  const isAdmin = mode === 'admin';
  console.log('Booking component - mode:', mode, 'isAdmin:', isAdmin);
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

  const clearFilters = () => {
    setFilterUser('');
    setFilterCenter('');
    setFilterProduct('');
    setFilterEmail('');
    setFilterUserType(defaultAgendaUserType);
  };
  const [bookingFlowActive, setBookingFlowActive] = useState(false);
  const [slotBookingRoom, setSlotBookingRoom] = useState(null);
  const [slotBookingTime, setSlotBookingTime] = useState(null);
  const [editBloqueo, setEditBloqueo] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, bloqueoId: null });
  const [invoiceDialog, setInvoiceDialog] = useState({ open: false, bloqueo: null });
  const [invoicePreview, setInvoicePreview] = useState({ open: false, invoice: null, pdfUrl: null, loading: false });
  const [invoiceForm, setInvoiceForm] = useState({ description: '', vat: '21', reference: '' });
  const [invoiceSubmitting, setInvoiceSubmitting] = useState(false);
  const [invoiceError, setInvoiceError] = useState('');

  const handleOpenCreateDialog = useCallback(() => {
    setEditBloqueo(null); // ensure edit dialog is closed
    setBookingFlowActive(true);
  }, []);

  const handleCloseCreateDialog = useCallback(() => {
    setBookingFlowActive(false);
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
      setInvoiceError(err.message || t('admin.unableToCreateInvoice'));
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
      setBookingFlowActive(false);
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
      setError(deleteError.message || t('admin.failedToDelete'));
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

    const load = async () => {
      try {
        let data = await fetchBloqueos({ from, to }, { signal: controller.signal });
        let rows = Array.isArray(data) ? data : [];
        if (!rows.length && calendarDate) {
          try {
            const fallback = await fetchPublicAvailability({
              date: calendarDate,
              products: Array.from(ALLOWED_PRODUCT_NAMES)
            });
            if (Array.isArray(fallback) && fallback.length) {
              rows = fallback;
            }
          } catch (fallbackError) {
            console.warn('Fallback availability load failed', fallbackError);
          }
        }
        setBloqueos(rows);
      }
      catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          return;
        }
        console.error('Error fetching bloqueos:', fetchError);
        // If the API endpoint doesn't exist yet, show a helpful message
        if (fetchError.status === 404) {
          setError('Bloqueos API endpoint not yet implemented. Please check backend configuration.');
        } else {
          setError(fetchError.message || t('admin.failedToLoad'));
        }
        setBloqueos([]);
      }
      finally {
        setLoading(false);
      }
    };

    load();

    return () => controller.abort();
  }, [monthKey, mode, calendarDate]);

  const filteredBloqueos = useMemo(() => {
    try {
      return (bloqueos || []).filter((bloqueo) => {
        // Filter by name search (partial matching like Contacts)
        if (filterUser && filterUser.trim()) {
          const searchTerm = filterUser.toLowerCase();
          const userName = (bloqueo?.cliente?.nombre || '').toLowerCase();
          const productName = (bloqueo?.producto?.nombre || '').toLowerCase();
          if (!userName.includes(searchTerm) && !productName.includes(searchTerm)) {
          return false;
          }
        }

        const centerLabel = bloqueo?.centro?.nombre || '';
        if (filterCenter && centerLabel !== filterCenter) {
        return false;
      }

        const productLabel = bloqueo?.producto?.nombre || '';
        if (filterProduct) {
          if (productLabel !== filterProduct) {
            return false;
          }
        } else {
          if (!ALLOWED_PRODUCT_NAMES.has(productLabel)) {
            return false;
          }
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

  const totalAllowedBloqueos = useMemo(() => {
    try {
      return (bloqueos || []).filter((bloqueo) => {
        const productLabel = bloqueo?.producto?.nombre || '';
        return ALLOWED_PRODUCT_NAMES.has(productLabel);
      }).length;
    } catch (error) {
      console.error('Error counting allowed bloqueos:', error);
      return 0;
    }
  }, [bloqueos]);

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

    const productList = Array.from(products).sort(sorter);
    const preferredProducts = ['MA1A1', 'MA1A2', 'MA1A3', 'MA1A4', 'MA1A5'];
    const preferredSet = new Set(preferredProducts.map((item) => item.toUpperCase()));
    const preferredList = productList.filter((item) => preferredSet.has(String(item).toUpperCase()));

    return {
      users: Array.from(users).sort(sorter),
      centers: Array.from(centers).sort(sorter),
      products: preferredList,
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

  const agendaTotalLabel = useMemo(() => {
    if (agendaDate) {
      return agendaBloqueos.length;
    }
    return totalAllowedBloqueos;
  }, [agendaDate, agendaBloqueos.length, totalAllowedBloqueos]);

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

  const handleAvailableSlotClick = useCallback((room, slot) => {
    const sample = (calendarBloqueos || []).find(b => b?.producto?.id === room.productId);
    const producto = sample?.producto
      ? { id: sample.producto.id, name: sample.producto.nombre || room.label }
      : { id: room.productId, name: room.label };
    const centro = sample?.centro
      ? { id: sample.centro.id, name: sample.centro.nombre || room.centerName, label: room.centerName }
      : null;

    setSlotBookingRoom({ _producto: producto, _centro: centro });
    const startMin = timeStringToMinutes(slot.id);
    const endMin = startMin + 30;
    const endTime = `${Math.floor(endMin / 60).toString().padStart(2, '0')}:${(endMin % 60).toString().padStart(2, '0')}`;
    setSlotBookingTime({ startTime: slot.id, endTime });
    setBookingFlowActive(true);
  }, [calendarBloqueos]);

  const calendarDateLabel = useMemo(() => formatDate(calendarDate), [calendarDate]);

  const noDataMessage = isAdmin
    ? `No bloqueos found for ${calendarDateLabel}. Try a different range or center.`
    : `No bloqueos registered for your account on ${calendarDateLabel}.`;

  // User mode: show the UserBookingView with Spaces/Bookings toggle
  if (!isAdmin) {
    return <UserBookingView />;
  }

  // Admin mode: Show booking flow or calendar/agenda view
  if (bookingFlowActive) {
    return (
      <>
        <BookingFlowPage
          onClose={() => { handleCloseCreateDialog(); setSlotBookingRoom(null); setSlotBookingTime(null); }}
          onCreated={(res) => { handleReservaCreated(res); setSlotBookingRoom(null); setSlotBookingTime(null); }}
          defaultDate={calendarDate}
          mode={mode}
          initialRoom={slotBookingRoom}
          initialTime={slotBookingTime}
        />
        <ReservaDialog
          open={Boolean(editBloqueo)}
          mode="edit"
          onClose={handleCloseEditDialog}
          onUpdated={handleBloqueoUpdated}
          initialBloqueo={editBloqueo}
          defaultDate={calendarDate}
        />
      </>
    );
  }

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
            Workspace Bookings
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Browse every booking across BeWorking locations. Switch between calendar and bookings views.
          </Typography>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Tabs value={view} onChange={handleViewChange} sx={getViewToggleTabsStyle(theme)}>
            <Tab icon={<CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={t('admin.calendarTab')} value="calendar" />
            <Tab icon={<CalendarViewWeekRoundedIcon sx={{ fontSize: 18 }} />} iconPosition="start" label={t('admin.agendaTab')} value="agenda" />
          </Tabs>
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={(e) => {
              console.log('Button clicked!', e);
              handleOpenCreateDialog();
            }}
            disableElevation
            sx={{
              minWidth: 120,
              height: 40,
              borderRadius: 999,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              px: 2.5,
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.dark'
              }
            }}
          >
            {t('admin.reserva')}
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      {view === 'calendar' ? (
        <Stack spacing={3}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                type="date"
                label={t('admin.selectDate')}
                value={calendarDate}
                onChange={handleCalendarDateChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
                size="small"
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
              <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <Table
                  size="small"
                  stickyHeader
                  sx={{
                    '& .MuiTableCell-root': {
                      borderRight: '1px solid',
                      borderRightColor: (theme) => alpha(theme.palette.divider, 0.6)
                    },
                    '& .MuiTableRow-root': {
                      borderBottom: '1px solid',
                      borderBottomColor: (theme) => alpha(theme.palette.divider, 0.6)
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
                          borderRight: '1px solid',
                          borderRightColor: (theme) => alpha(theme.palette.divider, 0.8),
                          boxShadow: (theme) => `4px 0 12px ${alpha(theme.palette.common.black, 0.06)}`
                        }}
                      >
                        {t('admin.room')}
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
                            borderRight: '1px solid',
                            borderRightColor: (theme) => alpha(theme.palette.divider, 0.7),
                            boxShadow: (theme) => `2px 0 8px ${alpha(theme.palette.common.black, 0.04)}`
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
                                title={bloqueo ? describeBloqueo(bloqueo) : t('admin.availableSlot')}
                              >
                                <Box
                                  onClick={() => bloqueo ? handleSelectBloqueo(bloqueo) : handleAvailableSlotClick(room, slot)}
                                  sx={{
                                    height: 52,
                                    width: '100%',
                                    borderRadius: 2,
                                    border: '2px solid',
                                    borderColor: styles.borderColor,
                                    bgcolor: styles.bgcolor,
                                    color: styles.color,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: (theme) => theme.transitions.create(['transform', 'border-color']),
                                    '&:hover': {
                                      transform: 'scale(1.05)'
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
          {/* Filters - Always visible like Contacts/MailboxAdmin */}
          <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
            <Typography variant="h6" gutterBottom>
              {t('admin.filters')}
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={2}>
                    <TextField
                  fullWidth
                  label={t('admin.bookingsDate')}
              type="date"
              value={agendaDate}
              onChange={handleAgendaDateChange}
              InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label={t('admin.searchByName')}
                  value={filterUser}
                  onChange={(event) => setFilterUser(event.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRoundedIcon sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label={t('admin.searchByEmail')}
                  value={filterEmail}
                  onChange={(event) => setFilterEmail(event.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MailOutlinedIcon sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel shrink>{t('admin.filterCentro')}</InputLabel>
                  <Select
                    value={filterCenter}
                    onChange={(event) => setFilterCenter(event.target.value)}
                    label={t('admin.filterCentro')}
                    displayEmpty
                    renderValue={(value) => (value ? value : t('admin.allCentros'))}
                  >
                    <MenuItem value="">
                      {t('admin.allCentros')}
                    </MenuItem>
                    {(filterOptions.centers || []).map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel shrink>{t('admin.filterUserType')}</InputLabel>
                  <Select
                    value={filterUserType}
                    onChange={(event) => setFilterUserType(event.target.value)}
                    label={t('admin.filterUserType')}
                    displayEmpty
                    renderValue={(value) => (value ? value : t('admin.allUserTypes'))}
                  >
                    <MenuItem value="">
                      {t('admin.allUserTypes')}
                    </MenuItem>
                    {(filterOptions.userTypes || []).map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel shrink>{t('admin.filterProducto')}</InputLabel>
                  <Select
                      value={filterProduct}
                      onChange={(event) => setFilterProduct(event.target.value)}
                    label={t('admin.filterProducto')}
                    displayEmpty
                    renderValue={(value) => (value ? value : t('admin.allProducts'))}
                  >
                    <MenuItem value="">
                      {t('admin.allProducts')}
                    </MenuItem>
                    {(filterOptions.products || []).map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    <Button
                variant="outlined"
                size="small"
                onClick={clearFilters}
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    backgroundColor: (theme) => `${theme.palette.primary.main}14`
                  }
                }}
              >
                {t('admin.reset').toUpperCase()}
                    </Button>
              <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
              {t('admin.showingBookings', { shown: agendaBloqueos.length, total: agendaTotalLabel })}
            </Typography>
            </Stack>
          </Paper>
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
              onDelete={handleDeleteBloqueo}
              deletingId={deletingBloqueoId}
            />
          )}
        </Stack>
      )}
      <ReservaDialog
        open={Boolean(editBloqueo)}
        mode="edit"
        onClose={handleCloseEditDialog}
        onUpdated={handleBloqueoUpdated}
        initialBloqueo={editBloqueo}
        defaultDate={calendarDate}
      />

      <BloqueoDetailsDialog
        bloqueo={selectedBloqueo}
        onClose={() => setSelectedBloqueo(null)}
        onEdit={handleStartEditBloqueo}
        onInvoice={handleStartInvoice}
        invoiceLoading={invoiceSubmitting}
      />
      <InvoicePreviewDialog
        open={invoicePreview.open}
        invoice={invoicePreview.invoice}
        pdfUrl={invoicePreview.pdfUrl}
        loading={invoicePreview.loading}
        onClose={() => setInvoicePreview({ open: false, invoice: null, pdfUrl: null, loading: false })}
      />
      <InvoiceFormDialog
        open={invoiceDialog.open}
        bloqueo={invoiceDialog.bloqueo}
        form={invoiceForm}
        onFieldChange={handleInvoiceFieldChange}
        onClose={handleCloseInvoiceDialog}
        onSubmit={handleInvoiceSubmit}
        submitting={invoiceSubmitting}
        error={invoiceError}
      />
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseConfirm}
        aria-labelledby="delete-bloqueo-title"
      >
        <DialogTitle id="delete-bloqueo-title">{t('admin.deleteConfirmTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('admin.deleteConfirmBody')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirm}>{t('admin.cancel')}</Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            disabled={Boolean(deletingBloqueoId)}
            sx={{
              backgroundColor: 'secondary.main',
              '&:hover': { backgroundColor: 'secondary.dark' }
            }}
          >
            {t('admin.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};
export default Booking;
