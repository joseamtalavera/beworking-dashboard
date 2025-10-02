import { useMemo, useState } from 'react';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
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
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';

const STATUS_COLOR = {
  Active: { color: 'success', label: 'Active' },
  Trial: { color: 'warning', label: 'Trial' },
  Suspended: { color: 'error', label: 'Suspended' }
};

const SAMPLE_CONTACTS = [
  {
    id: 'tenant-120',
    name: 'Glow Agency',
    contact: { name: 'María Ortiz', email: 'maria@glow.agency' },
    plan: 'Scale',
    status: 'Active',
    seats: 45,
    usage: 0.82,
    lastActive: '2h ago'
  },
  {
    id: 'tenant-118',
    name: 'Cloud Ops',
    contact: { name: 'Noah Reeves', email: 'ops@cloudops.io' },
    plan: 'Starter',
    status: 'Trial',
    seats: 18,
    usage: 0.38,
    lastActive: 'Yesterday'
  },
  {
    id: 'tenant-110',
    name: 'Studio K',
    contact: { name: 'Kira Daniels', email: 'hello@studiok.io' },
    plan: 'Scale',
    status: 'Active',
    seats: 32,
    usage: 0.94,
    lastActive: '13m ago'
  },
  {
    id: 'tenant-098',
    name: 'Northwind Labs',
    contact: { name: 'Arjun Patel', email: 'arjun@northwindlabs.com' },
    plan: 'Growth',
    status: 'Suspended',
    seats: 21,
    usage: 0.12,
    lastActive: '5 days ago'
  }
];

const Contacts = () => {
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredContacts = useMemo(() => {
    const term = search.trim().toLowerCase();

    return SAMPLE_CONTACTS.filter((tenant) => {
      const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
      const matchesPlan = planFilter === 'all' || tenant.plan === planFilter;
      const matchesSearch =
        term.length === 0 ||
        tenant.name.toLowerCase().includes(term) ||
        tenant.contact.email.toLowerCase().includes(term) ||
        tenant.id.toLowerCase().includes(term);

      return matchesStatus && matchesPlan && matchesSearch;
    });
  }, [statusFilter, planFilter, search]);

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
              Tenant contacts
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track onboarding progress, ownership, and engagement health across every tenant.
            </Typography>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Button
              startIcon={<AddRoundedIcon />}
              variant="contained"
              sx={{
                minWidth: 170,
                borderRadius: 2,
                bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' }
              }}
            >
              Invite new tenant
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
            placeholder="Search tenant or contact"
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
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Trial">Trial</MenuItem>
            <MenuItem value="Suspended">Suspended</MenuItem>
          </Select>
          <Select
            size="small"
            value={planFilter}
            onChange={(event) => setPlanFilter(event.target.value)}
            sx={{ borderRadius: 2, bgcolor: 'white', minWidth: 140 }}
          >
            <MenuItem value="all">All plans</MenuItem>
            <MenuItem value="Starter">Starter</MenuItem>
            <MenuItem value="Growth">Growth</MenuItem>
            <MenuItem value="Scale">Scale</MenuItem>
          </Select>
        </Stack>
      </Box>

      <Divider />

      <TableContainer sx={{ px: 1, pb: 3 }}>
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
          {filteredContacts.map((tenant) => {
            const statusMeta = STATUS_COLOR[tenant.status] || { color: 'default', label: tenant.status };
            const initials = tenant.name
              .split(' ')
              .map((word) => word[0])
              .join('')
              .toUpperCase();

            return (
              <TableRow key={tenant.id} hover sx={{ '& td': { borderBottomColor: '#eef2f6' } }}>
                <TableCell sx={{ pl: 4 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: '#1d4ed8' }}>{initials.slice(0, 2)}</Avatar>
                    <Box>
                      <Typography fontWeight={600}>{tenant.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {tenant.id}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography fontWeight={600}>{tenant.contact.name}</Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                      <MailOutlinedIcon fontSize="inherit" />
                      <Typography variant="caption">{tenant.contact.email}</Typography>
                    </Stack>
                  </Stack>
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
                  <Chip
                    label={statusMeta.label}
                    color={statusMeta.color}
                    size="small"
                    sx={{ borderRadius: 1.5, fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" fontWeight={500} color="text.secondary">
                    {tenant.lastActive}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ pr: 4 }}>
                  <Tooltip title="Copy tenant ID">
                    <IconButton size="small">
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
  </Paper>
  );
};

export default Contacts;
