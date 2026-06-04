import { useEffect, useState } from 'react';
import {
  Box, Paper, Stack, Typography, Button, CircularProgress, Alert, Snackbar,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import MeetingRoomRoundedIcon from '@mui/icons-material/MeetingRoomRounded';
import { tokens } from '../../theme/tokens.js';
import { fetchMyAccess, openDoor } from '../../api/bekey.js';

const BeKey = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [devices, setDevices] = useState([]);
  const [pin, setPin] = useState(null);
  const [openingId, setOpeningId] = useState(null);
  const [toast, setToast] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchMyAccess();
      setDevices(res?.devices || []);
      setPin(res?.pin || null);
    } catch (e) {
      setError(e?.message || t('bekey.user.loadError', { defaultValue: 'No se pudo cargar el acceso' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const handleOpen = async (device) => {
    setOpeningId(device.id);
    try {
      await openDoor(device.id);
      setToast({ severity: 'success', message: t('bekey.user.opened', { name: device.name, defaultValue: '{{name}} abierta' }) });
    } catch (e) {
      setToast({ severity: 'error', message: e?.message || t('bekey.user.openError', { defaultValue: 'No se pudo abrir la puerta' }) });
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: `${tokens.radius.lg}px`,
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        background: `linear-gradient(140deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[100]} 50%, ${theme.palette.background.paper} 100%)`,
      }}
    >
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'brand.green', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {t('bekey.user.eyebrow', { defaultValue: 'Acceso' })}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
          {t('bekey.user.title', { defaultValue: 'Mis puertas' })}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('bekey.user.subtitle', { defaultValue: 'Abre las puertas a las que tienes acceso. Tu PIN sirve como alternativa en el teclado.' })}
        </Typography>
      </Stack>

      {pin && (
        <Paper
          elevation={0}
          sx={{ mb: 3, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid', borderColor: 'divider', borderRadius: `${tokens.radius.md}px`, bgcolor: alpha(theme.palette.background.default, 0.6) }}
        >
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {t('bekey.user.pinLabel', { defaultValue: 'PIN de teclado' })}
          </Typography>
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.2em', fontFamily: 'monospace' }}>
            {pin}
          </Typography>
        </Paper>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>
      ) : devices.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
          {t('bekey.user.noDoors', { defaultValue: 'No tienes puertas asignadas.' })}
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {devices.map((d) => (
            <Paper
              key={d.id}
              elevation={0}
              sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid', borderColor: 'divider', borderRadius: `${tokens.radius.md}px` }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <MeetingRoomRoundedIcon sx={{ color: 'brand.green' }} />
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>{d.name}</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: d.online ? 'success.main' : 'text.disabled' }}>
                    {d.online ? t('bekey.online', { defaultValue: 'En línea' }) : t('bekey.offline', { defaultValue: 'Sin conexión' })}
                  </Typography>
                </Box>
              </Stack>
              <Button
                variant="contained"
                disableElevation
                startIcon={openingId === d.id ? <CircularProgress size={16} color="inherit" /> : <LockOpenRoundedIcon />}
                disabled={openingId === d.id}
                onClick={() => handleOpen(d)}
                sx={{ textTransform: 'none', fontWeight: 600, bgcolor: 'brand.green', '&:hover': { bgcolor: 'brand.greenHover' } }}
              >
                {t('bekey.user.open', { defaultValue: 'Abrir' })}
              </Button>
            </Paper>
          ))}
        </Stack>
      )}

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast && (
          <Alert onClose={() => setToast(null)} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
            {toast.message}
          </Alert>
        )}
      </Snackbar>
    </Paper>
  );
};

export default BeKey;
