import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';

import { fetchBookingContacts } from '../../../api/bookings.js';
import { useBookingFlow } from '../BookingFlowContext';
import ReviewSummary from './ReviewSummary';

const pillButtonSx = {
  borderRadius: 999,
  px: 4,
  py: 1.25,
  textTransform: 'none',
  fontWeight: 700,
  fontSize: '0.95rem',
};

const backButtonSx = {
  borderRadius: 999,
  px: 3,
  py: 1.25,
  textTransform: 'none',
  fontWeight: 600,
  color: 'text.secondary',
};

const splitName = (fullName) => {
  if (!fullName) return { first: '', last: '' };
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return { first: parts[0] || '', last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
};

export default function ContactBillingStep({ mode = 'admin', userProfile }) {
  const { state, setField, nextStep, prevStep } = useBookingFlow();

  // Admin contact search
  const [contactInputValue, setContactInputValue] = useState('');
  const [contactOptions, setContactOptions] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState(state.contact || null);
  const [validationError, setValidationError] = useState('');

  // User mode: build contact object from profile and auto-set it
  useEffect(() => {
    if (mode !== 'user' || !userProfile) return;
    const { first, last } = splitName(userProfile.name);
    const contact = {
      name: userProfile.name || '',
      firstName: userProfile.firstName || first,
      lastName: userProfile.lastName || last,
      email: userProfile.email || '',
      phone: userProfile.phone || '',
      company: userProfile.company || '',
      address: userProfile.address || {},
    };
    setField('contact', contact);
  }, [mode, userProfile, setField]);

  // Admin contact search with debounce
  useEffect(() => {
    if (mode !== 'admin' || !contactInputValue.trim()) {
      setContactOptions([]);
      return;
    }
    const timeout = setTimeout(() => {
      setContactsLoading(true);
      fetchBookingContacts({ search: contactInputValue.trim() })
        .then((contacts) => setContactOptions(Array.isArray(contacts) ? contacts : []))
        .catch(() => setContactOptions([]))
        .finally(() => setContactsLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [contactInputValue, mode]);

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
    setContactInputValue(contact.name || contact.code || '');
    setField('contact', contact);
  };

  const handleClearContact = () => {
    setSelectedContact(null);
    setContactInputValue('');
    setField('contact', null);
  };

  const handleNext = () => {
    setValidationError('');
    if (mode === 'admin') {
      if (!selectedContact?.id) {
        setValidationError('Please select a contact.');
        return;
      }
      setField('contact', selectedContact);
    }
    // User mode: contact already set via useEffect
    nextStep();
  };

  const initials = (userProfile?.name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <Stack spacing={3}>
      {validationError && <Alert severity="error">{validationError}</Alert>}

      {/* Reservation summary */}
      <ReviewSummary state={state} />

      {/* Contact details */}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={1} sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Contact details
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {mode === 'admin'
              ? 'Search for an existing contact to assign this booking.'
              : 'Booking will be confirmed under your account.'}
          </Typography>
        </Stack>

        {mode === 'admin' ? (
          /* Admin: contact search */
          <Box sx={{ position: 'relative' }}>
            <TextField
              fullWidth
              label="Search contact"
              value={contactInputValue}
              onChange={(e) => setContactInputValue(e.target.value)}
              placeholder="Search by name"
              required
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                endAdornment: contactsLoading ? (
                  <CircularProgress color="inherit" size={18} />
                ) : selectedContact ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearContact} sx={{ color: 'text.disabled' }}>
                      <CloseRoundedIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
            />
            {contactInputValue && contactOptions.length > 0 && !selectedContact && (
              <Paper
                elevation={3}
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 1000,
                  maxHeight: 200,
                  overflow: 'auto',
                  mt: 1,
                }}
              >
                {contactOptions.map((contact) => (
                  <Box
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    sx={{ p: 2, cursor: 'pointer', '&:hover': { backgroundColor: 'grey.100' } }}
                  >
                    <Typography variant="body2" fontWeight={500}>
                      {contact.name || contact.code || '—'}
                    </Typography>
                    {contact.email && (
                      <Typography variant="caption" color="text.secondary">
                        {contact.email}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Paper>
            )}
          </Box>
        ) : (
          /* User: show profile as confirmed contact (same compact style as admin) */
          <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 2, borderRadius: 2, bgcolor: 'action.hover' }}>
            <Avatar sx={{ width: 44, height: 44, bgcolor: 'primary.main', fontWeight: 700, fontSize: '1rem' }}>
              {initials || <PersonOutlineRoundedIcon />}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body1" fontWeight={600} noWrap>
                  {userProfile?.name || 'User'}
                </Typography>
                <Chip
                  icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: 16 }} />}
                  label="Confirmed"
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                />
              </Stack>
              <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                {userProfile?.email && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <EmailOutlinedIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.secondary">{userProfile.email}</Typography>
                  </Stack>
                )}
                {userProfile?.phone && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <PhoneOutlinedIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.secondary">{userProfile.phone}</Typography>
                  </Stack>
                )}
              </Stack>
            </Box>
          </Stack>
        )}
      </Paper>

      {/* Navigation buttons */}
      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Button onClick={prevStep} sx={backButtonSx}>
          Back
        </Button>
        <Button variant="contained" onClick={handleNext} sx={pillButtonSx}>
          Continue to payment
        </Button>
      </Stack>
    </Stack>
  );
}
