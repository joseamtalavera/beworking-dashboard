import { useState, useEffect } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { updateUserAvatar, updateUserProfile } from '../api/auth.js';
import { apiFetch } from '../api/client.js';
import { fetchSubscriptions } from '../api/subscriptions.js';
import { fetchCustomerPaymentMethods, createSetupIntent } from '../api/stripe.js';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n.js';
import esSettings from '../i18n/locales/es/settings.json';
import enSettings from '../i18n/locales/en/settings.json';

if (!i18n.hasResourceBundle('es', 'settings')) {
  i18n.addResourceBundle('es', 'settings', esSettings);
  i18n.addResourceBundle('en', 'settings', enSettings);
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const SetupForm = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const { t } = useTranslation('settings');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const { error: stripeError } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
    });
    if (stripeError) {
      setError(stripeError.message);
      setSubmitting(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button onClick={onCancel} disabled={submitting}>{t('actions.cancel')}</Button>
        <Button type="submit" variant="contained" disabled={submitting || !stripe}>
          {submitting ? <CircularProgress size={20} /> : t('actions.save')}
        </Button>
      </Stack>
    </form>
  );
};

const InfoRow = ({ label, value }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100, flexShrink: 0 }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'right', wordBreak: 'break-word' }}>
      {value || '—'}
    </Typography>
  </Stack>
);

const UserSettingsDrawer = ({ open, onClose, user, refreshProfile, onLogout }) => {
  const theme = useTheme();
  const { t } = useTranslation('settings');
  const accentColor = theme.palette.brand.green;
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: {
      line1: user?.address?.line1 || '',
      city: user?.address?.city || '',
      country: user?.address?.country || '',
      postal: user?.address?.postal || ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [contactProfile, setContactProfile] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);

  // Billing edit state
  const [isEditingBilling, setIsEditingBilling] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingForm, setBillingForm] = useState({
    company: '', email: '', address: '', country: '', province: '', city: '', postalCode: '', taxId: ''
  });

  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [pmLoading, setPmLoading] = useState(false);
  const [pmDialogOpen, setPmDialogOpen] = useState(false);
  const [setupClientSecret, setSetupClientSecret] = useState(null);

  const getBillingValues = (cp) => ({
    company: cp?.billingName || cp?.billing_name || '',
    email: cp?.billingEmail || cp?.email_secondary || cp?.emailSecondary || '',
    address: cp?.billingAddress || cp?.billing_address || '',
    country: cp?.billingCountry || cp?.billing_country || '',
    province: cp?.billingProvince || cp?.billing_province || cp?.billingCounty || cp?.billing_county || '',
    city: cp?.billingCity || cp?.billing_city || '',
    postalCode: cp?.billingPostalCode || cp?.billing_postal_code || '',
    taxId: cp?.billingTaxId || cp?.billing_tax_id || '',
  });

  // Load payment methods
  const loadPaymentMethods = () => {
    const email = user?.email;
    if (!email || !email.includes('@')) return;
    setPmLoading(true);
    fetchCustomerPaymentMethods(email)
      .then(data => setPaymentMethods(data?.paymentMethods || []))
      .catch(() => setPaymentMethods([]))
      .finally(() => setPmLoading(false));
  };

  // Fetch contact profile and subscriptions
  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;

    const loadContactProfile = async () => {
      try {
        let data = null;
        const tenantId = user.tenantId;
        const email = user.email;

        if (tenantId) {
          try {
            data = await apiFetch(`/contact-profiles/${tenantId}`);
          } catch {
            // fallback to email search
          }
        }
        if (!data && email) {
          const params = new URLSearchParams({ search: email, page: '0', size: '1' });
          const result = await apiFetch(`/contact-profiles?${params}`);
          const items = Array.isArray(result?.content)
            ? result.content
            : Array.isArray(result?.items)
              ? result.items
              : Array.isArray(result) ? result : [];
          if (items.length > 0) data = items[0];
        }
        if (!cancelled && data) {
          setContactProfile(data);
          setBillingForm(getBillingValues(data));
          // Fetch subscriptions for this contact
          try {
            const subs = await fetchSubscriptions({ contactId: data.id });
            if (!cancelled) {
              const list = Array.isArray(subs) ? subs : Array.isArray(subs?.content) ? subs.content : [];
              setSubscriptions(list.filter(s => s.active));
            }
          } catch {
            if (!cancelled) setSubscriptions([]);
          }
        }
      } catch {
        // silent
      }
    };

    loadContactProfile();
    loadPaymentMethods();
    return () => { cancelled = true; };
  }, [open, user?.tenantId, user?.email]);

  // Update form data when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: {
          line1: user.address?.line1 || '',
          city: user.address?.city || '',
          country: user.address?.country || '',
          postal: user.address?.postal || ''
        }
      });
    }
  }, [user]);

  // Sync billing form when contactProfile changes
  useEffect(() => {
    if (contactProfile) {
      setBillingForm(getBillingValues(contactProfile));
    }
  }, [contactProfile]);

  const handleFormChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleBillingFormChange = (field, value) => {
    setBillingForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await updateUserProfile(formData);
      setIsEditing(false);
      if (refreshProfile) refreshProfile();
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: {
        line1: user?.address?.line1 || '',
        city: user?.address?.city || '',
        country: user?.address?.country || '',
        postal: user?.address?.postal || ''
      }
    });
    setIsEditing(false);
  };

  const handleSaveBilling = async () => {
    if (!contactProfile?.id) return;
    setBillingLoading(true);
    try {
      const payload = {
        billingName: billingForm.company || null,
        billingEmail: billingForm.email || null,
        billingAddress: billingForm.address || null,
        billingCountry: billingForm.country || null,
        billingProvince: billingForm.province || null,
        billingCity: billingForm.city || null,
        billingPostalCode: billingForm.postalCode || null,
        billingTaxId: billingForm.taxId || null,
      };
      await apiFetch(`/contact-profiles/${contactProfile.id}`, {
        method: 'PUT',
        body: payload,
      });
      // Refresh contact profile
      const updated = await apiFetch(`/contact-profiles/${contactProfile.id}`);
      setContactProfile(updated);
      setIsEditingBilling(false);
    } catch (error) {
      console.error('Failed to update billing details:', error);
    } finally {
      setBillingLoading(false);
    }
  };

  const handleCancelBillingEdit = () => {
    setBillingForm(getBillingValues(contactProfile));
    setIsEditingBilling(false);
  };

  const handleOpenSetup = async () => {
    try {
      const email = user?.email;
      const name = contactProfile?.name || user?.name;
      const data = await createSetupIntent({ customerEmail: email, customerName: name });
      setSetupClientSecret(data.clientSecret);
      setPmDialogOpen(true);
    } catch (err) {
      console.error('Failed to create setup intent:', err);
    }
  };

  const handleSetupSuccess = () => {
    setPmDialogOpen(false);
    setSetupClientSecret(null);
    loadPaymentMethods();
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      setAvatarPreview(dataUrl);
      try {
        await updateUserAvatar(dataUrl);
        if (refreshProfile) refreshProfile();
      } catch (error) {
        console.error('Failed to update avatar:', error);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!user) return null;

  const cp = contactProfile;
  const contactStatus = cp?.status || 'Active';
  const userType = cp?.tenantType || cp?.user_type || '';

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      '&:hover fieldset': { borderColor: accentColor },
      '&.Mui-focused fieldset': { borderColor: accentColor },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: accentColor },
  };

  const editBtnSx = {
    minWidth: 100, height: 32, textTransform: 'none', fontWeight: 600,
    borderColor: accentColor, color: accentColor,
    '&:hover': {
      borderColor: theme.palette.brand.greenHover, color: theme.palette.brand.greenHover,
      backgroundColor: alpha(theme.palette.brand.green, 0.08),
    },
  };

  const saveBtnSx = {
    minWidth: 80, height: 32, textTransform: 'none', fontWeight: 600,
    backgroundColor: accentColor, color: 'common.white',
    '&:hover': { backgroundColor: theme.palette.brand.greenHover },
  };

  const cancelBtnSx = { minWidth: 80, height: 32, textTransform: 'none', fontWeight: 600 };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', md: 420 } } }}>
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
        {/* Header */}
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={user.avatar}
              alt={user.name}
              sx={{ width: 56, height: 56, border: '3px solid', borderColor: alpha(theme.palette.warning.light, 0.6) }}
            />
            <Box>
              <Typography variant="h6" fontWeight="bold">{user.name}</Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                {userType && (
                  <Typography variant="body2" color="text.secondary">{userType}</Typography>
                )}
                <Chip label={contactStatus} color="success" size="small" />
              </Stack>
            </Box>
          </Stack>
          <IconButton onClick={onClose}><CloseRoundedIcon /></IconButton>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Contact Information */}
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('contact.title')}
            </Typography>
            {!isEditing ? (
              <Button variant="outlined" size="small" onClick={() => setIsEditing(true)} sx={editBtnSx}>
                {t('actions.edit')}
              </Button>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" size="small" onClick={handleCancelEdit} disabled={loading} sx={cancelBtnSx}>
                  {t('actions.cancel')}
                </Button>
                <Button variant="contained" size="small" onClick={handleSaveProfile} disabled={loading} sx={saveBtnSx}>
                  {loading ? t('actions.saving') : t('actions.save')}
                </Button>
              </Stack>
            )}
          </Stack>

          <Stack spacing={2}>
            <TextField label={t('contact.fullName')} value={formData.name} onChange={(e) => handleFormChange('name', e.target.value)} disabled={!isEditing} fullWidth size="small" sx={fieldSx} />
            <TextField label={t('contact.email')} value={formData.email} onChange={(e) => handleFormChange('email', e.target.value)} disabled={!isEditing} fullWidth size="small" type="email" sx={fieldSx} />
            <TextField label={t('contact.phone')} value={formData.phone} onChange={(e) => handleFormChange('phone', e.target.value)} disabled={!isEditing} fullWidth size="small" sx={fieldSx} />
            <TextField label={t('contact.address')} value={formData.address.line1} onChange={(e) => handleFormChange('address.line1', e.target.value)} disabled={!isEditing} fullWidth size="small" sx={fieldSx} />
            <Stack direction="row" spacing={2}>
              <TextField label={t('contact.city')} value={formData.address.city} onChange={(e) => handleFormChange('address.city', e.target.value)} disabled={!isEditing} fullWidth size="small" sx={fieldSx} />
              <TextField label={t('contact.postalCode')} value={formData.address.postal} onChange={(e) => handleFormChange('address.postal', e.target.value)} disabled={!isEditing} fullWidth size="small" sx={fieldSx} />
            </Stack>
            <TextField label={t('contact.country')} value={formData.address.country} onChange={(e) => handleFormChange('address.country', e.target.value)} disabled={!isEditing} fullWidth size="small" sx={fieldSx} />
          </Stack>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Billing Details (editable) */}
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <BusinessRoundedIcon fontSize="small" sx={{ color: accentColor }} />
              <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('billingDetails.title')}
              </Typography>
            </Stack>
            {!isEditingBilling ? (
              <Button variant="outlined" size="small" onClick={() => setIsEditingBilling(true)} sx={editBtnSx}>
                {t('actions.edit')}
              </Button>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" size="small" onClick={handleCancelBillingEdit} disabled={billingLoading} sx={cancelBtnSx}>
                  {t('actions.cancel')}
                </Button>
                <Button variant="contained" size="small" onClick={handleSaveBilling} disabled={billingLoading} sx={saveBtnSx}>
                  {billingLoading ? t('actions.saving') : t('actions.save')}
                </Button>
              </Stack>
            )}
          </Stack>

          {isEditingBilling ? (
            <Stack spacing={2}>
              <TextField label={t('billingDetails.company')} value={billingForm.company} onChange={(e) => handleBillingFormChange('company', e.target.value)} fullWidth size="small" sx={fieldSx} />
              <TextField label={t('billingDetails.billingEmail')} value={billingForm.email} onChange={(e) => handleBillingFormChange('email', e.target.value)} fullWidth size="small" type="email" sx={fieldSx} />
              <TextField label={t('billingDetails.address')} value={billingForm.address} onChange={(e) => handleBillingFormChange('address', e.target.value)} fullWidth size="small" sx={fieldSx} />
              <Stack direction="row" spacing={2}>
                <TextField label={t('billingDetails.country')} value={billingForm.country} onChange={(e) => handleBillingFormChange('country', e.target.value)} fullWidth size="small" sx={fieldSx} />
                <TextField label={t('billingDetails.province')} value={billingForm.province} onChange={(e) => handleBillingFormChange('province', e.target.value)} fullWidth size="small" sx={fieldSx} />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField label={t('billingDetails.city')} value={billingForm.city} onChange={(e) => handleBillingFormChange('city', e.target.value)} fullWidth size="small" sx={fieldSx} />
                <TextField label={t('billingDetails.postalCode')} value={billingForm.postalCode} onChange={(e) => handleBillingFormChange('postalCode', e.target.value)} fullWidth size="small" sx={fieldSx} />
              </Stack>
              <TextField label={t('billingDetails.taxId')} value={billingForm.taxId} onChange={(e) => handleBillingFormChange('taxId', e.target.value)} fullWidth size="small" sx={fieldSx} />
            </Stack>
          ) : (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack spacing={1.5}>
                <InfoRow label={t('billingDetails.company')} value={billingForm.company} />
                <InfoRow label={t('billingDetails.billingEmail')} value={billingForm.email} />
                <InfoRow label={t('billingDetails.address')} value={billingForm.address} />
                <InfoRow label={t('billingDetails.country')} value={billingForm.country} />
                <InfoRow label={t('billingDetails.province')} value={billingForm.province} />
                <InfoRow label={t('billingDetails.city')} value={billingForm.city} />
                <InfoRow label={t('billingDetails.postalCode')} value={billingForm.postalCode} />
                <InfoRow label={t('billingDetails.taxId')} value={billingForm.taxId} />
              </Stack>
            </Paper>
          )}
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Payment Method */}
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <CreditCardRoundedIcon fontSize="small" sx={{ color: accentColor }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('paymentMethod.title')}
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {t('paymentMethod.description')}
          </Typography>
          {pmLoading ? (
            <CircularProgress size={20} />
          ) : paymentMethods.length === 0 ? (
            <Typography variant="body2" color="text.disabled">{t('paymentMethod.noMethod')}</Typography>
          ) : (
            <Stack spacing={1}>
              {paymentMethods.map((pm, idx) => (
                <Paper key={idx} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CreditCardRoundedIcon fontSize="small" color="action" />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {(pm.brand || 'card').toUpperCase()} •••• {pm.last4}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {pm.expMonth}/{pm.expYear}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
          <Button
            size="small"
            startIcon={<AddRoundedIcon />}
            onClick={handleOpenSetup}
            sx={{
              alignSelf: 'flex-start',
              textTransform: 'none', fontWeight: 600,
              color: accentColor,
              '&:hover': { color: theme.palette.brand.greenHover, backgroundColor: alpha(theme.palette.brand.green, 0.08) },
            }}
          >
            {paymentMethods.length > 0 ? t('paymentMethod.change') : t('paymentMethod.add')}
          </Button>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Photo */}
        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('photo.title')}
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={avatarPreview || user.avatar}
              alt={user.name}
              sx={{ width: 64, height: 64, border: '2px solid', borderColor: 'divider' }}
            >
              {user.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
            </Avatar>
            <Stack spacing={1}>
              <input accept="image/*" style={{ display: 'none' }} id="avatar-upload" type="file" onChange={handlePhotoUpload} />
              <label htmlFor="avatar-upload">
                <Button
                  component="span" variant="outlined" size="small" startIcon={<PhotoCameraRoundedIcon />}
                  sx={{
                    minWidth: 120, height: 36, textTransform: 'none', fontWeight: 600,
                    borderColor: accentColor, color: accentColor,
                    '&:hover': {
                      borderColor: theme.palette.brand.greenHover, color: theme.palette.brand.greenHover,
                      backgroundColor: alpha(theme.palette.brand.green, 0.08),
                    },
                  }}
                >
                  {t('photo.change')}
                </Button>
              </label>
              <Typography variant="caption" color="text.secondary">{t('photo.hint')}</Typography>
            </Stack>
          </Stack>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Subscriptions (real data) */}
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <AutorenewRoundedIcon fontSize="small" sx={{ color: accentColor }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('subscription.title')}
            </Typography>
          </Stack>
          {subscriptions.length > 0 ? (
            subscriptions.map((sub) => (
              <Paper key={sub.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" fontWeight="bold">{sub.description || 'Subscription'}</Typography>
                    <Chip
                      label={sub.billingMethod === 'stripe' ? 'Stripe' : 'Transferencia'}
                      size="small"
                      sx={{
                        fontSize: '0.7rem', height: 20,
                        bgcolor: sub.billingMethod === 'stripe' ? alpha('#635bff', 0.1) : alpha(accentColor, 0.1),
                        color: sub.billingMethod === 'stripe' ? '#635bff' : accentColor,
                      }}
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {sub.cuenta} · {'\u20AC'}{Number(sub.monthlyAmount).toFixed(2)}/{i18n.language === 'es' ? 'mes' : 'mo'}
                    {sub.startDate && ` · ${i18n.language === 'es' ? 'desde' : 'since'} ${sub.startDate}`}
                  </Typography>
                </Stack>
              </Paper>
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t('subscription.noActive')}
            </Typography>
          )}
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Account */}
        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('account.title')}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <VerifiedRoundedIcon fontSize="small" sx={{ color: accentColor }} />
            <Chip label={contactStatus} color="success" size="small" />
          </Stack>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Footer actions */}
        <Stack direction="row" spacing={1} justifyContent="space-between" sx={{ pb: 2 }}>
          <Button
            variant="outlined" size="small" startIcon={<LogoutRoundedIcon />}
            sx={{
              minWidth: 120, height: 36, textTransform: 'none', fontWeight: 600,
              borderColor: 'primary.main', color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark', color: 'primary.dark',
                backgroundColor: theme.palette.brand.greenSoft,
              },
            }}
            onClick={onLogout}
          >
            {t('actions.logout')}
          </Button>
          <Button
            variant="outlined" size="small"
            sx={{
              minWidth: 100, height: 36, textTransform: 'none', fontWeight: 600,
              borderColor: accentColor, color: accentColor,
              '&:hover': {
                borderColor: theme.palette.brand.greenHover, color: theme.palette.brand.greenHover,
                backgroundColor: alpha(theme.palette.brand.green, 0.08),
              },
            }}
            onClick={onClose}
          >
            {t('actions.close')}
          </Button>
        </Stack>
      </Box>

      {/* Stripe Payment Method Setup Dialog */}
      {setupClientSecret && (
        <Dialog open={pmDialogOpen} onClose={() => { setPmDialogOpen(false); setSetupClientSecret(null); }} maxWidth="sm" fullWidth>
          <DialogTitle>{t('paymentMethod.setup')}</DialogTitle>
          <DialogContent>
            <Elements stripe={stripePromise} options={{ clientSecret: setupClientSecret, appearance: { theme: 'stripe' } }}>
              <SetupForm onSuccess={handleSetupSuccess} onCancel={() => { setPmDialogOpen(false); setSetupClientSecret(null); }} />
            </Elements>
          </DialogContent>
        </Dialog>
      )}
    </Drawer>
  );
};

export default UserSettingsDrawer;
