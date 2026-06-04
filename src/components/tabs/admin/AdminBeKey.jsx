import { useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Stack, Typography, Button, TextField, IconButton, Chip,
  CircularProgress, Alert, Snackbar, Tooltip, Divider, Autocomplete,
  InputAdornment, Pagination,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { tokens } from '../../../theme/tokens.js';
import { pillFieldSx } from '../../common/pillField.js';
import {
  fetchDevices, fetchMemberGroups, fetchAccessGrants, grantAccess, updateAccess, revokeAccess, fetchEvents,
} from '../../../api/bekey.js';
import { fetchBookingContacts } from '../../../api/bookings.js';

const GRANTS_PER_PAGE = 8;
const EVENTS_PER_PAGE = 15;

const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '—');
// datetime-local string -> ISO with offset (backend OffsetDateTime); '' -> null.
const toIso = (v) => (v ? new Date(v).toISOString() : null);
// ISO -> datetime-local value (local time, minute precision).
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

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
  const [groups, setGroups] = useState([]);
  const [grants, setGrants] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Grant form
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactInput, setContactInput] = useState('');
  const [contactOptions, setContactOptions] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);

  // Filter + paging
  const [filter, setFilter] = useState('');
  const [showRevoked, setShowRevoked] = useState(false);
  const [grantPage, setGrantPage] = useState(1);
  const [eventPage, setEventPage] = useState(1);

  // Revoke + detail/edit
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);
  const [editStart, setEditStart] = useState('');
  const [editExpires, setEditExpires] = useState('');
  const [updating, setUpdating] = useState(false);

  const groupLabel = useMemo(
    () => Object.fromEntries(groups.map((g) => [g.id, g.label])),
    [groups],
  );

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [d, mg, g, e] = await Promise.all([fetchDevices(), fetchMemberGroups(), fetchAccessGrants(), fetchEvents()]);
      setDevices(d || []);
      setGroups(mg || []);
      setGrants(g || []);
      setEvents(e || []);
    } catch (err) {
      setError(err?.message || t('bekey.admin.loadError', { defaultValue: 'No se pudo cargar BeKey' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  // Debounced server-side contact search for the grant form.
  useEffect(() => {
    const id = setTimeout(() => {
      setContactsLoading(true);
      fetchBookingContacts({ search: contactInput.trim() })
        .then((list) => setContactOptions(Array.isArray(list) ? list : []))
        .catch(() => setContactOptions([]))
        .finally(() => setContactsLoading(false));
    }, 300);
    return () => clearTimeout(id);
  }, [contactInput]);

  // Reset to page 1 when the filter changes.
  useEffect(() => { setGrantPage(1); }, [filter, showRevoked]);

  const onlineLabel = (online) => (online
    ? t('bekey.online', { defaultValue: 'En línea' })
    : t('bekey.offline', { defaultValue: 'Sin conexión' }));

  const handleGrant = async () => {
    if (!selectedContact || !selectedGroup) {
      setToast({ severity: 'error', message: t('bekey.admin.grantRequired', { defaultValue: 'Selecciona un contacto y un grupo' }) });
      return;
    }
    setSaving(true);
    try {
      await grantAccess({
        contactId: selectedContact.id,
        memberGroupId: selectedGroup.id,
        startsAt: toIso(startsAt),
        expiresAt: toIso(expiresAt),
      });
      setToast({ severity: 'success', message: t('bekey.admin.granted', { defaultValue: 'Acceso concedido' }) });
      setSelectedContact(null);
      setContactInput('');
      setSelectedGroup(null);
      setStartsAt('');
      setExpiresAt('');
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
      setDetailTarget(null);
      load();
    } catch (err) {
      setToast({ severity: 'error', message: err?.message || t('bekey.admin.revokeError', { defaultValue: 'No se pudo revocar' }) });
    } finally {
      setRevoking(false);
    }
  };

  const openDetail = (g) => {
    setDetailTarget(g);
    setEditStart(toLocalInput(g.startsAt));
    setEditExpires(toLocalInput(g.endsAt));
  };

  const handleUpdate = async () => {
    if (!detailTarget) return;
    setUpdating(true);
    try {
      await updateAccess(detailTarget.id, { startsAt: toIso(editStart), expiresAt: toIso(editExpires) });
      setToast({ severity: 'success', message: t('bekey.admin.saved', { defaultValue: 'Concesión actualizada' }) });
      setDetailTarget(null);
      load();
    } catch (err) {
      setToast({ severity: 'error', message: err?.message || t('bekey.admin.saveError', { defaultValue: 'No se pudo actualizar' }) });
    } finally {
      setUpdating(false);
    }
  };

  const filteredGrants = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return grants.filter((g) => {
      if (!showRevoked && g.revokedAt) return false;
      if (!q) return true;
      const label = groupLabel[g.memberGroupId] || '';
      return [g.contactId, g.memberGroupId, label, g.source].some((v) => String(v ?? '').toLowerCase().includes(q));
    });
  }, [grants, filter, showRevoked, groupLabel]);

  const grantPageCount = Math.max(1, Math.ceil(filteredGrants.length / GRANTS_PER_PAGE));
  const pagedGrants = filteredGrants.slice((grantPage - 1) * GRANTS_PER_PAGE, grantPage * GRANTS_PER_PAGE);
  const eventPageCount = Math.max(1, Math.ceil(events.length / EVENTS_PER_PAGE));
  const pagedEvents = events.slice((eventPage - 1) * EVENTS_PER_PAGE, eventPage * EVENTS_PER_PAGE);

  const isManual = detailTarget?.source === 'manual' && !detailTarget?.revokedAt;

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

          {/* Grant form */}
          <Box>
            <SectionTitle eyebrow={t('bekey.admin.grantsEyebrow', { defaultValue: 'Accesos' })} title={t('bekey.admin.grantsTitle', { count: filteredGrants.length, defaultValue: 'Concesiones ({{count}})' })} />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'flex-end' }} sx={{ mb: 2 }}>
              <Autocomplete
                size="small"
                sx={{ minWidth: 220, flex: 1 }}
                options={contactOptions}
                loading={contactsLoading}
                value={selectedContact}
                onChange={(e, v) => setSelectedContact(v)}
                inputValue={contactInput}
                onInputChange={(e, v) => setContactInput(v)}
                getOptionLabel={(o) => (o ? `${o.name || ''}${o.email ? ` · ${o.email}` : ''}` : '')}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                filterOptions={(x) => x}
                renderInput={(params) => (
                  <TextField {...params} variant="standard" label={t('bekey.admin.contact', { defaultValue: 'Contacto' })} sx={pillFieldSx(!!selectedContact)} slotProps={{ inputLabel: { shrink: true } }} />
                )}
              />
              <Autocomplete
                size="small"
                sx={{ minWidth: 180 }}
                options={groups}
                value={selectedGroup}
                onChange={(e, v) => setSelectedGroup(v)}
                getOptionLabel={(o) => (o ? `${o.label}${o.scope ? ` (${o.scope})` : ''}` : '')}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                renderInput={(params) => (
                  <TextField {...params} variant="standard" label={t('bekey.admin.group', { defaultValue: 'Grupo' })} sx={pillFieldSx(!!selectedGroup)} slotProps={{ inputLabel: { shrink: true } }} />
                )}
              />
              <TextField variant="standard" size="small" type="datetime-local" label={t('bekey.admin.startsAt', { defaultValue: 'Inicio (opcional)' })} value={startsAt} onChange={(e) => setStartsAt(e.target.value)} sx={pillFieldSx(!!startsAt)} slotProps={{ inputLabel: { shrink: true } }} />
              <TextField variant="standard" size="small" type="datetime-local" label={t('bekey.admin.expires', { defaultValue: 'Expira (opcional)' })} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} sx={pillFieldSx(!!expiresAt)} slotProps={{ inputLabel: { shrink: true } }} />
              <Button variant="contained" disableElevation startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <AddRoundedIcon />} disabled={saving} onClick={handleGrant} sx={{ textTransform: 'none', fontWeight: 600, bgcolor: 'brand.green', '&:hover': { bgcolor: 'brand.greenHover' } }}>{t('bekey.admin.grant', { defaultValue: 'Conceder' })}</Button>
            </Stack>

            {/* Filter bar */}
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
              <TextField
                variant="standard"
                size="small"
                sx={{ ...pillFieldSx(!!filter), minWidth: 240, flex: 1 }}
                placeholder={t('bekey.admin.search', { defaultValue: 'Buscar por contacto, grupo, origen…' })}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} /></InputAdornment> } }}
              />
              <Chip
                label={t('bekey.admin.revokedFilter', { defaultValue: 'Revocadas' })}
                size="small"
                color={showRevoked ? 'primary' : 'default'}
                variant={showRevoked ? 'filled' : 'outlined'}
                onClick={() => setShowRevoked((v) => !v)}
                sx={{ fontWeight: 600, cursor: 'pointer' }}
              />
            </Stack>

            {/* Grants list */}
            <Stack spacing={1}>
              {pagedGrants.map((g) => (
                <Paper
                  key={g.id}
                  elevation={0}
                  onClick={() => openDetail(g)}
                  sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: `${tokens.radius.md}px`, opacity: g.revokedAt ? 0.55 : 1, cursor: 'pointer', transition: 'border-color 0.15s', '&:hover': { borderColor: 'brand.green' } }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.85rem' }}>{t('bekey.admin.grantRow', { contact: g.contactId, group: groupLabel[g.memberGroupId] || g.memberGroupId, defaultValue: 'Contacto {{contact}} · {{group}}' })}</Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{g.source} · {t('bekey.admin.from', { defaultValue: 'desde' })} {fmt(g.startsAt)}{g.endsAt ? ` · ${t('bekey.admin.until', { defaultValue: 'hasta' })} ${fmt(g.endsAt)}` : ''}{g.revokedAt ? ` · ${t('bekey.admin.revokedLabel', { defaultValue: 'revocado' })} ${fmt(g.revokedAt)}` : ''}</Typography>
                  </Box>
                  {!g.revokedAt && (
                    <Tooltip title={t('bekey.admin.revoke', { defaultValue: 'Revocar' })}>
                      <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setConfirmTarget(g); }}><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  )}
                </Paper>
              ))}
              {filteredGrants.length === 0 && <Typography color="text.secondary" sx={{ fontSize: '0.85rem' }}>{t('bekey.admin.noGrants', { defaultValue: 'Sin concesiones.' })}</Typography>}
            </Stack>
            {grantPageCount > 1 && (
              <Stack alignItems="center" sx={{ mt: 2 }}>
                <Pagination count={grantPageCount} page={grantPage} onChange={(e, p) => setGrantPage(p)} size="small" color="primary" />
              </Stack>
            )}
          </Box>

          <Divider />

          {/* Events */}
          <Box>
            <SectionTitle eyebrow={t('bekey.admin.eventsEyebrow', { defaultValue: 'Actividad' })} title={t('bekey.admin.eventsTitle', { count: events.length, defaultValue: 'Eventos ({{count}})' })} />
            <Stack spacing={0.5}>
              {pagedEvents.map((ev) => (
                <Stack key={ev.id} direction="row" spacing={1.5} sx={{ py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', minWidth: 150 }}>{fmt(ev.occurredAt)}</Typography>
                  <Chip size="small" label={ev.eventType} sx={{ height: 20, fontSize: '0.68rem' }} />
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{ev.contactId ? `${t('bekey.admin.eventContact', { defaultValue: 'contacto' })} ${ev.contactId}` : ''}{ev.deviceId ? ` · ${t('bekey.admin.eventDoor', { defaultValue: 'puerta' })} ${ev.deviceId}` : ''}</Typography>
                </Stack>
              ))}
              {events.length === 0 && <Typography color="text.secondary" sx={{ fontSize: '0.85rem' }}>{t('bekey.admin.noEvents', { defaultValue: 'Sin eventos.' })}</Typography>}
            </Stack>
            {eventPageCount > 1 && (
              <Stack alignItems="center" sx={{ mt: 2 }}>
                <Pagination count={eventPageCount} page={eventPage} onChange={(e, p) => setEventPage(p)} size="small" color="primary" />
              </Stack>
            )}
          </Box>
        </Stack>
      )}

      {/* Detail / edit dialog */}
      <Dialog open={!!detailTarget} onClose={() => { if (!updating && !revoking) setDetailTarget(null); }} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 600 }}>{t('bekey.admin.detailTitle', { defaultValue: 'Detalle de la concesión' })}</DialogTitle>
        <DialogContent>
          {detailTarget && (
            <Stack spacing={1.5} sx={{ mt: 0.5 }}>
              <Stack spacing={0.25}>
                <Typography sx={{ fontWeight: 600 }}>{t('bekey.admin.grantRow', { contact: detailTarget.contactId, group: groupLabel[detailTarget.memberGroupId] || detailTarget.memberGroupId, defaultValue: 'Contacto {{contact}} · {{group}}' })}</Typography>
                <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                  {detailTarget.source} · {detailTarget.revokedAt
                    ? t('bekey.admin.revokedStatus', { defaultValue: 'Revocada' })
                    : t('bekey.admin.activeStatus', { defaultValue: 'Activa' })}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                  {t('bekey.admin.from', { defaultValue: 'desde' })} {fmt(detailTarget.startsAt)}
                  {detailTarget.endsAt ? ` · ${t('bekey.admin.until', { defaultValue: 'hasta' })} ${fmt(detailTarget.endsAt)}` : ''}
                </Typography>
              </Stack>

              {isManual ? (
                <>
                  <Divider />
                  <TextField variant="standard" size="small" type="datetime-local" label={t('bekey.admin.startsAt', { defaultValue: 'Inicio (opcional)' })} value={editStart} onChange={(e) => setEditStart(e.target.value)} sx={pillFieldSx(!!editStart)} slotProps={{ inputLabel: { shrink: true } }} />
                  <TextField variant="standard" size="small" type="datetime-local" label={t('bekey.admin.expires', { defaultValue: 'Expira (opcional)' })} value={editExpires} onChange={(e) => setEditExpires(e.target.value)} sx={pillFieldSx(!!editExpires)} slotProps={{ inputLabel: { shrink: true } }} />
                </>
              ) : (
                <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                  {detailTarget.revokedAt
                    ? t('bekey.admin.revokedNote', { defaultValue: 'Esta concesión está revocada.' })
                    : t('bekey.admin.autoManaged', { source: detailTarget.source, defaultValue: 'Gestionada automáticamente por {{source}}. Edita la reserva o suscripción para cambiarla.' })}
                </Alert>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
          <Box>
            {detailTarget && !detailTarget.revokedAt && (
              <Button onClick={() => setConfirmTarget(detailTarget)} color="error" disabled={updating} sx={{ textTransform: 'none' }} startIcon={<DeleteOutlineRoundedIcon />}>{t('bekey.admin.revoke', { defaultValue: 'Revocar' })}</Button>
            )}
          </Box>
          <Box>
            <Button onClick={() => setDetailTarget(null)} disabled={updating} sx={{ textTransform: 'none' }}>{t('bekey.admin.close', { defaultValue: 'Cerrar' })}</Button>
            {isManual && (
              <Button onClick={handleUpdate} variant="contained" disableElevation disabled={updating} startIcon={updating ? <CircularProgress size={14} color="inherit" /> : null} sx={{ textTransform: 'none', fontWeight: 600, ml: 1, bgcolor: 'brand.green', '&:hover': { bgcolor: 'brand.greenHover' } }}>{t('bekey.admin.save', { defaultValue: 'Guardar' })}</Button>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      {/* Revoke confirm dialog */}
      <Dialog open={!!confirmTarget} onClose={() => { if (!revoking) setConfirmTarget(null); }}>
        <DialogTitle sx={{ fontWeight: 600 }}>{t('bekey.admin.revokeTitle', { defaultValue: 'Revocar acceso' })}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmTarget && t('bekey.admin.revokeConfirm', { contact: confirmTarget.contactId, group: groupLabel[confirmTarget.memberGroupId] || confirmTarget.memberGroupId, defaultValue: '¿Revocar el acceso del contacto {{contact}} al grupo {{group}}? La persona dejará de poder abrir esa puerta de inmediato.' })}
            {confirmTarget && confirmTarget.source !== 'manual' && ` ${t('bekey.admin.revokeAutoNote', { defaultValue: 'Aviso: es una concesión automática; la reconciliación podría restaurarla.' })}`}
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
