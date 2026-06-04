import { useEffect, useState } from 'react';
import {
  Box, Paper, Stack, Typography, Button, TextField, IconButton, Chip,
  CircularProgress, Alert, Snackbar, Tooltip, Divider,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { tokens } from '../../../theme/tokens.js';
import {
  fetchDevices, fetchAccessGrants, grantAccess, revokeAccess, fetchEvents,
} from '../../../api/bekey.js';

const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '—');

const SectionTitle = ({ eyebrow, title }) => (
  <Stack spacing={0.25} sx={{ mb: 1.5 }}>
    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'brand.green', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{eyebrow}</Typography>
    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{title}</Typography>
  </Stack>
);

const AdminBeKey = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [devices, setDevices] = useState([]);
  const [grants, setGrants] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ contactId: '', memberGroupId: '', expiresAt: '' });
  const [saving, setSaving] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [d, g, e] = await Promise.all([fetchDevices(), fetchAccessGrants(), fetchEvents()]);
      setDevices(d || []);
      setGrants(g || []);
      setEvents(e || []);
    } catch (err) {
      setError(err?.message || t('bekey.admin.loadError', { defaultValue: 'No se pudo cargar BeKey' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const handleGrant = async () => {
    if (!form.contactId || !form.memberGroupId) {
      setToast({ severity: 'error', message: t('bekey.admin.grantRequired', { defaultValue: 'contactId y memberGroupId son obligatorios' }) });
      return;
    }
    setSaving(true);
    try {
      await grantAccess({
        contactId: Number(form.contactId),
        memberGroupId: Number(form.memberGroupId),
        expiresAt: form.expiresAt || null,
      });
      setToast({ severity: 'success', message: t('bekey.admin.granted', { defaultValue: 'Acceso concedido' }) });
      setForm({ contactId: '', memberGroupId: '', expiresAt: '' });
      load();
    } catch (err) {
      setToast({ severity: 'error', message: err?.message || t('bekey.admin.grantError', { defaultValue: 'No se pudo conceder el acceso' }) });
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (id) => {
    setRevoking(true);
    try {
      await revokeAccess(id, 'admin manual revoke');
      setToast({ severity: 'success', message: t('bekey.admin.revoked', { defaultValue: 'Acceso revocado' }) });
      setConfirmTarget(null);
      load();
    } catch (err) {
      setToast({ severity: 'error', message: err?.message || t('bekey.admin.revokeError', { defaultValue: 'No se pudo revocar' }) });
    } finally {
      setRevoking(false);
    }
  };

  const onlineLabel = (online) => (online
    ? t('bekey.online', { defaultValue: 'En línea' })
    : t('bekey.offline', { defaultValue: 'Sin conexión' }));

  return (
    <Paper
      elevation={0}
      sx={{ borderRadius: `${tokens.radius.lg}px`, p: 3, border: '1px solid', borderColor: 'divider', background: `linear-gradient(140deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[100]} 50%, ${theme.palette.background.paper} 100%)` }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Stack spacing={0.5}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'brand.green', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('bekey.admin.eyebrow', { defaultValue: 'BeKey' })}</Typography>
          <Typography variant="h5" sx={{ fontWeight: 600, letterSpacing: '-0.02em' }}>{t('bekey.admin.title', { defaultValue: 'Control de acceso' })}</Typography>
          <Typography variant="body2" color="text.secondary">{t('bekey.admin.subtitle', { defaultValue: 'Gestiona puertas, accesos y eventos.' })}</Typography>
        </Stack>
        <Tooltip title={t('bekey.reload', { defaultValue: 'Recargar' })}>
          <IconButton onClick={load}><RefreshRoundedIcon /></IconButton>
        </Tooltip>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>
      ) : (
        <Stack spacing={4}>
          {/* Devices */}
          <Box>
            <SectionTitle eyebrow={t('bekey.admin.devicesEyebrow', { defaultValue: 'Puertas' })} title={t('bekey.admin.devicesTitle', { count: devices.length, defaultValue: 'Dispositivos ({{count}})' })} />
            <Stack spacing={1}>
              {devices.map((d) => (
                <Paper key={d.id} elevation={0} sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: `${tokens.radius.md}px` }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{d.name}</Typography>
                  <Chip size="small" variant="outlined" color={d.online ? 'success' : 'default'} label={onlineLabel(d.online)} sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }} />
                </Paper>
              ))}
              {devices.length === 0 && <Typography color="text.secondary" sx={{ fontSize: '0.85rem' }}>{t('bekey.admin.noDevices', { defaultValue: 'Sin dispositivos.' })}</Typography>}
            </Stack>
          </Box>

          <Divider />

          {/* Grant form + grants */}
          <Box>
            <SectionTitle eyebrow={t('bekey.admin.grantsEyebrow', { defaultValue: 'Accesos' })} title={t('bekey.admin.grantsTitle', { count: grants.length, defaultValue: 'Concesiones ({{count}})' })} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
              <TextField size="small" label={t('bekey.admin.contactId', { defaultValue: 'Contact ID' })} value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField size="small" label={t('bekey.admin.memberGroupId', { defaultValue: 'Member Group ID' })} value={form.memberGroupId} onChange={(e) => setForm({ ...form, memberGroupId: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField size="small" type="datetime-local" label={t('bekey.admin.expires', { defaultValue: 'Expira (opcional)' })} value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
              <Button variant="contained" disableElevation startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <AddRoundedIcon />} disabled={saving} onClick={handleGrant} sx={{ textTransform: 'none', fontWeight: 600, bgcolor: 'brand.green', '&:hover': { bgcolor: 'brand.greenHover' } }}>{t('bekey.admin.grant', { defaultValue: 'Conceder' })}</Button>
            </Stack>
            <Stack spacing={1}>
              {grants.map((g) => (
                <Paper key={g.id} elevation={0} sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: `${tokens.radius.md}px`, opacity: g.revokedAt ? 0.55 : 1 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{t('bekey.admin.grantRow', { contact: g.contactId, group: g.memberGroupId, defaultValue: 'Contacto {{contact}} · Grupo {{group}}' })}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{g.source} · {t('bekey.admin.from', { defaultValue: 'desde' })} {fmt(g.startsAt)}{g.endsAt ? ` · ${t('bekey.admin.until', { defaultValue: 'hasta' })} ${fmt(g.endsAt)}` : ''}{g.revokedAt ? ` · ${t('bekey.admin.revokedLabel', { defaultValue: 'revocado' })} ${fmt(g.revokedAt)}` : ''}</Typography>
                  </Box>
                  {!g.revokedAt && (
                    <Tooltip title={t('bekey.admin.revoke', { defaultValue: 'Revocar' })}>
                      <IconButton size="small" color="error" onClick={() => setConfirmTarget(g)}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  )}
                </Paper>
              ))}
              {grants.length === 0 && <Typography color="text.secondary" sx={{ fontSize: '0.85rem' }}>{t('bekey.admin.noGrants', { defaultValue: 'Sin concesiones.' })}</Typography>}
            </Stack>
          </Box>

          <Divider />

          {/* Events */}
          <Box>
            <SectionTitle eyebrow={t('bekey.admin.eventsEyebrow', { defaultValue: 'Actividad' })} title={t('bekey.admin.eventsTitle', { count: events.length, defaultValue: 'Eventos ({{count}})' })} />
            <Stack spacing={0.5}>
              {events.slice(0, 30).map((ev) => (
                <Stack key={ev.id} direction="row" spacing={1.5} sx={{ py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', minWidth: 150 }}>{fmt(ev.occurredAt)}</Typography>
                  <Chip size="small" label={ev.eventType} sx={{ height: 20, fontSize: '0.68rem' }} />
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{ev.contactId ? `${t('bekey.admin.eventContact', { defaultValue: 'contacto' })} ${ev.contactId}` : ''}{ev.deviceId ? ` · ${t('bekey.admin.eventDoor', { defaultValue: 'puerta' })} ${ev.deviceId}` : ''}</Typography>
                </Stack>
              ))}
              {events.length === 0 && <Typography color="text.secondary" sx={{ fontSize: '0.85rem' }}>{t('bekey.admin.noEvents', { defaultValue: 'Sin eventos.' })}</Typography>}
            </Stack>
          </Box>
        </Stack>
      )}

      <Dialog open={!!confirmTarget} onClose={() => { if (!revoking) setConfirmTarget(null); }}>
        <DialogTitle sx={{ fontWeight: 600 }}>{t('bekey.admin.revokeTitle', { defaultValue: 'Revocar acceso' })}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmTarget && t('bekey.admin.revokeConfirm', { contact: confirmTarget.contactId, group: confirmTarget.memberGroupId, defaultValue: '¿Revocar el acceso del contacto {{contact}} al grupo {{group}}? La persona dejará de poder abrir esa puerta de inmediato.' })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmTarget(null)} disabled={revoking} sx={{ textTransform: 'none' }}>{t('bekey.cancel', { defaultValue: 'Cancelar' })}</Button>
          <Button
            onClick={() => confirmTarget && handleRevoke(confirmTarget.id)}
            color="error"
            variant="contained"
            disableElevation
            disabled={revoking}
            startIcon={revoking ? <CircularProgress size={14} color="inherit" /> : <DeleteOutlineRoundedIcon />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {t('bekey.admin.revoke', { defaultValue: 'Revocar' })}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {toast && <Alert onClose={() => setToast(null)} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>{toast.message}</Alert>}
      </Snackbar>
    </Paper>
  );
};

export default AdminBeKey;
