import { useState } from 'react';
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

export default function PlanUpgradeDialog({ open, onClose, currentPlan, subscriptionId, onUpgraded }) {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'es' ? 'es' : 'en';
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentKey = currentPlan?.toLowerCase() || 'free';

  const handleSelect = async (plan) => {
    setLoading(plan.key);
    setError('');
    setSuccess('');

    try {
      if (currentKey === 'free' && plan.price > 0) {
        // Free → paid: redirect to oficina-virtual to set up payment
        window.open(`https://be-working.com/malaga/oficina-virtual?plan=${plan.key}`, '_blank');
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
                  p: 2.5,
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
                      fontWeight: 700, fontSize: '0.7rem', bgcolor: 'primary.main', color: '#fff',
                      borderRadius: '999px', px: 1.5, height: 24,
                    }}
                  />
                )}

                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{plan.name}</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5, fontSize: '0.85rem', lineHeight: 1.5 }}>
                  {plan.description[lang]}
                </Typography>

                <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: '2.25rem', fontWeight: 800, color: 'primary.main', lineHeight: 1 }}>{plan.price}€</Typography>
                  <Typography variant="body2" color="text.secondary">/mes</Typography>
                </Stack>

                <Stack spacing={1.25} sx={{ flex: 1, mb: 2.5 }}>
                  {(plan.features[lang] || plan.features.en).map((f) => (
                    <Stack key={f} direction="row" spacing={1} alignItems="flex-start">
                      <CheckCircleOutlinedIcon sx={{ fontSize: 18, color: 'primary.main', mt: 0.2 }} />
                      <Typography variant="body2" sx={{ lineHeight: 1.5 }}>{f}</Typography>
                    </Stack>
                  ))}
                </Stack>

                {isCurrent ? (
                  <Button
                    variant="outlined"
                    fullWidth
                    disabled
                    sx={{ borderRadius: '999px', textTransform: 'none', fontWeight: 600, py: 1 }}
                  >
                    {lang === 'es' ? 'Plan actual' : 'Current plan'}
                  </Button>
                ) : (
                  <Button
                    variant={plan.price > 0 ? 'contained' : 'outlined'}
                    fullWidth
                    onClick={() => handleSelect(plan)}
                    disabled={loading !== null}
                    sx={{ borderRadius: '999px', textTransform: 'none', fontWeight: 600, py: 1 }}
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

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
          {lang === 'es'
            ? 'Todos los precios + IVA. Sin permanencia. Cambia o cancela en cualquier momento.'
            : 'All prices + VAT. No commitment. Change or cancel anytime.'}
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
