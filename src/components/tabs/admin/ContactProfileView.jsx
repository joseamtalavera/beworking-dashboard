import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import LocationCityRoundedIcon from '@mui/icons-material/LocationCityRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import MarkunreadMailboxRoundedIcon from '@mui/icons-material/MarkunreadMailboxRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import Autocomplete from '@mui/material/Autocomplete';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';

import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n/i18n.js';
import esContacts from '../../../i18n/locales/es/contacts.json';
import enContacts from '../../../i18n/locales/en/contacts.json';

import { CANONICAL_USER_TYPES, normalizeUserTypeLabel } from './contactConstants';
import { COUNTRIES, SPAIN_PROVINCES, SPAIN_CITIES, getCountryLabel, isSpain, filterCountries } from '../../../data/geography';
import { fetchBookingStats } from '../../../api/bookings';
import { fetchSubscriptions, createSubscription, updateSubscription } from '../../../api/subscriptions';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import IconButton from '@mui/material/IconButton';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';

const VIRTUAL_USER_BILLING = {
  address: 'Calle Alejandro Dumas 17 - Oficinas',
  country: 'España',
  county: 'Málaga',
  city: 'Málaga',
  postal_code: '29004'
};

const STATUS_OPTIONS = [
  { value: 'Activo', label: 'Activo' },
  { value: 'Convertido', label: 'Convertido' },
  { value: 'Potencial', label: 'Potencial' },
  { value: 'Trial', label: 'Trial' },
  { value: 'Suspended', label: 'Suspendido' },
  { value: 'Inactive', label: 'Inactivo' },
];

const CENTER_OPTIONS = ['MA1 MALAGA DUMAS'];

if (!i18n.hasResourceBundle('es', 'contacts')) {
  i18n.addResourceBundle('es', 'contacts', esContacts);
  i18n.addResourceBundle('en', 'contacts', enContacts);
}

const ContactProfileView = ({ contact, onBack, onSave, userTypeOptions, refreshProfile }) => {
  const { t, i18n: i18nInstance } = useTranslation('contacts');
  const lang = i18nInstance.language?.startsWith('en') ? 'en' : 'es';
  const theme = useTheme();
  const mapContactToDraft = (value) => {
    if (!value) {
      return value;
    }
    return {
      ...value,
      user_type:
        value.user_type && value.user_type !== '—'
          ? normalizeUserTypeLabel(value.user_type)
          : '',
      center: value.center || 'MA1 MALAGA DUMAS'
    };
  };

  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(() => mapContactToDraft(contact));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Booking stats
  const [bookingStats, setBookingStats] = useState(null);
  useEffect(() => {
    if (!contact?.id) return;
    fetchBookingStats(contact.id)
      .then(setBookingStats)
      .catch(() => setBookingStats(null));
  }, [contact?.id]);

  // Subscriptions
  // Subscriptions
  const [subscriptions, setSubscriptions] = useState([]);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [newSub, setNewSub] = useState({ stripeSubscriptionId: '', monthlyAmount: '', cuenta: 'PT', description: 'Oficina Virtual', startDate: new Date().toISOString().split('T')[0], vatNumber: '' });
  const [subSaving, setSubSaving] = useState(false);

  const loadSubscriptions = () => {
    if (!contact?.id) return;
    fetchSubscriptions({ contactId: contact.id })
      .then(setSubscriptions)
      .catch(() => setSubscriptions([]));
  };
  useEffect(loadSubscriptions, [contact?.id]);

  const handleAddSubscription = async () => {
    setSubSaving(true);
    try {
      await createSubscription({
        contactId: contact.id,
        stripeSubscriptionId: newSub.stripeSubscriptionId || undefined,
        monthlyAmount: Number(newSub.monthlyAmount),
        cuenta: newSub.cuenta,
        description: newSub.description,
        startDate: newSub.startDate,
        vatNumber: newSub.vatNumber || undefined
      });
      setSubDialogOpen(false);
      setNewSub({ stripeSubscriptionId: '', monthlyAmount: '', cuenta: 'PT', description: 'Oficina Virtual', startDate: new Date().toISOString().split('T')[0], vatNumber: '' });
      loadSubscriptions();
    } catch (err) {
      console.error('Failed to add subscription', err);
    } finally {
      setSubSaving(false);
    }
  };

  const handleCancelSubscription = async (id) => {
    try {
      await updateSubscription(id, { active: false });
      loadSubscriptions();
    } catch (err) {
      console.error('Failed to cancel subscription', err);
    }
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1,
      height: 36,
      backgroundColor: theme.palette.common.white,
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.grey[400]
      }
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.grey[300]
    },
    '& .MuiInputLabel-root': {
      color: theme.palette.text.secondary
    }
  };
  const autocompleteFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1,
      backgroundColor: theme.palette.common.white,
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.grey[400]
      }
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.grey[300]
    },
    '& .MuiInputLabel-root': {
      color: theme.palette.text.secondary
    }
  };

  useEffect(() => {
    setDraft(mapContactToDraft(contact));
  }, [contact]);

  const availableUserTypes = useMemo(() => {
    const source = Array.isArray(userTypeOptions) && userTypeOptions.length > 0
      ? userTypeOptions
      : CANONICAL_USER_TYPES;
    const next = new Set(source);
    if (contact?.user_type && contact.user_type !== '—') {
      next.add(normalizeUserTypeLabel(contact.user_type));
    }
    return Array.from(next).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [userTypeOptions, contact?.user_type]);

  const initials = useMemo(() => {
    if (!contact?.name) return '—';
    return contact.name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }, [contact?.name]);

  if (!contact) {
    return null;
  }

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setDraft((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'user_type' && value === 'Usuario Virtual') {
        next.billing = { ...prev.billing, ...VIRTUAL_USER_BILLING };
      }
      return next;
    });
  };

  const handleContactChange = (field) => (event) => {
    setDraft((prev) => ({
      ...prev,
      contact: {
        ...prev.contact,
        [field]: event.target.value
      }
    }));
  };

  const handleBillingChange = (field) => (event) => {
    setDraft((prev) => ({
      ...prev,
      billing: {
        ...prev.billing,
        [field]: event.target.value
      }
    }));
  };

  // Cascading geography options for billing address
  const billingCountry = draft?.billing?.country || '';
  const billingProvince = draft?.billing?.county || '';
  const provinceOptions = useMemo(
    () => (isSpain(billingCountry) ? SPAIN_PROVINCES : []),
    [billingCountry]
  );
  const cityOptions = useMemo(
    () => (isSpain(billingCountry) && billingProvince ? (SPAIN_CITIES[billingProvince] || []) : []),
    [billingCountry, billingProvince]
  );

  const handleBillingCountryChange = (_event, newValue) => {
    const val = typeof newValue === 'string' ? newValue : (newValue ? getCountryLabel(newValue, lang) : '');
    setDraft((prev) => ({ ...prev, billing: { ...prev.billing, country: val, county: '', city: '' } }));
  };

  const handleBillingProvinceChange = (_event, newValue) => {
    const val = typeof newValue === 'string' ? newValue : (newValue || '');
    setDraft((prev) => ({ ...prev, billing: { ...prev.billing, county: val, city: '' } }));
  };

  const handleBillingCityChange = (_event, newValue) => {
    const val = typeof newValue === 'string' ? newValue : (newValue || '');
    setDraft((prev) => ({ ...prev, billing: { ...prev.billing, city: val } }));
  };

  const handleSave = async () => {
    if (!onSave) {
      setEditorOpen(false);
      return;
    }

    try {
      setSaving(true);
      setSaveError('');
      console.log('DEBUG: Saving draft with avatar:', draft?.avatar);
      console.log('DEBUG: Full draft object:', draft);
      await onSave(draft);
      setEditorOpen(false);
      // Refresh the user profile if this is the current user's contact
      console.log('DEBUG: Contact email:', contact?.email);
      console.log('DEBUG: Draft email:', draft?.email);
      console.log('DEBUG: refreshProfile available:', !!refreshProfile);
      
      // Always call refreshProfile when avatar is updated, regardless of email match
      if (refreshProfile) {
        console.log('DEBUG: Calling refreshProfile() - avatar was updated');
        refreshProfile();
      } else {
        console.log('DEBUG: refreshProfile not available');
      }
    } catch (error) {
      console.error('[ContactProfileView] Failed to save contact:', error);
      setSaveError(error?.message || t('profile.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const joinedLabel = useMemo(() => {
    if (!contact?.created_at) {
      return '—';
    }
    const parsedDate = new Date(contact.created_at);
    if (Number.isNaN(parsedDate.getTime())) {
      return contact.created_at;
    }
    return parsedDate.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, [contact?.created_at]);

  const statusLabel = contact?.status || 'Unknown';
  const statusColor = statusLabel === 'Active' ? 'success' :
    statusLabel === 'Trial' ? 'warning' :
    statusLabel === 'Suspended' ? 'warning' : 'default';

  return (
    <Stack spacing={4}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        {onBack && (
          <Button startIcon={<ArrowBackRoundedIcon />} onClick={onBack}>
            {t('profile.backToContacts')}
          </Button>
        )}
        <Button 
          variant="outlined" 
          startIcon={<EditRoundedIcon sx={{ color: 'primary.main' }} />}
          onClick={() => setEditorOpen(true)}
          sx={{
            minWidth: 120,
            height: 36,
            textTransform: 'none',
            fontWeight: 600,
            borderColor: 'primary.main',
            color: 'primary.main',
            '&:hover': {
              borderColor: 'primary.dark',
              color: 'primary.dark',
              backgroundColor: alpha(theme.palette.brand.green, 0.08),
              transform: 'translateY(-1px)',
              boxShadow: `0 4px 12px ${alpha(theme.palette.brand.green, 0.2)}`
            },
            transition: 'all 0.2s ease-in-out'
          }}
        >
          {t('profile.editProfile')}
        </Button>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'divider',
          p: { xs: 3, md: 4 },
          background: (theme) => `linear-gradient(120deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[50]} 50%, ${theme.palette.background.paper} 100%)`
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center" justifyContent="space-between">
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
            <Avatar 
              src={contact?.avatar || contact?.photo} 
              alt={contact?.name || 'Contact'} 
              sx={{
                width: 90,
                height: 90,
                fontSize: 36,
                bgcolor: 'secondary.main',
                border: '3px solid',
                borderColor: (theme) => alpha(theme.palette.primary.light, 0.5)
              }}
            >
              {initials.slice(0, 2)}
            </Avatar>
            <Box>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="h4" fontWeight={700}>
                  {contact.name}
                </Typography>
                <Chip label={t('status.' + statusLabel, { defaultValue: statusLabel })} color={statusColor} sx={{ borderRadius: 2 }} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {contact.contact?.email || '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('profile.joined')} {joinedLabel}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: 'grid',
          width: '100%',
          gap: { xs: 2.5, md: 3 },
          gridTemplateColumns: { xs: '1fr', lg: 'repeat(12, minmax(0, 1fr))' }
        }}
      >
        <Box sx={{ gridColumn: '1 / -1' }}>
          <InfoCard title={t('profile.highlights')}>
            <Box
              sx={{
                display: 'grid',
                gap: { xs: 2, md: 3 },
                gridTemplateColumns: {
                  xs: 'repeat(auto-fit, minmax(180px, 1fr))',
                  md: 'repeat(4, minmax(0, 1fr))'
                }
              }}
            >
              <HighlightCard label={t('profile.bookingsLabel')} value={contact.bookings || '0'} trend={t('profile.totalBookings')} />
              <HighlightCard label={t('profile.expenditure')} value={`€${contact.expenditure || '0'}`} trend={t('profile.bookingsAmount')} />
              <HighlightCard label={t('profile.storageUsed')} value={`${contact.storageUsed || '0'}GB`} trend={`${contact.storagePercentage || '0'}%`} />
              <HighlightCard label={t('profile.unreadMessages')} value={contact.unreadMessages || '0'} trend={t('profile.communications')} />
            </Box>
          </InfoCard>
        </Box>

        <Box sx={{ gridColumn: { xs: '1 / -1', lg: '1 / 7' }, display: 'flex', alignItems: 'stretch', flex: 1 }}>
          <InfoCard title={t('profile.basicData')} icon={PersonOutlineRoundedIcon}>
            <Stack spacing={2} sx={{ width: '100%' }}>
              <InfoRow label={t('profile.tenantId')} value={contact.id} pill />
              <InfoRow label={t('profile.primaryContact')} value={contact.contact?.name} />
              <InfoRow label={t('profile.email')} value={contact.contact?.email} />
              <InfoRow label={t('profile.phone')} value={contact.phone_primary} />
              <InfoRow label={t('profile.userType')} value={contact.user_type} />
              <InfoRow label={t('profile.status')} value={contact.status ? t('status.' + contact.status, { defaultValue: contact.status }) : undefined} />
              <InfoRow label={t('profile.center')} value={contact.center} />
            </Stack>
          </InfoCard>
        </Box>

        <Box sx={{ gridColumn: { xs: '1 / -1', lg: '7 / -1' }, display: 'flex', alignItems: 'stretch', flex: 1 }}>
          <SectionCard icon={CreditCardRoundedIcon} title={t('profile.billingDetails')}>
            <SectionList
              description={t('profile.primaryBillingProfile')}
              items={[
                { label: t('profile.billingCompany'), value: contact.billing?.company || contact.name },
                { label: t('profile.billingEmail'), value: contact.billing?.email || contact.contact?.email },
                { label: t('profile.billingAddress'), value: contact.billing?.address || '—' },
                { label: t('profile.billingCountry'), value: contact.billing?.country || '—' },
                { label: t('profile.billingCounty'), value: contact.billing?.county || '—' },
                { label: t('profile.billingCity'), value: contact.billing?.city || '—' },
                { label: t('profile.billingPostalCode'), value: contact.billing?.postal_code || '—' },
                { label: t('profile.billingTaxId'), value: contact.billing?.tax_id || '—' }
              ]}
            />
          </SectionCard>
        </Box>

        <Box sx={{ gridColumn: { xs: '1 / -1', lg: '1 / 7' }, display: 'flex', alignItems: 'stretch', flex: 1 }}>
          <SectionCard icon={EventAvailableRoundedIcon} title={t('profile.bookingsLabel')}>
            <SectionList
              description={t('profile.bookingsSummary')}
              items={(() => {
                const items = [
                  { label: t('profile.totalBookingsYTD'), value: bookingStats?.totalBookingsYTD ?? '—' },
                  { label: t('profile.totalBookingsMonth'), value: bookingStats?.totalBookingsMonth ?? '—' },
                ];
                if (bookingStats?.freeBookings === 'unlimited') {
                  items.push({ label: t('profile.freeBookings'), value: t('profile.unlimited') });
                } else if (bookingStats?.freeBookingsLimit != null) {
                  items.push({
                    label: t('profile.freeBookings'),
                    value: `${bookingStats.freeBookings ?? 0} (${bookingStats.freeBookingsLeft ?? 0} ${t('profile.left')})`
                  });
                }
                return items;
              })()}
            />
          </SectionCard>
        </Box>

        <Box sx={{ gridColumn: { xs: '1 / -1', lg: '7 / -1' }, display: 'flex', alignItems: 'stretch', flex: 1 }}>
          <SectionCard icon={AutorenewRoundedIcon} title={t('profile.subscriptions')}>
            <Box sx={{ px: 2, pb: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {t('profile.subscriptionsDesc')}
              </Typography>
              {subscriptions.filter(s => s.active).length === 0 ? (
                <Typography variant="body2" color="text.disabled">{t('profile.noSubscriptions')}</Typography>
              ) : (
                <Stack spacing={1}>
                  {subscriptions.filter(s => s.active).map((sub) => (
                    <Paper key={sub.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{sub.description}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {sub.cuenta} · €{Number(sub.monthlyAmount).toFixed(2)}/{t('profile.month')} · {t('profile.since')} {sub.startDate}
                          </Typography>
                        </Box>
                        <Button size="small" color="error" onClick={() => handleCancelSubscription(sub.id)}>
                          {t('profile.cancelSubscription')}
                        </Button>
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              )}
              <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setSubDialogOpen(true)} sx={{ mt: 1 }}>
                {t('profile.addSubscription')}
              </Button>
            </Box>
          </SectionCard>
        </Box>

        <Box sx={{ gridColumn: { xs: '1 / -1', lg: '1 / 7' }, display: 'flex', alignItems: 'stretch', flex: 1 }}>
          <SectionCard icon={DescriptionRoundedIcon} title={t('profile.invoices')}>
            <SectionList
              description={t('profile.recentBillingOverview')}
              items={[
                { label: t('profile.outstanding'), value: '$0.00' },
                { label: t('profile.totalBilledYTD'), value: '$24,890' },
                { label: t('profile.lastPayment'), value: 'Oct 03 · $500.00 (card)' }
              ]}
            />
          </SectionCard>
        </Box>

        <Box sx={{ gridColumn: { xs: '1 / -1', lg: '7 / -1' }, display: 'flex', alignItems: 'stretch', flex: 1 }}>
          <SectionCard icon={ChatBubbleOutlineRoundedIcon} title={t('profile.communications')}>
            <SectionList
              description={t('profile.communicationsDesc')}
              items={[
                { label: t('profile.successManager'), value: contact.contact?.name },
                { label: t('profile.lastOutreach'), value: 'Oct 04 · Quarterly review' },
                { label: t('profile.primaryChannel'), value: contact.channel }
              ]}
            />
          </SectionCard>
        </Box>
      </Box>


      <Dialog 
        open={editorOpen} 
        onClose={() => setEditorOpen(false)} 
        maxWidth="lg" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: (theme) => `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[200]} 100%)`,
            boxShadow: theme.shadows[6]
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 0,
          background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'common.white',
          borderRadius: '12px 12px 0 0',
          p: 3
        }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: alpha(theme.palette.common.white, 0.2), width: 40, height: 40 }}>
              <EditRoundedIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {t('profile.editUserProfile')}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {t('profile.updateUserInfo')}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 4 }}>
            <Stack spacing={4}>
              {saveError ? <Alert severity="error">{saveError}</Alert> : null}
              {/* Basic Information Section */}
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                  background: 'background.paper'
                }}
              >
                <Box sx={{
                  p: 3,
                  background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                  borderBottom: '1px solid',
                  borderBottomColor: 'divider'
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'success.light', width: 36, height: 36 }}>
                      <PersonRoundedIcon />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600} color="text.primary">
                      {t('profile.basicInformation')}
                    </Typography>
                  </Stack>
                </Box>
                <Box sx={{ p: 3 }}>
                  {/* Profile Photo Section */}
                  <Box sx={{
                    p: 3,
                    border: '2px dashed',
                    borderColor: 'success.light',
                    borderRadius: 2,
                    bgcolor: (th) => `${th.palette.success.main}0D`,
                    mb: 3
                  }}>
                    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'success.light' }}>
                      {t('profile.profilePhoto')}
                    </Typography>
                    <Stack direction="row" spacing={3} alignItems="center">
                      <Avatar
                        src={draft?.avatar}
                        alt={draft?.name}
                        sx={{ width: 80, height: 80, bgcolor: 'success.light', fontSize: 32, border: (th) => `3px solid ${th.palette.primary.light}80` }}
                      >
                        {draft?.name ? draft.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'U'}
                      </Avatar>
                      <Stack spacing={2}>
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="user-avatar-upload"
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const dataUrl = event.target.result;
                                handleChange('avatar')({ target: { value: dataUrl } });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <label htmlFor="user-avatar-upload">
                          <Button
                            component="span"
                            variant="outlined"
                            size="medium"
                            startIcon={<PhotoCameraRoundedIcon />}
                            sx={{
                              borderColor: 'success.light',
                              color: 'success.light',
                              '&:hover': {
                                borderColor: 'success.light',
                                backgroundColor: (th) => `${th.palette.success.light}10`
                              }
                            }}
                          >
                            {t('profile.changePhoto')}
                          </Button>
                        </label>
                        <Typography variant="caption" color="text.secondary">
                          {t('profile.clickToUpload')}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label={t('profile.userName')}
                        value={draft?.name || ''}
                        onChange={handleChange('name')}
                        fullWidth
                        variant="outlined"
                        size="small"
                        sx={fieldSx}
                        InputProps={{ startAdornment: <InputAdornment position="start"><PersonRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label={t('profile.email')}
                        value={draft?.contact?.email || ''}
                        onChange={handleContactChange('email')}
                        fullWidth
                        variant="outlined"
                        size="small"
                        sx={fieldSx}
                        InputProps={{ startAdornment: <InputAdornment position="start"><MailOutlineRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label={t('profile.phone')}
                        value={draft?.phone_primary || ''}
                        onChange={handleChange('phone_primary')}
                        fullWidth
                        variant="outlined"
                        size="small"
                        sx={fieldSx}
                        InputProps={{ startAdornment: <InputAdornment position="start"><PhoneRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        label={t('profile.userType')}
                        value={draft?.user_type && draft.user_type !== '—' ? draft.user_type : ''}
                        onChange={handleChange('user_type')}
                        fullWidth
                        variant="outlined"
                        size="small"
                        sx={fieldSx}
                        SelectProps={{ displayEmpty: true }}
                      >
                        <MenuItem value="">
                          <em>{t('profile.undefinedOption')}</em>
                        </MenuItem>
                        {availableUserTypes.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        label={t('profile.status')}
                        value={draft?.status || ''}
                        onChange={handleChange('status')}
                        fullWidth
                        variant="outlined"
                        size="small"
                        sx={fieldSx}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        select
                        label={t('profile.center')}
                        value={draft?.center || ''}
                        onChange={handleChange('center')}
                        fullWidth
                        variant="outlined"
                        size="small"
                        sx={fieldSx}
                        InputProps={{ startAdornment: <InputAdornment position="start"><LocationOnRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                        SelectProps={{ displayEmpty: true }}
                      >
                        <MenuItem value="">
                          <em>—</em>
                        </MenuItem>
                        {CENTER_OPTIONS.map((c) => (
                          <MenuItem key={c} value={c}>
                            {c}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>

              {/* Billing Information Section */}
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  overflow: 'hidden',
                  background: 'background.paper'
                }}
              >
                <Box sx={{
                  p: 3,
                  background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                  borderBottom: '1px solid',
                  borderBottomColor: 'divider'
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: 'success.light', width: 36, height: 36 }}>
                      <BusinessRoundedIcon />
                    </Avatar>
                    <Typography variant="h6" fontWeight={600} color="text.primary">
                      {t('profile.billingDetails')}
                    </Typography>
                  </Stack>
                </Box>
                <Box sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label={t('profile.companyName')}
                        value={draft?.billing?.company || ''}
                        onChange={handleBillingChange('company')}
                        fullWidth
                        variant="outlined"
                        size="small"
                        sx={fieldSx}
                        InputProps={{ startAdornment: <InputAdornment position="start"><BusinessRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label={t('profile.billingEmail')}
                        value={draft?.billing?.email || ''}
                        onChange={handleBillingChange('email')}
                        fullWidth
                        variant="outlined"
                        size="small"
                        sx={fieldSx}
                        InputProps={{ startAdornment: <InputAdornment position="start"><MailOutlineRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label={t('profile.billingAddress')}
                        value={draft?.billing?.address || ''}
                        onChange={handleBillingChange('address')}
                        fullWidth
                        variant="outlined"
                        size="small"
                        sx={fieldSx}
                        InputProps={{ startAdornment: <InputAdornment position="start"><LocationOnRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label={t('profile.billingPostalCode')}
                        value={draft?.billing?.postal_code || ''}
                        onChange={handleBillingChange('postal_code')}
                        fullWidth
                        variant="outlined"
                        size="small"
                        sx={fieldSx}
                        InputProps={{ startAdornment: <InputAdornment position="start"><MarkunreadMailboxRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Autocomplete
                        freeSolo
                        options={COUNTRIES}
                        getOptionLabel={(opt) => typeof opt === 'string' ? opt : getCountryLabel(opt, lang)}
                        filterOptions={(opts, { inputValue }) => filterCountries(opts, inputValue)}
                        value={draft?.billing?.country || ''}
                        onChange={handleBillingCountryChange}
                        onInputChange={(_e, val, reason) => { if (reason === 'input') setDraft((prev) => ({ ...prev, billing: { ...prev.billing, country: val } })); }}
                        renderInput={(params) => (
                          <TextField {...params} label={t('profile.billingCountry')} variant="outlined" size="small" sx={autocompleteFieldSx} slotProps={{ inputLabel: { shrink: true } }} />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Autocomplete
                        freeSolo
                        options={provinceOptions}
                        value={draft?.billing?.county || ''}
                        onChange={handleBillingProvinceChange}
                        onInputChange={(_e, val, reason) => { if (reason === 'input') setDraft((prev) => ({ ...prev, billing: { ...prev.billing, county: val } })); }}
                        renderInput={(params) => (
                          <TextField {...params} label={t('profile.countyState')} variant="outlined" size="small" sx={autocompleteFieldSx} slotProps={{ inputLabel: { shrink: true } }} />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Autocomplete
                        freeSolo
                        options={cityOptions}
                        value={draft?.billing?.city || ''}
                        onChange={handleBillingCityChange}
                        onInputChange={(_e, val, reason) => { if (reason === 'input') setDraft((prev) => ({ ...prev, billing: { ...prev.billing, city: val } })); }}
                        renderInput={(params) => (
                          <TextField {...params} label={t('profile.billingCity')} variant="outlined" size="small" sx={autocompleteFieldSx} slotProps={{ inputLabel: { shrink: true } }} />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label={t('profile.billingTaxId')}
                        value={draft?.billing?.tax_id || ''}
                        onChange={handleBillingChange('tax_id')}
                        fullWidth
                        variant="outlined"
                        size="small"
                        sx={fieldSx}
                        InputProps={{ startAdornment: <InputAdornment position="start"><BadgeRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                      />
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Stack>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ 
          p: 3, 
          background: (theme) => `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[200]} 100%)`,
          borderRadius: '0 0 12px 12px'
        }}>
          <Button
            startIcon={<CloseRoundedIcon sx={{ color: 'secondary.main' }} />}
            onClick={() => setEditorOpen(false)}
            disabled={saving}
            variant="outlined"
            sx={{
              minWidth: 120,
              height: 36,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                color: 'primary.dark',
                backgroundColor: (theme) => `${theme.palette.primary.main}14`,
                transform: 'translateY(-1px)',
                boxShadow: (theme) => `0 4px 12px ${theme.palette.primary.main}33`
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {t('profile.cancelEdit')}
          </Button>
          <Button
            variant="contained" 
            startIcon={<SaveRoundedIcon sx={{ color: 'white' }} />}
            onClick={handleSave}
            disabled={saving}
            sx={{
              minWidth: 120,
              height: 36,
              textTransform: 'none',
              fontWeight: 600,
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.dark'
              }
            }}
          >
            {t('profile.saveChanges')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={subDialogOpen} onClose={() => setSubDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('profile.addSubscription')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              size="small"
              label="Stripe Subscription ID"
              value={newSub.stripeSubscriptionId}
              onChange={(e) => setNewSub({ ...newSub, stripeSubscriptionId: e.target.value })}
              placeholder="sub_..."
              helperText={t('profile.stripeIdHelper')}
              fullWidth
            />
            <TextField
              size="small"
              label={t('profile.monthlyAmount')}
              type="number"
              value={newSub.monthlyAmount}
              onChange={(e) => setNewSub({ ...newSub, monthlyAmount: e.target.value })}
              slotProps={{ input: { startAdornment: <InputAdornment position="start">€</InputAdornment> } }}
              fullWidth
            />
            <TextField
              size="small"
              label={t('profile.startDate')}
              type="date"
              value={newSub.startDate}
              onChange={(e) => setNewSub({ ...newSub, startDate: e.target.value })}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <TextField
              size="small"
              label={t('profile.cuenta')}
              value={newSub.cuenta}
              onChange={(e) => setNewSub({ ...newSub, cuenta: e.target.value })}
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
              onChange={(e) => setNewSub({ ...newSub, description: e.target.value })}
              fullWidth
            />
            <TextField
              size="small"
              label={t('profile.vatNumber')}
              value={newSub.vatNumber}
              onChange={(e) => setNewSub({ ...newSub, vatNumber: e.target.value })}
              placeholder="ES12345678A"
              helperText={t('profile.vatNumberHelper')}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubDialogOpen(false)}>{t('profile.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleAddSubscription}
            disabled={!newSub.monthlyAmount || subSaving}
          >
            {subSaving ? t('profile.creating') : t('profile.add')}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

ContactProfileView.propTypes = {
  contact: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    contact: PropTypes.shape({
      name: PropTypes.string,
      email: PropTypes.string
    }),
    phone_primary: PropTypes.string,
    status: PropTypes.string,
    user_type: PropTypes.string,
    center: PropTypes.string,
    seats: PropTypes.number,
    usage: PropTypes.number,
    channel: PropTypes.string,
    created_at: PropTypes.string,
    billing: PropTypes.shape({
      company: PropTypes.string,
      email: PropTypes.string,
      address: PropTypes.string,
      postal_code: PropTypes.string,
      city: PropTypes.string,
      county: PropTypes.string,
      country: PropTypes.string,
      tax_id: PropTypes.string
    })
  }),
  onBack: PropTypes.func,
  onSave: PropTypes.func,
  userTypeOptions: PropTypes.arrayOf(PropTypes.string)
};

ContactProfileView.defaultProps = {
  contact: null,
  onSave: undefined,
  userTypeOptions: CANONICAL_USER_TYPES
};

const MetricCard = ({ title, value }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'grey.300',
      px: 3,
      py: 2,
      minWidth: 120,
      textAlign: 'center',
      bgcolor: 'background.paper'
    }}
  >
    <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.8}>
      {title}
    </Typography>
    <Typography variant="h6" fontWeight={700}>
      {value}
    </Typography>
  </Paper>
);

MetricCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};

const InfoCard = ({ title, icon: Icon, children }) => (
  <Paper
    elevation={0}
    sx={{ borderRadius: 3, border: '1px solid', borderColor: 'grey.200', bgcolor: 'background.paper', p: 3, height: '100%', width: '100%' }}
  >
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
      {Icon && (
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: (theme) => `${theme.palette.success.main}1A`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon fontSize="small" sx={{ color: 'secondary.main' }} />
        </Box>
      )}
      <Typography variant="subtitle1" fontWeight={600}>
        {title}
      </Typography>
    </Stack>
    {children}
  </Paper>
);

InfoCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
  children: PropTypes.node
};

const InfoRow = ({ label, value, pill }) => (
  <Stack
    spacing={0.5}
    sx={{
      '&:not(:first-of-type)': {
        borderTop: '1px solid',
        borderTopColor: 'grey.100',
        mt: 1,
        pt: 1
      }
    }}
  >
    <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.8}>
      {label}
    </Typography>
    {pill ? (
      <Chip label={value} size="small" sx={{ alignSelf: 'flex-start', borderRadius: 1.5 }} />
    ) : (
      <Typography variant="body2" fontWeight={600}>
        {value || '—'}
      </Typography>
    )}
  </Stack>
);

InfoRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  pill: PropTypes.bool
};

const HighlightCard = ({ label, value, trend }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: 2,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.default',
      p: 2.5,
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}
  >
    <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.8}>
      {label}
    </Typography>
    <Typography variant="h6" fontWeight={700} sx={{ mt: 0.5 }}>
      {value}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {trend}
    </Typography>
  </Paper>
);

HighlightCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  trend: PropTypes.string
};

const SectionCard = ({ icon: Icon, title, children }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper',
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}
  >
    <Stack direction="row" spacing={2} alignItems="center" sx={{ px: 3, py: 2, borderBottom: '1px solid', borderBottomColor: 'divider' }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          bgcolor: (theme) => alpha(theme.palette.success.main, 0.15),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Icon fontSize="small" sx={{ color: 'primary.main' }} />
      </Box>
      <Typography variant="subtitle2" fontWeight={600}>
        {title}
      </Typography>
    </Stack>
    <Box sx={{ px: 3, py: 2, flexGrow: 1 }}>{children}</Box>
  </Paper>
);

SectionCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node
};

const SectionList = ({ description, items }) => (
  <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
    <Typography variant="body2" color="text.secondary">
      {description}
    </Typography>
    <Stack
      spacing={1}
      sx={{
        '& > *:not(:first-of-type)': {
          borderTop: '1px solid',
        borderTopColor: 'grey.100',
          pt: 1,
          mt: 1
        }
      }}
    >
      {items.map((item) => (
        <Stack key={item.label} direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            {item.label}
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {item.value}
          </Typography>
        </Stack>
      ))}
    </Stack>
  </Stack>
);

SectionList.propTypes = {
  description: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
    })
  ).isRequired
};

export default ContactProfileView;
