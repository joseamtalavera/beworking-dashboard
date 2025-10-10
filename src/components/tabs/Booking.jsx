import { useCallback, useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
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

import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';

import {
  createReserva,
  fetchBloqueos,
  fetchBookingContacts,
  fetchBookingCentros,
  fetchBookingProductos,
  deleteBloqueo
} from '../../api/bookings.js';
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

const formatDateRange = (from, to) => {
  if (!from && !to) {
    return '—';
  }
  if (from && to && from !== to) {
    return `${formatDate(from)} – ${formatDate(to)}`;
  }
  return formatDate(from ?? to);
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
  for (let hour = DEFAULT_START_HOUR; hour <= DEFAULT_END_HOUR; hour += 1) {
    const label = `${hour.toString().padStart(2, '0')}:00`;
    slots.push({ id: label, label });
  }
  return slots;
};

const buildTimeSlots = (bloqueos) => {
  if (!Array.isArray(bloqueos) || bloqueos.length === 0) {
    return buildDefaultSlots();
  }
  let minHour = DEFAULT_START_HOUR;
  let maxHour = DEFAULT_END_HOUR;
  let hasTimeData = false;

  bloqueos.forEach((bloqueo) => {
    const startTime = bloqueo.fechaIni ? bloqueo.fechaIni.split('T')[1] : null;
    const endTime = bloqueo.fechaFin ? bloqueo.fechaFin.split('T')[1] : null;
    
    const start = timeStringToMinutes(startTime);
    const end = timeStringToMinutes(endTime);
    if (start != null) {
      hasTimeData = true;
      minHour = Math.min(minHour, Math.floor(start / 60));
    }
    if (end != null) {
      hasTimeData = true;
      maxHour = Math.max(maxHour, Math.ceil(end / 60));
    }
  });

  if (!hasTimeData) {
    return buildDefaultSlots();
  }

  if (maxHour <= minHour) {
    maxHour = Math.min(23, minHour + 8);
  }

  minHour = Math.max(DEFAULT_START_HOUR, Math.min(minHour, 23));
  maxHour = Math.max(minHour + 1, Math.min(maxHour, 23));

  return buildDefaultSlots().filter((slot) => {
    const hourValue = Number.parseInt(slot.id.split(':')[0], 10);
    return hourValue >= minHour && hourValue <= maxHour;
  });
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

const CreateReservaDialog = ({ open, onClose, onCreated, defaultDate }) => {
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
  const buildInitialState = () => ({
    contact: null,
    centro: null,
    producto: null,
    userType: DEFAULT_USER_TYPE,
    reservationType: DEFAULT_RESERVATION_TYPE,
    dateFrom: defaultDate || initialDateISO(),
    dateTo: defaultDate || initialDateISO(),
    startTime: DEFAULT_TIME_RANGE.start,
    endTime: DEFAULT_TIME_RANGE.end,
    weekdays: [],
    openEnded: false,
    tarifa: '',
    attendees: '',
    configuracion: '',
    note: '',
    status: STATUS_FORM_OPTIONS[0]
  });

  const [formState, setFormState] = useState(buildInitialState);
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
  }, [open, defaultDate]);

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

        setCentroOptions(filteredCenters);
        setProductOptions(Array.isArray(products) ? products : []);
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
  }, [open]);

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
          setContactOptions(Array.isArray(contacts) ? contacts : []);
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
  }, [open, contactInputValue, formState.userType]);

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
      setError('Start date must be before or equal to end date.');
      return;
    }

    if (isPerHour) {
      if (!formState.startTime || !formState.endTime) {
        setError('Both start and end times are required for hourly bookings.');
        return;
      }
      if (formState.startTime >= formState.endTime) {
        setError('End time must be after start time.');
        return;
      }
    }

    const tarifaValue = String(formState.tarifa ?? '').trim();
    const tarifa = tarifaValue === '' ? null : Number(tarifaValue);
    if (tarifaValue !== '' && Number.isNaN(tarifa)) {
      setError('Tarifa must be a valid number.');
      return;
    }

    const attendeesValue = String(formState.attendees ?? '').trim();
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
      const response = await createReserva(payload);
      onCreated?.(response);
    } catch (apiError) {
      setError(apiError.message || 'Unable to create reserva.');
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
              <AddRoundedIcon sx={{ color: 'white', fontSize: 20 }} />
            </Box>
            <Stack>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                Create reserva
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Add a new reservation to the system
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
            {submitting ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : 'Create reserva'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

const BookingDetailsDialog = ({ booking, onClose }) => {
  const open = Boolean(booking);
  const daysLabel = useMemo(() => {
    if (!booking?.days || booking.days.length === 0) {
      return '—';
    }
    return booking.days
      .map((day) => day.charAt(0).toUpperCase() + day.slice(1))
      .join(', ');
  }, [booking]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Booking details</DialogTitle>
      <DialogContent dividers>
        {booking ? (
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Client
                </Typography>
                <Typography variant="body2">{booking.clientName || '—'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {booking.clientEmail || ''}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Center / Room
                </Typography>
                <Typography variant="body2">
                  {booking.centerName || booking.centerCode || '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {booking.productName || booking.productType || '—'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Date range
                </Typography>
                <Typography variant="body2">
                  {formatDateRange(booking.dateFrom, booking.dateTo)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Time
                </Typography>
                <Typography variant="body2">
                  {formatTimeRange(booking.timeFrom, booking.timeTo)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Reservation type
                </Typography>
                <Typography variant="body2">{booking.reservationType || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Status
                </Typography>
                <Typography variant="body2">{statusLabels[mapStatusKey(booking.status)]}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Days
                </Typography>
                <Typography variant="body2">{daysLabel}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Attendees
                </Typography>
                <Typography variant="body2">
                  {typeof booking.attendees === 'number' ? booking.attendees : '—'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Notes
                </Typography>
                <Typography variant="body2">{booking.notes || '—'}</Typography>
              </Grid>
            </Grid>
          </Stack>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const BloqueoDetailsDialog = ({ bloqueo, onClose }) => {
  const open = Boolean(bloqueo);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Bloqueo details</DialogTitle>
      <DialogContent dividers>
        {bloqueo ? (
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Cliente
                </Typography>
                <Typography variant="body2">{bloqueo.cliente?.nombre || '—'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {bloqueo.cliente?.email || ''}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Centro / Producto
                </Typography>
                <Typography variant="body2">
                  {bloqueo.centro?.nombre || '—'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {bloqueo.producto?.nombre || '—'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Fecha inicio
                </Typography>
                <Typography variant="body2">
                  {bloqueo.fechaIni ? new Date(bloqueo.fechaIni).toLocaleString() : '—'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Fecha fin
                </Typography>
                <Typography variant="body2">
                  {bloqueo.fechaFin ? new Date(bloqueo.fechaFin).toLocaleString() : '—'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Estado
                </Typography>
                <Typography variant="body2">{bloqueo.estado || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Asistentes
                </Typography>
                <Typography variant="body2">
                  {bloqueo.asistentes || '—'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Tarifa
                </Typography>
                <Typography variant="body2">
                  {bloqueo.tarifa ? `€${bloqueo.tarifa}` : '—'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Configuración
                </Typography>
                <Typography variant="body2">{bloqueo.configuracion || '—'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Nota
                </Typography>
                <Typography variant="body2">{bloqueo.nota || '—'}</Typography>
              </Grid>
            </Grid>
          </Stack>
        ) : null}
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
  const [confirmDialog, setConfirmDialog] = useState({ open: false, bloqueoId: null });

  const handleOpenCreateDialog = useCallback(() => {
    setCreateDialogOpen(true);
  }, []);

  const handleCloseCreateDialog = useCallback(() => {
    setCreateDialogOpen(false);
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

        const tenantType = resolveTenantType(bloqueo);
        if (filterUserType && tenantType !== filterUserType) {
          return false;
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
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 220 }}>Room</TableCell>
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
                        <TableCell>
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
        <CreateReservaDialog
          open={createDialogOpen}
          onClose={handleCloseCreateDialog}
          onCreated={handleReservaCreated}
          defaultDate={calendarDate}
        />
      ) : null}

      <BloqueoDetailsDialog bloqueo={selectedBloqueo} onClose={() => setSelectedBloqueo(null)} />
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
