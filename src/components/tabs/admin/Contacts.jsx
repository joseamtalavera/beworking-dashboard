import { useEffect, useMemo, useState, useCallback, memo } from 'react';

import { apiFetch } from '../../../api/client';

// Colors live on theme.palette.brand (brand.green / brand.greenHover / brand.accentSoft)

import PropTypes from 'prop-types';
import { alpha, useTheme } from '@mui/material/styles';
import { tokens } from '../../../theme/tokens.js';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import LinearProgress from '@mui/material/LinearProgress';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import TextField from '../../common/ClearableTextField';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import LocationCityRoundedIcon from '@mui/icons-material/LocationCityRounded';
import MarkunreadMailboxRoundedIcon from '@mui/icons-material/MarkunreadMailboxRounded';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';

import ContactProfileView from './ContactProfileView';
import { CANONICAL_USER_TYPES, normalizeUserTypeLabel } from './contactConstants';
import { COUNTRIES, SPAIN_PROVINCES, SPAIN_CITIES, getCountryLabel, isSpain, filterCountries } from '../../../data/geography';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n/i18n.js';
import esContacts from '../../../i18n/locales/es/contacts.json';
import enContacts from '../../../i18n/locales/en/contacts.json';

if (!i18n.hasResourceBundle('es', 'contacts')) {
  i18n.addResourceBundle('es', 'contacts', esContacts);
  i18n.addResourceBundle('en', 'contacts', enContacts);
}

const STATUS_COLOR = {
  Activo: { color: 'success', label: 'Activo' },
  'Lista de Espera': { color: 'warning', label: 'Lista de Espera' },
  Inactivo: { color: 'default', label: 'Inactivo' },
  Potencial: { color: 'primary', label: 'Potencial' },
  Trial: { color: 'primary', label: 'Trial' },
  Suspended: { color: 'default', label: 'Suspended' },
  Inactive: { color: 'default', label: 'Inactive' }
};

// Activity status based on bookings and invoices
const ACTIVITY_STATUS = {
  Activo: { color: 'success', label: 'Activo', variant: 'outlined' },
  Inactivo: { color: 'default', label: 'Inactivo', variant: 'outlined' },
  Potencial: { color: 'primary', label: 'Potencial', variant: 'outlined' },
  Trial: { color: 'info', label: 'Trial', variant: 'outlined' },
  'Lista de Espera': { color: 'warning', label: 'Lista de Espera', variant: 'outlined' },
  Suspended: { color: 'error', label: 'Suspended', variant: 'outlined' },
  Inactive: { color: 'default', label: 'Inactive', variant: 'outlined' }
};

const PAGE_SIZE = 10; // Client-side pagination like MailboxAdmin
const DEFAULT_STATUSES = ['Activo', 'Lista de Espera', 'Potencial', 'Trial', 'Suspended', 'Inactive'];
const ADD_USER_STATUS_OPTIONS = [
  { value: 'Activo', label: 'Activo' },
  { value: 'Lista de Espera', label: 'Lista de Espera' },
  { value: 'Potencial', label: 'Potencial' },
  { value: 'Inactive', label: 'Inactivo' }
];

const VIRTUAL_USER_BILLING = {
  billingAddress: 'Calle Alejandro Dumas 17 - Oficinas',
  billingCountry: 'España',
  billingCounty: 'Málaga',
  billingCity: 'Málaga',
  billingPostalCode: '29004',
  center: 'MA1 MALAGA DUMAS'
};

const ADD_USER_DEFAULT = {
  name: '',
  email: '',
  phone: '',
  status: 'Activo',
  userType: 'Usuario Mesa',
  center: 'MA1 MALAGA DUMAS',
  channel: '',
  avatar: '',
  billingCompany: '',
  billingTaxId: '',
  billingAddress: '',
  billingPostalCode: '',
  billingCity: '',
  billingCounty: '',
  billingCountry: ''
};

const normalizeContact = (entry = {}) => {
  const contact = entry.contact ?? {};
  const billing = entry.billing ?? {};

  // Fallbacks from flat API fields (DB columns) when nested objects are missing
  // Compute representative full name separately to avoid mixing `??` with `||` in one expression
  const representativeName = [entry.representative_first_name ?? entry.representativeFirstName, entry.representative_last_name ?? entry.representativeLastName]
    .filter(Boolean)
    .join(' ');
  const fallbackContactName = contact.name
    ?? entry.primary_contact ?? entry.primaryContact ?? entry.contact_name ?? entry.contactName
    ?? (representativeName || null);
  const fallbackContactEmail = contact.email
    ?? entry.email_primary ?? entry.emailPrimary
    ?? entry.representative_email ?? entry.representativeEmail
    ?? null;

  const fallbackBilling = {
    company: billing.company ?? entry.billing_name ?? entry.billingName ?? entry.billing_company_name ?? entry.billingCompanyName ?? entry.name ?? null,
    email: billing.email ?? entry.billing_email ?? entry.billingEmail ?? entry.email_primary ?? entry.emailPrimary ?? null,
    address: billing.address ?? entry.billing_address ?? entry.billingAddress ?? null,
    postal_code: billing.postal_code ?? entry.billing_postal_code ?? entry.billingPostalCode ?? null,
    city: billing.city ?? entry.billing_city ?? entry.billingCity ?? null,
    county: billing.county ?? entry.billing_province ?? entry.billingProvince ?? null,
    country: billing.country ?? entry.billing_country ?? entry.billingCountry ?? null,
    tax_id: billing.tax_id ?? entry.billing_tax_id ?? entry.billingTaxId ?? null
  };

  const usageValue = typeof entry.usage === 'number' && Number.isFinite(entry.usage)
    ? Math.max(0, Math.min(1, entry.usage))
    : 0;
  const parsedSeats = Number.parseInt(entry.seats, 10);
  const seatsValue = Number.isFinite(entry.seats)
    ? entry.seats
    : Number.isFinite(parsedSeats)
      ? parsedSeats
      : 0;

  const rawUserType = entry.user_type ?? entry.userType ?? entry.tenant_type ?? entry.tenantType ?? '—';
  const normalizedUserType = rawUserType === '—' ? rawUserType : normalizeUserTypeLabel(rawUserType);

  return {
    ...entry,
    id: entry.id != null ? String(entry.id) : Math.random().toString(36).slice(2),
    name: entry.name ?? entry.billing_name ?? '—',
    plan: entry.plan ?? 'Custom',
    center: entry.center != null ? String(entry.center) : null,
    user_type: normalizedUserType,
    status: entry.status ?? 'Unknown',
    seats: seatsValue,
    usage: usageValue,
    lastActive: entry.lastActive ?? '—',
    channel: entry.channel ?? '—',
    created_at: entry.created_at ?? entry.createdAt ?? null,
    phone_primary: entry.phone_primary ?? entry.phonePrimary ?? null,
    avatar: entry.avatar ?? null,
    contact: {
      name: fallbackContactName ?? '—',
      email: fallbackContactEmail ?? '—'
    },
    billing: fallbackBilling
  };
};

// Memoized TextField component for better performance
const MemoizedTextField = memo(({ label, value, onChange, ...props }) => (
  <TextField 
    label={label}
    value={value}
    onChange={onChange}
    {...props}
  />
));

const AddUserDialog = ({ open, onClose, onSave, existingStatuses, refreshProfile }) => {
  const [form, setForm] = useState(ADD_USER_DEFAULT);
  const theme = useTheme();
  const { t, i18n: i18nInstance } = useTranslation('contacts');
  const lang = i18nInstance.language?.startsWith('en') ? 'en' : 'es';
  const contactFieldSx = {
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
  // Autocomplete fields need auto height — the fixed 36px squeezes text when
  // combined with the popup/clear endAdornment icons MUI injects.
  const autocompleteSx = {
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
    if (open) {
      setForm(ADD_USER_DEFAULT);
    }
  }, [open]);

  const statusOptions = useMemo(() => {
    // Build a map keyed by label to avoid duplicate labels like 'Inactivo' coming
    // from different values ('Inactive' vs 'Inactivo'). Prefer the canonical
    // entries defined in ADD_USER_STATUS_OPTIONS, then include any existingStatuses
    // that don't conflict by label.
    const labelMap = new Map();

    // First, add canonical options so they take precedence.
    ADD_USER_STATUS_OPTIONS.forEach((item) => {
      labelMap.set(item.label, { value: item.value, label: item.label });
    });

    // Then add any existing statuses from backend if their label isn't already used.
    (existingStatuses ?? []).forEach((status) => {
      // See if this status matches a canonical value to get its label
      const match = ADD_USER_STATUS_OPTIONS.find((item) => item.value === status || item.label === status);
      const label = match ? match.label : status;
      if (!labelMap.has(label)) {
        labelMap.set(label, { value: status, label });
      }
    });

    return Array.from(labelMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [existingStatuses]);

  const CENTER_OPTIONS = ['MA1 MALAGA DUMAS'];

  const handleFieldChange = useCallback((field) => (event) => {
    const { value } = event.target;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'userType' && value === 'Usuario Virtual') {
        Object.assign(next, VIRTUAL_USER_BILLING);
      }
      return next;
    });
  }, []);

  // Cascading geography options
  const provinceOptions = useMemo(
    () => (isSpain(form.billingCountry) ? SPAIN_PROVINCES : []),
    [form.billingCountry]
  );
  const cityOptions = useMemo(
    () => (isSpain(form.billingCountry) && form.billingCounty ? (SPAIN_CITIES[form.billingCounty] || []) : []),
    [form.billingCountry, form.billingCounty]
  );

  const handleCountryChange = useCallback((_event, newValue) => {
    const val = typeof newValue === 'string' ? newValue : (newValue ? getCountryLabel(newValue, lang) : '');
    setForm((prev) => ({ ...prev, billingCountry: val, billingCounty: '', billingCity: '' }));
  }, [lang]);

  const handleProvinceChange = useCallback((_event, newValue) => {
    const val = typeof newValue === 'string' ? newValue : (newValue || '');
    setForm((prev) => ({ ...prev, billingCounty: val, billingCity: '' }));
  }, []);

  const handleCityChange = useCallback((_event, newValue) => {
    const val = typeof newValue === 'string' ? newValue : (newValue || '');
    setForm((prev) => ({ ...prev, billingCity: val }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!form.name || !form.name.trim() || !form.email || !form.email.trim()) {
      return;
    }
    onSave?.(form);
  }, [form, onSave]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[200]} 100%)`,
          boxShadow: theme.shadows[6]
        }
      }}
    >
      <DialogTitle sx={{
        pb: 0,
        background: `linear-gradient(135deg, ${theme.palette.brand.green} 0%, ${theme.palette.brand.greenHover} 100%)`,
        color: 'common.white',
        borderRadius: '12px 12px 0 0',
        p: 3
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: alpha(theme.palette.common.white, 0.2), width: 40, height: 40 }}>
            <AddRoundedIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
              {t('addDialog.title')}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {t('addDialog.subtitle')}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 4 }}>
          <Stack spacing={4}>
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
                background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(
                  theme.palette.brand.green,
                  0.05
                )} 100%)`,
                borderBottom: '1px solid',
                borderBottomColor: 'divider'
              }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'success.light', width: 36, height: 36 }}>
                    <PersonRoundedIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight={600} color="text.primary">
                    {t('addDialog.basicInfo')}
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
                  bgcolor: (theme) => `${theme.palette.success.main}0D`,
                  mb: 3 
                }}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, color: 'success.light' }}>
                    {"📸 " + t('addDialog.profilePhoto')}
                  </Typography>
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Avatar 
                      src={form.avatar} 
                      alt={form.name || 'New User'} 
                      sx={{ width: 80, height: 80, bgcolor: 'success.light', fontSize: 32, border: (theme) => `3px solid ${theme.palette.brand.green}80` }}
                    >
                      {form.name ? form.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'NU'}
                    </Avatar>
                    <Stack spacing={2}>
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="new-user-avatar-upload"
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const dataUrl = event.target.result;
                              setForm(prev => ({ ...prev, avatar: dataUrl }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <label htmlFor="new-user-avatar-upload">
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
                              backgroundColor: (theme) => `${theme.palette.success.light}10`
                            } 
                          }}
                        >
                          Add Photo
                        </Button>
                      </label>
                      <Typography variant="caption" color="text.secondary">
                        Click to upload a profile photo
                      </Typography>
                    </Stack>
                  </Stack>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <MemoizedTextField
                      label={t('addDialog.userName')}
                      value={form.name}
                      onChange={handleFieldChange('name')}
                      fullWidth
                      required
                      variant="outlined"
                      size="small"
                      sx={contactFieldSx}
                      InputProps={{ startAdornment: <InputAdornment position="start"><PersonRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                    />
              </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t('addDialog.status')}
                  value={form.status}
                  onChange={handleFieldChange('status')}
                  fullWidth
                      select
                      variant="outlined"
                      size="small"
                      sx={contactFieldSx}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <MemoizedTextField
                      label={t('addDialog.email')}
                      type="email"
                      value={form.email}
                      onChange={handleFieldChange('email')}
                      fullWidth
                      required
                      variant="outlined"
                      size="small"
                      sx={contactFieldSx}
                      InputProps={{ startAdornment: <InputAdornment position="start"><MailOutlinedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label={t('addDialog.phone')}
                      value={form.phone}
                      onChange={handleFieldChange('phone')}
                      fullWidth
                      variant="outlined"
                      size="small"
                      sx={contactFieldSx}
                      InputProps={{ startAdornment: <InputAdornment position="start"><PhoneRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                  label={t('addDialog.userType')}
                  value={form.userType}
                  onChange={handleFieldChange('userType')}
                  fullWidth
                      select
                      variant="outlined"
                      size="small"
                      sx={contactFieldSx}
                    >
                      {CANONICAL_USER_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t('addDialog.center')}
                  value={form.center}
                  onChange={handleFieldChange('center')}
                  fullWidth
                      select
                      variant="outlined"
                      size="small"
                      sx={contactFieldSx}
                >
                  {CENTER_OPTIONS.map((center) => (
                    <MenuItem key={center} value={center}>
                      {center}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
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
                background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(
                  theme.palette.brand.green,
                  0.05
                )} 100%)`,
                borderBottom: '1px solid',
                borderBottomColor: 'divider'
              }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'brand.green', width: 36, height: 36 }}>
                    <BusinessRoundedIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight={600} color="text.primary">
                    {t('addDialog.billingInfo')}
            </Typography>
                </Stack>
              </Box>
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label={t('addDialog.billingCompany')}
                      value={form.billingCompany}
                      onChange={handleFieldChange('billingCompany')}
                      fullWidth
                      variant="outlined"
                      size="small"
                      sx={contactFieldSx}
                      InputProps={{ startAdornment: <InputAdornment position="start"><BusinessRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                    />
              </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label={t('addDialog.billingTaxId')}
                      value={form.billingTaxId}
                      onChange={handleFieldChange('billingTaxId')}
                      fullWidth
                      variant="outlined"
                      size="small"
                      placeholder="B12345678"
                      sx={contactFieldSx}
                      InputProps={{ startAdornment: <InputAdornment position="start"><BusinessRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                    />
                  </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label={t('addDialog.billingAddress')}
                  value={form.billingAddress}
                  onChange={handleFieldChange('billingAddress')}
                  fullWidth
                  variant="outlined"
                  size="small"
                  sx={contactFieldSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><HomeRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                />
              </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label={t('addDialog.postalCode')}
                      value={form.billingPostalCode}
                      onChange={handleFieldChange('billingPostalCode')}
                      fullWidth
                      variant="outlined"
                      size="small"
                      sx={contactFieldSx}
                      InputProps={{ startAdornment: <InputAdornment position="start"><MarkunreadMailboxRoundedIcon sx={{ color: 'text.disabled' }} /></InputAdornment> }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      freeSolo
                      options={COUNTRIES}
                      getOptionLabel={(opt) => typeof opt === 'string' ? opt : getCountryLabel(opt, lang)}
                      filterOptions={(opts, { inputValue }) => filterCountries(opts, inputValue)}
                      value={form.billingCountry || ''}
                      onChange={handleCountryChange}
                      onInputChange={(_e, val, reason) => { if (reason === 'input') setForm((prev) => ({ ...prev, billingCountry: val })); }}
                      renderInput={(params) => (
                        <TextField {...params} label={t('addDialog.country')} variant="outlined" size="small" sx={autocompleteSx} slotProps={{ inputLabel: { shrink: true } }} />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      freeSolo
                      options={provinceOptions}
                      value={form.billingCounty || ''}
                      onChange={handleProvinceChange}
                      onInputChange={(_e, val, reason) => { if (reason === 'input') setForm((prev) => ({ ...prev, billingCounty: val })); }}
                      renderInput={(params) => (
                        <TextField {...params} label={t('addDialog.county')} variant="outlined" size="small" sx={autocompleteSx} slotProps={{ inputLabel: { shrink: true } }} />
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      freeSolo
                      options={cityOptions}
                      value={form.billingCity || ''}
                      onChange={handleCityChange}
                      onInputChange={(_e, val, reason) => { if (reason === 'input') setForm((prev) => ({ ...prev, billingCity: val })); }}
                      renderInput={(params) => (
                        <TextField {...params} label={t('addDialog.billingCity')} variant="outlined" size="small" sx={autocompleteSx} slotProps={{ inputLabel: { shrink: true } }} />
                      )}
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
        background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[200]} 100%)`,
        borderRadius: '0 0 12px 12px'
      }}>
        <Button 
          startIcon={<CloseRoundedIcon />}
          onClick={onClose}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1,
            color: 'text.secondary',
            borderColor: 'divider',
            '&:hover': {
              borderColor: (theme) => theme.palette.grey[300],
              backgroundColor: 'background.default'
            }
          }}
          variant="outlined"
        >
          {t('addDialog.cancel')}
        </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveRoundedIcon />}
                  onClick={handleSubmit}
                  disabled={!form.name.trim() || !form.email.trim()}
                  sx={{
                    borderRadius: 999,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    boxShadow: 'none',
                    bgcolor: 'brand.green',
                    transition: `background-color ${tokens.motion.duration} ${tokens.motion.ease}`,
                    '&:hover': {
                      bgcolor: 'brand.greenHover',
                      boxShadow: 'none',
                    },
                    '&:disabled': {
                      background: theme.palette.grey[300],
                      color: theme.palette.text.disabled
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
          {t('addDialog.create')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

AddUserDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  existingStatuses: PropTypes.arrayOf(PropTypes.string)
};

AddUserDialog.defaultProps = {
  existingStatuses: []
};

const buildQueryString = ({ page, search, status, email, userType }) => {
  const params = new URLSearchParams({
    page: String(Math.max(0, (page || 1) - 1)),
    size: String(PAGE_SIZE),
    sort: 'lastActive,desc'
  });

  if (search) {
    params.append('search', search);
  }
  if (status && status !== 'all') {
    params.append('status', status);
  }
  if (email && email !== 'all') {
    params.append('email', email);
  }
  if (userType && userType !== 'all') {
    params.append('tenantType', userType);
  }

  return params.toString();
};

const pillFieldSx = (hasValue) => ({
  '& .MuiInputLabel-root': { fontSize: '0.75rem', fontWeight: 700, color: hasValue ? 'brand.green' : 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em', transition: 'color 0.2s' },
  '& .MuiInput-input': { fontSize: '0.875rem', color: hasValue ? 'text.primary' : 'text.secondary', py: 0.25 },
});

const Contacts = ({ userType = 'admin', refreshProfile, userProfile }) => {
  const theme = useTheme();
  const { t } = useTranslation('contacts');
  const [statusFilter, setStatusFilter] = useState('all');
  const [emailFilter, setEmailFilter] = useState('all');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusOptions, setStatusOptions] = useState([]);
  const [emailOptions, setEmailOptions] = useState([]);
  const [userTypeOptions, setUserTypeOptions] = useState(() => [...CANONICAL_USER_TYPES]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Reset view when component mounts (when Contacts tab is clicked)
  // This will reset the view back to list when switching to Contacts tab
  useEffect(() => {
    const selectedContactId = localStorage.getItem('selectedContactId');
    if (selectedContactId) {
      console.log('Contacts mounted with selectedContactId:', selectedContactId);
      // Don't reset to list mode if we have a selected contact ID
    } else {
      setViewMode('list');
      setSelectedContact(null);
    }
  }, []);

  useEffect(() => {
    if (statusFilter !== 'all' && !statusOptions.includes(statusFilter)) {
      setStatusOptions((prev) => {
        if (prev.includes(statusFilter)) {
          return prev;
        }
        return [...prev, statusFilter].sort((a, b) => a.localeCompare(b));
      });
    }
  }, [statusFilter, statusOptions]);

  useEffect(() => {
    if (emailFilter !== 'all' && !emailOptions.includes(emailFilter)) {
      setEmailOptions((prev) => {
        if (prev.includes(emailFilter)) {
          return prev;
        }
        return [...prev, emailFilter].sort((a, b) => a.localeCompare(b));
      });
    }
  }, [emailFilter, emailOptions]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, emailFilter, userTypeFilter]);

  const fetchContacts = useCallback(async () => {
      setLoading(true);
      setError(null);

      try {
        const query = buildQueryString({
          page,
          search: debouncedSearch,
          status: statusFilter,
          email: emailFilter,
          userType: userTypeFilter,
        });
        const data = await apiFetch(`/contact-profiles?${query}`);

        const rawItems = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.content)
            ? data.content
            : Array.isArray(data)
              ? data
              : [];

        const normalized = rawItems.map((entry) => normalizeContact(entry));

        setContacts(normalized);
        setTotal(Number.isFinite(data?.totalElements) ? data.totalElements :
          Number.isFinite(data?.total) ? data.total : normalized.length);

        setStatusOptions((prev) => {
          const next = new Set(prev);
          normalized.forEach((tenant) => {
            if (tenant.status && tenant.status !== 'Unknown') {
              next.add(tenant.status);
            }
          });
          return Array.from(next).sort((a, b) => a.localeCompare(b));
        });

        setUserTypeOptions(() => {
          const next = new Set(CANONICAL_USER_TYPES);
          normalized.forEach((tenant) => {
            if (tenant.user_type && tenant.user_type !== '—') {
              next.add(tenant.user_type);
            }
          });
          return Array.from(next).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        });
      } catch (fetchError) {
        setError(fetchError.message || 'Unable to load contacts');
        setContacts([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
  }, [page, debouncedSearch, statusFilter, emailFilter, userTypeFilter]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Check for selected contact ID from search
  useEffect(() => {
    const handleSelectedContact = async () => {
      const selectedContactId = localStorage.getItem('selectedContactId');
      console.log('Contacts useEffect - selectedContactId:', selectedContactId, 'contacts.length:', contacts.length);
      if (selectedContactId && contacts.length > 0) {
        console.log('Looking for contact with ID:', selectedContactId, 'Type:', typeof selectedContactId);
        console.log('Available contact IDs (first 10):', contacts.slice(0, 10).map(c => ({ id: c.id, name: c.name, idType: typeof c.id })));
        console.log('Searching for exact match...');
        // Use string comparison since contact IDs are strings
        const contact = contacts.find(c => c.id === selectedContactId);
        console.log('Found contact with string match:', contact);
        
        if (contact) {
          console.log('Setting selected contact and view mode to profile');
          setSelectedContact(contact);
          setViewMode('profile');
          // Clear the stored ID
          localStorage.removeItem('selectedContactId');
        } else {
          console.log('Contact not found with ID:', selectedContactId);
          // Try to fetch the contact directly by ID as a fallback
          try {
            console.log('Attempting to fetch contact directly by ID...');
            const directContact = await apiFetch(`/contact-profiles/${selectedContactId}`);
            if (directContact) {
              console.log('Found contact via direct fetch:', directContact);
              setSelectedContact(directContact);
              setViewMode('profile');
              localStorage.removeItem('selectedContactId');
            } else {
              console.log('Contact not found even with direct fetch');
              localStorage.removeItem('selectedContactId');
            }
          } catch (error) {
            console.error('Error fetching contact directly:', error);
            localStorage.removeItem('selectedContactId');
          }
        }
      }
    };

    handleSelectedContact();
  }, [contacts]);

  const handleRowClick = (tenant) => {
    setSelectedContact(tenant);
    setViewMode('profile');
  };

  const handleSaveProfile = useCallback(
    async (updatedProfile) => {
      console.log('DEBUG: handleSaveProfile called with:', updatedProfile);
      console.log('DEBUG: Avatar in updatedProfile:', updatedProfile?.avatar);
      if (!updatedProfile?.id) {
        return;
      }

      const normalizeString = (value, { allowEmpty = false } = {}) => {
        if (value == null) return undefined;
        if (typeof value !== 'string') return String(value);
        const trimmed = value.trim();
        if (!trimmed && !allowEmpty) {
          return undefined;
        }
        return trimmed;
      };

      const normalizedUserType = normalizeUserTypeLabel(updatedProfile.user_type);

      const payload = {
        name: normalizeString(updatedProfile.name, { allowEmpty: false }) ?? updatedProfile.name ?? '',
        status: normalizeString(updatedProfile.status) ?? null,
        plan: normalizeString(updatedProfile.plan) ?? null,
        primaryContact: normalizeString(updatedProfile.contact?.name) ?? null,
        email: normalizeString(updatedProfile.contact?.email) ?? null,
        phone: normalizeString(updatedProfile.phone_primary) ?? null,
        userType: normalizedUserType ?? null,
        tenantType: normalizedUserType ?? null,
        center: normalizeString(updatedProfile.center) ?? null,
        channel: normalizeString(updatedProfile.channel) ?? null,
        avatar: updatedProfile.avatar ?? null,
        billingCompany: normalizeString(updatedProfile.billing?.company) ?? null,
        billingEmail: normalizeString(updatedProfile.billing?.email) ?? null,
        billingAddress: normalizeString(updatedProfile.billing?.address) ?? null,
        billingPostalCode: normalizeString(updatedProfile.billing?.postal_code) ?? null,
        billingCounty: normalizeString(updatedProfile.billing?.county) ?? null,
        billingCountry: normalizeString(updatedProfile.billing?.country) ?? null,
        billingTaxId: normalizeString(updatedProfile.billing?.tax_id) ?? null,
        billingTaxIdType: normalizeString(updatedProfile.billing?.tax_id_type) ?? null
      };

      console.log('DEBUG: Payload being sent to backend:', payload);
      console.log('DEBUG: Avatar in payload:', payload.avatar);

      try {
        setLoading(true);
        await apiFetch(`/contact-profiles/${updatedProfile.id}`, {
          method: 'PUT',
          body: payload
        });

        const merged = normalizeContact({
          ...updatedProfile,
          name: payload.name || updatedProfile.name,
          status: payload.status || updatedProfile.status,
          plan: payload.plan || updatedProfile.plan,
          user_type: payload.tenantType || updatedProfile.user_type,
          center: payload.center ?? updatedProfile.center,
          channel: payload.channel ?? updatedProfile.channel,
          phone_primary: payload.phone ?? updatedProfile.phone_primary,
          avatar: payload.avatar ?? updatedProfile.avatar ?? null,
          contact: {
            ...(updatedProfile.contact || {}),
            name: payload.primaryContact ?? updatedProfile.contact?.name ?? null,
            email: payload.email ?? updatedProfile.contact?.email ?? null
          },
          billing: {
            ...(updatedProfile.billing || {}),
            company: payload.billingCompany ?? updatedProfile.billing?.company ?? null,
            email: payload.billingEmail ?? updatedProfile.billing?.email ?? null,
            address: payload.billingAddress ?? updatedProfile.billing?.address ?? null,
            postal_code: payload.billingPostalCode ?? updatedProfile.billing?.postal_code ?? null,
            county: payload.billingCounty ?? updatedProfile.billing?.county ?? null,
            country: payload.billingCountry ?? updatedProfile.billing?.country ?? null,
            tax_id: payload.billingTaxId ?? updatedProfile.billing?.tax_id ?? null,
            tax_id_type: payload.billingTaxIdType ?? updatedProfile.billing?.tax_id_type ?? null
          }
        });

        console.log('DEBUG: Merged contact after save:', merged);
        console.log('DEBUG: Avatar in merged contact:', merged.avatar);

        setContacts((prev) =>
          prev.map((tenant) => (tenant.id === String(updatedProfile.id) ? merged : tenant))
        );

        setSelectedContact(merged);

        console.log('DEBUG: Calling fetchContacts to refresh the list');
        await fetchContacts();

        return merged;
      } catch (error) {
        console.error('[Contacts] Error updating user:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [fetchContacts, setContacts, setSelectedContact]
  );

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setEmailFilter('all');
    setUserTypeFilter('all');
    setPage(1);
  };

  const handleAddUser = async (values) => {
    try {
      const userData = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        status: values.status || 'Potencial',
        userType: values.userType,
        center: values.center,
        channel: values.channel,
        billingCompany: values.billingCompany,
        billingTaxId: values.billingTaxId,
        billingAddress: values.billingAddress,
        billingPostalCode: values.billingPostalCode,
        billingCity: values.billingCity,
        billingCounty: values.billingCounty,
        billingCountry: values.billingCountry
      };

      const newUser = await apiFetch('/contact-profiles', {
        method: 'POST',
        body: userData
      });
      
      // Refresh the contacts list to show the new user
      fetchContacts();
      setAddDialogOpen(false);
      
      // If this is the current user being created, refresh the profile
      if (refreshProfile && values.email === userProfile?.email) {
        refreshProfile();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Contacts] Error creating user:', error);
      // You could add error handling here, like showing a toast notification
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await apiFetch(`/contact-profiles/${userId}`, {
        method: 'DELETE'
      });

      // Refresh the contacts list to remove the deleted user
      fetchContacts();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Contacts] Error deleting user:', error);
      // You could add error handling here, like showing a toast notification
    }
  };

  const openDeleteDialog = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  // Server-side pagination: backend returns only the current page
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = startIndex + contacts.length;
  const paginatedContacts = contacts;
  
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  if (viewMode === 'profile' && selectedContact) {
    return (
      <ContactProfileView
        contact={selectedContact}
        onBack={() => {
          setViewMode('list');
          setSelectedContact(null);
        }}
        onSave={handleSaveProfile}
        userTypeOptions={userTypeOptions}
        refreshProfile={refreshProfile}
      />
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: `${tokens.radius.lg}px`,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        background: `linear-gradient(140deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[100]} 50%, ${theme.palette.background.paper} 100%)`
      }}
    >
      <Box sx={{ px: 4, pt: 4, pb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={3}>
          <Stack spacing={1}>
            <Typography variant="h5" sx={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
              {t('header.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('header.subtitle')}
            </Typography>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Button
              variant="outlined"
              sx={{
                minWidth: 120,
                height: 36,
                textTransform: 'none',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                borderColor: 'success.main',
                color: 'success.main',
                '&:hover': {
                  borderColor: theme.palette.success.dark,
                  color: theme.palette.success.dark,
                  backgroundColor: alpha(theme.palette.success.main, 0.08),
                }
              }}
            >
              Export csv
            </Button>
            {userType === 'admin' && (
              <Button
                variant="contained"
                sx={{
                  minWidth: 120,
                  height: 36,
                  textTransform: 'none',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  backgroundColor: 'success.main',
                  color: 'common.white',
                  '&:hover': {
                    backgroundColor: 'success.dark',
                  }
                }}
                onClick={() => setAddDialogOpen(true)}
              >
                + {t('filters.addUser')}
              </Button>
            )}
          </Stack>
        </Stack>

        <Box sx={{ mb: 3 }} />

        {/* Search Bar */}
        <Paper
          elevation={0}
          sx={{
            mb: 2,
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
          {/* Name */}
          <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
            <TextField
              variant="standard"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              label={t('filters.searchByName')}
              placeholder={t('filters.searchByName')}
              fullWidth
              slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true } }}
              sx={pillFieldSx(search)}
            />
          </Box>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
          <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />

          {/* Email */}
          <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
            <TextField
              variant="standard"
              value={emailFilter === 'all' ? '' : emailFilter}
              onChange={(event) => setEmailFilter(event.target.value || 'all')}
              label={t('filters.searchByEmail')}
              placeholder={t('filters.searchByEmail')}
              fullWidth
              slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true } }}
              sx={pillFieldSx(emailFilter !== 'all' && emailFilter)}
            />
          </Box>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
          <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />

          {/* User Type */}
          <Box sx={{ flex: 0.8, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.25 }}>
              {t('filters.userType')}
            </Typography>
            <Select
              variant="standard"
              value={userTypeFilter}
              onChange={(event) => setUserTypeFilter(event.target.value)}
              displayEmpty
              fullWidth
              disableUnderline
              sx={{ fontSize: '0.875rem', color: userTypeFilter !== 'all' ? 'text.primary' : 'text.secondary' }}
            >
              <MenuItem value="all">{t('filters.allUserTypes')}</MenuItem>
              {userTypeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
          <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />

          {/* Status */}
          <Box sx={{ flex: 0.8, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.25 }}>
              {t('filters.status')}
            </Typography>
            <Select
              variant="standard"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              displayEmpty
              fullWidth
              disableUnderline
              sx={{ fontSize: '0.875rem', color: statusFilter !== 'all' ? 'text.primary' : 'text.secondary' }}
            >
              <MenuItem value="all">{t('filters.allStatuses')}</MenuItem>
              <MenuItem value="Activo">{t('status.Activo')}</MenuItem>
              <MenuItem value="Inactivo">{t('status.Inactivo')}</MenuItem>
              <MenuItem value="Potencial">{t('status.Potencial')}</MenuItem>
              <MenuItem value="Trial">Trial</MenuItem>
            </Select>
          </Box>

          {/* Search Button */}
          <Box sx={{ px: { xs: 2, sm: 1.5 }, py: { xs: 1.5, sm: 0 }, width: { xs: '100%', sm: 'auto' }, display: 'flex', justifyContent: 'center' }}>
            <IconButton
              aria-label="search"
              sx={{
                bgcolor: 'brand.green',
                color: 'common.white',
                width: 44,
                height: 44,
                '&:hover': { bgcolor: 'brand.greenHover' },
              }}
            >
              <SearchRoundedIcon />
            </IconButton>
          </Box>
        </Paper>

        {/* Filter actions row */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            size="small"
            onClick={handleResetFilters}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderColor: 'divider',
              color: 'text.secondary',
              borderRadius: 999,
              px: 2,
              '&:hover': { borderColor: 'brand.green', color: 'brand.green' },
            }}
          >
            {t('filters.reset')}
          </Button>
          <Box sx={{ flex: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Showing {contacts.length} of {total} contacts
          </Typography>
        </Stack>
      </Box>

      <Divider />

      <TableContainer sx={{ px: 1, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell sx={{ pl: 4, fontWeight: 'bold' }}>{t('table.user')}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('table.typeOfUser')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('table.status')}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('table.lastActivity')}</TableCell>
              <TableCell align="right" sx={{ pr: 4, fontWeight: 'bold' }}>{t('table.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Stack spacing={1} alignItems="center">
                    <CircularProgress size={24} />
                    <Typography variant="body2" color="text.secondary">
                      Loading contacts…
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            )}

            {!loading && error && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" sx={{ color: 'secondary.main' }}>
                    {error}
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {!loading && !error && paginatedContacts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No contacts match your filters.
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {!loading && !error && paginatedContacts.map((tenant) => {
              const statusMeta = ACTIVITY_STATUS[tenant.status] || { color: 'default', label: 'Unknown' };
              const initials = tenant.name
                .split(' ')
                .map((word) => word[0])
                .join('')
                .toUpperCase();

              return (
                <TableRow
                  key={tenant.id}
                  hover
                  sx={{ '& td': { borderBottomColor: 'divider' }, cursor: 'pointer' }}
                  onClick={() => handleRowClick(tenant)}
                >
                  <TableCell sx={{ pl: 4 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar 
                        src={tenant.avatar || tenant.photo} 
                        alt={tenant.name || 'Contact'} 
                        sx={{
                          bgcolor: 'secondary.main',
                          border: '3px solid',
                          borderColor: (theme) => alpha(theme.palette.brand.green, 0.5)
                        }}
                      >
                        {initials.slice(0, 2)}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={600} noWrap sx={{ maxWidth: { xs: 200, sm: 300, md: 400 } }}>{tenant.name}</Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                          <MailOutlinedIcon fontSize="inherit" />
                          <Typography variant="caption">{tenant.contact.email}</Typography>
                        </Stack>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={500}>{tenant.user_type || '—'}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={statusMeta.label} 
                      color={statusMeta.color} 
                      variant={statusMeta.variant || 'filled'}
                      size="small" 
                      sx={{ 
                        borderRadius: 1.5, 
                        fontWeight: 600,
                        minWidth: 80,
                        width: 80,
                        justifyContent: 'center'
                      }} 
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight={500} color="text.secondary">
                      {tenant.lastActive}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ pr: 4 }}>
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="Copy email">
                      <IconButton
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                              navigator.clipboard.writeText(tenant.contact.email || '');
                          }
                        }}
                      >
                          <MailOutlinedIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                      <Tooltip title="Delete user">
                        <IconButton
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            openDeleteDialog(tenant);
                          }}
                          sx={{ color: 'secondary.main', '&:hover': { color: 'secondary.dark', bgcolor: (theme) => theme.palette.brand.greenSoft } }}
                        >
                          <DeleteRoundedIcon fontSize="inherit" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="success"
            size="large"
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': {
                color: 'secondary.main',
                '&.Mui-selected': {
                  backgroundColor: 'secondary.main',
                  color: 'secondary.contrastText',
                  '&:hover': {
                    backgroundColor: 'secondary.main',
                  },
                },
                '&:hover': {
                  backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.12),
                },
              },
            }}
          />
        </Box>
      )}
      
      {/* Pagination Info */}
      <Box
        sx={{
          px: 4,
          py: 2,
          borderTop: '1px solid',
          borderTopColor: 'divider',
          bgcolor: alpha(theme.palette.background.default, 0.6)
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            {total === 0 ? '0 results' : `${startIndex + 1}-${Math.min(startIndex + contacts.length, total)} of ${total}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Page {page} of {totalPages}
          </Typography>
        </Stack>
      </Box>

      {userType === 'admin' && (
        <AddUserDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          onSave={handleAddUser}
          existingStatuses={statusOptions}
          refreshProfile={refreshProfile}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[200]} 100%)`,
            boxShadow: theme.shadows[6]
          }
        }}
      >
        <DialogTitle sx={{
          pb: 0,
          background: (theme) => `linear-gradient(135deg, ${theme.palette.brand.green} 0%, ${theme.palette.brand.greenHover} 100%)`,
          color: 'common.white',
          borderRadius: '12px 12px 0 0',
          p: 3
        }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: alpha(theme.palette.common.white, 0.2), width: 40, height: 40 }}>
              <WarningRoundedIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
                {t('deleteDialog.title')}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {t('deleteDialog.warning')}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Typography variant="body1" color="text.primary">
              {t('deleteDialog.confirm')} <strong>{userToDelete?.name}</strong>?
            </Typography>
            {userToDelete?.contact?.email && (
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 2, 
                border: '1px solid',
                borderColor: 'divider' 
              }}>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  User Details:
                </Typography>
                <Typography variant="body2" color="text.primary">
                  Email: {userToDelete.contact.email}
                </Typography>
                <Typography variant="body2" color="text.primary">
                  Type: {userToDelete.user_type || '—'}
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[200]} 100%)`,
          borderRadius: '0 0 12px 12px'
        }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1,
              color: 'text.secondary',
              borderColor: 'divider',
              '&:hover': {
                borderColor: (theme) => theme.palette.grey[300],
                backgroundColor: 'background.default'
              }
            }}
            variant="outlined"
          >
            {t('deleteDialog.cancel')}
          </Button>
          <Button
            variant="contained"
            startIcon={<DeleteRoundedIcon sx={{ color: 'text.secondary' }} />}
            onClick={() => handleDeleteUser(userToDelete?.id)}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1,
              background: (theme) => `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
              '&:hover': {
                background: (theme) => `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`,
                transform: 'translateY(-1px)',
                boxShadow: `0 8px 25px ${alpha(theme.palette.error.main, 0.3)}`
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            {t('deleteDialog.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default Contacts;
