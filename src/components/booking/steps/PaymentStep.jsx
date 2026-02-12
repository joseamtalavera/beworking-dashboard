import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';

import { createReserva } from '../../../api/bookings.js';
import {
  createPaymentIntent,
  fetchCustomerPaymentMethods,
  chargeCustomer,
  createStripeInvoice,
} from '../../../api/stripe.js';
import { useBookingFlow } from '../BookingFlowContext';
import ReviewSummary, { computePricing } from './ReviewSummary';

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

const WEEKDAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

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

function buildBookingPayload(state) {
  const contactId = state.contact?.id;
  const normalizedType = (state.reservationType || '').toLowerCase();
  const isPerHour = normalizedType === 'por horas';
  const showWeekdays = normalizedType === 'por horas' || normalizedType === 'diaria';
  const orderedWeekdays = WEEKDAY_ORDER.filter((d) => state.weekdays.includes(d));
  const attendees = state.attendees === '' ? null : Number(state.attendees);
  const tarifa = state.tarifa === '' ? null : Number(state.tarifa);

  return {
    contactId,
    centroId: state.centro?.id,
    productoId: state.producto?.id,
    reservationType: state.reservationType,
    dateFrom: state.dateFrom,
    dateTo: state.dateTo,
    timeSlots: isPerHour ? [{ from: state.startTime, to: state.endTime }] : [],
    weekdays: showWeekdays ? orderedWeekdays : [],
    openEnded: state.openEnded,
    tarifa,
    attendees,
    configuracion: state.configuracion || null,
    note: state.note || null,
    status: state.status,
  };
}

/* ─────────────────────────────────────
   Admin Payment Options
   ───────────────────────────────────── */
function AdminPaymentOptions({ onCreated }) {
  const theme = useTheme();
  const { state, prevStep } = useBookingFlow();
  const [paymentOption, setPaymentOption] = useState('none'); // 'none' | 'charge' | 'invoice'
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState('');
  const [cardsLoading, setCardsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [invoiceDueDays, setInvoiceDueDays] = useState(30);

  const contactEmail = state.contact?.email || '';
  const contactName = state.contact?.name || state.contact?.code || '';
  const pricing = useMemo(() => computePricing(state), [state]);

  // Load saved cards when charge option selected
  useEffect(() => {
    if (paymentOption !== 'charge' || !contactEmail) return;
    setCardsLoading(true);
    fetchCustomerPaymentMethods(contactEmail)
      .then((res) => {
        setSavedCards(res.paymentMethods || []);
        if (res.paymentMethods?.length > 0) {
          setSelectedCard(res.paymentMethods[0].id);
        }
      })
      .catch(() => setSavedCards([]))
      .finally(() => setCardsLoading(false));
  }, [paymentOption, contactEmail]);

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);

    try {
      const bookingPayload = buildBookingPayload(state);
      const amountCents = Math.round(pricing.total * 100);
      const description = `Reserva: ${state.producto?.name || ''} (${state.dateFrom})`;

      if (paymentOption === 'charge') {
        if (!selectedCard) {
          setError('Please select a card.');
          setSubmitting(false);
          return;
        }
        const chargeResult = await chargeCustomer({
          customerEmail: contactEmail,
          paymentMethodId: selectedCard,
          amount: amountCents,
          currency: 'eur',
          description,
          reference: String(state.producto?.id || ''),
        });
        bookingPayload.stripePaymentIntentId = chargeResult.paymentIntentId;
        bookingPayload.status = 'Paid';
      } else if (paymentOption === 'invoice') {
        const invoiceResult = await createStripeInvoice({
          customerEmail: contactEmail,
          customerName: contactName,
          amount: amountCents,
          currency: 'eur',
          description,
          reference: String(state.producto?.id || ''),
          dueDays: invoiceDueDays,
        });
        bookingPayload.stripeInvoiceId = invoiceResult.invoiceId;
        bookingPayload.status = 'Invoiced';
      }
      // If 'none', just create booking with current status

      const response = await createReserva(bookingPayload);
      setSuccess(true);
      onCreated?.(response);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
        <Stack spacing={3} alignItems="center">
          <CheckCircleRoundedIcon sx={{ fontSize: 56, color: 'success.main' }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Reserva created</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            The booking has been successfully created.
          </Typography>
        </Stack>
      </Paper>
    );
  }

  const fieldStyles = {
    '& .MuiOutlinedInput-root': {
      minHeight: 40,
      borderRadius: 8,
      backgroundColor: theme.palette.common.white,
    },
  };

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}

      <ReviewSummary state={state} />

      {/* Contact info */}
      {contactName && (
        <Paper
          elevation={0}
          variant="outlined"
          sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="body2" color="text.secondary">Contact</Typography>
          <Typography variant="body1" fontWeight={500}>{contactName}</Typography>
          {contactEmail && (
            <Typography variant="body2" color="text.secondary">{contactEmail}</Typography>
          )}
        </Paper>
      )}

      {/* Payment option selection */}
      <Paper
        elevation={0}
        variant="outlined"
        sx={{ p: { xs: 2, md: 3 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
      >
        <Stack spacing={2}>
          <Typography variant="subtitle1" fontWeight={700}>Payment</Typography>

          <RadioGroup value={paymentOption} onChange={(e) => setPaymentOption(e.target.value)}>
            <FormControlLabel value="none" control={<Radio size="small" />} label="No payment (booking only)" />
            <FormControlLabel
              value="charge"
              control={<Radio size="small" />}
              label="Charge saved card"
              disabled={!contactEmail}
            />
            <FormControlLabel
              value="invoice"
              control={<Radio size="small" />}
              label="Send Stripe invoice"
              disabled={!contactEmail}
            />
          </RadioGroup>

          {paymentOption === 'charge' && (
            <Box sx={{ pl: 4 }}>
              {cardsLoading ? (
                <CircularProgress size={24} />
              ) : savedCards.length === 0 ? (
                <Alert severity="info" sx={{ mt: 1 }}>
                  No saved cards found for {contactEmail}
                </Alert>
              ) : (
                <TextField
                  fullWidth
                  label="Select card"
                  value={selectedCard}
                  onChange={(e) => setSelectedCard(e.target.value)}
                  select
                  size="small"
                  sx={fieldStyles}
                >
                  {savedCards.map((card) => (
                    <MenuItem key={card.id} value={card.id}>
                      {card.brand?.toUpperCase()} **** {card.last4} — exp {card.expMonth}/{card.expYear}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Box>
          )}

          {paymentOption === 'invoice' && (
            <Box sx={{ pl: 4 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Days until due"
                    type="number"
                    value={invoiceDueDays}
                    onChange={(e) => setInvoiceDueDays(Number(e.target.value))}
                    size="small"
                    sx={fieldStyles}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </Stack>
      </Paper>

      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Button onClick={prevStep} disabled={submitting} sx={backButtonSx}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || (paymentOption === 'charge' && !selectedCard)}
          sx={pillButtonSx}
        >
          {submitting ? <CircularProgress size={22} color="inherit" /> : 'Create reserva'}
        </Button>
      </Stack>
    </Stack>
  );
}

/* ─────────────────────────────────────
   User Payment Form (Stripe Elements)
   ───────────────────────────────────── */
function UserPaymentFormInner({ onCreated }) {
  const stripe = useStripe();
  const elements = useElements();
  const { state, prevStep } = useBookingFlow();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const pricing = useMemo(() => computePricing(state), [state]);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setError('');
    setSubmitting(true);

    try {
      const result = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed.');
        setSubmitting(false);
        return;
      }

      if (result.paymentIntent?.status === 'succeeded') {
        const contact = state.contact || {};
        const payload = {
          firstName: contact.firstName || '',
          lastName: contact.lastName || '',
          email: contact.email || '',
          phone: contact.phone || '',
          company: contact.company || '',
          taxId: contact.taxId || '',
          productName: state.producto?.name || '',
          date: state.dateFrom || '',
          dateTo: state.dateTo || '',
          startTime: state.startTime || '',
          endTime: state.endTime || '',
          attendees: state.attendees ? Number(state.attendees) : 1,
          stripePaymentIntentId: result.paymentIntent.id,
        };
        const response = await createReserva(payload);
        setSuccess(true);
        onCreated?.(response);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
        <Stack spacing={3} alignItems="center">
          <CheckCircleRoundedIcon sx={{ fontSize: 56, color: 'success.main' }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Booking confirmed!</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Your payment of €{pricing.total.toFixed(2)} was successful. You'll receive a confirmation email shortly.
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}
      <ReviewSummary state={state} />

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <LockRoundedIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Secure payment powered by Stripe
            </Typography>
          </Stack>
          <PaymentElement />
        </Stack>
      </Paper>

      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Button onClick={prevStep} disabled={submitting} sx={backButtonSx}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !stripe}
          sx={pillButtonSx}
        >
          {submitting ? 'Processing...' : `Pay €${pricing.total.toFixed(2)}`}
        </Button>
      </Stack>
    </Stack>
  );
}

function UserPaymentForm({ onCreated }) {
  const { state } = useBookingFlow();
  const pricing = useMemo(() => computePricing(state), [state]);
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const amountCents = Math.round(pricing.total * 100);
    if (amountCents <= 0) return;
    createPaymentIntent({
      amount: amountCents,
      currency: 'eur',
      reference: String(state.producto?.id || 'booking'),
      description: `Booking: ${state.producto?.name || ''} (${state.dateFrom})`,
      customerEmail: state.contact?.email || '',
    })
      .then((res) => setClientSecret(res.clientSecret))
      .catch((err) => setError(err.message || 'Failed to initialize payment.'));
  }, [pricing.total, state.producto, state.dateFrom, state.contact]);

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!clientSecret) {
    return (
      <Stack spacing={3}>
        <ReviewSummary state={state} />
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          <Stack spacing={2} alignItems="center">
            <Box
              sx={{
                width: 32, height: 32,
                border: '3px solid', borderColor: 'divider',
                borderTopColor: 'primary.main', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                '@keyframes spin': { to: { transform: 'rotate(360deg)' } },
              }}
            />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Preparing secure payment...
            </Typography>
          </Stack>
        </Paper>
      </Stack>
    );
  }

  if (!stripePromise) {
    return <Alert severity="error">Stripe is not configured. Please set VITE_STRIPE_PUBLISHABLE_KEY.</Alert>;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <UserPaymentFormInner onCreated={onCreated} />
    </Elements>
  );
}

/* ─────────────────────────────────────
   Main PaymentStep
   ───────────────────────────────────── */
export default function PaymentStep({ mode = 'admin', onCreated }) {
  if (mode === 'admin') {
    return <AdminPaymentOptions onCreated={onCreated} />;
  }
  return <UserPaymentForm onCreated={onCreated} />;
}
