import { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Alert,
  Typography,
  Button,
  InputAdornment,
  MenuItem,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import TextField from '../../common/ClearableTextField';
import BillingIntervalToggle from '../../common/BillingIntervalToggle';

const TXT = {
  title:    { es: 'Editar suscripción', en: 'Edit subscription' },
  interval: { es: 'Intervalo de facturación', en: 'Billing interval' },
  nextDate: { es: 'Próxima fecha de facturación (opcional)', en: 'Next billing date (optional)' },
  nextHelp: { es: 'Mueve el día de cobro. Sin prorrateo; aplica desde esa fecha.', en: 'Moves the billing day. No proration; applies from that date.' },
  cancel:   { es: 'Cancelar', en: 'Cancel' },
  save:     { es: 'Guardar', en: 'Save' },
  amount:   { es: 'Importe', en: 'Amount' },
  desk:     { es: 'Mesa asignada', en: 'Assigned desk' },
  noDesk:   { es: 'Sin mesa asignada', en: 'No desk assigned' },
  deskHelp: { es: 'Vincular esta suscripción a una mesa específica', en: 'Link this subscription to a specific desk' },
};

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
function EditSubscriptionDialog({ open, sub, onClose, onSubmit, deskProducts = [] }) {
  const { t, i18n } = useTranslation('contacts');
  const lang = i18n.language?.startsWith('es') ? 'es' : 'en';
  const [form, setForm] = useState({ monthlyAmount: '', billingInterval: 'month', billingDate: '', productoId: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const dateRef = useRef(null);

  useEffect(() => {
    if (open && sub) {
      setForm({
        monthlyAmount: sub.monthlyAmount != null ? String(sub.monthlyAmount) : '',
        billingInterval: sub.billingInterval || 'month',
        billingDate: '',
        productoId: sub.productoId != null ? String(sub.productoId) : '',
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
        productoId: form.productoId === '' ? 0 : Number(form.productoId),
      });
      onClose();
    } catch (err) {
      let msg = err?.message || (lang === 'es' ? 'No se pudo actualizar la suscripción.' : 'Could not update the subscription.');
      try { const parsed = JSON.parse(msg); if (parsed.error) msg = parsed.error; } catch (_) {}
      setError(msg);
    } finally {
      setSaving(false);
    }
  }, [form, sub, onSubmit, onClose, lang]);

  if (!sub) return null;
  const months = MONTHS[form.billingInterval] || 1;
  const cycleTotal = (Number(form.monthlyAmount || 0) * months).toFixed(2);
  // Offer free desks plus this sub's own current desk (which reads as occupied
  // by itself). Empty list ⇒ hide the selector.
  const deskOptions = deskProducts.filter(
    (p) => p.available !== false || String(p.id) === String(sub.productoId ?? ''),
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{TXT.title[lang]}</DialogTitle>
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
                {p}€{lang === 'es' ? '/mes' : '/mo'}
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
              ? `${cycleTotal}€ / ${t(`profile.interval_${form.billingInterval}`)} (${lang === 'es' ? 'sin IVA' : 'excl. VAT'})`
              : undefined}
          />

          <Stack spacing={0.75}>
            <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
              {TXT.interval[lang]}
            </Typography>
            <BillingIntervalToggle
              value={form.billingInterval}
              onChange={(v) => setForm((f) => ({ ...f, billingInterval: v }))}
              lang={lang}
              size="small"
            />
          </Stack>

          <TextField
            fullWidth
            type="date"
            inputRef={dateRef}
            onClick={handleDateClick}
            label={TXT.nextDate[lang]}
            value={form.billingDate}
            onChange={setField('billingDate')}
            slotProps={dateInputSlotProps}
            helperText={TXT.nextHelp[lang]}
          />

          {deskProducts.length > 0 && (
            <TextField
              fullWidth
              select
              label={TXT.desk[lang]}
              value={form.productoId}
              onChange={setField('productoId')}
              helperText={TXT.deskHelp[lang]}
            >
              <MenuItem value="">
                <em>{TXT.noDesk[lang]}</em>
              </MenuItem>
              {deskOptions.map((p) => (
                <MenuItem key={p.id} value={String(p.id)}>
                  {p.nombre}
                </MenuItem>
              ))}
            </TextField>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          {TXT.cancel[lang]}
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving || !form.monthlyAmount}>
          {TXT.save[lang]}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default memo(EditSubscriptionDialog);
