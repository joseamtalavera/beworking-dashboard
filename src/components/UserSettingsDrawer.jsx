import { useState, useEffect } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { updateUserAvatar, updateUserProfile, changePassword } from '../api/auth.js';
import { apiFetch } from '../api/client.js';
import { fetchSubscriptions } from '../api/subscriptions.js';
import { fetchInvoices, fetchInvoicePdfBlob, fetchInvoicePdfUrl } from '../api/invoices.js';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { fetchCustomerPaymentMethods, createSetupIntent, setDefaultPaymentMethod, detachPaymentMethod } from '../api/stripe.js';
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
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
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

const PT_STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const GT_STRIPE_KEY = import.meta.env.VITE_GT_STRIPE_PUBLISHABLE_KEY || '';

const stripeInstances = {};
function getStripePromise(tenant) {
  const key = tenant === 'gt' ? GT_STRIPE_KEY : PT_STRIPE_KEY;
  if (!stripeInstances[key]) {
    stripeInstances[key] = loadStripe(key);
  }
  return stripeInstances[key];
}

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
    const { error: stripeError, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
    });
    if (stripeError) {
      setError(stripeError.message);
      setSubmitting(false);
    } else {
      onSuccess(setupIntent?.payment_method);
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
  const [userInvoices, setUserInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

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
  const [setupTenant, setSetupTenant] = useState('beworking');

  // Password change state
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

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
    const sub = subscriptions?.[0];
    const stripeCustomerId = sub?.stripeCustomerId || sub?.stripe_customer_id;
    const tenant = (sub?.cuenta || 'beworking').toLowerCase();
    setPmLoading(true);
    fetchCustomerPaymentMethods(email, stripeCustomerId, tenant)
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

    // Load user's own BeWorking invoices
    if (user?.email) {
      setInvoicesLoading(true);
      fetchInvoices({ page: 0, size: 20, email: user.email })
        .then(response => {
          if (!cancelled && response?.content) setUserInvoices(response.content);
        })
        .catch(() => { if (!cancelled) setUserInvoices([]); })
        .finally(() => { if (!cancelled) setInvoicesLoading(false); });
    }

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

  // Load payment methods once subscriptions are available (need tenant from sub.cuenta)
  useEffect(() => {
    if (open && user) loadPaymentMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptions, open, user]);

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
      const sub = subscriptions?.[0];
      const stripeCustomerId = sub?.stripeCustomerId || sub?.stripe_customer_id;
      const tenant = (sub?.cuenta || 'beworking').toLowerCase();
      const data = await createSetupIntent({ customerEmail: email, customerName: name, customerId: stripeCustomerId, tenant });
      setSetupClientSecret(data.clientSecret);
      setSetupTenant(tenant);
      setPmDialogOpen(true);
    } catch (err) {
      console.error('Failed to create setup intent:', err);
    }
  };

  const handleSetupSuccess = async (paymentMethodId) => {
    setPmDialogOpen(false);
    setSetupClientSecret(null);
    if (paymentMethodId) {
      try {
        await setDefaultPaymentMethod({ customerEmail: user?.email, paymentMethodId });
      } catch (e) {
        console.error('Failed to set new payment method as default', e);
      }
    }
    loadPaymentMethods();
  };

  const handleSetDefault = async (paymentMethodId) => {
    const email = user?.email;
    if (!email) return;
    try {
      await setDefaultPaymentMethod({ customerEmail: email, paymentMethodId });
      loadPaymentMethods();
    } catch (e) {
      console.error('Failed to set default payment method', e);
    }
  };

  const handleDetachPM = async (paymentMethodId) => {
    try {
      await detachPaymentMethod({ paymentMethodId });
      loadPaymentMethods();
    } catch (e) {
      console.error('Failed to detach payment method', e);
    }
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

  const handleSavePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError(t('password.mismatch'));
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword(passwordForm.current, passwordForm.new);
      setPasswordSuccess(true);
      setPasswordForm({ current: '', new: '', confirm: '' });
      setIsEditingPassword(false);
    } catch (err) {
      const msg = err?.message || err?.body?.message || 'Failed to change password';
      setPasswordError(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancelPasswordEdit = () => {
    setPasswordForm({ current: '', new: '', confirm: '' });
    setPasswordError(null);
    setPasswordSuccess(false);
    setIsEditingPassword(false);
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

        {/* Contact Information */}
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <PersonRoundedIcon fontSize="small" sx={{ color: accentColor }} />
              <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('contact.title')}
              </Typography>
            </Stack>
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

          <Stack spacing={2}>
            <TextField label={t('billingDetails.company')} value={billingForm.company} onChange={(e) => handleBillingFormChange('company', e.target.value)} disabled={!isEditingBilling} fullWidth size="small" sx={fieldSx} />
            <TextField label={t('billingDetails.address')} value={billingForm.address} onChange={(e) => handleBillingFormChange('address', e.target.value)} disabled={!isEditingBilling} fullWidth size="small" sx={fieldSx} />
            <Stack direction="row" spacing={2}>
              <TextField label={t('billingDetails.country')} value={billingForm.country} onChange={(e) => handleBillingFormChange('country', e.target.value)} disabled={!isEditingBilling} fullWidth size="small" sx={fieldSx} />
              <TextField label={t('billingDetails.province')} value={billingForm.province} onChange={(e) => handleBillingFormChange('province', e.target.value)} disabled={!isEditingBilling} fullWidth size="small" sx={fieldSx} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label={t('billingDetails.city')} value={billingForm.city} onChange={(e) => handleBillingFormChange('city', e.target.value)} disabled={!isEditingBilling} fullWidth size="small" sx={fieldSx} />
              <TextField label={t('billingDetails.postalCode')} value={billingForm.postalCode} onChange={(e) => handleBillingFormChange('postalCode', e.target.value)} disabled={!isEditingBilling} fullWidth size="small" sx={fieldSx} />
            </Stack>
            <TextField label={t('billingDetails.taxId')} value={billingForm.taxId} onChange={(e) => handleBillingFormChange('taxId', e.target.value)} disabled={!isEditingBilling} fullWidth size="small" sx={fieldSx} />
          </Stack>
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
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CreditCardRoundedIcon fontSize="small" color="action" />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {(pm.brand || 'card').toUpperCase()} •••• {pm.last4}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {pm.expMonth}/{pm.expYear}
                      </Typography>
                      {pm.isDefault && (
                        <Chip label={t('paymentMethod.default')} size="small" color="success" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                      )}
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {!pm.isDefault && (
                        <Button size="small" sx={{ textTransform: 'none', fontSize: '0.75rem', py: 0 }} onClick={() => handleSetDefault(pm.id)}>
                          {t('paymentMethod.setDefault')}
                        </Button>
                      )}
                      {!pm.isDefault && (
                        <IconButton size="small" onClick={() => handleDetachPM(pm.id)} sx={{ color: accentColor, '&:hover': { backgroundColor: alpha(accentColor, 0.08) } }}>
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
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
                    {sub.cuenta} · {'\u20AC'}{Number(sub.monthlyAmount).toFixed(2)}/{{ month: i18n.language === 'es' ? 'mes' : 'mo', quarter: i18n.language === 'es' ? 'trimestre' : 'quarter', year: i18n.language === 'es' ? 'año' : 'year' }[sub.billingInterval || 'month']}
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

        {/* Invoice History */}
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <ReceiptLongRoundedIcon fontSize="small" sx={{ color: accentColor }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('invoiceHistory.title', { defaultValue: 'Invoice History' })}
            </Typography>
          </Stack>
          {invoicesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={24} /></Box>
          ) : userInvoices.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {t('invoiceHistory.noInvoices', { defaultValue: 'No invoices yet.' })}
            </Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{t('invoiceHistory.date', { defaultValue: 'Date' })}</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }} align="right">{t('invoiceHistory.amount', { defaultValue: 'Amount' })}</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{t('invoiceHistory.status', { defaultValue: 'Status' })}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userInvoices.slice(0, 10).map(inv => (
                    <TableRow
                      key={inv.id}
                      hover
                      sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha(accentColor, 0.04) } }}
                      onClick={async () => {
                        try {
                          const blob = await fetchInvoicePdfBlob(inv.id);
                          const url = URL.createObjectURL(blob);
                          window.open(url, '_blank');
                          setTimeout(() => URL.revokeObjectURL(url), 30000);
                        } catch {
                          try {
                            const url = inv.holdedinvoicepdf || inv.holdedInvoicePdf || (await fetchInvoicePdfUrl(inv.id));
                            if (url) window.open(url, '_blank');
                          } catch { /* silent */ }
                        }
                      }}
                    >
                      <TableCell sx={{ fontSize: '0.8125rem' }}>{inv.holdedInvoiceNum || inv.idFactura || inv.id}</TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem' }}>{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '—'}</TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem', fontWeight: 600 }} align="right">€{parseFloat(inv.total || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={inv.estado || '—'}
                          size="small"
                          color={(inv.estado || '').toLowerCase().includes('pag') ? 'success' : 'default'}
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Change Password */}
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1} alignItems="center">
              <LockRoundedIcon fontSize="small" sx={{ color: accentColor }} />
              <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {t('password.title')}
              </Typography>
            </Stack>
            {!isEditingPassword ? (
              <Button variant="outlined" size="small" onClick={() => { setIsEditingPassword(true); setPasswordSuccess(false); }} sx={editBtnSx}>
                {t('actions.edit')}
              </Button>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" size="small" onClick={handleCancelPasswordEdit} disabled={passwordLoading} sx={cancelBtnSx}>
                  {t('actions.cancel')}
                </Button>
                <Button variant="contained" size="small" onClick={handleSavePassword} disabled={passwordLoading} sx={saveBtnSx}>
                  {passwordLoading ? t('password.changing') : t('actions.save')}
                </Button>
              </Stack>
            )}
          </Stack>

          {isEditingPassword ? (
            <Stack spacing={2}>
              <TextField
                label={t('password.current')} type="password" value={passwordForm.current}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                fullWidth size="small" sx={fieldSx}
              />
              <TextField
                label={t('password.new')} type="password" value={passwordForm.new}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                fullWidth size="small" sx={fieldSx}
                helperText={t('password.requirements')}
              />
              <TextField
                label={t('password.confirm')} type="password" value={passwordForm.confirm}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                fullWidth size="small" sx={fieldSx}
              />
              {passwordError && <Alert severity="error">{passwordError}</Alert>}
            </Stack>
          ) : (
            passwordSuccess && <Alert severity="success">{t('password.success')}</Alert>
          )}
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
            <Elements stripe={getStripePromise(setupTenant)} options={{ clientSecret: setupClientSecret, appearance: { theme: 'stripe' } }}>
              <SetupForm onSuccess={handleSetupSuccess} onCancel={() => { setPmDialogOpen(false); setSetupClientSecret(null); }} />
            </Elements>
          </DialogContent>
        </Dialog>
      )}
    </Drawer>
  );
};

export default UserSettingsDrawer;
