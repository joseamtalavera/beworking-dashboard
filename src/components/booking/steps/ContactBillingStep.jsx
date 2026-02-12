import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

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

const buildErrors = (form) => {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = 'First name is required';
  if (!form.lastName.trim()) errors.lastName = 'Last name is required';
  if (!form.email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email address';
  if (!form.phone.trim()) errors.phone = 'Phone number is required';
  return errors;
};

export default function ContactBillingStep({ mode = 'admin' }) {
  const { state, setField, nextStep, prevStep } = useBookingFlow();

  // Admin contact search
  const [contactInputValue, setContactInputValue] = useState('');
  const [contactOptions, setContactOptions] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState(state.contact || null);

  // User mode manual form
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    taxId: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    country: 'Spain',
  });
  const [formErrors, setFormErrors] = useState({});
  const [validationError, setValidationError] = useState('');

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

  const handleChange = (field) => (event) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleNext = () => {
    setValidationError('');
    if (mode === 'admin') {
      if (!selectedContact?.id) {
        setValidationError('Please select a contact.');
        return;
      }
      setField('contact', selectedContact);
    } else {
      const errors = buildErrors(formState);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        return;
      }
      setField('contact', formState);
    }
    nextStep();
  };

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
              : "We'll use this to confirm your booking and send access instructions."}
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
          /* User: manual contact form */
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField size="small" label="First name" value={formState.firstName} onChange={handleChange('firstName')} required error={Boolean(formErrors.firstName)} helperText={formErrors.firstName} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField size="small" label="Last name" value={formState.lastName} onChange={handleChange('lastName')} required error={Boolean(formErrors.lastName)} helperText={formErrors.lastName} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField size="small" label="Email" type="email" value={formState.email} onChange={handleChange('email')} required error={Boolean(formErrors.email)} helperText={formErrors.email} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField size="small" label="Phone" value={formState.phone} onChange={handleChange('phone')} required error={Boolean(formErrors.phone)} helperText={formErrors.phone} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField size="small" label="Company" value={formState.company} onChange={handleChange('company')} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField size="small" label="VAT / Tax ID" value={formState.taxId} onChange={handleChange('taxId')} fullWidth />
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Billing address (user mode only) */}
      {mode !== 'admin' && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Stack spacing={1} sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="baseline">
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Billing address
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                — optional
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Required only if you need an invoice.
            </Typography>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField size="small" label="Address line 1" value={formState.addressLine1} onChange={handleChange('addressLine1')} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField size="small" label="Address line 2" value={formState.addressLine2} onChange={handleChange('addressLine2')} fullWidth />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField size="small" label="City" value={formState.city} onChange={handleChange('city')} fullWidth />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField size="small" label="Postal code" value={formState.postalCode} onChange={handleChange('postalCode')} fullWidth />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField size="small" label="Country" value={formState.country} onChange={handleChange('country')} fullWidth />
            </Grid>
          </Grid>
        </Paper>
      )}

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
