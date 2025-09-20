import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

const accentColor = '#fb923c';
const availableColor = '#22c55e';
const pendingColor = '#facc15';

const ROOMS = [
  { id: 'room-1', name: 'Room A1' },
  { id: 'room-2', name: 'Room A2' },
  { id: 'room-3', name: 'Room A3' },
  { id: 'room-4', name: 'Room A4' },
  { id: 'room-5', name: 'Room A5' }
];

const CLIENT_OPTIONS = ['ACME Corp.', 'Lunar Bank', 'Cloud Ops Ltd.', 'BeWorking Tenant'];
const CENTER_OPTIONS = ['MA1 - Malaga Dumas', 'MAD - Madrid Center', 'BCN - Barcelona Hub'];
const ROOM_TYPE_OPTIONS = ['Aula', 'Sala de reuniones', 'Despacho'];
const PRODUCT_OPTIONS = ['MA1A1', 'MA1A2', 'MA1A3', 'MA1A4', 'MA1A5'];
const RESERVATION_TYPES = ['Por horas', 'Por día'];
const CONFIGURATION_OPTIONS = ['Boardroom', 'Escuela', 'Auditorio', 'U-shape'];
const WEEKDAY_OPTIONS = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' }
];

const TIME_SLOTS = Array.from({ length: 17 }).map((_, idx) => {
  const hour = 7 + idx; // 07:00 to 23:00
  return {
    id: `${hour.toString().padStart(2, '0')}:00`,
    label: `${hour.toString().padStart(2, '0')}:00`
  };
});

const initialDateISO = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = `${today.getMonth() + 1}`.padStart(2, '0');
  const day = `${today.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const INITIAL_BOOKINGS = [
  {
    id: 'bk-100',
    roomId: 'room-2',
    slotId: '10:00',
    date: initialDateISO(),
    status: 'booked',
    title: 'Marketing sync',
    host: 'Ana Steele',
    client: 'ACME Corp.',
    center: 'MA1 - Malaga Dumas',
    roomType: 'Aula',
    product: 'MA1A2',
    reservationType: 'Por horas',
    rate: '45',
    attendees: '8',
    configuration: 'Boardroom',
    days: ['tuesday'],
    dateFrom: initialDateISO(),
    dateTo: initialDateISO(),
    timeFrom: '10:00',
    timeTo: '11:00'
  },
  {
    id: 'bk-101',
    roomId: 'room-4',
    slotId: '14:00',
    date: initialDateISO(),
    status: 'pending',
    title: 'Client onboarding',
    host: 'Mark Chen',
    client: 'Cloud Ops Ltd.',
    center: 'MA1 - Malaga Dumas',
    roomType: 'Aula',
    product: 'MA1A4',
    reservationType: 'Por horas',
    rate: '60',
    attendees: '5',
    configuration: 'Escuela',
    days: ['thursday'],
    dateFrom: initialDateISO(),
    dateTo: initialDateISO(),
    timeFrom: '14:00',
    timeTo: '15:00'
  }
];

const statusStyles = {
  available: {
    bgcolor: 'rgba(34, 197, 94, 0.12)',
    borderColor: availableColor,
    color: availableColor
  },
  booked: {
    bgcolor: 'rgba(251, 146, 60, 0.15)',
    borderColor: accentColor,
    color: accentColor
  },
  pending: {
    bgcolor: 'rgba(250, 204, 21, 0.18)',
    borderColor: pendingColor,
    color: '#92400e'
  }
};

const statusLabels = {
  available: 'Available',
  booked: 'Booked',
  pending: 'Booked · Payment pending'
};

const Legend = () => (
  <Stack direction="row" spacing={2} flexWrap="wrap">
    {['available', 'booked', 'pending'].map((status) => (
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

const Booking = () => {
  const [selectedDate, setSelectedDate] = useState(initialDateISO());
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);

  const computeNextSlot = (slotId) => {
    if (!slotId) return '';
    const [hourString] = slotId.split(':');
    const hour = Number.parseInt(hourString, 10);
    if (hour >= 23) return '23:59';
    const nextHour = hour + 1;
    return `${nextHour.toString().padStart(2, '0')}:00`;
  };

  const buildEmptyDialogState = (roomId = '', slotId = '') => ({
    open: false,
    readOnly: false,
    id: undefined,
    roomId,
    slotId,
    title: '',
    host: '',
    status: 'pending',
    client: CLIENT_OPTIONS[0],
    center: CENTER_OPTIONS[0],
    roomType: ROOM_TYPE_OPTIONS[0],
    product: PRODUCT_OPTIONS[0],
    reservationType: RESERVATION_TYPES[0],
    rate: '',
    attendees: '',
    configuration: CONFIGURATION_OPTIONS[0],
    days: [],
    dateFrom: selectedDate,
    dateTo: selectedDate,
    timeFrom: slotId || '',
    timeTo: slotId ? computeNextSlot(slotId) : ''
  });

  const [dialog, setDialog] = useState(buildEmptyDialogState());

  const dayBookings = useMemo(() => bookings.filter((bk) => bk.date === selectedDate), [bookings, selectedDate]);

  const getSlotStatus = (roomId, slotId) => {
    const match = dayBookings.find((bk) => bk.roomId === roomId && bk.slotId === slotId);
    if (!match) {
      return { status: 'available', booking: null };
    }
    return { status: match.status, booking: match };
  };

  const openDialogForSlot = (roomId, slotId) => {
    const { status, booking } = getSlotStatus(roomId, slotId);
    if (status !== 'available') {
      if (!booking) return;
      setDialog({
        ...buildEmptyDialogState(roomId, slotId),
        open: true,
        readOnly: true,
        id: booking.id,
        title: booking.title,
        host: booking.host,
        status: booking.status,
        client: booking.client,
        center: booking.center,
        roomType: booking.roomType,
        product: booking.product,
        reservationType: booking.reservationType,
        rate: booking.rate,
        attendees: booking.attendees,
        configuration: booking.configuration,
        days: booking.days ?? [],
        dateFrom: booking.dateFrom ?? booking.date,
        dateTo: booking.dateTo ?? booking.date,
        timeFrom: booking.timeFrom ?? slotId,
        timeTo: booking.timeTo ?? computeNextSlot(slotId)
      });
      return;
    }
    setDialog({ ...buildEmptyDialogState(roomId, slotId), open: true });
  };

  const closeDialog = () => {
    setDialog(buildEmptyDialogState());
  };

  const handleSubmitBooking = () => {
    if (!dialog.title || !dialog.host) return;
    const newBooking = {
      id: `bk-${Date.now()}`,
      roomId: dialog.roomId,
      slotId: dialog.slotId,
      date: selectedDate,
      status: dialog.status,
      title: dialog.title,
      host: dialog.host,
      client: dialog.client,
      center: dialog.center,
      roomType: dialog.roomType,
      product: dialog.product,
      reservationType: dialog.reservationType,
      rate: dialog.rate,
      attendees: dialog.attendees,
      configuration: dialog.configuration,
      days: dialog.days,
      dateFrom: dialog.dateFrom,
      dateTo: dialog.dateTo,
      timeFrom: dialog.timeFrom || dialog.slotId,
      timeTo: dialog.timeTo || computeNextSlot(dialog.slotId)
    };
    setBookings((prev) => [...prev.filter((bk) => !(bk.roomId === newBooking.roomId && bk.slotId === newBooking.slotId && bk.date === newBooking.date)), newBooking]);
    closeDialog();
  };

  const updateDialogField = (field, value) => {
    setDialog((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDialogDay = (dayValue) => {
    setDialog((prev) => {
      const exists = prev.days.includes(dayValue);
      return {
        ...prev,
        days: exists ? prev.days.filter((value) => value !== dayValue) : [...prev.days, dayValue]
      };
    });
  };

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          Meeting Rooms
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track availability for all five rooms. Select an available slot to create a booking. Existing slots show current details and payment status.
        </Typography>
      </Stack>

      <Grid container spacing={3} alignItems="center">
        <Grid item xs={12} sm={6} md={4}>
          <TextField
            type="date"
            label="Select date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6} md={8}>
          <Legend />
        </Grid>
      </Grid>

      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 160 }}>Meeting room</TableCell>
                {TIME_SLOTS.map((slot) => (
                  <TableCell key={slot.id} align="center">
                    <Typography variant="subtitle2" fontWeight="bold">
                      {slot.label}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {ROOMS.map((room) => (
                <TableRow key={room.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {room.name}
                    </Typography>
                  </TableCell>
                  {TIME_SLOTS.map((slot) => {
                    const { status, booking } = getSlotStatus(room.id, slot.id);
                    const styles = statusStyles[status];
                    return (
                      <TableCell key={`${room.id}-${slot.id}`} align="center" sx={{ p: 1.5 }}>
                        <Tooltip
                          title={
                            status === 'available'
                              ? 'Click to reserve this room'
                              : `${booking?.title} — ${booking?.host}`
                          }
                          arrow
                        >
                          <Box
                            onClick={() => openDialogForSlot(room.id, slot.id)}
                            sx={{
                              height: 54,
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: styles.borderColor,
                              bgcolor: styles.bgcolor,
                              color: styles.color,
                              cursor: status === 'available' ? 'pointer' : 'default',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: (theme) => theme.transitions.create('transform'),
                              '&:hover': {
                                transform: status === 'available' ? 'scale(1.02)' : 'none'
                              }
                            }}
                          >
                            <Box component="span" sx={{ display: 'none' }}>
                              {statusLabels[status]}
                            </Box>
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

      <Dialog open={dialog.open} onClose={closeDialog} fullWidth maxWidth="md">
        <DialogTitle>
          {dialog.readOnly ? 'Booking details' : 'Reserve meeting room'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Room"
                value={ROOMS.find((room) => room.id === dialog.roomId)?.name ?? ''}
                InputProps={{ readOnly: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={3} md={2}>
              <TextField label="Slot" value={dialog.slotId} InputProps={{ readOnly: true }} fullWidth />
            </Grid>
            <Grid item xs={12} sm={3} md={2}>
              <TextField label="Date" value={selectedDate} InputProps={{ readOnly: true }} fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth disabled={dialog.readOnly}>
                <InputLabel id="booking-status-label">Estado</InputLabel>
                <Select
                  labelId="booking-status-label"
                  value={dialog.status}
                  label="Estado"
                  onChange={(event) => updateDialogField('status', event.target.value)}
                  input={<OutlinedInput label="Estado" />}
                >
                  <MenuItem value="pending">Booked – payment pending</MenuItem>
                  <MenuItem value="booked">Booked – paid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Título de la reunión"
                value={dialog.title}
                onChange={(event) => updateDialogField('title', event.target.value)}
                disabled={dialog.readOnly}
                placeholder="e.g. Revisión trimestral"
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Cliente / anfitrión"
                value={dialog.host}
                onChange={(event) => updateDialogField('host', event.target.value)}
                disabled={dialog.readOnly}
                placeholder="Nombre del participante"
                fullWidth
              />
            </Grid>
          </Grid>

          <Divider flexItem />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth disabled={dialog.readOnly}>
                <InputLabel id="cliente-label">Cliente</InputLabel>
                <Select
                  labelId="cliente-label"
                  value={dialog.client}
                  label="Cliente"
                  onChange={(event) => updateDialogField('client', event.target.value)}
                  input={<OutlinedInput label="Cliente" />}
                >
                  {CLIENT_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth disabled={dialog.readOnly}>
                <InputLabel id="center-label">Centro</InputLabel>
                <Select
                  labelId="center-label"
                  value={dialog.center}
                  label="Centro"
                  onChange={(event) => updateDialogField('center', event.target.value)}
                  input={<OutlinedInput label="Centro" />}
                >
                  {CENTER_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth disabled={dialog.readOnly}>
                <InputLabel id="room-type-label">Tipo</InputLabel>
                <Select
                  labelId="room-type-label"
                  value={dialog.roomType}
                  label="Tipo"
                  onChange={(event) => updateDialogField('roomType', event.target.value)}
                  input={<OutlinedInput label="Tipo" />}
                >
                  {ROOM_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth disabled={dialog.readOnly}>
                <InputLabel id="product-label">Producto</InputLabel>
                <Select
                  labelId="product-label"
                  value={dialog.product}
                  label="Producto"
                  onChange={(event) => updateDialogField('product', event.target.value)}
                  input={<OutlinedInput label="Producto" />}
                >
                  {PRODUCT_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth disabled={dialog.readOnly}>
                <InputLabel id="reservation-type-label">Reserva</InputLabel>
                <Select
                  labelId="reservation-type-label"
                  value={dialog.reservationType}
                  label="Reserva"
                  onChange={(event) => updateDialogField('reservationType', event.target.value)}
                  input={<OutlinedInput label="Reserva" />}
                >
                  {RESERVATION_TYPES.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Tarifa"
                value={dialog.rate}
                onChange={(event) => updateDialogField('rate', event.target.value)}
                disabled={dialog.readOnly}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Asistentes"
                value={dialog.attendees}
                onChange={(event) => updateDialogField('attendees', event.target.value)}
                disabled={dialog.readOnly}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth disabled={dialog.readOnly}>
                <InputLabel id="configuration-label">Configuración</InputLabel>
                <Select
                  labelId="configuration-label"
                  value={dialog.configuration}
                  label="Configuración"
                  onChange={(event) => updateDialogField('configuration', event.target.value)}
                  input={<OutlinedInput label="Configuración" />}
                >
                  {CONFIGURATION_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <FormGroup row sx={{ gap: 1 }}>
            {WEEKDAY_OPTIONS.map((day) => (
              <FormControlLabel
                key={day.value}
                control={
                  <Checkbox
                    checked={dialog.days.includes(day.value)}
                    onChange={() => toggleDialogDay(day.value)}
                    disabled={dialog.readOnly}
                  />
                }
                label={day.label}
              />
            ))}
          </FormGroup>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                type="date"
                label="De"
                value={dialog.dateFrom}
                onChange={(event) => updateDialogField('dateFrom', event.target.value)}
                disabled={dialog.readOnly}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                type="date"
                label="A"
                value={dialog.dateTo}
                onChange={(event) => updateDialogField('dateTo', event.target.value)}
                disabled={dialog.readOnly}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                type="time"
                label="Desde"
                value={dialog.timeFrom}
                onChange={(event) => updateDialogField('timeFrom', event.target.value)}
                disabled={dialog.readOnly}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                type="time"
                label="Hasta"
                value={dialog.timeTo}
                onChange={(event) => updateDialogField('timeTo', event.target.value)}
                disabled={dialog.readOnly}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Grid>
          </Grid>

          {dialog.readOnly && (
            <Chip
              label={statusLabels[dialog.status]}
              sx={{
                alignSelf: 'flex-start',
                bgcolor: statusStyles[dialog.status].bgcolor,
                color: statusStyles[dialog.status].color,
                border: '1px solid',
                borderColor: statusStyles[dialog.status].borderColor
              }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Close</Button>
          {!dialog.readOnly && (
            <Button variant="contained" onClick={handleSubmitBooking} sx={{ bgcolor: accentColor, '&:hover': { bgcolor: '#f97316' } }}>
              Save booking
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default Booking;
