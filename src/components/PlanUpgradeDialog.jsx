import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  Box, Button, Chip, Stack, Typography, CircularProgress, Alert,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
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
    key: 'free',
    name: 'Free',
    price: 0,
    description: { es: 'Empieza gratis con tu cuenta.', en: 'Start free with your account.' },
    features: {
      es: ['Plataforma BeWorking', 'Reserva de espacios BeWorking', 'Panel de gestión', 'Facturación básica', 'Soporte por email'],
      en: ['BeWorking Platform', 'BeWorking space booking', 'Management dashboard', 'Basic invoicing', 'Email support'],
    },
  },
  {
    key: 'basic',
    name: 'Basic',
    price: 15,
    popular: true,
    description: { es: 'Dirección empresarial registrada.', en: 'Registered business address.' },
    features: {
      es: ['Todo en Free', 'Domicilio fiscal y legal', 'Recepción de correo', 'Buzón digital', 'Logo en recepción'],
      en: ['Everything in Free', 'Legal & fiscal address', 'Mail reception', 'Digital mailbox', 'Logo at reception'],
    },
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 25,
    description: { es: 'Todo en Basic más Web personalizada.', en: 'Everything in Basic plus custom website.' },
    features: {
      es: ['Todo en Basic', 'Atención de llamadas', 'Multi-usuario (3 usuarios)', 'Gestor dedicado', 'Web corporativa'],
      en: ['Everything in Basic', 'Call handling', 'Multi-user (3 users)', 'Dedicated manager', 'Corporate website'],
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
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
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

  // Plan selection step
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {lang === 'es' ? 'Elige tu plan' : 'Choose your plan'}
        </Typography>
        <IconButton onClick={onClose} size="small"><CloseRoundedIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, py: 1 }}>
          {PLANS.map((plan) => {
            const isCurrent = currentKey === plan.key;

            return (
              <Box
                key={plan.key}
                sx={{
                  position: 'relative',
                  border: '2px solid',
                  borderColor: plan.popular ? 'primary.main' : 'divider',
                  borderRadius: 3,
                  p: 3.5,
                  display: 'flex',
                  flexDirection: 'column',
                  ...(isCurrent && { bgcolor: alpha('#009624', 0.04) }),
                }}
              >
                {plan.popular && (
                  <Chip
                    label="POPULAR"
                    size="small"
                    sx={{
                      position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                      fontWeight: 700, fontSize: '0.7rem', bgcolor: 'brand.green', color: '#fff',
                      borderRadius: '999px', px: 1.5, height: 24,
                    }}
                  />
                )}

                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{plan.name}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5, fontSize: '0.85rem', lineHeight: 1.5 }}>
                  {plan.description[lang]}
                </Typography>

                <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: '2.25rem', fontWeight: 800, color: 'brand.green', lineHeight: 1 }}>{plan.price}€</Typography>
                  <Typography variant="body2" color="text.secondary">/mes</Typography>
                </Stack>

                <Stack spacing={1.25} sx={{ flex: 1, mb: 2.5 }}>
                  {(plan.features[lang] || plan.features.en).map((f) => (
                    <Stack key={f} direction="row" spacing={1} alignItems="flex-start">
                      <CheckCircleOutlinedIcon sx={{ fontSize: 18, color: 'brand.green', mt: 0.2 }} />
                      <Typography variant="body2" sx={{ lineHeight: 1.5 }}>{f}</Typography>
                    </Stack>
                  ))}
                </Stack>

                {isCurrent ? (
                  <Button
                    variant="outlined"
                    fullWidth
                    disabled
                    sx={{ borderRadius: '999px', textTransform: 'none', fontWeight: 600, py: 1.25 }}
                  >
                    {lang === 'es' ? 'Plan actual' : 'Current plan'}
                  </Button>
                ) : (
                  <Button
                    variant={plan.popular ? 'contained' : 'outlined'}
                    fullWidth
                    onClick={() => handleSelect(plan)}
                    disabled={loading !== null}
                    sx={{ borderRadius: '999px', textTransform: 'none', fontWeight: 600, py: 1.25 }}
                  >
                    {loading === plan.key ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      lang === 'es' ? 'Elegir plan' : 'Choose plan'
                    )}
                  </Button>
                )}
              </Box>
            );
          })}
        </Box>

        <Typography variant="body2" sx={{ textAlign: 'center', color: 'text.secondary', mt: 3 }}>
          {lang === 'es'
            ? 'Todos los planes incluyen la Plataforma BeWorking completa: panel de gestión, facturación y todas las herramientas. Cambia de plan en cualquier momento.'
            : 'All plans include the full BeWorking Platform: management dashboard, invoicing and all tools. Change your plan at any time.'}
        </Typography>
        <Typography variant="body2" sx={{ textAlign: 'center', mt: 1.5, fontWeight: 600, color: 'brand.green' }}>
          {lang === 'es' ? 'Todos los precios + IVA. Sin permanencia.' : 'All prices + VAT. No commitment.'}
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
