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
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';

import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n/i18n.js';
import esBooking from '../../../i18n/locales/es/booking.json';
import enBooking from '../../../i18n/locales/en/booking.json';

import { createReserva, createPublicBooking, fetchBookingUsage, sendBookingConfirmation } from '../../../api/bookings.js';
import { createManualInvoice, sendInvoiceEmail } from '../../../api/invoices.js';
import {
  createPaymentIntent,
  fetchCustomerPaymentMethods,
  chargeCustomer,
  createStripeInvoice,
} from '../../../api/stripe.js';
import { useBookingFlow } from '../BookingFlowContext';
import ReviewSummary, { computePricing } from './ReviewSummary';

if (!i18n.hasResourceBundle('es', 'booking')) {
  i18n.addResourceBundle('es', 'booking', esBooking);
  i18n.addResourceBundle('en', 'booking', enBooking);
}

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
   Admin Payment Options (4 options)
   ───────────────────────────────────── */
function AdminPaymentOptions({ onCreated }) {
  const { t } = useTranslation('booking');
  const theme = useTheme();
  const { state, prevStep } = useBookingFlow();
  const [paymentOption, setPaymentOption] = useState('free'); // 'free' | 'charge' | 'stripe' | 'transfer'
  const [savedCards, setSavedCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState('');
  const [cardsLoading, setCardsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdResponse, setCreatedResponse] = useState(null);
  const [invoiceDueDays, setInvoiceDueDays] = useState(30);

  const contactEmail = state.contact?.email || '';
  const contactName = state.contact?.name || state.contact?.code || '';
  const productName = state.producto?.name || state.producto?.nombre || '';
  const pricing = useMemo(() => computePricing(state), [state]);

  // Fetch saved cards
  useEffect(() => {
    if (!contactEmail) return;
    setCardsLoading(true);
    fetchCustomerPaymentMethods(contactEmail)
      .then((res) => {
        const methods = res.paymentMethods || [];
        setSavedCards(methods);
        if (methods.length > 0) setSelectedCard(methods[0].id);
      })
      .catch(() => setSavedCards([]))
      .finally(() => setCardsLoading(false));
  }, [contactEmail]);

  // Build the manual invoice payload from booking state + pricing
  const buildInvoicePayload = (invoiceStatus) => {
    const description = `${productName} · ${state.dateFrom} ${state.startTime}-${state.endTime}`;
    return {
      clientName: contactName,
      clientId: state.contact?.id || null,
      userType: state.contact?.tenantType || null,
      center: state.centro?.name || state.centro?.code || null,
      cuenta: 'PT',
      date: state.dateFrom,
      status: invoiceStatus,
      lineItems: [{
        description,
        quantity: 1,
        price: pricing.subtotal,
        vatPercent: 21,
      }],
      computed: {
        subtotal: pricing.subtotal,
        totalVat: pricing.vat,
        total: pricing.total,
      },
    };
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);

    try {
      const bookingPayload = buildBookingPayload(state);
      const amountCents = Math.round(pricing.total * 100);
      const description = `Reserva: ${productName} (${state.dateFrom})`;
      let invoiceStatus;

      // ── Step 1: Option-specific actions ──
      if (paymentOption === 'free') {
        bookingPayload.status = 'Paid';
        bookingPayload.note = 'Reserva gratuita (admin)';
        invoiceStatus = 'Pagado';
      } else if (paymentOption === 'charge') {
        if (!selectedCard) {
          setError(t('steps.pleaseSelectCard'));
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
        invoiceStatus = 'Pagado';
      } else if (paymentOption === 'stripe') {
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
        invoiceStatus = 'Pendiente';
      } else if (paymentOption === 'transfer') {
        bookingPayload.status = 'Invoiced';
        invoiceStatus = 'Pendiente';
      }

      // ── Step 2: Create the booking ──
      const bookingResponse = await createReserva(bookingPayload);
      const bloqueoId = bookingResponse.bloqueos?.[0]?.id;

      // ── Step 3: Create the internal invoice (facturas record) ──
      const invoicePayload = buildInvoicePayload(invoiceStatus);
      const invoiceResponse = await createManualInvoice(invoicePayload);
      const invoiceId = invoiceResponse?.id;

      // ── Step 4: Option-specific post-actions ──
      if (paymentOption === 'transfer' && invoiceId) {
        await sendInvoiceEmail(invoiceId).catch((err) =>
          console.warn('Failed to send invoice email:', err)
        );
      }

      // ── Step 5: Send booking confirmation email ──
      if (bloqueoId) {
        sendBookingConfirmation(bloqueoId).catch((err) =>
          console.warn('Failed to send confirmation email:', err)
        );
      }

      setCreatedResponse(bookingResponse);
      setSuccess(true);
    } catch (err) {
      setError(err.message || t('steps.somethingWentWrong'));
    } finally {
      setSubmitting(false);
    }
  };

  const fieldStyles = {
    '& .MuiOutlinedInput-root': {
      minHeight: 40,
      borderRadius: 8,
      backgroundColor: theme.palette.common.white,
    },
  };

  return (
    <Stack spacing={3}>
      <Dialog open={success} PaperProps={{ sx: { borderRadius: 3, p: 2 } }}>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Stack spacing={3} alignItems="center">
            <CheckCircleRoundedIcon sx={{ fontSize: 56, color: 'success.main' }} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>{t('steps.reservaCreated')}</Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              {t('steps.bookingSuccessDesc')}
            </Typography>
            <Button variant="contained" sx={pillButtonSx} onClick={() => onCreated?.(createdResponse)}>
              {t('steps.close')}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      {error && <Alert severity="error">{error}</Alert>}

      <ReviewSummary state={state} />

      {/* Contact info */}
      {contactName && (
        <Paper
          elevation={0}
          variant="outlined"
          sx={{ p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
        >
          <Typography variant="body2" color="text.secondary">{t('steps.contact')}</Typography>
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
          <Typography variant="subtitle1" fontWeight={700}>{t('steps.payment')}</Typography>

          {cardsLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}

          <RadioGroup value={paymentOption} onChange={(e) => setPaymentOption(e.target.value)}>
            <FormControlLabel
              value="free"
              control={<Radio size="small" />}
              label={t('steps.freeBooking')}
            />

            <FormControlLabel
              value="charge"
              control={<Radio size="small" />}
              label={t('steps.chargeCard')}
              disabled={!contactEmail || cardsLoading || savedCards.length === 0}
            />
            {!cardsLoading && savedCards.length === 0 && contactEmail && (
              <Typography variant="caption" sx={{ pl: 4, color: 'text.secondary' }}>
                {t('steps.noSavedCards', { email: contactEmail })}
              </Typography>
            )}

            <FormControlLabel
              value="stripe"
              control={<Radio size="small" />}
              label={t('steps.stripeInvoice')}
              disabled={!contactEmail}
            />

            <FormControlLabel
              value="transfer"
              control={<Radio size="small" />}
              label={t('steps.bankTransfer')}
              disabled={!contactEmail}
            />
            {paymentOption === 'transfer' && (
              <Typography variant="caption" sx={{ pl: 4, color: 'text.secondary' }}>
                {t('steps.bankTransferDesc')}
              </Typography>
            )}
          </RadioGroup>

          {paymentOption === 'charge' && savedCards.length > 0 && (
            <Box sx={{ pl: 4 }}>
              <TextField
                fullWidth
                label={t('steps.selectCard')}
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
            </Box>
          )}

          {paymentOption === 'stripe' && (
            <Box sx={{ pl: 4 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label={t('steps.daysUntilDue')}
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
          {t('steps.back')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || (paymentOption === 'charge' && !selectedCard)}
          sx={pillButtonSx}
        >
          {submitting
            ? <CircularProgress size={22} color="inherit" />
            : paymentOption === 'free'
              ? t('steps.confirmFreeBooking')
              : t('steps.createReserva')}
        </Button>
      </Stack>
    </Stack>
  );
}

/* ─────────────────────────────────────
   Helper: build public booking payload
   ───────────────────────────────────── */
function buildPublicPayload(state, extra = {}) {
  const contact = state.contact || {};
  const firstName = contact.firstName || contact.name || '';
  const lastName = contact.lastName || firstName;
  return {
    firstName,
    lastName,
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
    ...extra,
  };
}

/* ─────────────────────────────────────
   User: Free Booking Form
   ───────────────────────────────────── */
function UserFreeBookingForm({ onCreated, usage }) {
  const { t } = useTranslation('booking');
  const { state, prevStep } = useBookingFlow();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const payload = buildPublicPayload(state);
      await createPublicBooking(payload);
      setSuccess(true);
    } catch (err) {
      setError(err.message || t('steps.somethingWentWrong'));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
        <Stack spacing={3} alignItems="center">
          <CheckCircleRoundedIcon sx={{ fontSize: 56, color: 'success.main' }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{t('steps.bookingConfirmed')}</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {t('steps.freeBookingSuccess', { used: usage.used + 1, limit: usage.freeLimit })}
          </Typography>
          <Button variant="contained" sx={pillButtonSx} onClick={() => onCreated?.({})}>
            {t('steps.done')}
          </Button>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      {error && <Alert severity="error">{error}</Alert>}
      <ReviewSummary state={state} />

      <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
        <Stack spacing={1.5} alignItems="center" sx={{ py: 1 }}>
          <CheckCircleRoundedIcon sx={{ fontSize: 40, color: 'success.main' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            {t('steps.freeBookingAvailable')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
            {t('steps.freeBookingUsage', { used: usage.used, limit: usage.freeLimit })}
          </Typography>
        </Stack>
      </Paper>

      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Button onClick={prevStep} disabled={submitting} sx={backButtonSx}>
          {t('steps.back')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          sx={pillButtonSx}
        >
          {submitting ? <CircularProgress size={22} color="inherit" /> : t('steps.confirmFreeBooking')}
        </Button>
      </Stack>
    </Stack>
  );
}

/* ─────────────────────────────────────
   User: Stripe Payment Form (inner)
   ───────────────────────────────────── */
function UserPaymentFormInner({ onCreated }) {
  const { t } = useTranslation('booking');
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
        setError(result.error.message || t('steps.somethingWentWrong'));
        setSubmitting(false);
        return;
      }

      if (result.paymentIntent?.status === 'succeeded') {
        const payload = buildPublicPayload(state, {
          stripePaymentIntentId: result.paymentIntent.id,
        });
        await createPublicBooking(payload);
        setSuccess(true);
        onCreated?.({});
      }
    } catch (err) {
      setError(err.message || t('steps.somethingWentWrong'));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
        <Stack spacing={3} alignItems="center">
          <CheckCircleRoundedIcon sx={{ fontSize: 56, color: 'success.main' }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>{t('steps.bookingConfirmed')}</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {t('steps.paymentSuccessful', { amount: pricing.total.toFixed(2) })}
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
              {t('steps.securePaymentStripe')}
            </Typography>
          </Stack>
          <PaymentElement />
        </Stack>
      </Paper>

      <Stack direction="row" spacing={2} justifyContent="space-between">
        <Button onClick={prevStep} disabled={submitting} sx={backButtonSx}>
          {t('steps.back')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !stripe}
          sx={pillButtonSx}
        >
          {submitting ? t('steps.processing') : t('steps.payAmount', { amount: pricing.total.toFixed(2) })}
        </Button>
      </Stack>
    </Stack>
  );
}

/* ─────────────────────────────────────
   User Payment Form (checks free eligibility first)
   ───────────────────────────────────── */
function UserPaymentForm({ onCreated }) {
  const { t } = useTranslation('booking');
  const { state } = useBookingFlow();
  const pricing = useMemo(() => computePricing(state), [state]);
  const [clientSecret, setClientSecret] = useState(null);
  const [error, setError] = useState('');
  const [usage, setUsage] = useState(null); // { used, freeLimit, isFree }
  const [usageLoading, setUsageLoading] = useState(true);

  const contactEmail = state.contact?.email || '';
  const productName = state.producto?.name || '';

  // Check free booking eligibility on mount
  useEffect(() => {
    if (!contactEmail || !productName) {
      setUsageLoading(false);
      return;
    }
    setUsageLoading(true);
    fetchBookingUsage(contactEmail, productName)
      .then((res) => setUsage(res))
      .catch(() => setUsage(null))
      .finally(() => setUsageLoading(false));
  }, [contactEmail, productName]);

  // Only create Stripe intent if NOT free
  useEffect(() => {
    if (usageLoading) return;
    if (usage?.isFree) return; // skip Stripe for free bookings
    const amountCents = Math.round(pricing.total * 100);
    if (amountCents <= 0) return;
    createPaymentIntent({
      amount: amountCents,
      currency: 'eur',
      reference: String(state.producto?.id || 'booking'),
      description: `Booking: ${state.producto?.name || ''} (${state.dateFrom})`,
      customerEmail: contactEmail,
    })
      .then((res) => setClientSecret(res.clientSecret))
      .catch((err) => setError(err.message || 'Failed to initialize payment.'));
  }, [usageLoading, usage, pricing.total, state.producto, state.dateFrom, contactEmail]);

  // Loading state
  if (usageLoading) {
    return (
      <Stack spacing={3}>
        <ReviewSummary state={state} />
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
          <Stack spacing={2} alignItems="center">
            <CircularProgress size={28} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('steps.checkingEligibility')}
            </Typography>
          </Stack>
        </Paper>
      </Stack>
    );
  }

  // Free booking path
  if (usage?.isFree) {
    return <UserFreeBookingForm onCreated={onCreated} usage={usage} />;
  }

  // Paid booking path
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
              {t('steps.preparingPayment')}
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
