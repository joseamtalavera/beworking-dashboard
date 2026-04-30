import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';

import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Switch from '@mui/material/Switch';
import TextField from '../../common/ClearableTextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';

import EventRepeatRoundedIcon from '@mui/icons-material/EventRepeatRounded';


import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n/i18n.js';
import esBooking from '../../../i18n/locales/es/booking.json';
import enBooking from '../../../i18n/locales/en/booking.json';

import { useBookingFlow } from '../BookingFlowContext';
import { fetchPublicAvailability, fetchBloqueos } from '../../../api/bookings';
import { fetchDeskOccupancy } from '../../../api/subscriptions';
import RoomCalendarGrid, { CalendarLegend } from '../RoomCalendarGrid';
import TimeSlotSelect from '../TimeSlotSelect';
import { addMinutesToTime, buildTimeSlots, getBookedSlotIds, getMaxEndTime } from '../../../utils/calendarUtils';
import { GRID_DESKS, buildDeskMap } from '../CoworkingFloorPlan';

if (!i18n.hasResourceBundle('es', 'booking')) {
  i18n.addResourceBundle('es', 'booking', esBooking);
  i18n.addResourceBundle('en', 'booking', enBooking);
}

const pillFieldSx = (hasValue) => ({
  '& .MuiInputLabel-root': { fontSize: '0.7rem', fontWeight: 700, color: hasValue ? 'brand.green' : 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em', transition: 'color 0.2s' },
  '& .MuiInput-input': { fontSize: '0.875rem', color: hasValue ? 'text.primary' : 'text.secondary', py: 0.25 },
});

const pillFieldNumberSx = (hasValue) => ({
  ...pillFieldSx(hasValue),
  '& input[type=number]::-webkit-inner-spin-button, & input[type=number]::-webkit-outer-spin-button': { display: 'none' },
  '& input[type=number]': { MozAppearance: 'textfield' },
});

const pillSx = {
  borderRadius: 999,
  px: 4,
  py: 1.25,
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '0.95rem',
};

const DESK_BOOKING_TYPES = [
  { label: 'Day', value: 'day' },
  { label: 'Month', value: 'month' },
];
const DESK_DURATION_OPTIONS = [
  { label: '1 month', months: 1 },
  { label: '3 months', months: 3 },
  { label: '6 months', months: 6 },
  { label: '12 months', months: 12 },
];
const getMonthEnd = (startDate, months) => {
  const d = new Date(startDate + 'T00:00:00');
  d.setMonth(d.getMonth() + months);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

const WEEKDAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_JS_MAP = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0 };

export default function SelectDetailsStep({ mode = 'admin' }) {
  const { t } = useTranslation('booking');
  const { state, setField, setFields, nextStep } = useBookingFlow();
  const [validationError, setValidationError] = useState('');
  const [recurring, setRecurring] = useState(
    () => state.weekdays?.length > 0 && state.dateFrom !== state.dateTo,
  );

  // Detect desk product
  const isDeskProduct = useMemo(() => {
    const name = (state.producto?.name || '').toUpperCase().replace(/[-_\s]/g, '');
    return name === 'MA1DESK' || name === 'MA1DESKS' || /^MA1O1\d{1,2}$/.test(name);
  }, [state.producto?.name]);

  const [selectedDesk, setSelectedDesk] = useState(null);
  const [deskBookingType, setDeskBookingType] = useState('day');
  const [deskDuration, setDeskDuration] = useState(1);
  const today = new Date();
  const [deskMonth, setDeskMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  );

  // Availability calendar state
  const [bloqueos, setBloqueos] = useState([]);
  const [availLoading, setAvailLoading] = useState(false);
  const [availError, setAvailError] = useState(null);

  // Ensure defaults for start/end time on mount
  useEffect(() => {
    if (!state.startTime) setField('startTime', '09:00');
    if (!state.endTime) setField('endTime', '10:00');
    if (!state.dateFrom) {
      const today = new Date().toISOString().split('T')[0];
      setFields({ dateFrom: today, dateTo: today });
    } else if (!state.dateTo) {
      setField('dateTo', state.dateFrom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch availability when date changes
  const productName = state.producto?.name || '';
  useEffect(() => {
    if (!state.dateFrom) return;
    let cancelled = false;
    setAvailLoading(true);
    setAvailError(null);
    fetchPublicAvailability({
      date: state.dateFrom,
      products: productName ? [productName] : undefined,
    })
      .then((data) => {
        if (!cancelled) setBloqueos(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (!cancelled) setAvailError(err?.message || 'Unable to fetch availability.');
      })
      .finally(() => {
        if (!cancelled) setAvailLoading(false);
      });
    return () => { cancelled = true; };
  }, [state.dateFrom, productName]);

  const roomBloqueos = useMemo(() => {
    if (!productName) return bloqueos;
    return bloqueos.filter(
      (item) => (item?.producto?.nombre || '').toLowerCase() === productName.toLowerCase()
    );
  }, [bloqueos, productName]);

  const timeSlots = useMemo(() => buildTimeSlots(), []);

  const bookedSlotIds = useMemo(() => getBookedSlotIds(roomBloqueos), [roomBloqueos]);

  const maxEndTime = useMemo(
    () => getMaxEndTime(state.startTime, roomBloqueos),
    [state.startTime, roomBloqueos]
  );

  // Auto-adjust if selected startTime is booked
  useEffect(() => {
    if (!state.startTime || bookedSlotIds.size === 0) return;
    if (bookedSlotIds.has(state.startTime)) {
      const next = timeSlots.find((s) => !bookedSlotIds.has(s.id));
      if (next) {
        setFields({ startTime: next.id, endTime: addMinutesToTime(next.id, 60) });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookedSlotIds]);

  // Compute desk date range based on booking type
  const deskStartDate = deskBookingType === 'day' ? state.dateFrom : `${deskMonth}-01`;
  const deskEndDate = deskBookingType === 'day' ? state.dateFrom : getMonthEnd(deskStartDate, deskDuration);

  // Desk floor plan: fetch subscription-based occupancy
  const [deskOccupancy, setDeskOccupancy] = useState([]);
  useEffect(() => {
    if (!isDeskProduct) return;
    let cancelled = false;
    setAvailLoading(true);
    fetchDeskOccupancy()
      .then((data) => {
        if (!cancelled) setDeskOccupancy(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setDeskOccupancy([]);
      })
      .finally(() => {
        if (!cancelled) setAvailLoading(false);
      });
    return () => { cancelled = true; };
  }, [isDeskProduct]);

  const deskDataMap = useMemo(() => {
    if (!isDeskProduct) return null;
    return buildDeskMap(deskOccupancy);
  }, [isDeskProduct, deskOccupancy]);

  const deskAvailableCount = useMemo(() => {
    if (!deskDataMap) return 16;
    let count = 0;
    for (let i = 1; i <= 16; i++) {
      const entry = deskDataMap.get(i);
      if (!entry || !entry.subscription) count++;
    }
    return count;
  }, [deskDataMap]);

  const handleDeskSelect = (deskNum) => {
    setSelectedDesk(deskNum);
    const deskName = `MA1O1-${deskNum}`;
    // Look up the actual productoId from the desk products list
    const deskProducts = state.producto?._deskProducts || [];
    const match = deskProducts.find((p) => {
      const n = (p.name || '').toUpperCase().replace(/[-_\s]/g, '');
      return n === `MA1O1${deskNum}`;
    });
    setField('producto', {
      ...state.producto,
      name: deskName,
      deskNumber: deskNum,
      deskProductoId: match?.id || null,
      _deskProducts: deskProducts,
    });
    setFields({
      dateFrom: deskStartDate,
      dateTo: deskEndDate || deskStartDate,
      startTime: '00:00',
      endTime: '23:59',
      attendees: 1,
      reservationType: deskBookingType === 'month' ? 'Mensual' : 'Diaria',
      deskBookingType,
      deskDuration,
    });
  };

  // Reset desk selection when date/booking type changes
  useEffect(() => {
    setSelectedDesk(null);
  }, [state.dateFrom, deskBookingType, deskDuration, deskMonth]);

  const selectedSlotKey = useMemo(() => {
    if (state.startTime) {
      return `${state.producto?.id || 'room'}-${state.startTime}`;
    }
    return '';
  }, [state.producto?.id, state.startTime]);

  const handleSlotSelect = (slot, bloqueo) => {
    if (!state.dateFrom || bloqueo) return;
    const nextEnd = addMinutesToTime(slot.id, 60);
    setFields({ startTime: slot.id, endTime: nextEnd });
  };

  const bookingCount = useMemo(() => {
    if (!recurring || !state.dateFrom || !state.dateTo || !state.weekdays?.length) return 0;
    const selectedDays = new Set(state.weekdays.map((d) => DAY_JS_MAP[d]));
    let count = 0;
    const cursor = new Date(state.dateFrom + 'T00:00:00');
    const end = new Date(state.dateTo + 'T00:00:00');
    while (cursor <= end) {
      if (selectedDays.has(cursor.getDay())) count++;
      cursor.setDate(cursor.getDate() + 1);
    }
    return count;
  }, [recurring, state.dateFrom, state.dateTo, state.weekdays]);

  const handleNext = () => {
    if (!state.dateFrom || !state.dateTo) {
      setValidationError(t('steps.datesRequired'));
      return;
    }
    if (state.dateFrom > state.dateTo) {
      setValidationError(t('steps.startDateBeforeEnd'));
      return;
    }
    if (recurring && (!state.weekdays || state.weekdays.length === 0)) {
      setValidationError(t('steps.selectAtLeastOneDay'));
      return;
    }
    setValidationError('');
    nextStep();
  };

  const heroImage = state.producto?.heroImage || state.producto?.imageUrl || null;
  const isContinueDisabled = isDeskProduct
    ? !state.dateFrom || !selectedDesk
    : !state.dateFrom || !state.dateTo || !state.startTime || !state.endTime;

  const dateLabel = state.dateFrom
    ? new Date(state.dateFrom + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <Stack spacing={3}>
      {validationError && <Alert severity="error">{validationError}</Alert>}

      {/* ── Room summary card ── */}
      {state.producto && (
        <Paper
          variant="outlined"
          sx={{ p: 3, borderRadius: '14px', display: 'flex', gap: 2, alignItems: 'center' }}
        >
          {heroImage && (
            <Box
              component="img"
              src={heroImage}
              alt={state.producto.name}
              sx={{ width: 80, height: 80, borderRadius: 2, objectFit: 'cover', flexShrink: 0 }}
            />
          )}
          <Stack spacing={0.25} sx={{ flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
              {state.producto.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {state.centro?.name || state.centro?.label || ''}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {state.producto.capacity ? `${t('steps.capacity')} ${state.producto.capacity}` : ''}
              {isDeskProduct
                ? ' · € 10/day · € 90/month'
                : state.producto.priceFrom ? ` · ${t('steps.from')} ${state.producto.priceFrom} ${state.producto.priceUnit || 'EUR/h'}` : ''}
            </Typography>
          </Stack>
        </Paper>
      )}

      {/* ── Desk flow (when product is a desk) ── */}
      {isDeskProduct ? (
        <>
          {/* Period selection */}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: '14px' }}>
            <Stack spacing={2.5}>
              <Stack spacing={0.5}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
                  {t('steps.pickDateTime')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('steps.pickDateTimeDesc')}
                </Typography>
              </Stack>

              {/* Booking type toggle */}
              <Stack spacing={1}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {t('steps.reservationType')}
                </Typography>
                <Stack direction="row" spacing={1}>
                  {DESK_BOOKING_TYPES.map((opt) => (
                    <Button
                      key={opt.value}
                      variant={deskBookingType === opt.value ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => setDeskBookingType(opt.value)}
                      sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600, px: 2.5 }}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </Stack>
              </Stack>

              {deskBookingType === 'day' ? (
                <Paper
                  elevation={0}
                  sx={{
                    border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper',
                    display: 'flex', alignItems: 'center', overflow: 'hidden',
                    boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
                    flexDirection: { xs: 'column', sm: 'row' },
                    borderRadius: { xs: 3, sm: 999 },
                  }}
                >
                  <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
                    <TextField
                      variant="standard"
                      type="date"
                      label={t('admin.selectDate')}
                      value={state.dateFrom || ''}
                      onChange={(e) => {
                        setField('dateFrom', e.target.value);
                        setField('dateTo', e.target.value);
                      }}
                      fullWidth
                      slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true } }}
                      sx={pillFieldSx(state.dateFrom)}
                    />
                  </Box>
                </Paper>
              ) : (
                <>
                  <Paper
                    elevation={0}
                    sx={{
                      border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper',
                      display: 'flex', alignItems: 'center', overflow: 'hidden',
                      boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
                      flexDirection: { xs: 'column', sm: 'row' },
                      borderRadius: { xs: 3, sm: 999 },
                    }}
                  >
                    <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
                      <TextField
                        variant="standard"
                        type="month"
                        label={t('steps.dateFrom')}
                        value={deskMonth}
                        onChange={(e) => setDeskMonth(e.target.value)}
                        fullWidth
                        slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true } }}
                        sx={pillFieldSx(deskMonth)}
                      />
                    </Box>
                  </Paper>
                  <Stack spacing={1}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {t('steps.duration')}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {DESK_DURATION_OPTIONS.map((opt) => (
                        <Button
                          key={opt.months}
                          variant={deskDuration === opt.months ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => setDeskDuration(opt.months)}
                          sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600, px: 2.5 }}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </Stack>
                  </Stack>
                </>
              )}
            </Stack>
          </Paper>

          {/* Choose your desk */}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: '14px' }}>
            <Stack spacing={2}>
              <Stack spacing={0.5}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
                  {t('admin.floorPlan')}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('admin.desksAvailableCount', { available: deskAvailableCount, total: 16 })}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={2}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Box sx={{ width: 14, height: 14, borderRadius: '3px', bgcolor: 'success.light' }} />
                  <Typography variant="caption">{t('admin.deskAvailable')}</Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Box sx={{ width: 14, height: 14, borderRadius: '3px', bgcolor: 'action.disabled' }} />
                  <Typography variant="caption">{t('admin.deskOccupied')}</Typography>
                </Stack>
              </Stack>

              {availLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gridTemplateRows: 'repeat(6, auto)',
                    gap: 1.5,
                    py: 2,
                  }}
                >
                  {GRID_DESKS.map(([deskNum, col, row]) => {
                    const deskEntry = deskDataMap?.get(deskNum);
                    const isBooked = Boolean(deskEntry?.subscription);
                    const isSelected = selectedDesk === deskNum;

                    return (
                      <Box key={deskNum} sx={{ gridColumn: col, gridRow: row }}>
                        <Button
                          variant={isSelected ? 'contained' : 'outlined'}
                          onClick={() => !isBooked && handleDeskSelect(deskNum)}
                          disabled={isBooked}
                          fullWidth
                          sx={{
                            py: 2,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            minWidth: 0,
                            ...(!isSelected && !isBooked && {
                              borderColor: 'success.light',
                              color: 'success.dark',
                              '&:hover': {
                                borderColor: 'success.main',
                                bgcolor: (theme) => alpha(theme.palette.success.main, 0.08),
                              },
                            }),
                            ...(isBooked && {
                              borderColor: 'action.disabled',
                              color: 'text.disabled',
                              bgcolor: (theme) => alpha(theme.palette.action.disabled, 0.08),
                            }),
                          }}
                        >
                          <Stack alignItems="center" spacing={0.25}>
                            <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1 }}>
                              {t('admin.deskNumber', { number: deskNum }).split(' ')[0]}
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 700, lineHeight: 1 }}>
                              {deskNum}
                            </Typography>
                          </Stack>
                        </Button>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Stack>
          </Paper>
        </>
      ) : (
      /* ── Pick your date & time (meeting rooms) ── */
      <Paper variant="outlined" sx={{ p: 3, borderRadius: '14px' }}>
        <Stack spacing={2.5}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
              {t('steps.pickDateTime')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('steps.pickDateTimeDesc')}
            </Typography>
          </Stack>

          {/* ── Pill search bar: date / time / attendees / price ── */}
          {!recurring && (
            <Paper
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
                flexDirection: { xs: 'column', sm: 'row' },
                borderRadius: { xs: 3, sm: 999 },
              }}
            >
              {/* Date */}
              <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
                <TextField
                  variant="standard"
                  type="date"
                  label={t('steps.date')}
                  value={state.dateFrom || ''}
                  onChange={(e) => {
                    setField('dateFrom', e.target.value);
                    setField('dateTo', e.target.value);
                  }}
                  fullWidth
                  slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true } }}
                  sx={pillFieldSx(state.dateFrom)}
                />
              </Box>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
              <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />

              {/* Start time */}
              <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
                <TimeSlotSelect
                  label={t('steps.startTime')}
                  value={state.startTime || '09:00'}
                  onChange={(val) => setField('startTime', val)}
                  slots={timeSlots}
                  bookedSlotIds={bookedSlotIds}
                />
              </Box>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
              <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />

              {/* End time */}
              <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
                <TimeSlotSelect
                  label={t('steps.endTime')}
                  value={state.endTime || '10:00'}
                  onChange={(val) => setField('endTime', val)}
                  slots={timeSlots}
                  bookedSlotIds={bookedSlotIds}
                  minTime={state.startTime ? addMinutesToTime(state.startTime, 30) : undefined}
                  maxTime={maxEndTime || undefined}
                  isEndTime
                />
              </Box>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
              <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />

              {/* Attendees */}
              <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
                <TextField
                  variant="standard"
                  type="number"
                  label={t('steps.numberOfAttendees')}
                  placeholder="1"
                  value={state.attendees || ''}
                  onChange={(e) => setField('attendees', e.target.value)}
                  fullWidth
                  slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true } }}
                  sx={pillFieldNumberSx(state.attendees)}
                />
              </Box>
            </Paper>
          )}

          {/* Recurring: pill bar with date range */}
          {recurring && (
            <Paper
              elevation={0}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                backgroundColor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
                flexDirection: { xs: 'column', sm: 'row' },
                borderRadius: { xs: 3, sm: 999 },
              }}
            >
              {/* Date from */}
              <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
                <TextField
                  variant="standard"
                  type="date"
                  label={t('steps.dateFrom')}
                  value={state.dateFrom || ''}
                  onChange={(e) => setField('dateFrom', e.target.value)}
                  fullWidth
                  slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true } }}
                  sx={pillFieldSx(state.dateFrom)}
                />
              </Box>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
              <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />

              {/* Date to */}
              <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
                <TextField
                  variant="standard"
                  type="date"
                  label={t('steps.dateTo')}
                  value={state.dateTo || ''}
                  onChange={(e) => setField('dateTo', e.target.value)}
                  fullWidth
                  slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true } }}
                  sx={pillFieldSx(state.dateTo)}
                />
              </Box>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
              <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />

              {/* Start time */}
              <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
                <TimeSlotSelect
                  label={t('steps.startTime')}
                  value={state.startTime || '09:00'}
                  onChange={(val) => setField('startTime', val)}
                  slots={timeSlots}
                  bookedSlotIds={bookedSlotIds}
                />
              </Box>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
              <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />

              {/* End time */}
              <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
                <TimeSlotSelect
                  label={t('steps.endTime')}
                  value={state.endTime || '10:00'}
                  onChange={(val) => setField('endTime', val)}
                  slots={timeSlots}
                  bookedSlotIds={bookedSlotIds}
                  minTime={state.startTime ? addMinutesToTime(state.startTime, 30) : undefined}
                  maxTime={maxEndTime || undefined}
                  isEndTime
                />
              </Box>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
              <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />

              {/* Attendees */}
              <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
                <TextField
                  variant="standard"
                  type="number"
                  label={t('steps.numberOfAttendees')}
                  placeholder="1"
                  value={state.attendees || ''}
                  onChange={(e) => setField('attendees', e.target.value)}
                  fullWidth
                  slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true } }}
                  sx={pillFieldNumberSx(state.attendees)}
                />
              </Box>
            </Paper>
          )}

          {/* Recurring toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={recurring}
                onChange={(e) => {
                  const on = e.target.checked;
                  setRecurring(on);
                  if (!on) {
                    setField('dateTo', state.dateFrom);
                    setField('weekdays', []);
                  }
                }}
              />
            }
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <EventRepeatRoundedIcon sx={{ fontSize: 20, color: 'brand.green' }} />
                <Typography variant="body2" fontWeight={600}>
                  {t('steps.recurringBooking')}
                </Typography>
              </Stack>
            }
          />

          {/* Recurring: weekday selector */}
          {recurring && (
            <>
              <Stack spacing={1}>
                <Typography variant="body2" fontWeight={600}>
                  {t('steps.selectWeekdays')}
                </Typography>
                <ToggleButtonGroup
                  value={state.weekdays || []}
                  onChange={(_, newDays) => setField('weekdays', newDays)}
                  size="small"
                  multiple
                  sx={{ flexWrap: 'wrap', gap: 0.5 }}
                >
                  {WEEKDAY_KEYS.map((day) => (
                    <ToggleButton
                      key={day}
                      value={day}
                      sx={{
                        px: 1.75,
                        py: 0.5,
                        borderRadius: '999px !important',
                        border: '1px solid',
                        borderColor: 'divider',
                        textTransform: 'none',
                        fontWeight: 500,
                        transition: (theme) => theme.transitions.create(['border-color', 'background-color', 'color']),
                        '&:hover': { borderColor: 'brand.green' },
                        '&.Mui-selected': {
                          bgcolor: 'brand.green',
                          color: 'common.white',
                          borderColor: 'brand.green',
                          '&:hover': { bgcolor: 'brand.greenHover', borderColor: 'brand.greenHover' },
                        },
                      }}
                    >
                      {t(`steps.weekday_${day}`)}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Stack>

              {bookingCount > 0 && (
                <Chip
                  icon={<EventRepeatRoundedIcon />}
                  label={t('steps.bookingsWillBeCreated', { count: bookingCount })}
                  sx={{
                    alignSelf: 'flex-start',
                    bgcolor: 'brand.accentSoft',
                    color: 'brand.greenHover',
                    border: '1px solid',
                    borderColor: 'brand.green',
                    '& .MuiChip-icon': { color: 'brand.greenHover' },
                  }}
                />
              )}
            </>
          )}

          <Divider />

          {/* Availability calendar — only for single-date bookings */}
          {!recurring && (
            <>
              {availError ? (
                <Alert severity="error">{availError}</Alert>
              ) : null}

              {availLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : (
                <Stack spacing={1.5}>
                  <CalendarLegend />
                  <RoomCalendarGrid
                    room={{
                      id: state.producto?.id || 'room',
                      name: state.producto?.name || t('steps.meetingRoom'),
                      capacity: state.producto?.capacity,
                    }}
                    dateLabel={dateLabel}
                    bloqueos={roomBloqueos}
                    selectedSlotKey={selectedSlotKey}
                    onSelectSlot={handleSlotSelect}
                  />
                </Stack>
              )}
            </>
          )}
        </Stack>
      </Paper>
      )}

      {/* ── Additional details ── */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: '14px' }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
            {t('steps.additionalDetails')}
          </Typography>
          {mode === 'admin' && (
            <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', display: 'flex', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', borderRadius: { xs: 3, sm: 999 } }}>
              <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: '100%' }}>
                <TextField
                  variant="standard"
                  label={t('steps.cuenta')}
                  value={state.cuenta || 'PT'}
                  onChange={(e) => setField('cuenta', e.target.value)}
                  select
                  fullWidth
                  slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true } }}
                  sx={pillFieldSx(state.cuenta)}
                >
                  <MenuItem value="PT">BeWorking Partners Offices</MenuItem>
                  <MenuItem value="GT">GLOBALTECHNO OÜ</MenuItem>
                </TextField>
              </Box>
            </Paper>
          )}
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', display: 'flex', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', borderRadius: '14px' }}>
            <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: '100%' }}>
              <TextField
                variant="standard"
                label={t('steps.notesOptional')}
                value={state.note || ''}
                onChange={(e) => setField('note', e.target.value)}
                fullWidth
                multiline
                minRows={2}
                placeholder={t('steps.notesRequirementsPlaceholder')}
                slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true } }}
                sx={pillFieldSx(state.note)}
              />
            </Box>
          </Paper>
        </Stack>
      </Paper>

      {/* ── Continue button ── */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={isContinueDisabled}
          sx={pillSx}
        >
          {t('steps.continue')}
        </Button>
      </Box>
    </Stack>
  );
}
