import { useEffect, useRef, useState } from 'react';
import {
  Box, Paper, Stack, Typography, CircularProgress, Alert, Snackbar, Avatar, Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import { tokens } from '../../theme/tokens.js';
import { fetchMyAccess, openDoor } from '../../api/bekey.js';

// Slide-to-unlock control: drag the green knob to the right past ~75% of the
// track to trigger the open; release before that and it snaps back. Pointer
// events cover both mouse and touch. While opening, the knob locks at the end
// and shows a spinner; offline doors are dimmed and non-draggable.
const SlideToOpen = ({ onOpen, opening, offline, theme, labelOpen, labelOffline, slideHint }) => {
  const TRACK_W = 208;
  const KNOB = 44;
  const PAD = 6;
  const maxX = TRACK_W - KNOB - PAD * 2;
  const threshold = maxX * 0.75;
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef(0);

  useEffect(() => {
    if (opening) setX(maxX);
    else if (!dragging) setX(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opening]);

  const disabled = offline || opening;
  const onDown = (e) => {
    if (disabled) return;
    setDragging(true);
    startRef.current = e.clientX - x;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e) => {
    if (!dragging) return;
    setX(Math.min(maxX, Math.max(0, e.clientX - startRef.current)));
  };
  const onUp = (e) => {
    if (!dragging) return;
    setDragging(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    if (x >= threshold) { setX(maxX); onOpen(); } else { setX(0); }
  };

  const progress = maxX > 0 ? x / maxX : 0;
  return (
    <Tooltip title={offline ? labelOffline : labelOpen}>
      <Box
        aria-label={labelOpen}
        aria-disabled={offline}
        sx={{
          position: 'relative',
          width: TRACK_W,
          height: 56,
          borderRadius: 999,
          display: 'flex',
          alignItems: 'center',
          px: `${PAD}px`,
          overflow: 'hidden',
          flexShrink: 0,
          cursor: disabled ? 'not-allowed' : 'grab',
          opacity: offline ? 0.4 : 1,
          background: `linear-gradient(90deg, ${alpha(theme.palette.brand.green, 0.45)} 0%, ${alpha(theme.palette.brand.green, 0.04)} 100%)`,
        }}
      >
        <Typography
          sx={{
            position: 'absolute',
            left: KNOB,
            right: 0,
            textAlign: 'center',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'brand.green',
            pointerEvents: 'none',
            opacity: offline ? 0.7 : Math.max(0, 1 - progress * 1.6),
            transition: dragging ? 'none' : 'opacity .2s',
          }}
        >
          {offline ? labelOffline : slideHint}
        </Typography>
        <Avatar
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          sx={{
            bgcolor: 'brand.green',
            width: KNOB,
            height: KNOB,
            zIndex: 1,
            boxShadow: `0 2px 8px ${alpha(theme.palette.brand.green, 0.5)}`,
            transform: `translateX(${x}px)`,
            transition: dragging ? 'none' : 'transform .25s',
            touchAction: 'none',
            cursor: disabled ? 'not-allowed' : 'grab',
            '&:active': disabled ? {} : { cursor: 'grabbing' },
          }}
        >
          {opening
            ? <CircularProgress size={18} sx={{ color: 'common.white' }} />
            : (progress >= 0.75
              ? <LockOpenRoundedIcon sx={{ color: 'common.white' }} />
              : <LockRoundedIcon sx={{ color: 'common.white' }} />)}
        </Avatar>
      </Box>
    </Tooltip>
  );
};

const BeKey = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [devices, setDevices] = useState([]);
  const [pin, setPin] = useState(null);
  const [openingId, setOpeningId] = useState(null);
  const [toast, setToast] = useState(null);
  const [admin, setAdmin] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchMyAccess();
      setDevices(res?.devices || []);
      setPin(res?.pin || null);
      setAdmin(!!res?.admin);
    } catch (e) {
      setError(e?.message || t('bekey.user.loadError', { defaultValue: 'No se pudo cargar el acceso' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const handleOpen = async (device) => {
    if (!device.online) return;
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
        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: 'common.black' }}>
          {t('bekey.user.title', { defaultValue: 'Mis puertas' })}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {admin
            ? t('bekey.user.subtitleAdmin', { defaultValue: 'Acceso de administrador: puedes abrir todas las puertas del centro.' })
            : t('bekey.user.subtitle', { defaultValue: 'Abre las puertas a las que tienes acceso. Tu PIN sirve como alternativa en el teclado.' })}
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
          <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.2em', fontFamily: 'monospace', color: 'common.black' }}>
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
        <Stack spacing={2}>
          {devices.map((d) => {
            const opening = openingId === d.id;
            const offline = !d.online;
            return (
              <Paper
                key={d.id}
                elevation={0}
                sx={{
                  px: 3,
                  py: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: `${tokens.radius.lg}px`,
                  bgcolor: 'background.paper',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: 'common.black' }}>{d.name}</Typography>
                  {offline && (
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontWeight: 600 }}>
                      {t('bekey.offline', { defaultValue: 'Sin conexión' })}
                    </Typography>
                  )}
                </Box>

                <SlideToOpen
                  onOpen={() => handleOpen(d)}
                  opening={opening}
                  offline={offline}
                  theme={theme}
                  labelOpen={t('bekey.user.open', { defaultValue: 'Abrir' })}
                  labelOffline={t('bekey.offline', { defaultValue: 'Sin conexión' })}
                  slideHint={t('bekey.user.slideToOpen', { defaultValue: 'Desliza para abrir' })}
                />
              </Paper>
            );
          })}
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
