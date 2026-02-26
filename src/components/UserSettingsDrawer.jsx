import { useState, useEffect } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { updateUserAvatar, updateUserProfile } from '../api/auth.js';
import { apiFetch } from '../api/client.js';
import { fetchSubscriptions } from '../api/subscriptions.js';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n.js';
import esSettings from '../i18n/locales/es/settings.json';
import enSettings from '../i18n/locales/en/settings.json';

if (!i18n.hasResourceBundle('es', 'settings')) {
  i18n.addResourceBundle('es', 'settings', esSettings);
  i18n.addResourceBundle('en', 'settings', enSettings);
}

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
  const billingCompany = cp?.billingName || cp?.billing_name || '';
  const billingEmail = cp?.billingEmail || cp?.email_secondary || cp?.emailSecondary || '';
  const billingAddress = cp?.billingAddress || cp?.billing_address || '';
  const billingCountry = cp?.billingCountry || cp?.billing_country || '';
  const billingProvince = cp?.billingProvince || cp?.billing_province || '';
  const billingCity = cp?.billingCity || cp?.billing_city || '';
  const billingPostal = cp?.billingPostalCode || cp?.billing_postal_code || '';
  const billingTaxId = cp?.billingTaxId || cp?.billing_tax_id || '';
  const contactStatus = cp?.status || 'Active';
  const userType = cp?.tenantType || cp?.user_type || '';

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      '&:hover fieldset': { borderColor: accentColor },
      '&.Mui-focused fieldset': { borderColor: accentColor },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: accentColor },
  };

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
              <Button
                variant="outlined"
                size="small"
                onClick={() => setIsEditing(true)}
                sx={{
                  minWidth: 100, height: 32, textTransform: 'none', fontWeight: 600,
                  borderColor: accentColor, color: accentColor,
                  '&:hover': {
                    borderColor: theme.palette.brand.greenHover, color: theme.palette.brand.greenHover,
                    backgroundColor: alpha(theme.palette.brand.green, 0.08),
                  },
                }}
              >
                {t('actions.edit')}
              </Button>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" size="small" onClick={handleCancelEdit} disabled={loading} sx={{ minWidth: 80, height: 32, textTransform: 'none', fontWeight: 600 }}>
                  {t('actions.cancel')}
                </Button>
                <Button
                  variant="contained" size="small" onClick={handleSaveProfile} disabled={loading}
                  sx={{ minWidth: 80, height: 32, textTransform: 'none', fontWeight: 600, backgroundColor: accentColor, color: 'common.white', '&:hover': { backgroundColor: theme.palette.brand.greenHover } }}
                >
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

        {/* Billing Details (from contact profile) */}
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <BusinessRoundedIcon fontSize="small" sx={{ color: accentColor }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('billingDetails.title')}
            </Typography>
          </Stack>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={1.5}>
              <InfoRow label={t('billingDetails.company')} value={billingCompany} />
              <InfoRow label={t('billingDetails.billingEmail')} value={billingEmail} />
              <InfoRow label={t('billingDetails.address')} value={billingAddress} />
              <InfoRow label={t('billingDetails.country')} value={billingCountry} />
              <InfoRow label={t('billingDetails.province')} value={billingProvince} />
              <InfoRow label={t('billingDetails.city')} value={billingCity} />
              <InfoRow label={t('billingDetails.postalCode')} value={billingPostal} />
              <InfoRow label={t('billingDetails.taxId')} value={billingTaxId} />
            </Stack>
          </Paper>
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
    </Drawer>
  );
};

export default UserSettingsDrawer;
