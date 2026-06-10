import { useEffect, useRef, useState } from 'react';
import {
  Box, Paper, Stack, Typography, CircularProgress, Alert, Snackbar, Avatar, Tooltip, Button,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import DirectionsRoundedIcon from '@mui/icons-material/DirectionsRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import { tokens } from '../../theme/tokens.js';
import { fetchMyAccess, openDoor } from '../../api/bekey.js';
import ShareAccessPanel from './user/ShareAccessPanel.jsx';

// All BeKey doors are at the single MA1 center (BeWorking Málaga). Borrowed from
// the Business Address tab so the opener shows where the building is.
const MAP_SRC = 'https://maps.google.com/maps?q=BeWorking+Coworking+M%C3%A1laga+Calle+Alejandro+Dumas+17&t=&z=16&ie=UTF8&iwloc=&output=embed';
const MAP_ADDRESS = 'Calle Alejandro Dumas 17, 29004 Málaga, Spain';

// Slide-to-unlock control: drag the green knob to the right past ~75% of the
// track to trigger the open; release before that and it snaps back. Pointer
// events cover both mouse and touch. While opening, the knob locks at the end
// and shows a spinner; offline doors are dimmed and non-draggable.
const SlideToOpen = ({ onOpen, opening, offline, theme, labelOpen, labelOffline, slideHint }) => {
  const KNOB = 52;
  const PAD = 6;
  const trackRef = useRef(null);
  const [trackW, setTrackW] = useState(0);
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startRef = useRef(0);

  // The track fills the card (flex:1), so its width is dynamic — measure it to
  // compute the knob's travel. ResizeObserver keeps it correct on rotate/resize.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    const update = () => setTrackW(el.clientWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const maxX = Math.max(0, trackW - KNOB - PAD * 2);
  const threshold = maxX * 0.75;

  useEffect(() => {
    if (opening) setX(maxX);
    else if (!dragging) setX(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opening, maxX]);

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
        ref={trackRef}
        aria-label={labelOpen}
        aria-disabled={offline}
        sx={{
          position: 'relative',
          flex: 1,
          minWidth: 0,
          width: '100%',
          maxWidth: { sm: 460 },
          height: 64,
          borderRadius: 999,
          display: 'flex',
          alignItems: 'center',
          px: `${PAD}px`,
          overflow: 'hidden',
          cursor: disabled ? 'not-allowed' : 'grab',
          opacity: offline ? 0.4 : 1,
          background: `linear-gradient(90deg, ${alpha(theme.palette.brand.green, 0.5)} 0%, ${alpha(theme.palette.brand.green, 0.06)} 55%, ${alpha(theme.palette.brand.green, 0.03)} 100%)`,
        }}
      >
        <Typography
          sx={{
            position: 'absolute',
            left: KNOB + PAD,
            right: 16,
            textAlign: 'center',
            fontSize: '0.95rem',
            fontWeight: 700,
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
            boxShadow: `0 2px 10px ${alpha(theme.palette.brand.green, 0.5)}`,
            transform: `translateX(${x}px)`,
            transition: dragging ? 'none' : 'transform .25s',
            touchAction: 'none',
            cursor: disabled ? 'not-allowed' : 'grab',
            '&:active': disabled ? {} : { cursor: 'grabbing' },
          }}
        >
          {opening
            ? <CircularProgress size={20} sx={{ color: 'common.white' }} />
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
  const [canShare, setCanShare] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchMyAccess();
      setDevices(res?.devices || []);
      setPin(res?.pin || null);
      setAdmin(!!res?.admin);
      setCanShare(!!res?.canShare);
    } catch (e) {
      setError(e?.message || t('bekey.user.loadError', { defaultValue: 'No se pudo cargar el acceso' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const handleGetDirections = () => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(MAP_ADDRESS)}`,
      '_blank', 'noopener',
    );
  };

  const handleOpen = async (device) => {
    if (!device.online) return;
    setOpeningId(device.id);
    try {
      await openDoor(device.id);
      setToast({ severity: 'success', message: t('bekey.user.opened', { name: device.name, defaultValue: '{{name}} abierta' }) });
    } catch (e) {
      // The backend returns a JSON body; for an unreachable door it's
      // { error: 'hardware_offline', ... } — show a clear, transient message.
      let offline = false;
      try { offline = JSON.parse(e?.message || '{}')?.error === 'hardware_offline'; } catch (_) { /* not JSON */ }
      const message = offline
        ? t('bekey.user.offlineOnOpen', { name: device.name, defaultValue: '{{name}} no responde ahora mismo. Inténtalo de nuevo en un momento o usa tu PIN.' })
        : (e?.message || t('bekey.user.openError', { defaultValue: 'No se pudo abrir la puerta' }));
      setToast({ severity: offline ? 'warning' : 'error', message });
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

      {!loading && !admin && devices.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            spacing={1.5}
            sx={{ mb: 1.5 }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <PlaceRoundedIcon sx={{ fontSize: 18, color: 'brand.green' }} />
              <Box>
                <Typography sx={{ fontWeight: 700, color: 'common.black', lineHeight: 1.2 }}>
                  {t('bekey.user.locationTitle', { defaultValue: 'Ubicación' })}
                </Typography>
                <Typography variant="body2" color="text.secondary">{MAP_ADDRESS}</Typography>
              </Box>
            </Stack>
            <Button
              variant="contained"
              startIcon={<DirectionsRoundedIcon />}
              onClick={handleGetDirections}
              sx={{
                bgcolor: 'brand.green',
                '&:hover': { bgcolor: 'brand.greenHover' },
                borderRadius: 999,
                textTransform: 'none',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {t('bekey.user.getDirections', { defaultValue: 'Cómo llegar' })}
            </Button>
          </Stack>
          <Paper elevation={0} sx={{ borderRadius: `${tokens.radius.lg}px`, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
            <Box sx={{ position: 'relative', height: { xs: 220, sm: 300 } }}>
              <iframe
                title={t('bekey.user.locationTitle', { defaultValue: 'Ubicación' })}
                src={MAP_SRC}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </Box>
          </Paper>
        </Box>
      )}

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
                  px: { xs: 2.5, sm: 3 },
                  py: 2.5,
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: { xs: 'stretch', sm: 'center' },
                  gap: { xs: 1.5, sm: 2 },
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: `${tokens.radius.lg}px`,
                  bgcolor: 'background.paper',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                }}
              >
                <Box sx={{ width: { xs: '100%', sm: 200 }, flexShrink: 0, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', lineHeight: 1.15, color: 'common.black' }}>{d.name}</Typography>
                  {offline && (
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', fontWeight: 600 }}>
                      {t('bekey.offline', { defaultValue: 'Sin conexión' })}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: { sm: 'flex-end' } }}>
                  <SlideToOpen
                    onOpen={() => handleOpen(d)}
                    opening={opening}
                    offline={offline}
                    theme={theme}
                    labelOpen={t('bekey.user.open', { defaultValue: 'Abrir' })}
                    labelOffline={t('bekey.offline', { defaultValue: 'Sin conexión' })}
                    slideHint={t('bekey.user.slideToOpen', { defaultValue: 'Desliza para abrir' })}
                  />
                </Box>
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* Share my access — members holding their OWN access only. Guests (shared
          grant) and admins (master key) can't re-share. */}
      {!loading && canShare && <ShareAccessPanel />}

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
