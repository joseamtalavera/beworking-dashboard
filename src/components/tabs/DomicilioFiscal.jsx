import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';

import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n.js';
import esContacts from '../../i18n/locales/es/contacts.json';
import enContacts from '../../i18n/locales/en/contacts.json';

import { apiFetch } from '../../api/client';

if (!i18n.hasResourceBundle('es', 'contacts')) {
  i18n.addResourceBundle('es', 'contacts', esContacts);
  i18n.addResourceBundle('en', 'contacts', enContacts);
}

const FIELDS = [
  { key: 'company',     label: 'edit.billingCompany',    grid: 12 },
  { key: 'taxId',       label: 'edit.billingTaxId',      grid: 6 },
  { key: 'email',       label: 'edit.billingEmail',      grid: 6, type: 'email' },
  { key: 'address',     label: 'edit.billingAddress',    grid: 12 },
  { key: 'postalCode',  label: 'edit.billingPostalCode', grid: 4 },
  { key: 'city',        label: 'edit.billingCity',       grid: 4 },
  { key: 'county',      label: 'edit.billingCounty',     grid: 4 },
  { key: 'country',     label: 'edit.billingCountry',    grid: 12 },
];

const extractBilling = (entry = {}) => {
  const billing = entry.billing ?? {};
  return {
    company: billing.company ?? entry.billing_name ?? entry.billingName ?? entry.name ?? '',
    email: billing.email ?? entry.billing_email ?? entry.billingEmail ?? entry.email_primary ?? entry.emailPrimary ?? '',
    address: billing.address ?? entry.billing_address ?? entry.billingAddress ?? '',
    postalCode: billing.postal_code ?? billing.postalCode ?? entry.billing_postal_code ?? entry.billingPostalCode ?? '',
    city: billing.city ?? entry.billing_city ?? entry.billingCity ?? '',
    county: billing.county ?? entry.billing_province ?? entry.billingProvince ?? '',
    country: billing.country ?? entry.billing_country ?? entry.billingCountry ?? '',
    taxId: billing.tax_id ?? billing.taxId ?? entry.billing_tax_id ?? entry.billingTaxId ?? '',
  };
};

const DomicilioFiscal = ({ userProfile }) => {
  const { t } = useTranslation('contacts');

  const [contactId, setContactId] = useState(null);
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [toastOpen, setToastOpen] = useState(false);

  const tenantId = userProfile?.tenantId;
  const email = userProfile?.email;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        let data = null;
        if (tenantId) {
          try {
            data = await apiFetch(`/contact-profiles/${tenantId}`);
          } catch {
            // fall through to email lookup
          }
        }
        if (!data && email) {
          const params = new URLSearchParams({ search: email, page: '0', size: '1' });
          const result = await apiFetch(`/contact-profiles?${params}`);
          const items = Array.isArray(result?.content)
            ? result.content
            : Array.isArray(result?.items)
              ? result.items
              : Array.isArray(result)
                ? result
                : [];
          if (items.length > 0) data = items[0];
        }
        if (!cancelled) {
          if (data) {
            setContactId(data.id != null ? String(data.id) : null);
            setBilling(extractBilling(data));
          } else {
            setError(t('errors.noProfile', 'No profile found.'));
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message || t('errors.unableToLoad', 'Unable to load profile.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (!tenantId && !email) {
      setError(t('errors.noProfileLinked', 'No profile linked to this account.'));
      setLoading(false);
      return;
    }
    load();
    return () => { cancelled = true; };
  }, [tenantId, email, t]);

  const openEdit = useCallback(() => {
    setDraft(billing || {});
    setSaveError(null);
    setEditOpen(true);
  }, [billing]);

  const closeEdit = useCallback(() => {
    if (saving) return;
    setEditOpen(false);
  }, [saving]);

  const handleDraftChange = (key) => (e) => {
    setDraft((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSave = useCallback(async () => {
    if (!contactId) return;
    setSaving(true);
    setSaveError(null);
    const norm = (v) => {
      if (v == null) return null;
      const s = String(v).trim();
      return s || null;
    };
    const payload = {
      billingCompany: norm(draft.company),
      billingEmail: norm(draft.email),
      billingAddress: norm(draft.address),
      billingPostalCode: norm(draft.postalCode),
      billingCity: norm(draft.city),
      billingCounty: norm(draft.county),
      billingCountry: norm(draft.country),
      billingTaxId: norm(draft.taxId),
    };
    try {
      await apiFetch(`/contact-profiles/${contactId}`, { method: 'PUT', body: payload });
      setBilling({ ...draft });
      setEditOpen(false);
      setToastOpen(true);
    } catch (err) {
      setSaveError(err.message || t('errors.saveFailed', 'Could not save changes.'));
    } finally {
      setSaving(false);
    }
  }, [contactId, draft, t]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mx: 2 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 880, mx: 'auto' }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Domicilio Fiscal</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {t('edit.billingDetails', 'Datos de facturación')}
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={openEdit}>
          {t('actions.edit', 'Edit')}
        </Button>
      </Stack>

      <Card variant="outlined">
        <CardContent>
          <Grid container spacing={2.5}>
            {FIELDS.map((f, i) => (
              <Grid key={f.key} size={{ xs: 12, sm: f.grid }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {t(f.label, f.key)}
                </Typography>
                <Typography variant="body1" sx={{ mt: 0.5, color: billing?.[f.key] ? 'text.primary' : 'text.disabled' }}>
                  {billing?.[f.key] || '—'}
                </Typography>
                {i < FIELDS.length - 1 && <Divider sx={{ mt: 2, display: { xs: 'block', sm: 'none' } }} />}
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onClose={closeEdit} fullWidth maxWidth="sm">
        <DialogTitle>{t('edit.billingDetails', 'Datos de facturación')}</DialogTitle>
        <DialogContent dividers>
          {saveError && <Alert severity="error" sx={{ mb: 2 }}>{saveError}</Alert>}
          <Grid container spacing={2}>
            {FIELDS.map((f) => (
              <Grid key={f.key} size={{ xs: 12, sm: f.grid }}>
                <TextField
                  fullWidth
                  size="small"
                  label={t(f.label, f.key)}
                  type={f.type || 'text'}
                  value={draft?.[f.key] ?? ''}
                  onChange={handleDraftChange(f.key)}
                  disabled={saving}
                />
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit} disabled={saving}>{t('actions.cancel', 'Cancel')}</Button>
          <Button onClick={handleSave} disabled={saving} variant="contained">
            {saving ? <CircularProgress size={20} color="inherit" /> : t('actions.save', 'Save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setToastOpen(false)}>
          {t('actions.saved', 'Saved')}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DomicilioFiscal;
