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
 * Shared coworking period picker — day/subscription toggle + a single date
 * input. Used by the admin Coworking view (Booking.jsx) and the user booking
 * flow Phase 3 (SelectDetailsStep.jsx) so both surfaces stay in lockstep with
 * the canonical booking app (SelectDeskDetails).
 *
 * Canonical model:
 * - Day: a single date (min today, max today+30 for users; admin unbounded).
 * - Subscription: an open-ended monthly subscription that starts on the chosen
 *   date and renews automatically. NO fixed duration. The start date is bounded
 *   to today … 1st of next month for users; admin unbounded.
 *
 * Both booking types bind to one `date`/`onDateChange`; the parent decides the
 * `minDate`/`maxDate` for the current booking type.
 *
 * All strings come from the shared `admin.*` namespace in booking.json.
 */
export default function CoworkingPeriodSelector({
  bookingType,
  onBookingTypeChange,
  date,
  onDateChange,
  minDate,
  maxDate,
}) {
  const { t } = useTranslation('booking');
  const isSubscription = bookingType === 'month';

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

        <Stack spacing={1}>
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
                label={isSubscription ? t('admin.startDate') : t('admin.selectDate')}
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
          {isSubscription && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('admin.subscriptionHelper')}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}

CoworkingPeriodSelector.propTypes = {
  bookingType: PropTypes.oneOf(['day', 'month']).isRequired,
  onBookingTypeChange: PropTypes.func.isRequired,
  date: PropTypes.string,
  onDateChange: PropTypes.func.isRequired,
  minDate: PropTypes.string,
  maxDate: PropTypes.string,
};
