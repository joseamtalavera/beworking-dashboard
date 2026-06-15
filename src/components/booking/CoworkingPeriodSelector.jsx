import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import { pillFieldSx } from '../common/pillField';

/**
 * Shared coworking period picker — day/month tabs + date/month input +
 * duration buttons. Used by the admin Coworking view (Booking.jsx) and the
 * user booking flow Phase 3 (SelectDetailsStep.jsx) so both surfaces stay in
 * lockstep with the booking app's SelectDeskDetails.
 *
 * All strings come from the shared `admin.*` namespace in booking.json so the
 * existing translations work unchanged.
 */
export default function CoworkingPeriodSelector({
  bookingType,
  onBookingTypeChange,
  date,
  onDateChange,
  month,
  onMonthChange,
  duration,
  onDurationChange,
  durations = [1, 3, 6, 12],
  minDate,
  maxDate,
  minMonth,
  maxMonth,
}) {
  const { t } = useTranslation('booking');

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: '14px' }}>
      <Stack spacing={2.5}>
        <Stack spacing={0.5}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
            {t('admin.coworkingPeriodTitle')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('admin.coworkingPeriodSubtitle')}
          </Typography>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {t('admin.bookingType')}
          </Typography>
          <Stack direction="row" spacing={1}>
            {['day', 'month'].map((opt) => (
              <Button
                key={opt}
                variant={bookingType === opt ? 'contained' : 'outlined'}
                size="small"
                onClick={() => onBookingTypeChange(opt)}
                sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600, px: 2.5 }}
              >
                {t(opt === 'day' ? 'admin.day' : 'admin.subscription')}
              </Button>
            ))}
          </Stack>
        </Stack>

        {bookingType === 'day' ? (
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
            <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
              <TextField
                variant="standard"
                type="date"
                label={t('admin.selectDate')}
                value={date || ''}
                onChange={(e) => onDateChange(e.target.value)}
                fullWidth
                slotProps={{
                  input: { disableUnderline: true },
                  inputLabel: { shrink: true },
                  htmlInput: { ...(minDate ? { min: minDate } : {}), ...(maxDate ? { max: maxDate } : {}) },
                }}
                sx={pillFieldSx(date)}
              />
            </Box>
          </Paper>
        ) : (
          <Stack spacing={2}>
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
              <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
                <TextField
                  variant="standard"
                  type="month"
                  label={t('admin.startMonth')}
                  value={month || ''}
                  onChange={(e) => onMonthChange(e.target.value)}
                  fullWidth
                  slotProps={{
                    input: { disableUnderline: true },
                    inputLabel: { shrink: true },
                    htmlInput: { ...(minMonth ? { min: minMonth } : {}), ...(maxMonth ? { max: maxMonth } : {}) },
                  }}
                  sx={pillFieldSx(month)}
                />
              </Box>
            </Paper>
            <Stack spacing={1}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t('admin.duration')}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {durations.map((months) => (
                  <Button
                    key={months}
                    variant={duration === months ? 'contained' : 'outlined'}
                    size="small"
                    onClick={() => onDurationChange(months)}
                    sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600, px: 2.5 }}
                  >
                    {t('admin.monthsCount', { count: months })}
                  </Button>
                ))}
              </Stack>
            </Stack>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

CoworkingPeriodSelector.propTypes = {
  bookingType: PropTypes.oneOf(['day', 'month']).isRequired,
  onBookingTypeChange: PropTypes.func.isRequired,
  date: PropTypes.string,
  onDateChange: PropTypes.func.isRequired,
  month: PropTypes.string,
  onMonthChange: PropTypes.func.isRequired,
  duration: PropTypes.number,
  onDurationChange: PropTypes.func.isRequired,
  durations: PropTypes.arrayOf(PropTypes.number),
  minDate: PropTypes.string,
  maxDate: PropTypes.string,
  minMonth: PropTypes.string,
  maxMonth: PropTypes.string,
};
