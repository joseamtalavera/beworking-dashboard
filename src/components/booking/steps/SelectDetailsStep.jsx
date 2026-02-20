import { useEffect, useMemo, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';

import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n/i18n.js';
import esBooking from '../../../i18n/locales/es/booking.json';
import enBooking from '../../../i18n/locales/en/booking.json';

import { useBookingFlow } from '../BookingFlowContext';
import { fetchPublicAvailability } from '../../../api/bookings';
import RoomCalendarGrid, { CalendarLegend } from '../RoomCalendarGrid';
import { addMinutesToTime } from '../../../utils/calendarUtils';

if (!i18n.hasResourceBundle('es', 'booking')) {
  i18n.addResourceBundle('es', 'booking', esBooking);
  i18n.addResourceBundle('en', 'booking', enBooking);
}

const pillSx = {
  borderRadius: 999,
  px: 4,
  py: 1.25,
  textTransform: 'none',
  fontWeight: 700,
  fontSize: '0.95rem',
};

export default function SelectDetailsStep() {
  const { t } = useTranslation('booking');
  const { state, setField, setFields, nextStep } = useBookingFlow();
  const [validationError, setValidationError] = useState('');

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

  const handleNext = () => {
    if (!state.dateFrom || !state.dateTo) {
      setValidationError(t('steps.datesRequired'));
      return;
    }
    if (state.dateFrom > state.dateTo) {
      setValidationError(t('steps.startDateBeforeEnd'));
      return;
    }
    setValidationError('');
    nextStep();
  };

  const heroImage = state.producto?.heroImage || state.producto?.imageUrl || null;
  const isContinueDisabled = !state.dateFrom || !state.dateTo || !state.startTime || !state.endTime;

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
          sx={{ p: 3, borderRadius: 3, display: 'flex', gap: 2, alignItems: 'center' }}
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
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {state.producto.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {state.centro?.name || state.centro?.label || ''}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {state.producto.capacity ? `${t('steps.capacity')} ${state.producto.capacity}` : ''}
              {state.producto.priceFrom ? ` · ${t('steps.from')} ${state.producto.priceFrom} ${state.producto.priceUnit || 'EUR'}/h` : ''}
            </Typography>
          </Stack>
        </Paper>
      )}

      {/* ── Pick your date & time ── */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={2.5}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {t('steps.pickDateTime')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('steps.pickDateTimeDesc')}
            </Typography>
          </Stack>

          <TextField
            size="small"
            label={t('steps.date')}
            type="date"
            value={state.dateFrom || ''}
            onChange={(e) => {
              setField('dateFrom', e.target.value);
              setField('dateTo', e.target.value);
            }}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              size="small"
              label={t('steps.startTime')}
              type="time"
              value={state.startTime || '09:00'}
              onChange={(e) => setField('startTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              size="small"
              label={t('steps.endTime')}
              type="time"
              value={state.endTime || '10:00'}
              onChange={(e) => setField('endTime', e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              size="small"
              label={t('steps.numberOfAttendees')}
              type="number"
              value={state.attendees || ''}
              onChange={(e) => setField('attendees', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PeopleAltRoundedIcon sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                inputProps: { min: 1, max: state.producto?.capacity || 99 }
              }}
              fullWidth
            />
            <TextField
              size="small"
              label={t('steps.price')}
              type="number"
              value={state.customPrice !== '' ? state.customPrice : (state.producto?.priceFrom || '')}
              onChange={(e) => setField('customPrice', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">€</InputAdornment>
                ),
                inputProps: { min: 0, step: 0.01 }
              }}
              fullWidth
            />
          </Stack>

          <Divider />

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
        </Stack>
      </Paper>

      {/* ── Additional details ── */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {t('steps.additionalDetails')}
          </Typography>
          <TextField
            size="small"
            label={t('steps.cuenta')}
            value={state.cuenta || 'PT'}
            onChange={(e) => setField('cuenta', e.target.value)}
            select
            fullWidth
          >
            <MenuItem value="PT">BeWorking Partners Offices</MenuItem>
            <MenuItem value="GT">GLOBALTECHNO OÜ</MenuItem>
          </TextField>
          <TextField
            size="small"
            label={t('steps.notesOptional')}
            value={state.note || ''}
            onChange={(e) => setField('note', e.target.value)}
            fullWidth
            multiline
            minRows={2}
            placeholder={t('steps.notesRequirementsPlaceholder')}
          />
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
