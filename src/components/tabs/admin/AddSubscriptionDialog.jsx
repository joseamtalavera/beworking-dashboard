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
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import TextField from '../../common/ClearableTextField';
import BillingIntervalToggle from '../../common/BillingIntervalToggle';

const todayIso = () => new Date().toISOString().split('T')[0];

const initialNewSub = () => ({
  billingMethod: 'stripe',
  stripeSubscriptionId: '',
  monthlyAmount: '',
  billingInterval: 'month',
  cuenta: 'PT',
  description: 'Oficina Virtual',
  startDate: todayIso(),
  productoId: '',
});

const dateInputSlotProps = {
  inputLabel: { shrink: true },
  htmlInput: { style: { cursor: 'pointer' } },
};

const amountSlotProps = {
  input: { startAdornment: <InputAdornment position="start">€</InputAdornment> },
};

function AddSubscriptionDialog({ open, onClose, onSubmit, deskProducts = [] }) {
  const { t, i18n } = useTranslation('contacts');
  const lang = i18n.language?.startsWith('es') ? 'es' : 'en';
  const [newSub, setNewSub] = useState(initialNewSub);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const startDateInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setNewSub(initialNewSub());
      setError('');
      setSaving(false);
    }
  }, [open]);

  const setField = useCallback(
    (key) => (e) => setNewSub((prev) => ({ ...prev, [key]: e.target.value })),
    [],
  );

  const handleDateClick = useCallback(() => {
    try { startDateInputRef.current?.showPicker?.(); } catch (_) {}
  }, []);

  const handleSubmit = useCallback(async () => {
    setSaving(true);
    setError('');
    try {
      await onSubmit({
        billingMethod: newSub.billingMethod,
        stripeSubscriptionId:
          newSub.billingMethod === 'stripe' ? (newSub.stripeSubscriptionId || undefined) : undefined,
        monthlyAmount: Number(newSub.monthlyAmount),
        billingInterval: newSub.billingInterval,
        cuenta: newSub.cuenta,
        description: newSub.description,
        startDate: newSub.startDate,
        productoId: newSub.productoId || undefined,
      });
      onClose();
    } catch (err) {
      let msg = err?.message || t('profile.addSubscriptionError');
      try { const parsed = JSON.parse(msg); if (parsed.error) msg = parsed.error; } catch (_) {}
      setError(msg);
    } finally {
      setSaving(false);
    }
  }, [newSub, onSubmit, onClose, t]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('profile.addSubscription')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            size="small"
            label={t('profile.billingMethod')}
            value={newSub.billingMethod}
            onChange={setField('billingMethod')}
            select
            fullWidth
          >
            <MenuItem value="stripe">Stripe</MenuItem>
            <MenuItem value="bank_transfer">{t('profile.bankTransfer')}</MenuItem>
          </TextField>
          {newSub.billingMethod === 'stripe' && (
            <TextField
              size="small"
              label="Stripe Subscription ID"
              value={newSub.stripeSubscriptionId}
              onChange={setField('stripeSubscriptionId')}
              placeholder="sub_..."
              helperText={t('profile.stripeIdHelper')}
              fullWidth
            />
          )}
          <Stack direction="row" spacing={1}>
            {[15, 90].map((p) => (
              <Button
                key={p}
                size="small"
                variant={Number(newSub.monthlyAmount) === p ? 'contained' : 'outlined'}
                onClick={() => setNewSub((f) => ({ ...f, monthlyAmount: String(p) }))}
                sx={{ borderRadius: '999px', textTransform: 'none' }}
              >
                {p}€{lang === 'es' ? '/mes' : '/mo'}
              </Button>
            ))}
          </Stack>
          <TextField
            size="small"
            label={t('profile.amount')}
            type="number"
            value={newSub.monthlyAmount}
            onChange={setField('monthlyAmount')}
            slotProps={amountSlotProps}
            fullWidth
          />
          <Stack spacing={0.75}>
            <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
              {t('profile.billingInterval')}
            </Typography>
            <BillingIntervalToggle
              value={newSub.billingInterval}
              onChange={(v) => setNewSub((f) => ({ ...f, billingInterval: v }))}
              lang={lang}
              size="small"
            />
          </Stack>
          <TextField
            size="small"
            label={t('profile.startDate')}
            type="date"
            value={newSub.startDate}
            onChange={setField('startDate')}
            inputRef={startDateInputRef}
            onClick={handleDateClick}
            slotProps={dateInputSlotProps}
            fullWidth
          />
          <TextField
            size="small"
            label={t('profile.cuenta')}
            value={newSub.cuenta}
            onChange={setField('cuenta')}
            select
            fullWidth
          >
            <MenuItem value="PT">BeWorking Partners Offices</MenuItem>
            <MenuItem value="GT">GLOBALTECHNO OÜ</MenuItem>
          </TextField>
          <TextField
            size="small"
            label={t('profile.description')}
            value={newSub.description}
            onChange={setField('description')}
            fullWidth
          />
          {deskProducts.length > 0 && (
            <TextField
              size="small"
              label={t('profile.deskProduct')}
              value={newSub.productoId}
              onChange={setField('productoId')}
              select
              fullWidth
              helperText={t('profile.deskProductHelper')}
            >
              <MenuItem value="">
                <em>{t('profile.noDesk')}</em>
              </MenuItem>
              {deskProducts.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.nombre}
                </MenuItem>
              ))}
            </TextField>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('profile.cancel')}</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!newSub.monthlyAmount || saving}
        >
          {saving ? t('profile.creating') : t('profile.add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default memo(AddSubscriptionDialog);
