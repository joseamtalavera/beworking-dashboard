import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useTheme, alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';

const SUBSCRIBE_URL = 'https://oficinavirtual.be-working.com';

const SubscriptionGate = ({ tabLabel }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center',
        px: 3,
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
        }}
      >
        <LockOutlinedIcon sx={{ fontSize: 40, color: 'primary.main' }} />
      </Box>

      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        {tabLabel}
      </Typography>

      <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 440, mb: 1 }}>
        {t('subscription.gateDescription', {
          defaultValue: 'Esta funcionalidad está incluida en tu plan de Oficina Virtual.',
        })}
      </Typography>

      <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main', mb: 3 }}>
        {t('subscription.gatePrice', {
          defaultValue: 'Activa tu Oficina Virtual desde 15€/mes',
        })}
      </Typography>

      <Button
        variant="contained"
        size="large"
        href={SUBSCRIBE_URL}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          px: 5,
          py: 1.5,
          fontWeight: 700,
          fontSize: '1rem',
          borderRadius: 2,
          textTransform: 'none',
        }}
      >
        {t('subscription.gateCta', { defaultValue: 'Ver planes' })}
      </Button>
    </Box>
  );
};

export default SubscriptionGate;
