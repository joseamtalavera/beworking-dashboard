import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';

import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n/i18n.js';
import esBooking from '../../../i18n/locales/es/booking.json';
import enBooking from '../../../i18n/locales/en/booking.json';

import { timeStringToMinutes } from '../../../utils/calendarUtils';

if (!i18n.hasResourceBundle('es', 'booking')) {
  i18n.addResourceBundle('es', 'booking', esBooking);
  i18n.addResourceBundle('en', 'booking', enBooking);
}

const VAT_RATE = 0.21;

function computePricing(state) {
  const priceFrom = state.producto?.priceFrom;
  if (!priceFrom) return { subtotal: 0, vat: 0, total: 0, label: '' };

  const start = timeStringToMinutes(state.startTime);
  const end = timeStringToMinutes(state.endTime);
  if (start == null || end == null || end <= start) {
    return { subtotal: 0, vat: 0, total: 0, label: '' };
  }

  const hours = (end - start) / 60;
  const subtotal = hours * priceFrom;
  const vat = +(subtotal * VAT_RATE).toFixed(2);
  const total = +(subtotal + vat).toFixed(2);
  return { subtotal, vat, total, label: `${hours.toFixed(1)}h` };
}

export default function ReviewSummary({ state }) {
  const { t } = useTranslation('booking');
  const { subtotal, vat, total, label } = computePricing(state);
  const heroImage = state.producto?.heroImage || state.producto?.imageUrl || null;
  const roomName = state.producto?.name || '—';
  const centroName = state.centro?.name || state.centro?.code || '—';

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Image header with gradient overlay */}
      <Box
        sx={{
          position: 'relative',
          height: 140,
          backgroundImage: heroImage ? `url(${heroImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          bgcolor: heroImage ? undefined : (theme) => alpha(theme.palette.primary.main, 0.08),
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
          }}
        />
        <Stack
          sx={{ position: 'absolute', bottom: 16, left: 20, right: 20 }}
          direction="row"
          justifyContent="space-between"
          alignItems="flex-end"
        >
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700 }}>
              {roomName}
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <PlaceRoundedIcon sx={{ color: 'grey.300', fontSize: 16 }} />
              <Typography variant="body2" sx={{ color: 'grey.300' }}>
                {centroName}
              </Typography>
            </Stack>
          </Box>
          {total > 0 && (
            <Chip
              label={`€${total.toFixed(2)}`}
              sx={{
                bgcolor: 'rgba(255,255,255,0.9)',
                fontWeight: 700,
                fontSize: '0.95rem',
                height: 32,
              }}
            />
          )}
        </Stack>
      </Box>

      {/* Details grid */}
      <Stack
        direction="row"
        divider={<Divider orientation="vertical" flexItem />}
        sx={{ px: 2.5, py: 2 }}
      >
        <Stack spacing={0.25} sx={{ flex: 1, alignItems: 'center' }}>
          <CalendarMonthRoundedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {state.dateFrom
              ? new Date(state.dateFrom + 'T00:00:00').toLocaleDateString(undefined, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('steps.date')}</Typography>
        </Stack>
        <Stack spacing={0.25} sx={{ flex: 1, alignItems: 'center' }}>
          <AccessTimeRoundedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {state.startTime && state.endTime
              ? `${state.startTime} – ${state.endTime}`
              : '—'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('steps.time')}</Typography>
        </Stack>
        {state.attendees && (
          <Stack spacing={0.25} sx={{ flex: 1, alignItems: 'center' }}>
            <PeopleAltRoundedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {state.attendees}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('steps.attendees')}</Typography>
          </Stack>
        )}
      </Stack>

      {/* Pricing breakdown */}
      <Stack sx={{ px: 2.5, py: 1.5, borderTop: '1px solid', borderColor: 'divider' }} spacing={0.5}>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('steps.subtotal')}{label ? ` (${label})` : ''}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            €{subtotal.toFixed(2)}
          </Typography>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('steps.vatPercent', { percent: 21 })}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>€{vat.toFixed(2)}</Typography>
        </Stack>
        <Divider sx={{ my: 0.5 }} />
        <Stack direction="row" justifyContent="space-between">
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{t('steps.total')}</Typography>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>€{total.toFixed(2)}</Typography>
        </Stack>
      </Stack>
    </Paper>
  );
}

export { computePricing };
