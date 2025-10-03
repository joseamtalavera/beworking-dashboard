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

import ContactProfileView from './ContactProfileView';

const STATUS_COLOR = {
  Active: { color: 'success', label: 'Active' },
  Trial: { color: 'warning', label: 'Trial' },
  Suspended: { color: 'error', label: 'Suspended' },
  Inactive: { color: 'default', label: 'Inactive' }
};

const PLAN_FALLBACK = 'Custom';
const PAGE_SIZE = 25;
const DEFAULT_STATUSES = ['Active', 'Trial', 'Suspended', 'Inactive'];
const ADD_USER_STATUS_OPTIONS = [
  { value: 'Active', label: 'Activo' },
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
    name: entry.name ?? '—',
    plan: entry.plan ?? PLAN_FALLBACK,
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
      name: contact.name ?? '—',
      email: contact.email ?? '—'
    },
    billing: {
      company: billing.company ?? entry.name ?? '—',
      email: billing.email ?? contact.email ?? '—',
      address: billing.address ?? null,
      postal_code: billing.postal_code ?? null,
      county: billing.county ?? null,
      country: billing.country ?? null,
      tax_id: billing.tax_id ?? null
    }
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
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1.5 }}>Add new user</DialogTitle>
      <DialogContent
        dividers
        sx={{ bgcolor: '#f8fafc', px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}
      >
        <Stack spacing={3}>
          <Box
            sx={{ borderRadius: 3, border: '1px solid #d1fae5', bgcolor: '#ecfdf5', p: { xs: 2.5, md: 3 } }}
          >
            <Typography variant="subtitle2" fontWeight={700} color="#047857" sx={{ mb: 2 }}>
              Basic data
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField label="User / Company name" value={form.name} onChange={handleFieldChange('name')} fullWidth required />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Primary contact" value={form.primaryContact} onChange={handleFieldChange('primaryContact')} fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Email" type="email" value={form.email} onChange={handleFieldChange('email')} fullWidth required />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Phone" value={form.phone} onChange={handleFieldChange('phone')} fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Status"
                  value={form.status}
                  onChange={handleFieldChange('status')}
                  fullWidth
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="User type"
                  value={form.userType}
                  onChange={handleFieldChange('userType')}
                  fullWidth
                >
                  {USER_TYPE_OPTIONS.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Center"
                  value={form.center}
                  onChange={handleFieldChange('center')}
                  fullWidth
                >
                  {CENTER_OPTIONS.map((center) => (
                    <MenuItem key={center} value={center}>
                      {center}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="Seats" value={form.seats} onChange={handleFieldChange('seats')} type="number" inputProps={{ min: 0 }} fullWidth />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField label="Channel" value={form.channel} onChange={handleFieldChange('channel')} fullWidth />
              </Grid>
            </Grid>
          </Box>

          <Box
            sx={{ borderRadius: 3, border: '1px solid #fed7aa', bgcolor: '#fff7ed', p: { xs: 2.5, md: 3 } }}
          >
            <Typography variant="subtitle2" fontWeight={700} color="#c2410c" sx={{ mb: 2 }}>
              Billing data
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField label="Billing company" value={form.billingCompany} onChange={handleFieldChange('billingCompany')} fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField label="Billing email" value={form.billingEmail} onChange={handleFieldChange('billingEmail')} fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Billing address"
                  value={form.billingAddress}
                  onChange={handleFieldChange('billingAddress')}
                  fullWidth
                  multiline
                  minRows={2}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Postal code" value={form.billingPostalCode} onChange={handleFieldChange('billingPostalCode')} fullWidth />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="County" value={form.billingCounty} onChange={handleFieldChange('billingCounty')} fullWidth />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Country" value={form.billingCountry} onChange={handleFieldChange('billingCountry')} fullWidth />
              </Grid>
            </Grid>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!form.name.trim() || !form.email.trim()}>
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

const buildQueryString = ({ page, search, status, plan }) => {
  const params = new URLSearchParams({
    page: String(page),
    size: String(PAGE_SIZE)
  });

  if (search) {
    params.append('search', search);
  }
  if (status && status !== 'all') {
    params.append('status', status);
  }
  if (plan && plan !== 'all') {
    params.append('plan', plan);
  }

  return params.toString();
};

const Contacts = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
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
  const [planOptions, setPlanOptions] = useState([]);
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
    if (planFilter !== 'all' && !planOptions.includes(planFilter)) {
      setPlanOptions((prev) => {
        if (prev.includes(planFilter)) {
          return prev;
        }
        return [...prev, planFilter].sort((a, b) => a.localeCompare(b));
      });
    }
  }, [planFilter, planOptions]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, statusFilter, planFilter]);

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
          plan: planFilter
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
          : Array.isArray(data)
            ? data
            : [];
        const normalized = rawItems.map((entry) => normalizeContact(entry));

        setContacts(normalized);
        setTotal(Number.isFinite(data?.totalElements) ? data.totalElements : normalized.length);

        setStatusOptions((prev) => {
          const next = new Set(prev);
          normalized.forEach((tenant) => {
            if (tenant.status && tenant.status !== 'Unknown') {
              next.add(tenant.status);
            }
          });
          return Array.from(next).sort((a, b) => a.localeCompare(b));
        });

        setPlanOptions((prev) => {
          const next = new Set(prev);
          normalized.forEach((tenant) => {
            if (tenant.plan && tenant.plan !== PLAN_FALLBACK) {
              next.add(tenant.plan);
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
  }, [page, debouncedSearch, statusFilter, planFilter]);

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

  const handleAddUser = (values) => {
    const now = new Date();
    const seatsValue = values.seats ? Number.parseInt(values.seats, 10) : 0;
    const planValue = PLAN_FALLBACK;
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
                bgcolor: '#16a34a',
                '&:hover': { bgcolor: '#15803d' }
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
            {statusOptions.map((status) => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
          <Select
            size="small"
            value={planFilter}
            onChange={(event) => setPlanFilter(event.target.value)}
            sx={{ borderRadius: 2, bgcolor: 'white', minWidth: 140 }}
          >
            <MenuItem value="all">All plans</MenuItem>
            {planOptions.map((plan) => (
              <MenuItem key={plan} value={plan}>
                {plan}
              </MenuItem>
            ))}
          </Select>
        </Stack>
      </Box>

      <Divider />

      <TableContainer sx={{ px: 1 }}>
        <Table size="small" sx={{ '& th': { fontWeight: 600, color: 'text.secondary' } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 4 }}>Tenant</TableCell>
              <TableCell>Primary contact</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell align="center">Seats</TableCell>
              <TableCell align="center">Adoption</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Last activity</TableCell>
              <TableCell align="right" sx={{ pr: 4 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
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
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No contacts match your filters.
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {!loading && !error && contacts.map((tenant) => {
              const statusMeta = STATUS_COLOR[tenant.status] || { color: 'default', label: tenant.status };
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
                      <Avatar sx={{ bgcolor: '#1d4ed8' }}>{initials.slice(0, 2)}</Avatar>
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
                    <Typography fontWeight={600}>{tenant.contact.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={tenant.plan} color="primary" size="small" variant="outlined" sx={{ borderRadius: 1.5 }} />
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontWeight={600}>{tenant.seats}</Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: 160 }}>
                    <Stack spacing={0.5} alignItems="center">
                      <Typography variant="caption" color="text.secondary">
                        {(tenant.usage * 100).toFixed(0)}% active users
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={tenant.usage * 100}
                        sx={{ width: '100%', height: 6, borderRadius: 999, backgroundColor: '#e2e8f0' }}
                      />
                    </Stack>
                  </TableCell>
                  <TableCell align="center">
                    <Chip label={statusMeta.label} color={statusMeta.color} size="small" sx={{ borderRadius: 1.5, fontWeight: 600 }} />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight={500} color="text.secondary">
                      {tenant.lastActive}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ pr: 4 }}>
                    <Tooltip title="Copy tenant ID">
                      <IconButton
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                            navigator.clipboard.writeText(tenant.id);
                          }
                        }}
                      >
                        <ContentCopyRoundedIcon fontSize="inherit" />
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
