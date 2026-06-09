import { useEffect, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Box, Paper, Stack, Typography, Button, IconButton, TextField, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, CircularProgress,
} from '@mui/material';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import i18n from '../../../i18n/i18n.js';
import { tokens } from '../../../theme/tokens.js';
import { fetchMyShares, createShare, revokeShare } from '../../../api/bekey.js';

const isEN = () => (i18n.language || 'es').toLowerCase().startsWith('en');
const L = (es, en) => (isEN() ? en : es);
const MAX_HOURS = 24;

// Date <-> datetime-local input string (local time, no seconds).
const toLocalInput = (d) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

// Default window: now .. now + 4h.
const defaultForm = () => {
  const start = new Date();
  const end = new Date(start.getTime() + 4 * 3600 * 1000);
  return { guestName: '', guestEmail: '', start: toLocalInput(start), end: toLocalInput(end) };
};

const ShareAccessPanel = () => {
  const theme = useTheme();
  const green = theme.palette.brand?.green || '#009624';
  const locale = isEN() ? 'en-US' : 'es-ES';

  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const load = () => {
    setLoading(true);
    fetchMyShares()
      .then((data) => setShares(Array.isArray(data) ? data : []))
      .catch(() => setShares([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const setField = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleOpen = () => { setForm(defaultForm()); setError(''); setOpen(true); };

  const handleSubmit = async () => {
    setError('');
    if (!form.guestEmail.trim()) { setError(L('Indica el email del invitado.', 'Enter the guest email.')); return; }
    const start = new Date(form.start);
    const end = new Date(form.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) { setError(L('Fechas no válidas.', 'Invalid dates.')); return; }
    if (end <= start) { setError(L('El fin debe ser posterior al inicio.', 'End must be after start.')); return; }
    if (end <= new Date()) { setError(L('El fin está en el pasado.', 'End is in the past.')); return; }
    if ((end - start) / 3600000 > MAX_HOURS) { setError(L(`Máximo ${MAX_HOURS} horas.`, `Up to ${MAX_HOURS} hours.`)); return; }

    setSubmitting(true);
    try {
      await createShare({
        guestName: form.guestName.trim() || null,
        guestEmail: form.guestEmail.trim(),
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
      });
      setOpen(false);
      setToast({ severity: 'success', message: L('Acceso compartido', 'Access shared') });
      load();
    } catch (e) {
      setError(e?.message || L('No se pudo compartir el acceso', "Couldn't share access"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (id) => {
    try {
      await revokeShare(id);
      setToast({ severity: 'success', message: L('Acceso revocado', 'Access revoked') });
      load();
    } catch (e) {
      setToast({ severity: 'error', message: e?.message || L('No se pudo revocar', "Couldn't revoke") });
    }
  };

  const fmt = (iso) => new Date(iso).toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const fieldSx = { '& .MuiOutlinedInput-root': { borderRadius: `${tokens.radius.md}px` } };

  return (
    <Paper
      elevation={0}
      sx={{ mt: 3, p: { xs: 2.5, md: 3 }, border: '1px solid', borderColor: 'divider', borderRadius: `${tokens.radius.lg}px`, bgcolor: 'background.paper' }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={1.5}>
        <Box>
          <Typography sx={{ fontWeight: 700, color: 'common.black', lineHeight: 1.2 }}>
            {L('Compartir acceso', 'Share access')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {L('Da acceso temporal a un invitado. Abrirá la puerta desde la app.', "Give a guest temporary access. They'll open the door from the app.")}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddRoundedIcon />}
          onClick={handleOpen}
          sx={{ bgcolor: green, '&:hover': { bgcolor: theme.palette.brand?.greenHover || green }, borderRadius: 999, textTransform: 'none', fontWeight: 700, flexShrink: 0 }}
        >
          {L('Compartir', 'Share')}
        </Button>
      </Stack>

      {/* Active shares */}
      {!loading && shares.length > 0 && (
        <Stack spacing={1} sx={{ mt: 2.5 }}>
          {shares.map((s) => {
            const expired = new Date(s.endsAt) < new Date();
            return (
              <Stack
                key={s.id}
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: `${tokens.radius.md}px` }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 600, color: 'common.black' }}>
                    {s.guestName || s.guestEmail}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {fmt(s.startsAt)} → {fmt(s.endsAt)}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label={expired ? L('Caducado', 'Expired') : L('Activo', 'Active')}
                  sx={{
                    fontWeight: 700,
                    bgcolor: expired ? alpha(theme.palette.text.disabled, 0.12) : alpha(green, 0.12),
                    color: expired ? 'text.disabled' : green,
                  }}
                />
                <IconButton size="small" onClick={() => handleRevoke(s.id)} aria-label="revoke">
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Stack>
            );
          })}
        </Stack>
      )}

      {/* Create dialog */}
      <Dialog open={open} onClose={() => !submitting && setOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: `${tokens.radius.lg}px` } }}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {L('Compartir acceso', 'Share access')}
          <IconButton onClick={() => setOpen(false)} size="small" disabled={submitting}><CloseRoundedIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField label={L('Nombre del invitado', 'Guest name')} value={form.guestName} onChange={setField('guestName')} fullWidth sx={fieldSx} />
            <TextField label={L('Email del invitado', 'Guest email')} type="email" value={form.guestEmail} onChange={setField('guestEmail')} fullWidth required sx={fieldSx} />
            <TextField label={L('Desde', 'From')} type="datetime-local" value={form.start} onChange={setField('start')} fullWidth slotProps={{ inputLabel: { shrink: true } }} sx={fieldSx} />
            <TextField label={L('Hasta', 'Until')} type="datetime-local" value={form.end} onChange={setField('end')} fullWidth slotProps={{ inputLabel: { shrink: true } }} sx={fieldSx} helperText={L(`Máximo ${MAX_HOURS} horas.`, `Up to ${MAX_HOURS} hours.`)} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setOpen(false)} disabled={submitting} sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600, color: 'text.secondary' }}>
            {L('Cancelar', 'Cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            sx={{ bgcolor: green, '&:hover': { bgcolor: theme.palette.brand?.greenHover || green }, borderRadius: 999, textTransform: 'none', fontWeight: 700 }}
          >
            {submitting ? <CircularProgress size={18} sx={{ color: 'common.white' }} /> : L('Compartir', 'Share')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {toast && <Alert onClose={() => setToast(null)} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>{toast.message}</Alert>}
      </Snackbar>
    </Paper>
  );
};

export default ShareAccessPanel;
