import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';

import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import CloudDoneRoundedIcon from '@mui/icons-material/CloudDoneRounded';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

const ContactProfileView = ({ contact, onBack, onSave }) => {
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(contact);

  useEffect(() => {
    setDraft(contact);
  }, [contact]);

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
    setEditorOpen(false);
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
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={onBack}>
          Back to contacts
        </Button>
        <Button variant="contained" onClick={() => setEditorOpen(true)}>
          Edit profile
        </Button>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 4,
          border: '1px solid #e2e8f0',
          p: { xs: 3, md: 4 },
          background: 'linear-gradient(120deg, #f8fafc 0%, #eef2ff 50%, #ffffff 100%)'
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center" justifyContent="space-between">
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center">
            <Avatar sx={{ width: 90, height: 90, fontSize: 36, bgcolor: '#1d4ed8' }}>{initials.slice(0, 2)}</Avatar>
            <Box>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="h4" fontWeight={700}>
                  {contact.name}
                </Typography>
                <Chip label={statusLabel} color={statusColor} sx={{ borderRadius: 2 }} />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {contact.contact?.email || '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Joined {joinedLabel}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={2}>
            <MetricCard title="Plan" value={contact.plan || '—'} />
            <MetricCard title="Seats" value={Number.isFinite(contact.seats) ? contact.seats : '—'} />
            <MetricCard
              title="Adoption"
              value={`${Number.isFinite(contact.usage) ? (contact.usage * 100).toFixed(0) : 0}%`}
            />
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
          <InfoCard title="Highlights">
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
              <HighlightCard label="Annual contract" value="$28,400" trend="+12% YoY" />
              <HighlightCard label="Satisfaction" value="4.7/5" trend="CSAT" />
              <HighlightCard label="Last invoice" value="Oct 03 2025" trend="INV-005" />
              <HighlightCard label="Channel" value={contact.channel} trend="Lead source" />
            </Box>
          </InfoCard>
        </Box>

        <Box sx={{ gridColumn: { xs: '1 / -1', lg: '1 / 7' }, display: 'flex', alignItems: 'stretch', flex: 1 }}>
          <InfoCard title="Basic data" icon={PersonOutlineRoundedIcon}>
            <Stack spacing={2} sx={{ width: '100%' }}>
              <InfoRow label="Tenant ID" value={contact.id} pill />
              <InfoRow label="Primary contact" value={contact.contact?.name} />
              <InfoRow label="Email" value={contact.contact?.email} />
              <InfoRow label="Phone" value={contact.phone_primary} />
              <InfoRow label="Type of user" value={contact.user_type} />
              <InfoRow label="Status" value={contact.status} />
              <InfoRow label="Center" value={contact.center} />
            </Stack>
          </InfoCard>
        </Box>

        <Box sx={{ gridColumn: { xs: '1 / -1', lg: '7 / -1' }, display: 'flex', alignItems: 'stretch', flex: 1 }}>
          <SectionCard icon={CreditCardRoundedIcon} title="Billing details">
            <SectionList
              description="Primary billing profile"
              items={[
                { label: 'Company', value: contact.billing?.company || contact.name },
                { label: 'Billing email', value: contact.billing?.email || contact.contact?.email },
                { label: 'Address', value: contact.billing?.address || '—' },
                { label: 'Post code', value: contact.billing?.postal_code || '—' },
                { label: 'County', value: contact.billing?.county || '—' },
                { label: 'Country', value: contact.billing?.country || '—' },
                { label: 'Tax ID', value: contact.billing?.tax_id || '—' }
              ]}
            />
          </SectionCard>
        </Box>

        <Box sx={{ gridColumn: { xs: '1 / -1', lg: '1 / 7' }, display: 'flex', alignItems: 'stretch', flex: 1 }}>
          <SectionCard icon={EventAvailableRoundedIcon} title="Bookings">
            <SectionList
              description="Upcoming reservations for meeting rooms and desks"
              items={[
                { label: 'Next booking', value: 'Boardroom · Oct 12, 10:00' },
                { label: 'Past month', value: '14 reservations' },
                { label: 'No-shows', value: '1 (30 days)' }
              ]}
            />
          </SectionCard>
        </Box>

        <Box sx={{ gridColumn: { xs: '1 / -1', lg: '7 / -1' }, display: 'flex', alignItems: 'stretch', flex: 1 }}>
          <SectionCard icon={DescriptionRoundedIcon} title="Invoices">
            <SectionList
              description="Recent billing and payments overview"
              items={[
                { label: 'Outstanding', value: '$0.00' },
                { label: 'Total billed YTD', value: '$24,890' },
                { label: 'Last payment', value: 'Oct 03 · $500.00 (card)' }
              ]}
            />
          </SectionCard>
        </Box>

        <Box sx={{ gridColumn: { xs: '1 / -1', lg: '1 / 7' }, display: 'flex', alignItems: 'stretch', flex: 1 }}>
          <SectionCard icon={CloudDoneRoundedIcon} title="Storage">
            <SectionList
              description="Storage usage across shared drives"
              items={[
                { label: 'Total capacity', value: '120 GB' },
                { label: 'Used', value: '58.2 GB' },
                { label: 'Recent upload', value: 'Brand assets (2 days ago)' }
              ]}
            />
          </SectionCard>
        </Box>

        <Box sx={{ gridColumn: { xs: '1 / -1', lg: '7 / -1' }, display: 'flex', alignItems: 'stretch', flex: 1 }}>
          <SectionCard icon={ChatBubbleOutlineRoundedIcon} title="Communications">
            <SectionList
              description="Latest touchpoints and active channels"
              items={[
                { label: 'Success manager', value: contact.contact?.name },
                { label: 'Last outreach', value: 'Oct 04 · Quarterly review' },
                { label: 'Primary channel', value: contact.channel }
              ]}
            />
          </SectionCard>
        </Box>
      </Box>


      <Dialog open={editorOpen} onClose={() => setEditorOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit tenant profile</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField label="Tenant name" value={draft?.name || ''} onChange={handleChange('name')} fullWidth />
            <TextField label="Status" value={draft?.status || ''} onChange={handleChange('status')} fullWidth />
            <TextField label="Primary contact" value={draft?.contact?.name || ''} onChange={handleContactChange('name')} fullWidth />
            <TextField label="Email" value={draft?.contact?.email || ''} onChange={handleContactChange('email')} fullWidth />
            <TextField label="Plan" value={draft?.plan || ''} onChange={handleChange('plan')} fullWidth />
            <TextField label="User type" value={draft?.user_type || ''} onChange={handleChange('user_type')} fullWidth />
            <TextField label="Phone" value={draft?.phone_primary || ''} onChange={handleChange('phone_primary')} fullWidth />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setEditorOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave}>
            Save changes
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
    plan: PropTypes.string,
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
      county: PropTypes.string,
      country: PropTypes.string,
      tax_id: PropTypes.string
    })
  }),
  onBack: PropTypes.func.isRequired,
  onSave: PropTypes.func
};

const MetricCard = ({ title, value }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: 3,
      border: '1px solid #d9e1f2',
      px: 3,
      py: 2,
      minWidth: 120,
      textAlign: 'center',
      bgcolor: '#fff'
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
    sx={{ borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#fff', p: 3, height: '100%', width: '100%' }}
  >
    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
      {Icon && (
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            bgcolor: '#eff4ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon fontSize="small" color="primary" />
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
        borderTop: '1px solid #eef2f6',
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
  <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', p: 2.5, height: '100%', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
  <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid #d9e1f2', bgcolor: '#fff', height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
    <Stack direction="row" spacing={2} alignItems="center" sx={{ px: 3, py: 2, borderBottom: '1px solid #eef2f6' }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          bgcolor: '#eff4ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Icon fontSize="small" color="primary" />
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
          borderTop: '1px solid #eef2f6',
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
