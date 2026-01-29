import { useEffect, useMemo, useState, useCallback, memo } from 'react';

import { apiFetch } from '../../../api/client';

// Colors are now defined in theme.js - use theme palette: primary.main/dark for green, secondary.main/dark for orange

import PropTypes from 'prop-types';
import { alpha, useTheme } from '@mui/material/styles';

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
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
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
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';

import ContactProfileView from './ContactProfileView';
import { CANONICAL_USER_TYPES, normalizeUserTypeLabel } from './contactConstants';

const STATUS_COLOR = {
  Activo: { color: 'success', label: 'Activo' },
  Convertido: { color: 'success', label: 'Convertido' },
  Inactivo: { color: 'warning', label: 'Inactivo' },
  Potencial: { color: 'warning', label: 'Potencial' },
  Trial: { color: 'warning', label: 'Trial' },
  Suspended: { color: 'warning', label: 'Suspended' },
  Inactive: { color: 'default', label: 'Inactive' }
};

// Activity status based on bookings and invoices
const ACTIVITY_STATUS = {
  Activo: { color: 'success', label: 'Active', variant: 'outlined' },
  Inactivo: { color: 'warning', label: 'Inactive', variant: 'outlined' },
  Potencial: { color: 'default', label: 'Potencial', variant: 'outlined' }
};

const PAGE_SIZE = 10; // Client-side pagination like MailboxAdmin
const DEFAULT_STATUSES = ['Activo', 'Convertido', 'Potencial', 'Trial', 'Suspended', 'Inactive'];
const ADD_USER_STATUS_OPTIONS = [
  { value: 'Activo', label: 'Activo' },
  { value: 'Convertido', label: 'Convertido' },
  { value: 'Potencial', label: 'Potencial' },
  { value: 'Inactive', label: 'Inactivo' }
];

const ADD_USER_DEFAULT = {
  name: '',
  primaryContact: '',
  email: '',
  phone: '',
  plan: '',
  status: 'Activo',
  userType: 'Usuario Mesa',
  center: 'MA1 MALAGA DUMAS',
  seats: '',
  channel: '',
  avatar: '',
  billingCompany: '',
  billingEmail: '',
  billingAddress: '',
  billingPostalCode: '',
  billingCounty: '',
  billingCountry: ''
};

const normalizeContact = (entry = {}) => {
  const contact = entry.contact ?? {};
  const billing = entry.billing ?? {};

  // Fallbacks from flat API fields (DB columns) when nested objects are missing
  // Compute representative full name separately to avoid mixing `??` with `||` in one expression
  const representativeName = [entry.representative_first_name, entry.representative_last_name]
    .filter(Boolean)
    .join(' ');
  const fallbackContactName = contact.name
    ?? entry.primary_contact
    ?? (representativeName || null);
  const fallbackContactEmail = contact.email
    ?? entry.email_primary
    ?? entry.representative_email
    ?? null;

  const fallbackBilling = {
    company: billing.company ?? entry.billing_name ?? entry.name ?? null,
    email: billing.email ?? entry.billing_email ?? entry.email_primary ?? null,
    address: billing.address ?? entry.billing_address ?? null,
    postal_code: billing.postal_code ?? entry.billing_postal_code ?? null,
    county: billing.county ?? entry.billing_province ?? null,
    country: billing.country ?? entry.billing_country ?? null,
    tax_id: billing.tax_id ?? entry.billing_tax_id ?? null
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

  const rawUserType = entry.user_type ?? '—';
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
    created_at: entry.created_at ?? null,
    phone_primary: entry.phone_primary ?? null,
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
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
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
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        color: 'common.white',
        borderRadius: '12px 12px 0 0',
        p: 3
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: alpha(theme.palette.common.white, 0.2), width: 40, height: 40 }}>
            <AddRoundedIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Add New User
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Create a new user profile with basic and billing information
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
                  theme.palette.primary.main,
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
                    Basic Information
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
                    📸 Profile Photo
                  </Typography>
                  <Stack direction="row" spacing={3} alignItems="center">
                    <Avatar 
                      src={form.avatar} 
                      alt={form.name || 'New User'} 
                      sx={{ width: 80, height: 80, bgcolor: 'success.light', fontSize: 32, border: (theme) => `3px solid ${theme.palette.primary.light}80` }}
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
                  <Grid item xs={12} sm={6}>
                    <MemoizedTextField 
                      label="User / Company name" 
                      value={form.name} 
                      onChange={handleFieldChange('name')} 
                      fullWidth 
                      required
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          minHeight: 56,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'success.light'
                          }
                        }
                      }}
                    />
              </Grid>
                  <Grid item xs={12} sm={6}>
                <TextField
                  label="Status"
                  value={form.status}
                  onChange={handleFieldChange('status')}
                  fullWidth
                      select
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          minHeight: 56,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'success.light'
                          }
                        }
                      }}
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
                  <Grid item xs={12} sm={6}>
                <TextField
                      label="Primary contact" 
                      value={form.primaryContact} 
                      onChange={handleFieldChange('primaryContact')} 
                      fullWidth 
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          minHeight: 56,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'success.light'
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <MemoizedTextField 
                      label="Email" 
                      type="email" 
                      value={form.email} 
                      onChange={handleFieldChange('email')} 
                      fullWidth 
                      required
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          minHeight: 56,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'success.light'
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      label="Phone" 
                      value={form.phone} 
                      onChange={handleFieldChange('phone')} 
                      fullWidth 
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          minHeight: 56,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'success.light'
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                  label="User type"
                  value={form.userType}
                  onChange={handleFieldChange('userType')}
                  fullWidth
                      select
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          minHeight: 56,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'success.light'
                          }
                        }
                      }}
                    >
                      {CANONICAL_USER_TYPES.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
                  <Grid item xs={12} sm={6}>
                <TextField
                  label="Center"
                  value={form.center}
                  onChange={handleFieldChange('center')}
                  fullWidth
                      select
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          minHeight: 56,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'success.light'
                          }
                        }
                      }}
                >
                  {CENTER_OPTIONS.map((center) => (
                    <MenuItem key={center} value={center}>
                      {center}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
                  <Grid item xs={12} sm={6}>
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
                  theme.palette.primary.main,
                  0.05
                )} 100%)`,
                borderBottom: '1px solid',
                borderBottomColor: 'divider'
              }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
                    <BusinessRoundedIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight={600} color="text.primary">
                    Billing Details
            </Typography>
                </Stack>
              </Box>
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      label="Billing company" 
                      value={form.billingCompany} 
                      onChange={handleFieldChange('billingCompany')} 
                      fullWidth 
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          minHeight: 56,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main'
                          }
                        }
                      }}
                    />
              </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      label="Billing email" 
                      value={form.billingEmail} 
                      onChange={handleFieldChange('billingEmail')} 
                      fullWidth 
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          minHeight: 56,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main'
                          }
                        }
                      }}
                    />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Billing address"
                  value={form.billingAddress}
                  onChange={handleFieldChange('billingAddress')}
                  fullWidth
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          minHeight: 56,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main'
                          }
                        }
                      }}
                />
              </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField 
                      label="Postal code" 
                      value={form.billingPostalCode} 
                      onChange={handleFieldChange('billingPostalCode')} 
                      fullWidth 
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          minHeight: 56,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main'
                          }
                        }
                      }}
                    />
              </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField 
                      label="County" 
                      value={form.billingCounty} 
                      onChange={handleFieldChange('billingCounty')} 
                      fullWidth 
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          minHeight: 56,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main'
                          }
                        }
                      }}
                    />
              </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField 
                      label="Country" 
                      value={form.billingCountry} 
                      onChange={handleFieldChange('billingCountry')} 
                      fullWidth 
                      variant="outlined"
                      sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            minHeight: 56,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'primary.main'
                            }
                          }
                        }}
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
          Cancel
        </Button>
                <Button 
                  variant="contained" 
                  startIcon={<SaveRoundedIcon />}
                  onClick={handleSubmit}
                  disabled={!form.name.trim() || !form.email.trim()}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.brand.greenHover} 100%)`,
                      transform: 'translateY(-1px)',
                      boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`
                    },
                    '&:disabled': {
                      background: theme.palette.grey[300],
                      color: theme.palette.text.disabled
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
          Save user
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
    page: '0', // Always fetch from first page
    size: '10000', // Fetch a large number to get all contacts (7000+)
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

const Contacts = ({ userType = 'admin', refreshProfile, userProfile }) => {
  const theme = useTheme();
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
  const [dateFilters, setDateFilters] = useState({
    startDate: '',
    endDate: ''
  });
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
          page: 1, // Not used anymore since we fetch all
          search: debouncedSearch,
          status: statusFilter,
        email: emailFilter,
        userType: userTypeFilter
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

        console.log('DEBUG: Raw items from backend:', rawItems);
        console.log('DEBUG: Normalized contacts:', normalized);
        console.log('DEBUG: First contact avatar:', normalized[0]?.avatar);

        // Filter contacts based on user type
        let filteredContacts = normalized;
        if (userType === 'user') {
          // For users, they should only see their own contact
          // This will be handled by the backend API based on the user's tenantId
          // The backend should already filter to only return the user's own contact
          filteredContacts = normalized;
        }
        // For admins, show all contacts (no filtering needed)

        setContacts(filteredContacts);
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
  }, [debouncedSearch, statusFilter, emailFilter, userTypeFilter]);

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
        billingTaxId: normalizeString(updatedProfile.billing?.tax_id) ?? null
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
            tax_id: payload.billingTaxId ?? updatedProfile.billing?.tax_id ?? null
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
    setDateFilters({ startDate: '', endDate: '' });
    setPage(1);
  };

  const handleDateFilterChange = (field, value) => {
    setDateFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(1); // Reset to first page when filters change
  };

  const handleAddUser = async (values) => {
    try {
      const userData = {
        name: values.name,
        email: values.email,
        primaryContact: values.primaryContact,
        phone: values.phone,
        status: values.status || 'Potencial',
        userType: values.userType,
        center: values.center,
        channel: values.channel,
        billingCompany: values.billingCompany,
        billingEmail: values.billingEmail,
        billingAddress: values.billingAddress,
        billingPostalCode: values.billingPostalCode,
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

  // Client-side filtering for date range (since backend doesn't support date filtering yet)
  const filteredContacts = useMemo(() => {
    let filtered = contacts;
    
    // Filter by date range
    if (dateFilters.startDate) {
      const startDate = new Date(dateFilters.startDate);
      filtered = filtered.filter((contact) => {
        const contactDate = new Date(contact.createdAt || contact.lastActive || contact.updatedAt);
        return contactDate >= startDate;
      });
    }
    
    if (dateFilters.endDate) {
      const endDate = new Date(dateFilters.endDate);
      endDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter((contact) => {
        const contactDate = new Date(contact.createdAt || contact.lastActive || contact.updatedAt);
        return contactDate <= endDate;
      });
    }
    
    return filtered;
  }, [contacts, dateFilters]);

  // Pagination logic (client-side like MailboxAdmin)
  const totalPages = Math.ceil(filteredContacts.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = startIndex + PAGE_SIZE;
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex);
  
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
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        background: `linear-gradient(140deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[100]} 50%, ${theme.palette.background.paper} 100%)`
      }}
    >
      <Box sx={{ px: 4, pt: 4, pb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={3}>
          <Stack spacing={1}>
            <Typography variant="h5" fontWeight={700}>
              Contacts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track onboarding progress, ownership, and engagement health across every user.
            </Typography>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            {userType === 'admin' && (
              <Button
                variant="outlined"
                sx={{
                  minWidth: 120,
                  height: 36,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: 'secondary.main',
                  color: 'secondary.main',
                  '&:hover': {
                    borderColor: theme.palette.brand.orangeHover,
                    color: theme.palette.brand.orangeHover,
                    backgroundColor: alpha(theme.palette.brand.orange, 0.08),
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.brand.orange, 0.2)}`
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
                onClick={() => setAddDialogOpen(true)}
              >
                + NEW USER
              </Button>
            )}
            <Button 
              variant="contained"
              sx={{
                minWidth: 120,
                height: 36,
                textTransform: 'none',
                fontWeight: 600,
                backgroundColor: 'primary.main',
                color: 'common.white',
                '&:hover': {
                  backgroundColor: 'primary.dark'
                }
              }}
            >
              EXPORT CSV
            </Button>
          </Stack>
        </Stack>

        {/* Filters - Always visible like MailboxAdmin */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search by Name"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Search by Email"
                value={emailFilter === 'all' ? '' : emailFilter}
                onChange={(event) => setEmailFilter(event.target.value || 'all')}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailOutlinedIcon sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={dateFilters.startDate}
                onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={dateFilters.endDate}
                onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>User Type</InputLabel>
                <Select
                  value={userTypeFilter}
                  onChange={(event) => setUserTypeFilter(event.target.value)}
                  label="User Type"
                >
                  <MenuItem value="all">All user types</MenuItem>
                  {userTypeOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All statuses</MenuItem>
                  <MenuItem value="Activo">Activo</MenuItem>
                  <MenuItem value="Inactivo">Inactivo</MenuItem>
                  <MenuItem value="Potencial">Potencial</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleResetFilters}
            >
              Clear Filters
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
              Showing {filteredContacts.length} of {contacts.length} contacts
            </Typography>
          </Stack>
        </Paper>
      </Box>

      <Divider />

      <TableContainer sx={{ px: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell sx={{ pl: 4, fontWeight: 'bold' }}>User</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Type of user</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Last activity</TableCell>
              <TableCell align="right" sx={{ pr: 4, fontWeight: 'bold' }}>Actions</TableCell>
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
                          borderColor: (theme) => alpha(theme.palette.primary.light, 0.5)
                        }}
                      >
                        {initials.slice(0, 2)}
                      </Avatar>
                      <Box>
                        <Typography fontWeight={600}>{tenant.name}</Typography>
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
                          sx={{ color: 'secondary.main', '&:hover': { color: 'secondary.dark', bgcolor: (theme) => theme.palette.brand.orangeSoft } }}
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
            {filteredContacts.length === 0 ? '0 results' : `${startIndex + 1}-${Math.min(endIndex, filteredContacts.length)} of ${filteredContacts.length}`}
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
          background: (theme) => `linear-gradient(135deg, ${theme.palette.brand.orange} 0%, ${theme.palette.brand.orangeHover} 100%)`,
          color: 'common.white',
          borderRadius: '12px 12px 0 0',
          p: 3
        }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: alpha(theme.palette.common.white, 0.2), width: 40, height: 40 }}>
              <WarningRoundedIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Delete User
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                This action cannot be undone
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Stack spacing={3}>
            <Typography variant="body1" color="text.primary">
              Are you sure you want to delete <strong>{userToDelete?.name}</strong>?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This will permanently remove the user and all associated data from the system.
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
            Cancel
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
              background: (theme) => `linear-gradient(135deg, ${theme.palette.brand.orange} 0%, ${theme.palette.brand.orangeHover} 100%)`,
              '&:hover': {
                background: (theme) => `linear-gradient(135deg, ${theme.palette.brand.orangeHover} 0%, ${theme.palette.secondary.dark} 100%)`,
                transform: 'translateY(-1px)',
                boxShadow: `0 8px 25px ${alpha(theme.palette.brand.orange, 0.3)}`
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Delete User
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default Contacts;
