import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  Box, Button, Stack, Typography, CircularProgress, Alert,
  MenuItem, TextField,
} from '@mui/material';
import { tokens } from '../theme/tokens.js';
import BillingIntervalToggle from './common/BillingIntervalToggle.jsx';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../api/client.js';
import { createSetupIntent } from '../api/stripe.js';
import { fetchAvailableDeskProducts } from '../api/subscriptions.js';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const PT_STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = PT_STRIPE_KEY ? loadStripe(PT_STRIPE_KEY) : null;

// Plans that include a dedicated desk → the user must pick one before subscribing.
const DESK_PLAN_KEYS = new Set(['max']);
const DESK_PRODUCT_RE = /^MA1O\d[-_ ]?\d{1,2}$/i;

const PLANS = [
  {
    key: 'basic',
    name: 'BeWorkingVirtual',
    price: 15,
    description: {
      es: 'Dirección profesional en Málaga, domicilio legal y fiscal, recepción de correo y acceso a BeWorkingApp.',
      en: 'Professional address in Málaga, legal and fiscal domicile, mail reception, and full access to BeWorkingApp.',
    },
    features: {
      es: ['Domicilio fiscal y legal', 'Recepción de correo y paquetería', 'Logo en recepción', '5 días de oficina al mes', 'Acceso completo a BeWorkingApp'],
      en: ['Legal & fiscal address', 'Mail & parcel reception', 'Logo at reception', '5 office days per month', 'Full access to BeWorkingApp'],
    },
  },
  {
    key: 'max',
    name: 'BeWorkingDesk',
    price: 90,
    description: {
      es: 'Tu escritorio fijo en BeWorking: puesto reservado, acceso con BeKey y todas las ventajas de la comunidad.',
      en: 'Your dedicated desk at BeWorking: a reserved spot, BeKey access and all community perks.',
    },
    features: {
      es: ['Escritorio fijo reservado', 'Acceso 24/7 con BeKey', 'Salas de reuniones', 'Recepción de correo', 'Acceso completo a BeWorkingApp'],
      en: ['Reserved dedicated desk', '24/7 access with BeKey', 'Meeting rooms', 'Mail reception', 'Full access to BeWorkingApp'],
    },
  },
];

// Billing intervals. `months` drives the per-cycle total (price × months). The
// backend bills the monthly rate × months and never prorates; interval changes
// take effect at the next renewal.
const INTERVALS = [
  { key: 'month',     months: 1,  label: { es: 'Mensual',   en: 'Monthly' },  suffix: { es: '/mes',      en: '/mo' } },
  { key: 'half_year', months: 6,  label: { es: 'Semestral', en: 'Biannual' }, suffix: { es: '/semestre', en: '/6 mo' } },
  { key: 'year',      months: 12, label: { es: 'Anual',     en: 'Annual' },   suffix: { es: '/año',      en: '/yr' } },
];

/* ── Inline payment form for free → paid ── */
function PaymentForm({ onSuccess, onCancel, loading: parentLoading, lang }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);
    const { error: stripeError, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
    });
    if (stripeError) {
      setError(stripeError.message);
      setSubmitting(false);
    } else {
      onSuccess(setupIntent);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
        {lang === 'es' ? 'Datos de pago' : 'Payment details'}
      </Typography>
      <PaymentElement />
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button onClick={onCancel} disabled={submitting || parentLoading}>
          {lang === 'es' ? 'Cancelar' : 'Cancel'}
        </Button>
        <Button type="submit" variant="contained" disabled={submitting || !stripe || parentLoading}
          sx={{ borderRadius: '999px', px: 4, fontWeight: 600 }}>
          {submitting || parentLoading ? <CircularProgress size={20} color="inherit" /> : (lang === 'es' ? 'Confirmar y activar' : 'Confirm & activate')}
        </Button>
      </Stack>
    </form>
  );
}

export default function PlanUpgradeDialog({ open, onClose, currentPlan, subscriptionId, userProfile, onUpgraded }) {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'es' ? 'es' : 'en';
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Payment setup state (for free → paid)
  const [paymentStep, setPaymentStep] = useState(null); // null = plan selection, { plan, clientSecret, customerId, billingInterval }
  const [creatingSubscription, setCreatingSubscription] = useState(false);
  const [billingInterval, setBillingInterval] = useState('month'); // month | half_year | year
  // Desk assignment for the desk plan.
  const [deskProducts, setDeskProducts] = useState([]);
  const [deskPlanPending, setDeskPlanPending] = useState(null); // plan awaiting desk choice
  const [deskChoice, setDeskChoice] = useState('');

  const currentKey = currentPlan?.toLowerCase() || 'free';

  // Reset state when dialog opens/closes; load available desks on open.
  useEffect(() => {
    if (!open) {
      setPaymentStep(null);
      setError('');
      setSuccess('');
      setLoading(null);
      setCreatingSubscription(false);
      setBillingInterval('month');
      setDeskPlanPending(null);
      setDeskChoice('');
      return;
    }
    fetchAvailableDeskProducts()
      .then((list) => setDeskProducts(
        (list || []).filter((p) => DESK_PRODUCT_RE.test(p.nombre) && p.available !== false)))
      .catch(() => setDeskProducts([]));
  }, [open]);

  const handleSelect = async (plan, productoId) => {
    setLoading(plan.key);
    setError('');
    setSuccess('');

    try {
      if (currentKey === 'free' && plan.price > 0) {
        // Free → paid: create SetupIntent and show payment form
        const email = userProfile?.email;
        const name = userProfile?.name || email;
        if (!email) {
          setError(lang === 'es' ? 'No se encontró tu email.' : 'Email not found.');
          setLoading(null);
          return;
        }
        const data = await createSetupIntent({ customerEmail: email, customerName: name, tenant: 'beworking' });
        setPaymentStep({ plan, clientSecret: data.clientSecret, customerId: data.customerId, billingInterval, productoId: productoId || null });
        setDeskPlanPending(null);
        setLoading(null);
        return;
      }

      if (subscriptionId && plan.price > 0) {
        // Existing subscription → upgrade via API
        await apiFetch(`/subscriptions/${subscriptionId}/upgrade`, {
          method: 'POST',
          body: {
            plan: plan.key,
            monthlyAmount: plan.price,
            description: `Oficina Virtual ${plan.name}`,
            billingInterval,
            ...(productoId ? { productoId } : {}),
          },
        });
        setDeskPlanPending(null);
        setSuccess(lang === 'es'
          ? `Plan actualizado a ${plan.name} (${plan.price}€/mes)`
          : `Plan upgraded to ${plan.name} (€${plan.price}/month)`);
        onUpgraded?.();
        setTimeout(() => { onClose(); setSuccess(''); }, 2000);
      }
    } catch (err) {
      setError(err?.message || (lang === 'es' ? 'Error al cambiar de plan' : 'Error changing plan'));
    } finally {
      setLoading(null);
    }
  };

  const handlePaymentSuccess = async (setupIntent) => {
    // Card confirmed — now create the subscription via self-subscribe
    setCreatingSubscription(true);
    setError('');
    try {
      await apiFetch('/subscriptions/self-subscribe', {
        method: 'POST',
        body: {
          plan: paymentStep.plan.key,
          stripeCustomerId: paymentStep.customerId,
          paymentMethodId: setupIntent?.payment_method,
          billingInterval: paymentStep.billingInterval,
          ...(paymentStep.productoId ? { productoId: paymentStep.productoId } : {}),
        },
      });

      setPaymentStep(null);
      setSuccess(lang === 'es'
        ? `Plan ${paymentStep.plan.name} activado (${paymentStep.plan.price}€/mes)`
        : `${paymentStep.plan.name} plan activated (€${paymentStep.plan.price}/month)`);
      onUpgraded?.();
      setTimeout(() => { onClose(); setSuccess(''); }, 2500);
    } catch (err) {
      setError(err?.message || (lang === 'es' ? 'Error al crear la suscripción' : 'Error creating subscription'));
    } finally {
      setCreatingSubscription(false);
    }
  };

  // Payment step: show Stripe form
  if (paymentStep) {
    const pIv = INTERVALS.find((i) => i.key === paymentStep.billingInterval) || INTERVALS[0];
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: `${tokens.radius.lg}px` } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Stack>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {lang === 'es' ? `Activar plan ${paymentStep.plan.name}` : `Activate ${paymentStep.plan.name} plan`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {paymentStep.plan.price * pIv.months}€{pIv.suffix[lang]} · {paymentStep.plan.description[lang]}
            </Typography>
          </Stack>
          <IconButton onClick={onClose} size="small"><CloseRoundedIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <Elements stripe={stripePromise} options={{ clientSecret: paymentStep.clientSecret, appearance: { theme: 'stripe' } }}>
            <PaymentForm
              onSuccess={handlePaymentSuccess}
              onCancel={() => setPaymentStep(null)}
              loading={creatingSubscription}
              lang={lang}
            />
          </Elements>
        </DialogContent>
      </Dialog>
    );
  }

  // Desk-selection step — user picked the desk plan and must choose a free desk.
  if (deskPlanPending) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: `${tokens.radius.lg}px` } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {lang === 'es' ? 'Elige tu mesa' : 'Choose your desk'}
          </Typography>
          <IconButton onClick={onClose} size="small"><CloseRoundedIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {lang === 'es'
              ? `${deskPlanPending.name} incluye un escritorio fijo reservado. Selecciona la mesa que quieres.`
              : `${deskPlanPending.name} includes a reserved dedicated desk. Select the one you want.`}
          </Typography>
          {deskProducts.length === 0 ? (
            <Alert severity="warning">
              {lang === 'es'
                ? 'No hay mesas disponibles en este momento. Contáctanos y te ayudamos.'
                : 'No desks available right now. Please contact us and we will help.'}
            </Alert>
          ) : (
            <TextField
              select
              fullWidth
              label={lang === 'es' ? 'Mesa' : 'Desk'}
              value={deskChoice}
              onChange={(e) => setDeskChoice(e.target.value)}
            >
              {deskProducts.map((p) => (
                <MenuItem key={p.id} value={String(p.id)}>{p.nombre}</MenuItem>
              ))}
            </TextField>
          )}
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
            <Button onClick={() => setDeskPlanPending(null)} disabled={loading !== null}>
              {lang === 'es' ? 'Atrás' : 'Back'}
            </Button>
            <Button
              variant="contained"
              disabled={!deskChoice || loading !== null}
              onClick={() => handleSelect(deskPlanPending, deskChoice)}
              sx={{ borderRadius: '999px', px: 4, fontWeight: 600 }}
            >
              {loading !== null ? <CircularProgress size={20} color="inherit" /> : (lang === 'es' ? 'Continuar' : 'Continue')}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    );
  }

  // Plan selection step — plan cards + billing-interval toggle
  const activeInterval = INTERVALS.find((i) => i.key === billingInterval) || INTERVALS[0];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: `${tokens.radius.lg}px` } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {lang === 'es' ? 'Activa tu plan' : 'Activate your plan'}
        </Typography>
        <IconButton onClick={onClose} size="small"><CloseRoundedIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {/* Billing interval toggle: Mensual / Semestral / Anual */}
        <BillingIntervalToggle value={billingInterval} onChange={setBillingInterval} lang={lang} sx={{ mt: 1, mb: 2.5 }} />

        {/* Plan cards */}
        <Stack spacing={2}>
          {PLANS.map((plan) => {
            const isCurrent = currentKey === plan.key && billingInterval === 'month';
            const cycleTotal = plan.price * activeInterval.months;
            return (
              <Box
                key={plan.key}
                sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: { xs: 2.5, sm: 3 } }}
              >
                <Typography sx={{ fontSize: { xs: '1.4rem', sm: '1.6rem' }, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, mb: 1 }}>
                  {plan.name}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.55 }}>
                  {plan.description[lang]}
                </Typography>
                <Stack direction="row" alignItems="baseline" spacing={0.5}>
                  <Typography sx={{ fontSize: '2.2rem', fontWeight: 800, color: 'brand.green', lineHeight: 1, letterSpacing: '-0.02em' }}>{cycleTotal}€</Typography>
                  <Typography variant="body2" color="text.secondary">{activeInterval.suffix[lang]}</Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', minHeight: 18, mb: 2 }}>
                  {activeInterval.months > 1
                    ? (lang === 'es'
                        ? `${plan.price}€/mes · facturado cada ${activeInterval.months} meses`
                        : `€${plan.price}/mo · billed every ${activeInterval.months} months`)
                    : ''}
                </Typography>
                <Stack spacing={1} sx={{ mb: 2.5 }}>
                  {(plan.features[lang] || plan.features.en).map((f) => (
                    <Stack key={f} direction="row" spacing={1} alignItems="center">
                      <CheckCircleOutlinedIcon sx={{ fontSize: 18, color: 'brand.green' }} />
                      <Typography variant="body2">{f}</Typography>
                    </Stack>
                  ))}
                </Stack>
                {isCurrent ? (
                  <Button variant="outlined" fullWidth disabled sx={{ borderRadius: '999px', textTransform: 'none', fontWeight: 600, py: 1.2 }}>
                    {lang === 'es' ? 'Plan actual' : 'Current plan'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => {
                      if (DESK_PLAN_KEYS.has(plan.key)) {
                        setError(''); setDeskChoice(''); setDeskPlanPending(plan);
                      } else {
                        handleSelect(plan);
                      }
                    }}
                    disabled={loading !== null}
                    sx={{ borderRadius: '999px', textTransform: 'none', fontWeight: 700, py: 1.2, fontSize: '0.95rem' }}
                  >
                    {loading === plan.key
                      ? <CircularProgress size={20} color="inherit" />
                      : (subscriptionId
                          ? (lang === 'es' ? 'Cambiar a este plan' : 'Switch to this plan')
                          : (lang === 'es' ? 'Registrarse online →' : 'Register online →'))}
                  </Button>
                )}
              </Box>
            );
          })}
        </Stack>

        <Typography variant="body2" sx={{ textAlign: 'center', mt: 2, fontWeight: 600, color: 'brand.green' }}>
          {lang === 'es' ? 'Precio + IVA. Sin permanencia.' : 'Price + VAT. No commitment.'}
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
