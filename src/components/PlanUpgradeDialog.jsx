import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  Box, Button, Stack, Typography, CircularProgress, Alert,
} from '@mui/material';
import { tokens } from '../theme/tokens.js';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../api/client.js';
import { createSetupIntent } from '../api/stripe.js';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const PT_STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = PT_STRIPE_KEY ? loadStripe(PT_STRIPE_KEY) : null;

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
  const [paymentStep, setPaymentStep] = useState(null); // null = plan selection, { plan, clientSecret, customerId }
  const [creatingSubscription, setCreatingSubscription] = useState(false);

  const currentKey = currentPlan?.toLowerCase() || 'free';

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setPaymentStep(null);
      setError('');
      setSuccess('');
      setLoading(null);
      setCreatingSubscription(false);
    }
  }, [open]);

  const handleSelect = async (plan) => {
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
        setPaymentStep({ plan, clientSecret: data.clientSecret, customerId: data.customerId });
        setLoading(null);
        return;
      }

      if (subscriptionId && plan.price > 0) {
        // Existing subscription → upgrade via API
        await apiFetch(`/subscriptions/${subscriptionId}/upgrade`, {
          method: 'POST',
          body: {
            monthlyAmount: plan.price,
            description: `Oficina Virtual ${plan.name}`,
          },
        });
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
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: `${tokens.radius.lg}px` } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Stack>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {lang === 'es' ? `Activar plan ${paymentStep.plan.name}` : `Activate ${paymentStep.plan.name} plan`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {paymentStep.plan.price}€/mes · {paymentStep.plan.description[lang]}
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

  // Plan selection step — single BeWorkingVirtual card
  const plan = PLANS[0];
  const isCurrent = currentKey === plan.key;

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

        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            p: { xs: 3, sm: 4 },
            mt: 1,
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: '1.75rem', sm: '2rem' },
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              mb: 1.5,
            }}
          >
            BeWorking
            <Box component="span" sx={{ color: 'brand.green' }}>Virtual</Box>
          </Typography>

          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5, lineHeight: 1.55 }}>
            {plan.description[lang]}
          </Typography>

          <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: '2.5rem', fontWeight: 800, color: 'brand.green', lineHeight: 1, letterSpacing: '-0.02em' }}>{plan.price}€</Typography>
            <Typography variant="body2" color="text.secondary">/{lang === 'es' ? 'mes' : 'month'}</Typography>
          </Stack>

          <Stack spacing={1.25} sx={{ mb: 3 }}>
            {(plan.features[lang] || plan.features.en).map((f) => (
              <Stack key={f} direction="row" spacing={1} alignItems="center">
                <CheckCircleOutlinedIcon sx={{ fontSize: 18, color: 'brand.green' }} />
                <Typography variant="body2">{f}</Typography>
              </Stack>
            ))}
          </Stack>

          {isCurrent ? (
            <Button variant="outlined" fullWidth disabled sx={{ borderRadius: '999px', textTransform: 'none', fontWeight: 600, py: 1.4 }}>
              {lang === 'es' ? 'Plan actual' : 'Current plan'}
            </Button>
          ) : (
            <Button
              variant="contained"
              fullWidth
              onClick={() => handleSelect(plan)}
              disabled={loading !== null}
              sx={{ borderRadius: '999px', textTransform: 'none', fontWeight: 700, py: 1.4, fontSize: '1rem' }}
            >
              {loading === plan.key
                ? <CircularProgress size={20} color="inherit" />
                : (lang === 'es' ? 'Registrarse online →' : 'Register online →')}
            </Button>
          )}
        </Box>

        <Typography variant="body2" sx={{ textAlign: 'center', mt: 2, fontWeight: 600, color: 'brand.green' }}>
          {lang === 'es' ? 'Precio + IVA. Sin permanencia.' : 'Price + VAT. No commitment.'}
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
