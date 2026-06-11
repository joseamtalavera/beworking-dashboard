import { useCallback, useEffect, useState } from 'react';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import i18n from '../../../i18n/i18n.js';
import { listNotifications, createNotification } from '../../../api/notifications.js';

const isEN = () => (i18n.language || 'es').toLowerCase().startsWith('en');
const L = (es, en) => (isEN() ? en : es);

// Status -> { label, color } for the chip. Colors map to MUI palette keys.
const statusMeta = (status) => {
  switch (status) {
    case 'acknowledged': return { label: L('Acuse recibido', 'Acknowledged'), color: 'success' };
    case 'read':         return { label: L('Leída', 'Read'), color: 'info' };
    case 'sent':         return { label: L('Enviada', 'Sent'), color: 'default' };
    default:             return { label: L('Creada', 'Created'), color: 'warning' };
  }
};

const fmtDate = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString(isEN() ? 'en-US' : 'es-ES', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return ''; }
};

const ContactCommunicationsCard = ({ contactEmail, mode }) => {
  const isAdmin = mode !== 'user';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ subject: '', body: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listNotifications(contactEmail ? { contactEmail } : {});
      setItems(Array.isArray(res) ? res : []);
    } catch (e) {
      setError(e.message || 'Error');
    } finally {
      setLoading(false);
    }
  }, [contactEmail]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.subject.trim() || !form.body.trim()) return;
    setSubmitting(true);
    try {
      await createNotification({ contactEmail, subject: form.subject, body: form.body });
      setDialogOpen(false);
      setForm({ subject: '', body: '' });
      await load();
    } catch (e) {
      setError(e.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper',
            height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between"
             sx={{ px: 3, py: 2, borderBottom: '1px solid', borderBottomColor: 'divider' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                     bgcolor: (theme) => alpha(theme.palette.success.main, 0.15) }}>
            <ChatBubbleOutlineRoundedIcon fontSize="small" sx={{ color: 'brand.green' }} />
          </Box>
          <Typography variant="subtitle2" fontWeight={600}>{L('Comunicaciones', 'Communications')}</Typography>
        </Stack>
        {isAdmin && (
          <Button size="small" variant="outlined" startIcon={<AddRoundedIcon />} onClick={() => setDialogOpen(true)}
                  disabled={!contactEmail} sx={{ textTransform: 'none', fontWeight: 600 }}>
            {L('Nueva notificación', 'New notification')}
          </Button>
        )}
      </Stack>

      <Box sx={{ px: 3, py: 2, flexGrow: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={20} /></Box>
        ) : error ? (
          <Typography variant="body2" color="error.main">{error}</Typography>
        ) : items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {L('Sin notificaciones todavía.', 'No notifications yet.')}
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {items.map((n) => {
              const meta = statusMeta(n.status);
              return (
                <Box key={n.id} sx={{ pb: 1.5, borderBottom: '1px solid', borderColor: 'divider', '&:last-of-type': { borderBottom: 'none', pb: 0 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Typography variant="body2" fontWeight={600} sx={{ minWidth: 0 }}>{n.subject}</Typography>
                    <Chip label={meta.label} color={meta.color} size="small" variant="outlined" sx={{ fontWeight: 600, flexShrink: 0 }} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                    {fmtDate(n.createdAt)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>{n.body}</Typography>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>

      <Dialog open={dialogOpen} onClose={() => !submitting && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>{L('Nueva notificación', 'New notification')}</DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            {L('Se enviará un email al cliente avisando de que tiene una notificación en su panel.',
               'An email will be sent to the client letting them know they have a notification in their dashboard.')}
          </Typography>
          <Stack spacing={2}>
            <TextField label={L('Asunto', 'Subject')} value={form.subject} fullWidth
                       onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
            <TextField label={L('Mensaje', 'Message')} value={form.body} fullWidth multiline minRows={4}
                       onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting} sx={{ textTransform: 'none' }}>
            {L('Cancelar', 'Cancel')}
          </Button>
          <Button variant="contained" onClick={handleCreate}
                  disabled={submitting || !form.subject.trim() || !form.body.trim()}
                  sx={{ textTransform: 'none', fontWeight: 600 }}>
            {submitting ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
            {L('Enviar', 'Send')}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ContactCommunicationsCard;
