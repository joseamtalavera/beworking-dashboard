import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';

import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n.js';
import esBooking from '../../i18n/locales/es/booking.json';
import enBooking from '../../i18n/locales/en/booking.json';

if (!i18n.hasResourceBundle('es', 'booking')) {
  i18n.addResourceBundle('es', 'booking', esBooking);
  i18n.addResourceBundle('en', 'booking', enBooking);
}

const DEFAULT_EXTRA = { description: '', quantity: 1, price: 0 };

export default function ExtraLineItems({ lines = [], onChange }) {
  const { t } = useTranslation('booking');

  const addLine = () => onChange([...lines, { ...DEFAULT_EXTRA }]);

  const updateLine = (idx, patch) =>
    onChange(lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const removeLine = (idx) => onChange(lines.filter((_, i) => i !== idx));

  const extrasSubtotal = lines.reduce(
    (acc, l) => acc + Number(l.quantity || 0) * Number(l.price || 0),
    0
  );

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ReceiptLongRoundedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {t('steps.extraServices')}
          </Typography>
        </Stack>

        {lines.map((line, idx) => (
          <Stack key={idx} direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="flex-start">
            <TextField
              size="small"
              label={t('steps.serviceDescription')}
              value={line.description}
              onChange={(e) => updateLine(idx, { description: e.target.value })}
              placeholder="Water, Coffee, Day pass..."
              sx={{ flex: 2 }}
              fullWidth
            />
            <TextField
              size="small"
              label={t('steps.serviceQuantity')}
              type="number"
              value={line.quantity}
              onChange={(e) => updateLine(idx, { quantity: Number(e.target.value || 0) })}
              inputProps={{ min: 1, step: 1 }}
              sx={{ width: 100 }}
            />
            <TextField
              size="small"
              label={t('steps.servicePrice')}
              type="number"
              value={line.price}
              onChange={(e) => updateLine(idx, { price: Number(e.target.value || 0) })}
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">€</InputAdornment>,
              }}
              sx={{ width: 130 }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: { xs: 0, sm: 0.5 } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 60, textAlign: 'right' }}>
                €{(Number(line.quantity || 0) * Number(line.price || 0)).toFixed(2)}
              </Typography>
              <IconButton size="small" onClick={() => removeLine(idx)} sx={{ color: 'text.disabled' }}>
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
          </Stack>
        ))}

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Button
            size="small"
            startIcon={<AddRoundedIcon />}
            onClick={addLine}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {t('steps.addExtraService')}
          </Button>
          {lines.length > 0 && extrasSubtotal > 0 && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('steps.extraSubtotal')}: €{extrasSubtotal.toFixed(2)}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
