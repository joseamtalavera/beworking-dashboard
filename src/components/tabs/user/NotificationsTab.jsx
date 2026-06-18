import { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { tokens } from '../../../theme/tokens.js';
import i18n from '../../../i18n/i18n.js';
import { listNotifications, markNotificationRead, acknowledgeNotification, createNotification } from '../../../api/notifications.js';
import { fetchBookingContacts } from '../../../api/bookings.js';

const isEN = () => (i18n.language || 'es').toLowerCase().startsWith('en');
const L = (es, en) => (isEN() ? en : es);

const statusMeta = (status) => {
  switch (status) {
    case 'acknowledged': return { label: L('Acuse recibido', 'Acknowledged'), color: 'success' };
    case 'read':         return { label: L('Leída', 'Read'), color: 'info' };
    case 'sent':         return { label: L('Enviada', 'Sent'), color: 'default' };
    default:             return { label: L('Nueva', 'New'), color: 'warning' };
  }
};

const fmtDate = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleString(isEN() ? 'en-US' : 'es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
};

const NotificationsTab = ({ userType = 'user' }) => {
  const isAdmin = userType === 'admin';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [acking, setAcking] = useState(null);

  // Admin-only "+ Notificación" compose state. This is a global admin page (no
  // single contact in context), so the dialog includes a recipient picker.
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ subject: '', body: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactOptions, setContactOptions] = useState([]);
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef(null);

  const searchContacts = useCallback((term) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!term || term.trim().length < 2) { setContactOptions([]); return; }
    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await fetchBookingContacts({ search: term.trim() });
        setContactOptions(
          (Array.isArray(results) ? results : [])
            .map((c) => ({ id: c.id, name: c.name || c.contactName || 'Unknown', email: c.email || c.emailPrimary || '' }))
            .filter((c) => c.email)
        );
      } catch { setContactOptions([]); }
      finally { setSearching(false); }
    }, 300);
  }, []);

  const resetDialog = () => {
    setDialogOpen(false);
    setForm({ subject: '', body: '' });
    setSelectedContact(null);
    setContactOptions([]);
  };

  const handleCreate = async () => {
    if (!selectedContact?.email || !form.subject.trim() || !form.body.trim()) return;
    setSubmitting(true);
    try {
      await createNotification({ contactEmail: selectedContact.email, subject: form.subject, body: form.body });
      resetDialog();
      await load();
    } catch (e) {
      setError(e.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listNotifications();
      setItems(Array.isArray(res) ? res : []);
    } catch (e) {
      setError(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const patch = (updated) =>
    setItems((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));

  // Opening a notification marks it read (users only; best-effort).
  const handleToggle = (n) => {
    const next = openId === n.id ? null : n.id;
    setOpenId(next);
    if (next && !isAdmin && n.status !== 'read' && n.status !== 'acknowledged') {
      markNotificationRead(n.id).then(patch).catch(() => { /* non-critical */ });
    }
  };

  const handleAck = async (n) => {
    setAcking(n.id);
    try {
      const updated = await acknowledgeNotification(n.id);
      patch(updated);
    } catch (e) {
      setError(e.message || 'Error');
    } finally {
      setAcking(null);
    }
  };

  return (
    <Paper elevation={0} sx={{ borderRadius: `${tokens.radius.lg}px`, p: 3, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Stack spacing={0.5}>
          <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.015em' }}>
            {L('Notificaciones', 'Notifications')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isAdmin
              ? L('Todas las notificaciones formales enviadas.', 'All formal notifications sent.')
              : L('Comunicaciones formales de BeWorking. Ábrelas y confirma el acuse de recibo.',
                  'Formal communications from BeWorking. Open them and confirm receipt.')}
          </Typography>
        </Stack>
        {isAdmin && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddRoundedIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 600, flexShrink: 0 }}
          >
            {L('Nueva notificación', 'New notification')}
          </Button>
        )}
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress size={24} /></Box>
      ) : error ? (
        <Typography variant="body2" color="error.main" sx={{ py: 2 }}>{error}</Typography>
      ) : items.length === 0 ? (
        <Stack alignItems="center" spacing={1} sx={{ py: 5, color: 'text.secondary' }}>
          <NotificationsNoneRoundedIcon sx={{ fontSize: 40, opacity: 0.4 }} />
          <Typography variant="body2">{L('No tienes notificaciones.', 'You have no notifications.')}</Typography>
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          {items.map((n) => {
            const meta = statusMeta(n.status);
            const open = openId === n.id;
            const acknowledged = n.status === 'acknowledged';
            return (
              <Paper key={n.id} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Box onClick={() => handleToggle(n)} sx={{ p: 2, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                    <Typography variant="body2" fontWeight={700} sx={{ minWidth: 0 }}>{n.subject}</Typography>
                    <Chip label={meta.label} color={meta.color} size="small" variant="outlined" sx={{ fontWeight: 600, flexShrink: 0 }} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">{fmtDate(n.createdAt)}</Typography>
                </Box>
                <Collapse in={open} unmountOnExit>
                  <Box sx={{ px: 2, pb: 2, pt: 0 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mb: 1.5 }}>{n.body}</Typography>
                    {!isAdmin && (
                      acknowledged ? (
                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: 'success.main' }}>
                          <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {L('Acuse de recibo confirmado', 'Receipt acknowledged')} · {fmtDate(n.acknowledgedAt)}
                          </Typography>
                        </Stack>
                      ) : (
                        <Button variant="contained" size="small" onClick={() => handleAck(n)} disabled={acking === n.id}
                                sx={{ textTransform: 'none', fontWeight: 600 }}>
                          {acking === n.id ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                          {L('Acuse de recibo', 'Acknowledge receipt')}
                        </Button>
                      )
                    )}
                  </Box>
                </Collapse>
              </Paper>
            );
          })}
        </Stack>
      )}

      {/* Admin: compose a new notification for any contact (recipient picker). */}
      <Dialog open={dialogOpen} onClose={() => !submitting && resetDialog()} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{L('Nueva notificación', 'New notification')}</DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            {L('Se enviará un email al cliente avisando de que tiene una notificación en su panel.',
               'An email will be sent to the client letting them know they have a notification in their dashboard.')}
          </Typography>
          <Stack spacing={2}>
            <Autocomplete
              options={contactOptions}
              loading={searching}
              value={selectedContact}
              onChange={(e, v) => setSelectedContact(v)}
              onInputChange={(e, v) => searchContacts(v)}
              getOptionLabel={(o) => (o ? `${o.name} · ${o.email}` : '')}
              isOptionEqualToValue={(o, v) => o.email === v.email}
              noOptionsText={L('Escribe para buscar…', 'Type to search…')}
              renderInput={(params) => (
                <TextField {...params} label={L('Destinatario', 'Recipient')} placeholder={L('Buscar contacto…', 'Search contact…')} />
              )}
            />
            <TextField label={L('Asunto', 'Subject')} value={form.subject} fullWidth
                       onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
            <TextField label={L('Mensaje', 'Message')} value={form.body} fullWidth multiline minRows={4}
                       onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={resetDialog} disabled={submitting} sx={{ textTransform: 'none' }}>
            {L('Cancelar', 'Cancel')}
          </Button>
          <Button variant="contained" onClick={handleCreate}
                  disabled={submitting || !selectedContact?.email || !form.subject.trim() || !form.body.trim()}
                  sx={{ textTransform: 'none', fontWeight: 600 }}>
            {submitting ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
            {L('Enviar', 'Send')}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default NotificationsTab;
