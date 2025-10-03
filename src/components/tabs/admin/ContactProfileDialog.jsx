import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';

import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

const TABS = [
  { value: 'overview', label: 'Data' },
  { value: 'storage', label: 'Storage' },
  { value: 'bookings', label: 'Bookings' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'communications', label: 'Communications' }
];

const ContactProfileDialog = ({ open, onClose, contact, onSave }) => {
  const [tab, setTab] = useState('overview');
  const [draft, setDraft] = useState(contact);

  useEffect(() => {
    setDraft(contact);
    setTab('overview');
  }, [contact, open]);

  const initials = useMemo(() => {
    if (!draft?.name) return '–';
    return draft.name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }, [draft?.name]);

  if (!contact || !draft) {
    return null;
  }

  const handleDraftChange = (field) => (event) => {
    setDraft((prev) => ({
      ...prev,
      [field]: event.target.value
    }));
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

  const handleSave = () => {
    if (onSave) {
      onSave(draft);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Tenant profile</DialogTitle>
      <DialogContent dividers sx={{ bgcolor: '#f8fafc' }}>
        <Stack spacing={3}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
            <Avatar sx={{ width: 72, height: 72, bgcolor: '#1d4ed8', fontSize: 32 }}>{initials.slice(0, 2)}</Avatar>
            <Box>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="h5" fontWeight={700}>
                  {draft.name}
                </Typography>
                <Chip label={draft.status} color="success" sx={{ borderRadius: 2 }} />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {draft.contact?.email}
              </Typography>
            </Box>
          </Stack>

          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            variant="scrollable"
            allowScrollButtonsMobile
            sx={{ pt: 1 }}
          >
            {TABS.map((item) => (
              <Tab key={item.value} value={item.value} label={item.label} />
            ))}
          </Tabs>

          {tab === 'overview' && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <ProfileCard title="Basic details">
                  <Stack spacing={2}>
                    <TextField label="Tenant ID" value={draft.id} disabled size="small" />
                    <TextField label="Tenant name" value={draft.name} onChange={handleDraftChange('name')} size="small" />
                    <TextField
                      label="Primary contact"
                      value={draft.contact?.name || ''}
                      onChange={handleContactChange('name')}
                      size="small"
                    />
                    <TextField
                      label="Email"
                      value={draft.contact?.email || ''}
                      onChange={handleContactChange('email')}
                      size="small"
                    />
                    <TextField
                      label="Phone"
                      value={draft.phone_primary || ''}
                      onChange={handleDraftChange('phone_primary')}
                      size="small"
                    />
                    <TextField
                      label="Plan"
                      value={draft.plan}
                      onChange={handleDraftChange('plan')}
                      size="small"
                    />
                    <TextField
                      label="User type"
                      value={draft.user_type || ''}
                      onChange={handleDraftChange('user_type')}
                      size="small"
                    />
                    <TextField
                      label="Status"
                      value={draft.status || ''}
                      onChange={handleDraftChange('status')}
                      size="small"
                    />
                    <QuotaBar value={draft.usage} />
                  </Stack>
                </ProfileCard>
              </Grid>

              <Grid item xs={12} md={8}>
                <ProfileCard title="Recent activity">
                  <Stack spacing={2}>
                    <ActivityRow label="Created" value={draft.created_at} />
                    <ActivityRow label="Last invoice" value="Oct 3, 2025 04:15 PM" />
                    <ActivityRow label="Channel" value={draft.channel} />
                  </Stack>
                </ProfileCard>
              </Grid>
            </Grid>
          )}

          {tab === 'storage' && (
            <PlaceholderPanel title="Storage" description="File storage usage across shared drives." />
          )}
          {tab === 'bookings' && (
            <PlaceholderPanel title="Bookings" description="Upcoming and past bookings." />
          )}
          {tab === 'invoices' && (
            <PlaceholderPanel title="Invoices" description="Recent invoices and payment status." />
          )}
          {tab === 'communications' && (
            <PlaceholderPanel title="Communications" description="Email and message history." />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onClose}>
          Close
        </Button>
        <Button variant="contained" onClick={handleSave}>
          Save changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ContactProfileDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onSave: PropTypes.func,
  contact: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    contact: PropTypes.shape({
      name: PropTypes.string,
      email: PropTypes.string
    }),
    phone_primary: PropTypes.string,
    plan: PropTypes.string,
    user_type: PropTypes.string,
    status: PropTypes.string,
    usage: PropTypes.number,
    created_at: PropTypes.string,
    channel: PropTypes.string,
    billing: PropTypes.shape({
      company: PropTypes.string,
      email: PropTypes.string,
      address: PropTypes.string,
      postal_code: PropTypes.string,
      county: PropTypes.string,
      country: PropTypes.string,
      tax_id: PropTypes.string
    }),
    center: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  })
};

const ProfileCard = ({ title, children }) => (
  <Box
    sx={{
      borderRadius: 3,
      bgcolor: '#fff',
      border: '1px solid #e2e8f0',
      p: 3,
      height: '100%'
    }}
  >
    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
      {title}
    </Typography>
    {children}
  </Box>
);

ProfileCard.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node
};

const ActivityRow = ({ label, value }) => (
  <Stack direction="row" justifyContent="space-between" alignItems="center">
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={600}>
      {value || '—'}
    </Typography>
  </Stack>
);

ActivityRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string
};

const QuotaBar = ({ value }) => (
  <Stack spacing={0.5}>
    <Typography variant="caption" color="text.secondary">
      Usage
    </Typography>
    <LinearProgress
      variant="determinate"
      value={(value || 0) * 100}
      sx={{ height: 6, borderRadius: 999, bgcolor: '#e2e8f0' }}
    />
    <Typography variant="caption" color="text.secondary">
      {((value || 0) * 100).toFixed(0)}%
    </Typography>
  </Stack>
);

QuotaBar.propTypes = {
  value: PropTypes.number
};

const PlaceholderPanel = ({ title, description }) => (
  <Box
    sx={{
      borderRadius: 3,
      bgcolor: '#fff',
      border: '1px dashed #cbd5f0',
      p: 4,
      textAlign: 'center'
    }}
  >
    <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {description}
    </Typography>
  </Box>
);

PlaceholderPanel.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired
};

export default ContactProfileDialog;
