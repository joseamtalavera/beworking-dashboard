import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
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

import { fetchBookings } from '../../api/bookings.js';

const DEFAULT_START_HOUR = 7;
const DEFAULT_END_HOUR = 20;

const statusStyles = {
  available: {
    bgcolor: 'rgba(34, 197, 94, 0.08)',
    borderColor: '#cbd5f5',
    color: '#15803d'
  },
  booked: {
    bgcolor: 'rgba(251, 146, 60, 0.18)',
    borderColor: '#fb923c',
    color: '#c2410c'
  },
  pending: {
    bgcolor: 'rgba(250, 204, 21, 0.18)',
    borderColor: '#facc15',
    color: '#92400e'
  },
  cancelled: {
    bgcolor: 'rgba(148, 163, 184, 0.16)',
    borderColor: '#94a3b8',
    color: '#475569'
  }
};

const statusLabels = {
  available: 'Available',
  booked: 'Booked',
  pending: 'Booking pending',
  cancelled: 'Cancelled'
};

const LEGEND_STATUSES = ['available', 'booked', 'pending', 'cancelled'];

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

const buildTimeSlots = (bookings) => {
  let minHour = DEFAULT_START_HOUR;
  let maxHour = DEFAULT_END_HOUR;
  let hasTimeData = false;

  bookings.forEach((booking) => {
    const start = timeStringToMinutes(booking.timeFrom);
    const end = timeStringToMinutes(booking.timeTo);
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
    minHour = DEFAULT_START_HOUR;
    maxHour = DEFAULT_END_HOUR;
  }

  if (maxHour <= minHour) {
    maxHour = Math.min(23, minHour + 8);
  }

  minHour = Math.max(0, Math.min(minHour, 23));
  maxHour = Math.max(minHour + 1, Math.min(maxHour, 23));

  const slots = [];
  for (let hour = minHour; hour <= maxHour; hour += 1) {
    const label = `${hour.toString().padStart(2, '0')}:00`;
    slots.push({ id: label, label });
  }
  return slots;
};

const bookingAppliesToDate = (booking, isoDate) => {
  if (!isoDate) {
    return false;
  }
  const dateKey = isoDate;
  const from = booking.dateFrom ?? dateKey;
  const to = booking.dateTo ?? booking.dateFrom ?? dateKey;

  if (from > dateKey || to < dateKey) {
    return false;
  }

  if (Array.isArray(booking.days) && booking.days.length > 0) {
    const weekday = getWeekdayKey(dateKey);
    if (weekday && !booking.days.includes(weekday)) {
      return false;
    }
  }

  return true;
};

const coversSlot = (booking, slot) => {
  const slotMinutes = timeStringToMinutes(slot.id);
  const startMinutes = timeStringToMinutes(booking.timeFrom) ?? 0;
  let endMinutes = timeStringToMinutes(booking.timeTo);

  if (endMinutes == null || endMinutes <= startMinutes) {
    const isAllDay = booking.reservationType?.toLowerCase().includes('dia');
    endMinutes = isAllDay ? 24 * 60 : startMinutes + 60;
  }

  return slotMinutes != null && slotMinutes >= startMinutes && slotMinutes < endMinutes;
};

const mapStatusKey = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized.includes('cancel')) {
    return 'cancelled';
  }
  if (normalized.includes('pend') || normalized.includes('no confirm')) {
    return 'pending';
  }
  return 'booked';
};

const describeBooking = (booking) => {
  const pieces = [];
  if (booking.clientName) {
    pieces.push(booking.clientName);
  }
  if (booking.centerName) {
    pieces.push(booking.centerName);
  }
  if (booking.productName) {
    pieces.push(booking.productName);
  } else if (booking.productType) {
    pieces.push(booking.productType);
  }
  return pieces.join(' · ');
};

const toTimestamp = (value) => {
  if (!value) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const composeRooms = (bookings) => {
  const map = new Map();
  bookings.forEach((booking) => {
    if (!booking.productId) {
      return;
    }
    if (!map.has(booking.productId)) {
      map.set(booking.productId, {
        id: booking.productId,
        label: booking.productName || booking.productType || `Room ${booking.productId}`,
        productId: booking.productId,
        centerName: booking.centerName,
        centerCode: booking.centerCode
      });
    }
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
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Center</TableCell>
              <TableCell>User type</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Start hour</TableCell>
              <TableCell>Finish hour</TableCell>
              <TableCell>Payment status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginated.map((booking) => {
              const statusKey = mapStatusKey(booking.status);
              const statusStyle = statusStyles[statusKey];
              const statusLabel = booking.status || statusLabels[statusKey];
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

const AgendaTable = ({ bookings, onSelect }) => {
  const sortedBookings = useMemo(() => {
    const clone = [...bookings];
    clone.sort((a, b) => {
      const timeA = timeStringToMinutes(a.timeFrom);
      const timeB = timeStringToMinutes(b.timeFrom);
      const normalizedA = timeA != null ? timeA : -1;
      const normalizedB = timeB != null ? timeB : -1;
      if (normalizedA !== normalizedB) {
        return normalizedA - normalizedB;
      }
      return (a.clientName || '').localeCompare(b.clientName || '');
    });
    return clone;
  }, [bookings]);

  if (sortedBookings.length === 0) {
    return (
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', py: 6 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          No bookings scheduled for this date.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Center</TableCell>
              <TableCell>User type</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Start hour</TableCell>
              <TableCell>Finish hour</TableCell>
              <TableCell>Payment status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedBookings.map((booking) => {
              const statusKey = mapStatusKey(booking.status);
              const statusStyle = statusStyles[statusKey];
              const statusLabel = booking.status || statusLabels[statusKey];
              const startHour = booking.timeFrom ? booking.timeFrom : 'All day';
              const finishHour = booking.timeTo
                ? booking.timeTo
                : booking.timeFrom
                ? '—'
                : 'All day';
              return (
                <TableRow
                  key={`agenda-${booking.id}`}
                  hover
                  onClick={() => onSelect(booking)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>{booking.clientName || '—'}</TableCell>
                  <TableCell>{booking.centerName || booking.centerCode || '—'}</TableCell>
                  <TableCell>{booking.clientTenantType || '—'}</TableCell>
                  <TableCell>{booking.productName || booking.productType || '—'}</TableCell>
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
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
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

const initialDateISO = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, '0');
  const day = `${today.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const Booking = ({ mode = 'user' }) => {
  const isAdmin = mode === 'admin';
  const [view, setView] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(initialDateISO());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [filterUser, setFilterUser] = useState('');
  const [filterCenter, setFilterCenter] = useState('');
  const [filterProduct, setFilterProduct] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterCheckIn, setFilterCheckIn] = useState('');
  const [filterCheckOut, setFilterCheckOut] = useState('');
  const [agendaUserTypeFilter, setAgendaUserTypeFilter] = useState('');

  const monthKey = useMemo(() => selectedDate.slice(0, 7), [selectedDate]);

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

    fetchBookings({ from, to }, { signal: controller.signal })
      .then((data) => {
        setBookings(Array.isArray(data) ? data : []);
      })
      .catch((fetchError) => {
        if (fetchError.name === 'AbortError') {
          return;
        }
        setError(fetchError.message || 'Unable to load bookings');
        setBookings([]);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [monthKey, mode]);

  const timeSlots = useMemo(() => buildTimeSlots(bookings), [bookings]);
  const rooms = useMemo(() => composeRooms(bookings), [bookings]);
  const filterOptions = useMemo(() => {
    const users = new Set();
    const centers = new Set();
    const products = new Set();
    const userTypes = new Set();

    bookings.forEach((booking) => {
      if (booking.clientName) {
        users.add(booking.clientName);
      }
      const centerLabel = booking.centerName || booking.centerCode;
      if (centerLabel) {
        centers.add(centerLabel);
      }
      const productLabel = booking.productName || booking.productType;
      if (productLabel) {
        products.add(productLabel);
      }
      if (booking.clientTenantType) {
        userTypes.add(booking.clientTenantType);
      }
    });

    const sorter = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' });

    return {
      users: Array.from(users).sort(sorter),
      centers: Array.from(centers).sort(sorter),
      products: Array.from(products).sort(sorter),
      userTypes: Array.from(userTypes).sort(sorter)
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const userLabel = booking.clientName || '';
      if (filterUser && userLabel !== filterUser) {
        return false;
      }

      const centerLabel = booking.centerName || booking.centerCode || '';
      if (filterCenter && centerLabel !== filterCenter) {
        return false;
      }

      const productLabel = booking.productName || booking.productType || '';
      if (filterProduct && productLabel !== filterProduct) {
        return false;
      }

      if (filterEmail) {
        const email = (booking.clientEmail || '').toLowerCase();
        if (!email.includes(filterEmail.toLowerCase())) {
          return false;
        }
      }

      const startDate = booking.dateFrom || booking.dateTo || '';
      const endDate = booking.dateTo || booking.dateFrom || '';

      if (filterCheckIn && (!startDate || startDate < filterCheckIn)) {
        return false;
      }

      if (filterCheckOut && (!endDate || endDate > filterCheckOut)) {
        return false;
      }

      return true;
    });
  }, [bookings, filterUser, filterCenter, filterProduct, filterEmail, filterCheckIn, filterCheckOut]);

  const dayBookings = useMemo(
    () => bookings.filter((booking) => bookingAppliesToDate(booking, selectedDate)),
    [bookings, selectedDate]
  );

  const agendaBookings = useMemo(() => {
    const sameDayBookings = dayBookings.filter((booking) => {
      const from = booking.dateFrom;
      const to = booking.dateTo || booking.dateFrom;
      if (!from || !to) {
        return true;
      }
      return from === to;
    });

    if (!agendaUserTypeFilter) {
      return sameDayBookings;
    }
    return sameDayBookings.filter(
      (booking) => (booking.clientTenantType || '') === agendaUserTypeFilter
    );
  }, [agendaUserTypeFilter, dayBookings]);

  const selectedDateLabel = useMemo(() => formatDate(selectedDate), [selectedDate]);

  const getSlotStatus = (room, slot) => {
    const booking = dayBookings.find(
      (entry) => entry.productId === room.productId && coversSlot(entry, slot)
    );
    if (!booking) {
      return { status: 'available', booking: null };
    }
    return { status: mapStatusKey(booking.status), booking };
  };

  const handleViewChange = (_event, newValue) => {
    if (newValue) {
      setView(newValue);
    }
  };

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  const handleSelectBooking = (booking) => {
    if (booking) {
      setSelectedBooking(booking);
    }
  };

  const noDataMessage = isAdmin
    ? 'No bookings found for this date. Try a different range or center.'
    : 'No bookings registered for your account on this date.';

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          {isAdmin ? 'Workspace bookings' : 'My meeting room bookings'}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isAdmin
            ? 'Browse every reservation across BeWorking locations. Switch between calendar, list, and agenda views to review occupancy, statuses, and tenants.'
            : 'Track your reservations, check upcoming slots, and review booking details from the calendar, list, or agenda views.'}
        </Typography>
      </Stack>

      <Tabs value={view} onChange={handleViewChange} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tab label="Calendar" value="calendar" disableRipple />
        <Tab label="Bookings" value="list" disableRipple />
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
                value={selectedDate}
                onChange={handleDateChange}
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
                            {room.centerName && (
                              <Typography variant="caption" color="text.secondary">
                                {room.centerName}
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                        {timeSlots.map((slot) => {
                          const { status, booking } = getSlotStatus(room, slot);
                          const styles = statusStyles[status];
                          return (
                            <TableCell key={`${room.id}-${slot.id}`} align="center" sx={{ p: 1.25 }}>
                              <Tooltip
                                arrow
                                title={booking ? describeBooking(booking) : 'Available slot'}
                              >
                                <Box
                                  onClick={() => booking && handleSelectBooking(booking)}
                                  sx={{
                                    height: 52,
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: styles.borderColor,
                                    bgcolor: styles.bgcolor,
                                    color: styles.color,
                                    cursor: booking ? 'pointer' : 'default',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: (theme) => theme.transitions.create('transform'),
                                    '&:hover': {
                                      transform: booking ? 'scale(1.03)' : 'none'
                                    }
                                  }}
                                >
                                  {booking ? (
                                    <Typography variant="caption" fontWeight={600} noWrap>
                                      {booking.clientName || booking.productName || 'Booked'}
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
      ) : view === 'list' ? (
        <Stack spacing={3}>
          {loading ? (
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', py: 8 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={32} />
              </Box>
            </Paper>
          ) : (
            <Stack spacing={2}>
              <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2 }}>
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                  <Box sx={{ flex: '1 1 180px', minWidth: 0 }}>
                    <TextField
                      select
                      label="User"
                      value={filterUser}
                      onChange={(event) => setFilterUser(event.target.value)}
                      fullWidth
                    >
                      <MenuItem value="">All users</MenuItem>
                      {filterOptions.users.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                  <Box sx={{ flex: '1 1 180px', minWidth: 0 }}>
                    <TextField
                      select
                      label="Center"
                      value={filterCenter}
                      onChange={(event) => setFilterCenter(event.target.value)}
                      fullWidth
                    >
                      <MenuItem value="">All centers</MenuItem>
                      {filterOptions.centers.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                  <Box sx={{ flex: '1 1 180px', minWidth: 0 }}>
                    <TextField
                      select
                      label="Product"
                      value={filterProduct}
                      onChange={(event) => setFilterProduct(event.target.value)}
                      fullWidth
                    >
                      <MenuItem value="">All products</MenuItem>
                      {filterOptions.products.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                  <Box sx={{ flex: '1 1 180px', minWidth: 0 }}>
                    <TextField
                      label="Email contains"
                      value={filterEmail}
                      onChange={(event) => setFilterEmail(event.target.value)}
                      placeholder="tenant@domain.com"
                      fullWidth
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 180px', minWidth: 0 }}>
                    <TextField
                      type="date"
                      label="Check-in from"
                      value={filterCheckIn}
                      onChange={(event) => setFilterCheckIn(event.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 180px', minWidth: 0 }}>
                    <TextField
                      type="date"
                      label="Check-out to"
                      value={filterCheckOut}
                      onChange={(event) => setFilterCheckOut(event.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 180px', minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                    <Button
                      variant="text"
                      onClick={() => {
                        setFilterUser('');
                        setFilterCenter('');
                        setFilterProduct('');
                        setFilterEmail('');
                        setFilterCheckIn('');
                        setFilterCheckOut('');
                      }}
                    >
                      Clear filters
                    </Button>
                  </Box>
                </Box>
              </Paper>
              <BookingsTable bookings={filteredBookings} onSelect={handleSelectBooking} />
            </Stack>
          )}
        </Stack>
      ) : (
        <Stack spacing={3}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                type="date"
                label="Agenda date"
                value={selectedDate}
                onChange={handleDateChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select
                label="User type"
                value={agendaUserTypeFilter}
                onChange={(event) => setAgendaUserTypeFilter(event.target.value)}
                fullWidth
              >
                <MenuItem value="">All user types</MenuItem>
                {(filterOptions.userTypes || []).map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={12} md={4}>
              {selectedDateLabel !== '—' && (
                <Typography variant="body2" color="text.secondary">
                  Showing bookings happening on {selectedDateLabel}.
                </Typography>
              )}
            </Grid>
          </Grid>

          {loading ? (
            <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', py: 8 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={32} />
              </Box>
            </Paper>
          ) : (
            <AgendaTable bookings={agendaBookings} onSelect={handleSelectBooking} />
          )}
        </Stack>
      )}

      <BookingDetailsDialog booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
    </Stack>
  );
};

export default Booking;
