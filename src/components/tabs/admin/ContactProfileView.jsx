import PropTypes from 'prop-types';
import { useEffect, useMemo, useState } from 'react';

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
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';

import { CANONICAL_USER_TYPES, normalizeUserTypeLabel } from './contactConstants';

const ContactProfileView = ({ contact, onBack, onSave, userTypeOptions }) => {
  const mapContactToDraft = (value) => {
    if (!value) {
      return value;
    }
    return {
      ...value,
      user_type:
        value.user_type && value.user_type !== '—'
          ? normalizeUserTypeLabel(value.user_type)
          : ''
    };
  };

  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(() => mapContactToDraft(contact));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

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

  const handleBillingChange = (field) => (event) => {
    setDraft((prev) => ({
      ...prev,
      billing: {
        ...prev.billing,
        [field]: event.target.value
      }
    }));
  };

  const handleSave = async () => {
    if (!onSave) {
      setEditorOpen(false);
      return;
    }

    try {
      setSaving(true);
      setSaveError('');
      await onSave(draft);
      setEditorOpen(false);
    } catch (error) {
      console.error('[ContactProfileView] Failed to save contact:', error);
      setSaveError(error?.message || 'No se pudieron guardar los cambios.');
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
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={onBack}>
          Back to contacts
        </Button>
        <Button 
          variant="contained" 
          startIcon={<EditRoundedIcon />}
          onClick={() => setEditorOpen(true)}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              transform: 'translateY(-1px)',
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)'
            },
            transition: 'all 0.2s ease-in-out'
          }}
        >
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
            <Avatar sx={{ width: 90, height: 90, fontSize: 36, bgcolor: '#f97316' }}>{initials.slice(0, 2)}</Avatar>
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


      <Dialog 
        open={editorOpen} 
        onClose={() => setEditorOpen(false)} 
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
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          borderRadius: '12px 12px 0 0',
          p: 3
        }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
              <EditRoundedIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Edit User Profile
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Update user information and billing details
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
                    <Avatar sx={{ bgcolor: '#10b981', width: 36, height: 36 }}>
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
                        label="User name" 
                        value={draft?.name || ''} 
                        onChange={handleChange('name')} 
                        fullWidth 
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            minHeight: 56,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#10b981'
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField 
                        label="Status" 
                        value={draft?.status || ''} 
                        onChange={handleChange('status')} 
                        fullWidth 
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            minHeight: 56,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#10b981'
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField 
                        label="Primary contact" 
                        value={draft?.contact?.name || ''} 
                        onChange={handleContactChange('name')} 
                        fullWidth 
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            minHeight: 56,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#10b981'
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField 
                        label="Email" 
                        value={draft?.contact?.email || ''} 
                        onChange={handleContactChange('email')} 
                        fullWidth 
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            minHeight: 56,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#10b981'
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField 
                        label="Phone" 
                        value={draft?.phone_primary || ''} 
                        onChange={handleChange('phone_primary')} 
                        fullWidth 
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            minHeight: 56,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#10b981'
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select
                        label="User type"
                        value={draft?.user_type && draft.user_type !== '—' ? draft.user_type : ''}
                        onChange={handleChange('user_type')}
                        fullWidth
                        variant="outlined"
                        SelectProps={{ displayEmpty: true }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            minHeight: 56,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#10b981'
                            }
                          }
                        }}
                      >
                        <MenuItem value="">
                          <em>Sin definir</em>
                        </MenuItem>
                        {availableUserTypes.map((type) => (
                          <MenuItem key={type} value={type}>
                            {type}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField 
                        label="Plan" 
                        value={draft?.plan || ''} 
                        onChange={handleChange('plan')} 
                        fullWidth 
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            minHeight: 56,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#10b981'
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField 
                        label="Center" 
                        value={draft?.center || ''} 
                        onChange={handleChange('center')} 
                        fullWidth 
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            minHeight: 56,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#10b981'
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
                    <Avatar sx={{ bgcolor: '#059669', width: 36, height: 36 }}>
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
                        label="Company name" 
                        value={draft?.billing?.company || ''} 
                        onChange={handleBillingChange('company')} 
                        fullWidth 
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            minHeight: 56,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#059669'
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField 
                        label="Billing email" 
                        value={draft?.billing?.email || ''} 
                        onChange={handleBillingChange('email')} 
                        fullWidth 
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            minHeight: 56,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#059669'
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField 
                        label="Address" 
                        value={draft?.billing?.address || ''} 
                        onChange={handleBillingChange('address')} 
                        fullWidth 
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            minHeight: 56,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#059669'
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField 
                        label="Postal code" 
                        value={draft?.billing?.postal_code || ''} 
                        onChange={handleBillingChange('postal_code')} 
                        fullWidth 
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            minHeight: 56,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#059669'
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField 
                        label="County/State" 
                        value={draft?.billing?.county || ''} 
                        onChange={handleBillingChange('county')} 
                        fullWidth 
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            minHeight: 56,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#059669'
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField 
                        label="Country" 
                        value={draft?.billing?.country || ''} 
                        onChange={handleBillingChange('country')} 
                        fullWidth 
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            minHeight: 56,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#059669'
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField 
                        label="Tax ID" 
                        value={draft?.billing?.tax_id || ''} 
                        onChange={handleBillingChange('tax_id')} 
                        fullWidth 
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            minHeight: 56,
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#059669'
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
            onClick={() => setEditorOpen(false)}
            disabled={saving}
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
            onClick={handleSave}
            disabled={saving}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                transform: 'translateY(-1px)',
                boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
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
            bgcolor: '#fed7aa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Icon fontSize="small" sx={{ color: '#f97316' }} />
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
          bgcolor: '#fed7aa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Icon fontSize="small" sx={{ color: '#f97316' }} />
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
