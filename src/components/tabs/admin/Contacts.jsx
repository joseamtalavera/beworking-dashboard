import { useEffect, useMemo, useState } from 'react';

import PropTypes from 'prop-types';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
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
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import ContactProfileView from './ContactProfileView';

const STATUS_COLOR = {
  Activo: { color: 'success', label: 'Activo' },
  Convertido: { color: 'success', label: 'Convertido' },
  Inactivo: { color: 'error', label: 'Inactivo' },
  Potencial: { color: 'warning', label: 'Potencial' },
  Trial: { color: 'warning', label: 'Trial' },
  Suspended: { color: 'error', label: 'Suspended' },
  Inactive: { color: 'default', label: 'Inactive' }
};

// Activity status based on bookings and invoices
const ACTIVITY_STATUS = {
  Activo: { color: 'success', label: 'Active', variant: 'outlined' },
  Inactivo: { color: 'error', label: 'Inactive', variant: 'outlined' },
  Potencial: { color: 'default', label: 'Potencial', variant: 'outlined' }
};

const PAGE_SIZE = 25;
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
  status: 'Active',
  userType: 'Usuario Mesa',
  center: 'MA1 MALAGA DUMAS',
  seats: '',
  channel: '',
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
  const fallbackContactName = contact.name
    ?? entry.primary_contact
    ?? ([entry.representative_first_name, entry.representative_last_name].filter(Boolean).join(' ') || null);
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

  return {
    ...entry,
    id: entry.id != null ? String(entry.id) : Math.random().toString(36).slice(2),
    name: entry.name ?? entry.billing_name ?? '—',
    plan: entry.plan ?? 'Custom',
    center: entry.center != null ? String(entry.center) : null,
    user_type: entry.user_type ?? '—',
    status: entry.status ?? 'Unknown',
    seats: seatsValue,
    usage: usageValue,
    lastActive: entry.lastActive ?? '—',
    channel: entry.channel ?? '—',
    created_at: entry.created_at ?? null,
    phone_primary: entry.phone_primary ?? null,
    contact: {
      name: fallbackContactName ?? '—',
      email: fallbackContactEmail ?? '—'
    },
    billing: fallbackBilling
  };
};

const AddUserDialog = ({ open, onClose, onSave, existingStatuses }) => {
  const [form, setForm] = useState(ADD_USER_DEFAULT);

  useEffect(() => {
    if (open) {
      setForm(ADD_USER_DEFAULT);
    }
  }, [open]);

  const statusOptions = useMemo(() => {
    const existing = new Set(existingStatuses ?? []);
    ADD_USER_STATUS_OPTIONS.forEach((item) => existing.add(item.value));
    return Array.from(existing)
      .map((status) => {
        const match = ADD_USER_STATUS_OPTIONS.find((item) => item.value === status);
        return { value: status, label: match ? match.label : status };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [existingStatuses]);

  const CENTER_OPTIONS = ['MA1 MALAGA DUMAS'];

  const USER_TYPE_OPTIONS = [
    'Usuario Mesa',
    'Usuario Aulas',
    'Usuario Virtual',
    'Usuario Nómada',
    'Distribuidor',
    'Proveedor',
    'Servicios'
  ];

  const handleFieldChange = (field) => (event) => {
    const { value } = event.target;
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.email.trim()) {
      return;
    }
    onSave?.(form);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 0,
        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
        color: 'white',
        borderRadius: '12px 12px 0 0',
        p: 3
      }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
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
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                background: 'white'
              }}
            >
              <Box sx={{ 
                p: 3, 
                background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: '#f97316', width: 36, height: 36 }}>
                    <PersonRoundedIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight={600} color="text.primary">
                    Basic Information
                  </Typography>
                </Stack>
              </Box>
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField 
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
                            borderColor: '#f97316'
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
                            borderColor: '#f97316'
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
                            borderColor: '#f97316'
                          }
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
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
                            borderColor: '#f97316'
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
                            borderColor: '#f97316'
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
                            borderColor: '#f97316'
                          }
                        }
                      }}
                    >
                      {USER_TYPE_OPTIONS.map((type) => (
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
                            borderColor: '#f97316'
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
                    <TextField 
                      label="Seats" 
                      value={form.seats} 
                      onChange={handleFieldChange('seats')} 
                      type="number" 
                      inputProps={{ min: 0 }} 
                      fullWidth 
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          minHeight: 56,
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#f97316'
                          }
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Paper>

            {/* Billing Information Section */}
            <Paper 
              elevation={0}
              sx={{ 
                borderRadius: 3, 
                border: '1px solid #e2e8f0',
                overflow: 'hidden',
                background: 'white'
              }}
            >
              <Box sx={{ 
                p: 3, 
                background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar sx={{ bgcolor: '#ea580c', width: 36, height: 36 }}>
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
                            borderColor: '#ea580c'
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
                            borderColor: '#ea580c'
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
                            borderColor: '#ea580c'
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
                            borderColor: '#ea580c'
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
                            borderColor: '#ea580c'
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
                            borderColor: '#ea580c'
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
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
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
            borderColor: '#e2e8f0',
            '&:hover': {
              borderColor: '#cbd5e1',
              backgroundColor: '#f8fafc'
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
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
              transform: 'translateY(-1px)',
              boxShadow: '0 8px 25px rgba(249, 115, 22, 0.3)'
            },
            '&:disabled': {
              background: '#d1d5db',
              color: '#9ca3af'
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
    page: String(page),
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

const Contacts = () => {
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
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [statusOptions, setStatusOptions] = useState([]);
  const [emailOptions, setEmailOptions] = useState([]);
  const [userTypeOptions, setUserTypeOptions] = useState([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

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
    setPage(0);
  }, [debouncedSearch, statusFilter, emailFilter, userTypeFilter]);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const fetchContacts = async () => {
      setLoading(true);
      setError(null);

      try {
        const query = buildQueryString({
          page,
          search: debouncedSearch,
          status: statusFilter,
          email: emailFilter,
          userType: userTypeFilter
        });
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/contact-profiles?${query}`, {
          signal: controller.signal
        });
        if (!response.ok) {
          throw new Error('Failed to fetch contact profiles');
        }
        const data = await response.json();
        if (!active) {
          return;
        }

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


        setUserTypeOptions((prev) => {
          const next = new Set(prev);
          normalized.forEach((tenant) => {
            if (tenant.user_type && tenant.user_type !== '—') {
              next.add(tenant.user_type);
            }
          });
          return Array.from(next).sort((a, b) => a.localeCompare(b));
        });
      } catch (fetchError) {
        if (!active || fetchError.name === 'AbortError') {
          return;
        }
        setError(fetchError.message || 'Unable to load contacts');
        setContacts([]);
        setTotal(0);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchContacts();

    return () => {
      active = false;
      controller.abort();
    };
  }, [page, debouncedSearch, statusFilter, emailFilter, userTypeFilter]);

  const handleRowClick = (tenant) => {
    setSelectedContact(tenant);
    setViewMode('profile');
  };

  const handleSaveProfile = (updatedProfile) => {
    if (!updatedProfile?.id) {
      return;
    }

    setContacts((prev) =>
      prev.map((tenant) =>
        tenant.id === String(updatedProfile.id)
          ? normalizeContact({ ...tenant, ...updatedProfile })
          : tenant
      )
    );

    setSelectedContact((prev) => {
      if (!prev || prev.id !== String(updatedProfile.id)) {
        return prev;
      }
      return normalizeContact({ ...prev, ...updatedProfile });
    });
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setEmailFilter('all');
    setUserTypeFilter('all');
    setPage(0);
  };

  const handleAddUser = (values) => {
    const now = new Date();
    const seatsValue = values.seats ? Number.parseInt(values.seats, 10) : 0;
    const planValue = 'Custom';
    const statusValue = values.status || 'Active';

    const entry = {
      id: `tmp-${now.getTime()}`,
      name: values.name || 'New user',
      contact: {
        name: values.primaryContact || values.name || '—',
        email: values.email
      },
      plan: planValue,
      user_type: values.userType || '—',
      center: values.center || null,
      status: statusValue,
      seats: Number.isFinite(seatsValue) ? seatsValue : 0,
      usage: 0,
      lastActive: 'Just now',
      channel: values.channel || 'Manual',
      created_at: now.toISOString(),
      phone_primary: values.phone || '',
      billing: {
        company: values.billingCompany || values.name || '—',
        email: values.billingEmail || values.email,
        address: values.billingAddress || '',
        postal_code: values.billingPostalCode || '',
        county: values.billingCounty || '',
        country: values.billingCountry || '',
        tax_id: ''
      }
    };

    const normalized = normalizeContact(entry);

    setContacts((prev) => {
      const updated = [normalized, ...prev];
      return updated.slice(0, PAGE_SIZE);
    });

    setTotal((prev) => prev + 1);

    if (normalized.status && normalized.status !== 'Unknown') {
      setStatusOptions((prev) => (prev.includes(normalized.status) ? prev : [...prev, normalized.status].sort((a, b) => a.localeCompare(b))));
    }

    setAddDialogOpen(false);
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
      />
    );
  }

  const rangeStart = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(rangeStart + contacts.length - 1, total);
  const hasPreviousPage = page > 0;
  const hasNextPage = rangeEnd < total;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 4,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(140deg, #f8fafc 0%, #f1f5f9 50%, #ffffff 100%)'
      }}
    >
      <Box sx={{ px: 4, pt: 4, pb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={3}>
          <Stack spacing={1}>
            <Typography variant="h5" fontWeight={700}>
              User contacts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track onboarding progress, ownership, and engagement health across every user.
            </Typography>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Button
              startIcon={<AddRoundedIcon />}
              variant="contained"
              sx={{
                minWidth: 170,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                py: 1,
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 8px 25px rgba(249, 115, 22, 0.3)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
              onClick={() => setAddDialogOpen(true)}
            >
              Add new user
            </Button>
            <Button variant="outlined" color="inherit" sx={{ borderRadius: 2 }}>
              Export CSV
            </Button>
          </Stack>
        </Stack>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 3 }}>
          <OutlinedInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search user or contact"
            startAdornment={
              <InputAdornment position="start">
                <SearchRoundedIcon fontSize="small" />
              </InputAdornment>
            }
            sx={{ maxWidth: 320, borderRadius: 2, bgcolor: 'white' }}
          />
          <Select
            size="small"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            sx={{ borderRadius: 2, bgcolor: 'white', minWidth: 140 }}
          >
            <MenuItem value="all">All statuses</MenuItem>
            <MenuItem value="Activo">Activo</MenuItem>
            <MenuItem value="Inactivo">Inactivo</MenuItem>
            <MenuItem value="Potencial">Potencial</MenuItem>
          </Select>
          <OutlinedInput
            size="small"
            value={emailFilter === 'all' ? '' : emailFilter}
            onChange={(event) => setEmailFilter(event.target.value || 'all')}
            placeholder="Search by email"
            startAdornment={
              <InputAdornment position="start">
                <MailOutlinedIcon fontSize="small" />
              </InputAdornment>
            }
            sx={{ borderRadius: 2, bgcolor: 'white', minWidth: 200 }}
          />
          <Select
            size="small"
            value={userTypeFilter}
            onChange={(event) => setUserTypeFilter(event.target.value)}
            sx={{ borderRadius: 2, bgcolor: 'white', minWidth: 140 }}
          >
            <MenuItem value="all">All user types</MenuItem>
            <MenuItem value="Usuario Aulas">Usuario Aulas</MenuItem>
            <MenuItem value="Usuario Virtual">Usuario Virtual</MenuItem>
            <MenuItem value="Usuario Mesa">Usuario Mesa</MenuItem>
            <MenuItem value="Usuario Nómada">Usuario Nómada</MenuItem>
            <MenuItem value="Servicios">Servicios</MenuItem>
            <MenuItem value="Proveedor">Proveedor</MenuItem>
            <MenuItem value="Distribuidor">Distribuidor</MenuItem>
          </Select>
          <Stack 
            direction="row" 
            alignItems="center" 
            spacing={0.5}
            onClick={handleResetFilters}
            sx={{ 
              cursor: 'pointer',
              color: 'text.secondary',
              '&:hover': {
                color: 'primary.main'
              }
            }}
          >
            <RefreshRoundedIcon fontSize="small" />
            <Typography variant="body2" fontWeight={500}>
              Reset
            </Typography>
          </Stack>
        </Stack>
      </Box>

      <Divider />

      <TableContainer sx={{ px: 1 }}>
        <Table size="small" sx={{ '& th': { fontWeight: 600, color: 'text.secondary' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 4 }}>User</TableCell>
              <TableCell>Type of user</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Last activity</TableCell>
              <TableCell align="right" sx={{ pr: 4 }}>Actions</TableCell>
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
                  <Typography variant="body2" color="error">
                    {error}
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {!loading && !error && contacts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No contacts match your filters.
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {!loading && !error && contacts.map((tenant) => {
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
                  sx={{ '& td': { borderBottomColor: '#eef2f6' }, cursor: 'pointer' }}
                  onClick={() => handleRowClick(tenant)}
                >
                  <TableCell sx={{ pl: 4 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar sx={{ bgcolor: '#f97316' }}>{initials.slice(0, 2)}</Avatar>
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
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ px: 4, py: 2, borderTop: '1px solid #eef2f6', bgcolor: 'rgba(248,250,252,0.6)' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            {total === 0 ? '0 results' : `${rangeStart}-${rangeEnd} of ${total}`}
          </Typography>
          <Stack direction="row" spacing={1}>
            <IconButton
              size="small"
              onClick={() => hasPreviousPage && !loading && setPage((prev) => Math.max(prev - 1, 0))}
              disabled={!hasPreviousPage || loading}
            >
              <ChevronLeftRoundedIcon />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => hasNextPage && !loading && setPage((prev) => prev + 1)}
              disabled={!hasNextPage || loading || total === 0}
            >
              <ChevronRightRoundedIcon />
            </IconButton>
          </Stack>
        </Stack>
      </Box>

      <AddUserDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onSave={handleAddUser}
        existingStatuses={statusOptions}
      />
    </Paper>
  );
};

export default Contacts;
