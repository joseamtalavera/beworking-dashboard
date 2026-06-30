import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Alert,
  MenuItem,
  Button,
  InputAdornment,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import TextField from '../../common/ClearableTextField';

const dateInputSlotProps = {
  inputLabel: { shrink: true },
  htmlInput: { style: { cursor: 'pointer' } },
};

const amountSlotProps = {
  input: { startAdornment: <InputAdornment position="start">€</InputAdornment> },
};

const MONTHS = { year: 12, half_year: 6, quarter: 3 };

// Admin edit of an existing subscription: amount + interval + billing date.
// Calls onSubmit(id, { monthlyAmount, billingInterval, billingDate?, description }).
// monthlyAmount is the MONTHLY net rate; the per-cycle total shown = rate × months.
function EditSubscriptionDialog({ open, sub, onClose, onSubmit }) {
  const { t } = useTranslation('contacts');
  const [form, setForm] = useState({ monthlyAmount: '', billingInterval: 'month', billingDate: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const dateRef = useRef(null);

  useEffect(() => {
    if (open && sub) {
      setForm({
        monthlyAmount: sub.monthlyAmount != null ? String(sub.monthlyAmount) : '',
        billingInterval: sub.billingInterval || 'month',
        billingDate: '',
      });
      setError('');
      setSaving(false);
    }
  }, [open, sub]);

  const setField = useCallback(
    (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })),
    [],
  );

  const handleDateClick = useCallback(() => {
    try { dateRef.current?.showPicker?.(); } catch (_) {}
  }, []);

  const handleSubmit = useCallback(async () => {
    setSaving(true);
    setError('');
    try {
      await onSubmit(sub.id, {
        monthlyAmount: Number(form.monthlyAmount),
        billingInterval: form.billingInterval,
        billingDate: form.billingDate || undefined,
        description: sub.description,
      });
      onClose();
    } catch (err) {
      let msg = err?.message || t('profile.editSubscriptionError', { defaultValue: 'No se pudo actualizar la suscripción.' });
      try { const parsed = JSON.parse(msg); if (parsed.error) msg = parsed.error; } catch (_) {}
      setError(msg);
    } finally {
      setSaving(false);
    }
  }, [form, sub, onSubmit, onClose, t]);

  if (!sub) return null;
  const months = MONTHS[form.billingInterval] || 1;
  const cycleTotal = (Number(form.monthlyAmount || 0) * months).toFixed(2);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('profile.editSubscription', { defaultValue: 'Editar suscripción' })}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Quick plan presets: €15 / €90 */}
          <Stack direction="row" spacing={1}>
            {[15, 90].map((p) => (
              <Button
                key={p}
                size="small"
                variant={Number(form.monthlyAmount) === p ? 'contained' : 'outlined'}
                onClick={() => setForm((f) => ({ ...f, monthlyAmount: String(p) }))}
                sx={{ borderRadius: '999px', textTransform: 'none' }}
              >
                {p}€/mes
              </Button>
            ))}
          </Stack>

          <TextField
            fullWidth
            type="number"
            label={t('profile.amount')}
            value={form.monthlyAmount}
            onChange={setField('monthlyAmount')}
            slotProps={amountSlotProps}
            helperText={months > 1
              ? `${cycleTotal}€ / ${t(`profile.interval_${form.billingInterval}`)} (sin IVA)`
              : undefined}
          />

          <TextField
            select
            fullWidth
            label={t('profile.billingInterval')}
            value={form.billingInterval}
            onChange={setField('billingInterval')}
          >
            <MenuItem value="month">{t('profile.monthly')}</MenuItem>
            <MenuItem value="quarter">{t('profile.quarterly')}</MenuItem>
            <MenuItem value="half_year">{t('profile.halfYearly')}</MenuItem>
            <MenuItem value="year">{t('profile.yearly')}</MenuItem>
          </TextField>

          <TextField
            fullWidth
            type="date"
            inputRef={dateRef}
            onClick={handleDateClick}
            label={t('profile.nextBillingDate', { defaultValue: 'Próxima fecha de facturación (opcional)' })}
            value={form.billingDate}
            onChange={setField('billingDate')}
            slotProps={dateInputSlotProps}
            helperText={t('profile.nextBillingDateHelp', { defaultValue: 'Mueve el día de cobro. Sin prorrateo; aplica desde esa fecha.' })}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          {t('profile.cancel', { defaultValue: 'Cancelar' })}
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving || !form.monthlyAmount}>
          {t('profile.save', { defaultValue: 'Guardar' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default memo(EditSubscriptionDialog);
