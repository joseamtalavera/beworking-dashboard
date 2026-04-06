import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent,
  Box, Button, Chip, Divider, Stack, Typography, CircularProgress, Alert,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import IconButton from '@mui/material/IconButton';
import { useTranslation } from 'react-i18next';

const PLANS = [
  {
    key: 'basic',
    name: 'Basic',
    price: 15,
    popular: true,
    features: {
      es: ['Domicilio fiscal y legal', 'Recepción de correo', 'Buzón digital', 'Plataforma BeWorking completa', 'Reserva de espacios BeWorking'],
      en: ['Legal & fiscal address', 'Mail reception', 'Digital mailbox', 'Full BeWorking Platform', 'BeWorking space booking'],
    },
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 25,
    features: {
      es: ['Todo en Basic', 'Atención de llamadas', 'Multi-usuario (3 usuarios)', 'Logo en recepción', 'Web corporativa'],
      en: ['Everything in Basic', 'Call handling', 'Multi-user (3 users)', 'Logo at reception', 'Corporate website'],
    },
  },
  {
    key: 'max',
    name: 'Max',
    price: 90,
    features: {
      es: ['Todo en Pro', 'Gestor dedicado', 'Prioridad en soporte', 'Integraciones', 'Automatizaciones'],
      en: ['Everything in Pro', 'Dedicated manager', 'Priority support', 'Integrations', 'Automations'],
    },
  },
];

export default function PlanUpgradeDialog({ open, onClose, currentPlan, onSelectPlan }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'es' ? 'es' : 'en';
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState('');

  const handleSelect = async (plan) => {
    setLoading(plan.key);
    setError('');
    try {
      if (onSelectPlan) {
        await onSelectPlan(plan);
      }
      onClose();
    } catch (err) {
      setError(err?.message || 'Error al cambiar de plan');
    } finally {
      setLoading(null);
    }
  };

  const currentKey = currentPlan?.toLowerCase() || 'free';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {t('plans.title', { defaultValue: lang === 'es' ? 'Elige tu plan' : 'Choose your plan' })}
        </Typography>
        <IconButton onClick={onClose} size="small"><CloseRoundedIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, py: 1 }}>
          {PLANS.map((plan) => {
            const isCurrent = currentKey === plan.key;
            const isUpgrade = !isCurrent && (
              (currentKey === 'free') ||
              (currentKey === 'basic' && (plan.key === 'pro' || plan.key === 'max')) ||
              (currentKey === 'pro' && plan.key === 'max')
            );

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
                      fontWeight: 700, fontSize: '0.65rem', bgcolor: 'primary.main', color: '#fff',
                    }}
                  />
                )}

                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>{plan.name}</Typography>

                <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mb: 2 }}>
                  <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: 'primary.main' }}>{plan.price}€</Typography>
                  <Typography variant="body2" color="text.secondary">/mes</Typography>
                </Stack>

                <Divider sx={{ mb: 2 }} />

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
                    variant={isUpgrade ? 'contained' : 'outlined'}
                    fullWidth
                    onClick={() => handleSelect(plan)}
                    disabled={loading !== null}
                    sx={{ borderRadius: '999px', textTransform: 'none', fontWeight: 600, py: 1 }}
                  >
                    {loading === plan.key ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : isUpgrade ? (
                      lang === 'es' ? 'Actualizar' : 'Upgrade'
                    ) : (
                      lang === 'es' ? 'Cambiar' : 'Switch'
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
