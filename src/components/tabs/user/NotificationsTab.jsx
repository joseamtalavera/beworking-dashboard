import { useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import { tokens } from '../../../theme/tokens.js';
import i18n from '../../../i18n/i18n.js';
import { listNotifications, markNotificationRead, acknowledgeNotification } from '../../../api/notifications.js';

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
      <Stack spacing={0.5} sx={{ mb: 2 }}>
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
    </Paper>
  );
};

export default NotificationsTab;
