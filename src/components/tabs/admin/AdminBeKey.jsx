import { useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Stack, Typography, Button, IconButton, Chip, Avatar,
  CircularProgress, Alert, Snackbar, Tooltip, Divider, Autocomplete, TextField,
  InputAdornment, Pagination, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import VpnKeyRoundedIcon from '@mui/icons-material/VpnKeyRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { tokens } from '../../../theme/tokens.js';
import { pillFieldSx } from '../../common/pillField.js';
import {
  fetchDevices, fetchMemberGroups, fetchAccessGrants, grantAccess, updateAccess, revokeAccess, fetchEvents,
} from '../../../api/bekey.js';
import { fetchBookingContacts } from '../../../api/bookings.js';

const GRANTS_PER_PAGE = 10;
const EVENTS_PER_PAGE = 15;

const fmt = (iso) => (iso ? new Date(iso).toLocaleString() : '—');
const toIso = (v) => (v ? new Date(v).toISOString() : null);
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const AdminBeKey = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  // Outlined white field styling, matching Contacts' AddUserDialog (contactFieldSx).
  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 1,
      backgroundColor: theme.palette.common.white,
      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.grey[400] },
    },
    '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.grey[300] },
    '& .MuiInputLabel-root': { color: theme.palette.text.secondary },
  };
  const [devices, setDevices] = useState([]);
  const [groups, setGroups] = useState([]);
  const [grants, setGrants] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Grant dialog (form)
  const [grantOpen, setGrantOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [contactInput, setContactInput] = useState('');
  const [contactOptions, setContactOptions] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);

  // Filters + paging
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');
  const [grantPage, setGrantPage] = useState(1);
  const [eventPage, setEventPage] = useState(1);

  // Revoke + detail/edit
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [revoking, setRevoking] = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);
  const [editStart, setEditStart] = useState('');
  const [editExpires, setEditExpires] = useState('');
  const [updating, setUpdating] = useState(false);

  const groupLabel = useMemo(() => Object.fromEntries(groups.map((g) => [g.id, g.label])), [groups]);

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

  useEffect(() => {
    if (!grantOpen) return undefined;
    const q = contactInput.trim();
    // Search-as-you-type: don't list everyone — wait for at least 2 chars.
    if (q.length < 2) {
      setContactOptions([]);
      setContactsLoading(false);
      return undefined;
    }
    const id = setTimeout(() => {
      setContactsLoading(true);
      fetchBookingContacts({ search: q })
        .then((list) => setContactOptions(Array.isArray(list) ? list : []))
        .catch(() => setContactOptions([]))
        .finally(() => setContactsLoading(false));
    }, 300);
    return () => clearTimeout(id);
  }, [contactInput, grantOpen]);

  useEffect(() => { setGrantPage(1); }, [search, sourceFilter, statusFilter]);

  const sourceLabel = (s) => t(`bekey.admin.source.${s}`, { defaultValue: s });

  const sourceCounts = useMemo(() => {
    const active = grants.filter((g) => !g.revokedAt);
    return {
      booking: active.filter((g) => g.source === 'booking').length,
      subscription: active.filter((g) => g.source === 'subscription').length,
      manual: active.filter((g) => g.source === 'manual').length,
    };
  }, [grants]);

  const resetGrantForm = () => {
    setSelectedContact(null); setContactInput(''); setSelectedGroups([]); setStartsAt(''); setExpiresAt('');
  };

  const handleGrant = async () => {
    if (!selectedContact || selectedGroups.length === 0) {
      setToast({ severity: 'error', message: t('bekey.admin.grantRequired', { defaultValue: 'Selecciona un contacto y al menos un grupo' }) });
      return;
    }
    setSaving(true);
    try {
      // One grant per selected group; collect per-group outcomes so a single
      // failure doesn't hide the ones that succeeded.
      const results = await Promise.allSettled(
        selectedGroups.map((g) => grantAccess({
          contactId: selectedContact.id, memberGroupId: g.id,
          startsAt: toIso(startsAt), expiresAt: toIso(expiresAt),
        }))
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed === 0) {
        setToast({ severity: 'success', message: t('bekey.admin.granted', { defaultValue: 'Acceso concedido' }) });
        resetGrantForm();
        setGrantOpen(false);
      } else {
        setToast({ severity: 'error', message: t('bekey.admin.grantPartial', { ok: results.length - failed, total: results.length, defaultValue: `${results.length - failed}/${results.length} accesos concedidos; ${failed} fallaron` }) });
      }
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
    const q = search.trim().toLowerCase();
    return grants.filter((g) => {
      if (statusFilter === 'active' && g.revokedAt) return false;
      if (statusFilter === 'revoked' && !g.revokedAt) return false;
      if (sourceFilter !== 'all' && g.source !== sourceFilter) return false;
      if (!q) return true;
      const label = groupLabel[g.memberGroupId] || '';
      return [g.contactName, g.contactId, g.memberGroupId, label, g.source].some((v) => String(v ?? '').toLowerCase().includes(q));
    });
  }, [grants, search, sourceFilter, statusFilter, groupLabel]);

  const grantPageCount = Math.max(1, Math.ceil(filteredGrants.length / GRANTS_PER_PAGE));
  const pagedGrants = filteredGrants.slice((grantPage - 1) * GRANTS_PER_PAGE, grantPage * GRANTS_PER_PAGE);
  const eventPageCount = Math.max(1, Math.ceil(events.length / EVENTS_PER_PAGE));
  const pagedEvents = events.slice((eventPage - 1) * EVENTS_PER_PAGE, eventPage * EVENTS_PER_PAGE);

  const isManual = detailTarget?.source === 'manual' && !detailTarget?.revokedAt;

  const resetFilters = () => { setSearch(''); setSourceFilter('all'); setStatusFilter('active'); };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: `${tokens.radius.lg}px`,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        background: `linear-gradient(140deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[100]} 50%, ${theme.palette.background.paper} 100%)`,
      }}
    >
      <Box sx={{ px: 4, pt: 4, pb: 2 }}>
        {/* Header */}
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={3}>
          <Stack spacing={1}>
            <Typography variant="h5" sx={{ fontWeight: 600, letterSpacing: '-0.02em' }}>{t('bekey.admin.title', { defaultValue: 'Control de acceso' })}</Typography>
            <Typography variant="body2" color="text.secondary">{t('bekey.admin.subtitle', { defaultValue: 'Gestiona puertas, accesos y eventos.' })}</Typography>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <Tooltip title={t('bekey.reload', { defaultValue: 'Recargar' })}>
              <IconButton onClick={load} sx={{ alignSelf: 'center' }}><RefreshRoundedIcon /></IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() => setGrantOpen(true)}
              sx={{ minWidth: 120, height: 36, textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap', backgroundColor: 'success.main', color: 'common.white', '&:hover': { backgroundColor: 'success.dark' } }}
            >
              {t('bekey.admin.grantAction', { defaultValue: 'Conceder acceso' })}
            </Button>
          </Stack>
        </Stack>

        <Box sx={{ mb: 3 }} />

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Doors strip */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
          {devices.map((d) => (
            <Chip
              key={d.id}
              icon={<VpnKeyRoundedIcon sx={{ fontSize: 16 }} />}
              label={d.name}
              size="small"
              color={d.online ? 'success' : 'default'}
              variant="outlined"
              sx={{ fontWeight: 600, borderRadius: 1.5 }}
            />
          ))}
        </Stack>

        {/* Source filter chips */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
          {[
            { value: 'booking', color: 'success' },
            { value: 'subscription', color: 'primary' },
            { value: 'manual', color: 'default' },
          ].map((opt) => (
            <Chip
              key={opt.value}
              label={`${sourceLabel(opt.value)} · ${sourceCounts[opt.value] ?? 0}`}
              color={opt.color}
              variant={sourceFilter === opt.value ? 'filled' : 'outlined'}
              onClick={() => setSourceFilter(sourceFilter === opt.value ? 'all' : opt.value)}
              sx={{ fontWeight: 600, borderRadius: 1.5, cursor: 'pointer' }}
            />
          ))}
        </Stack>

        {/* Search bar (pill) */}
        <Paper
          elevation={0}
          sx={{ mb: 2, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper', display: 'flex', alignItems: 'center', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', flexDirection: { xs: 'column', sm: 'row' }, borderRadius: { xs: 3, sm: 999 } }}
        >
          <Box sx={{ flex: 1.4, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
            <TextField
              variant="standard"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              label={t('bekey.admin.searchLabel', { defaultValue: 'Buscar' })}
              placeholder={t('bekey.admin.search', { defaultValue: 'Contacto, grupo, origen…' })}
              fullWidth
              slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true } }}
              sx={pillFieldSx(search)}
            />
          </Box>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
          <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />

          <Box sx={{ flex: 0.8, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.25 }}>{t('bekey.admin.colSource', { defaultValue: 'Origen' })}</Typography>
            <Select variant="standard" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} displayEmpty fullWidth disableUnderline sx={{ fontSize: '0.875rem', color: sourceFilter !== 'all' ? 'text.primary' : 'text.secondary' }}>
              <MenuItem value="all">{t('bekey.admin.sourceAll', { defaultValue: 'Todos los orígenes' })}</MenuItem>
              <MenuItem value="booking">{sourceLabel('booking')}</MenuItem>
              <MenuItem value="subscription">{sourceLabel('subscription')}</MenuItem>
              <MenuItem value="manual">{sourceLabel('manual')}</MenuItem>
            </Select>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
          <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />

          <Box sx={{ flex: 0.8, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.25 }}>{t('bekey.admin.colStatus', { defaultValue: 'Estado' })}</Typography>
            <Select variant="standard" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} displayEmpty fullWidth disableUnderline sx={{ fontSize: '0.875rem', color: statusFilter !== 'all' ? 'text.primary' : 'text.secondary' }}>
              <MenuItem value="active">{t('bekey.admin.activeStatus', { defaultValue: 'Activa' })}</MenuItem>
              <MenuItem value="revoked">{t('bekey.admin.revokedStatus', { defaultValue: 'Revocada' })}</MenuItem>
              <MenuItem value="all">{t('bekey.admin.statusAll', { defaultValue: 'Todos los estados' })}</MenuItem>
            </Select>
          </Box>

          <Box sx={{ px: { xs: 2, sm: 1.5 }, py: { xs: 1.5, sm: 0 }, width: { xs: '100%', sm: 'auto' }, display: 'flex', justifyContent: 'center' }}>
            <IconButton aria-label="search" sx={{ bgcolor: 'brand.green', color: 'common.white', width: 44, height: 44, '&:hover': { bgcolor: 'brand.greenHover' } }}>
              <SearchRoundedIcon />
            </IconButton>
          </Box>
        </Paper>

        {/* Filter actions row */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap" useFlexGap>
          <Button variant="outlined" size="small" onClick={resetFilters} sx={{ textTransform: 'none', fontWeight: 600, borderColor: 'divider', color: 'text.secondary', borderRadius: 999, px: 2, '&:hover': { borderColor: 'brand.green', color: 'brand.green' } }}>
            {t('bekey.admin.reset', { defaultValue: 'Restablecer' })}
          </Button>
          <Box sx={{ flex: 1 }} />
          <Typography variant="body2" color="text.secondary">
            {t('bekey.admin.showing', { defaultValue: 'Mostrando' })} {pagedGrants.length} {t('bekey.admin.of', { defaultValue: 'de' })} {filteredGrants.length} {t('bekey.admin.grantsWord', { defaultValue: 'concesiones' })}
          </Typography>
        </Stack>
      </Box>

      <Divider />

      {/* Grants table */}
      <TableContainer sx={{ px: 1, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell sx={{ pl: 3, fontWeight: 'bold' }}>{t('bekey.admin.contact', { defaultValue: 'Contacto' })}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('bekey.admin.group', { defaultValue: 'Grupo' })}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('bekey.admin.colSource', { defaultValue: 'Origen' })}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('bekey.admin.colWindow', { defaultValue: 'Periodo' })}</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('bekey.admin.colStatus', { defaultValue: 'Estado' })}</TableCell>
              <TableCell align="right" sx={{ pr: 4, fontWeight: 'bold' }}>{t('bekey.admin.colActions', { defaultValue: 'Acciones' })}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            )}
            {!loading && filteredGrants.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" color="text.secondary">{t('bekey.admin.noGrants', { defaultValue: 'Sin concesiones.' })}</Typography>
                </TableCell>
              </TableRow>
            )}
            {!loading && pagedGrants.map((g) => (
              <TableRow key={g.id} hover sx={{ '& td': { borderBottomColor: 'divider' }, cursor: 'pointer', opacity: g.revokedAt ? 0.6 : 1 }} onClick={() => openDetail(g)}>
                <TableCell sx={{ pl: 3 }}>
                  <Typography fontWeight={600}>{g.contactName || t('bekey.admin.contactNo', { id: g.contactId, defaultValue: 'Contacto {{id}}' })}</Typography>
                </TableCell>
                <TableCell><Typography fontWeight={500}>{groupLabel[g.memberGroupId] || g.memberGroupId}</Typography></TableCell>
                <TableCell><Typography variant="body2" color="text.secondary">{sourceLabel(g.source)}</Typography></TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {fmt(g.startsAt)}{g.endsAt ? ` → ${fmt(g.endsAt)}` : ' → ∞'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={g.revokedAt ? t('bekey.admin.revokedStatus', { defaultValue: 'Revocada' }) : t('bekey.admin.activeStatus', { defaultValue: 'Activa' })}
                    color={g.revokedAt ? 'default' : 'success'}
                    variant={g.revokedAt ? 'outlined' : 'filled'}
                    size="small"
                    sx={{ borderRadius: 1.5, fontWeight: 600, minWidth: 90, justifyContent: 'center' }}
                  />
                </TableCell>
                <TableCell align="right" sx={{ pr: 4 }}>
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Tooltip title={t('bekey.admin.detailTitle', { defaultValue: 'Detalle de la concesión' })}>
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); openDetail(g); }}><EditRoundedIcon fontSize="inherit" /></IconButton>
                    </Tooltip>
                    {!g.revokedAt && (
                      <Tooltip title={t('bekey.admin.revoke', { defaultValue: 'Revocar' })}>
                        <IconButton size="small" sx={{ color: 'secondary.main', '&:hover': { color: 'secondary.dark' } }} onClick={(e) => { e.stopPropagation(); setConfirmTarget(g); }}><DeleteOutlineRoundedIcon fontSize="inherit" /></IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {grantPageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
          <Pagination count={grantPageCount} page={grantPage} onChange={(e, p) => setGrantPage(p)} color="success" size="large" showFirstButton showLastButton />
        </Box>
      )}

      {/* Events */}
      <Box sx={{ px: 4, pt: 2, pb: 1 }}>
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'brand.green', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('bekey.admin.eventsEyebrow', { defaultValue: 'Actividad' })}</Typography>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{t('bekey.admin.eventsTitle', { count: events.length, defaultValue: 'Eventos ({{count}})' })}</Typography>
      </Box>
      <TableContainer sx={{ px: 1, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell sx={{ pl: 3, fontWeight: 'bold' }}>{t('bekey.admin.colTime', { defaultValue: 'Fecha' })}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('bekey.admin.colEvent', { defaultValue: 'Evento' })}</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{t('bekey.admin.contact', { defaultValue: 'Contacto' })}</TableCell>
              <TableCell sx={{ pr: 4, fontWeight: 'bold' }}>{t('bekey.admin.colDoor', { defaultValue: 'Puerta' })}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && events.length === 0 && (
              <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><Typography variant="body2" color="text.secondary">{t('bekey.admin.noEvents', { defaultValue: 'Sin eventos.' })}</Typography></TableCell></TableRow>
            )}
            {!loading && pagedEvents.map((ev) => (
              <TableRow key={ev.id} sx={{ '& td': { borderBottomColor: 'divider' } }}>
                <TableCell sx={{ pl: 3 }}><Typography variant="body2" color="text.secondary">{fmt(ev.occurredAt)}</Typography></TableCell>
                <TableCell><Chip size="small" label={ev.eventType} sx={{ height: 20, fontSize: '0.68rem' }} /></TableCell>
                <TableCell><Typography variant="body2" color="text.secondary">{ev.contactId ?? '—'}</Typography></TableCell>
                <TableCell sx={{ pr: 4 }}><Typography variant="body2" color="text.secondary">{ev.deviceId ?? '—'}</Typography></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {eventPageCount > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 3 }}>
          <Pagination count={eventPageCount} page={eventPage} onChange={(e, p) => setEventPage(p)} color="success" size="large" showFirstButton showLastButton />
        </Box>
      )}

      {/* Grant dialog — styled to match Contacts' AddUserDialog */}
      <Dialog
        open={grantOpen}
        onClose={() => { if (!saving) { setGrantOpen(false); resetGrantForm(); } }}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: {
          borderRadius: 3,
          background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[200]} 100%)`,
          boxShadow: theme.shadows[6],
        } }}
      >
        <DialogTitle sx={{
          p: 3,
          background: `linear-gradient(135deg, ${theme.palette.brand.green} 0%, ${theme.palette.brand.greenHover} 100%)`,
          color: 'common.white',
          borderRadius: '12px 12px 0 0',
        }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: alpha(theme.palette.common.white, 0.2), width: 40, height: 40 }}>
              <VpnKeyRoundedIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
                {t('bekey.admin.grantAction', { defaultValue: 'Conceder acceso' })}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {t('bekey.admin.grantSubtitle', { defaultValue: 'Da acceso manual a un contacto a una puerta del centro' })}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 4 }}>
            <Stack spacing={3}>
              {/* Contact search — booking-flow pill style (search-as-you-type) */}
              <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', boxShadow: '0 1px 6px rgba(0,0,0,0.08)', borderRadius: { xs: 3, sm: 999 }, px: 3, py: { xs: 1, sm: 1.25 } }}>
                <Autocomplete
                  fullWidth
                  options={contactOptions}
                  loading={contactsLoading}
                  noOptionsText={contactInput.trim().length < 2
                    ? t('bekey.admin.typeToSearch', { defaultValue: 'Escribe para buscar…' })
                    : t('bekey.admin.noContacts', { defaultValue: 'Sin resultados' })}
                  value={selectedContact}
                  onChange={(e, v) => setSelectedContact(v)}
                  inputValue={contactInput}
                  onInputChange={(e, v) => setContactInput(v)}
                  getOptionLabel={(o) => (o ? `${o.name || ''}${o.email ? ` · ${o.email}` : ''}` : '')}
                  isOptionEqualToValue={(o, v) => o.id === v.id}
                  filterOptions={(x) => x}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      variant="standard"
                      fullWidth
                      label={t('bekey.admin.searchContact', { defaultValue: 'Buscar contacto…' })}
                      placeholder={t('bekey.admin.searchByName', { defaultValue: 'Buscar por nombre' })}
                      slotProps={{ inputLabel: { shrink: true } }}
                      sx={pillFieldSx(!!selectedContact || contactInput.trim().length > 0)}
                      InputProps={{ ...params.InputProps, disableUnderline: true }}
                    />
                  )}
                />
              </Paper>
              <Autocomplete
                multiple
                disableCloseOnSelect
                size="small"
                options={groups}
                value={selectedGroups}
                onChange={(e, v) => setSelectedGroups(v)}
                getOptionLabel={(o) => (o ? `${o.label}${o.scope ? ` (${o.scope})` : ''}` : '')}
                isOptionEqualToValue={(o, v) => o.id === v.id}
                renderInput={(params) => (
                  <TextField {...params} variant="outlined" size="small" label={t('bekey.admin.groups', { defaultValue: 'Grupos (uno o varios)' })} sx={fieldSx} slotProps={{ inputLabel: { shrink: true } }} />
                )}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField variant="outlined" size="small" fullWidth type="datetime-local" label={t('bekey.admin.startsAt', { defaultValue: 'Inicio (opcional)' })} value={startsAt} onChange={(e) => setStartsAt(e.target.value)} sx={fieldSx} slotProps={{ inputLabel: { shrink: true } }} />
                <TextField variant="outlined" size="small" fullWidth type="datetime-local" label={t('bekey.admin.expires', { defaultValue: 'Expira (opcional)' })} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} sx={fieldSx} slotProps={{ inputLabel: { shrink: true } }} />
              </Stack>
            </Stack>
          </Box>
        </DialogContent>
        <DialogActions sx={{
          p: 3,
          background: `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${theme.palette.grey[200]} 100%)`,
          borderRadius: '0 0 12px 12px',
        }}>
          <Button
            variant="outlined"
            startIcon={<CloseRoundedIcon />}
            onClick={() => { setGrantOpen(false); resetGrantForm(); }}
            disabled={saving}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3, py: 1, color: 'text.secondary', borderColor: 'divider', '&:hover': { borderColor: theme.palette.grey[300], backgroundColor: 'background.default' } }}
          >
            {t('bekey.cancel', { defaultValue: 'Cancelar' })}
          </Button>
          <Button
            variant="contained"
            onClick={handleGrant}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <AddRoundedIcon />}
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600, px: 3, py: 1, boxShadow: 'none', bgcolor: 'brand.green', transition: `background-color ${tokens.motion.duration} ${tokens.motion.ease}`, '&:hover': { bgcolor: 'brand.greenHover', boxShadow: 'none' } }}
          >
            {t('bekey.admin.grant', { defaultValue: 'Conceder' })}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail / edit dialog */}
      <Dialog open={!!detailTarget} onClose={() => { if (!updating && !revoking) setDetailTarget(null); }} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 600 }}>{t('bekey.admin.detailTitle', { defaultValue: 'Detalle de la concesión' })}</DialogTitle>
        <DialogContent>
          {detailTarget && (
            <Stack spacing={1.5} sx={{ mt: 0.5 }}>
              <Stack spacing={0.25}>
                <Typography sx={{ fontWeight: 600 }}>{t('bekey.admin.grantRow', { contact: detailTarget.contactName || t('bekey.admin.contactNo', { id: detailTarget.contactId, defaultValue: 'Contacto {{id}}' }), group: groupLabel[detailTarget.memberGroupId] || detailTarget.memberGroupId, defaultValue: '{{contact}} · {{group}}' })}</Typography>
                <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                  {sourceLabel(detailTarget.source)} · {detailTarget.revokedAt ? t('bekey.admin.revokedStatus', { defaultValue: 'Revocada' }) : t('bekey.admin.activeStatus', { defaultValue: 'Activa' })}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                  {t('bekey.admin.from', { defaultValue: 'desde' })} {fmt(detailTarget.startsAt)}{detailTarget.endsAt ? ` · ${t('bekey.admin.until', { defaultValue: 'hasta' })} ${fmt(detailTarget.endsAt)}` : ''}
                </Typography>
              </Stack>
              {isManual ? (
                <>
                  <Divider />
                  <TextField variant="standard" type="datetime-local" label={t('bekey.admin.startsAt', { defaultValue: 'Inicio (opcional)' })} value={editStart} onChange={(e) => setEditStart(e.target.value)} sx={pillFieldSx(!!editStart)} slotProps={{ inputLabel: { shrink: true } }} />
                  <TextField variant="standard" type="datetime-local" label={t('bekey.admin.expires', { defaultValue: 'Expira (opcional)' })} value={editExpires} onChange={(e) => setEditExpires(e.target.value)} sx={pillFieldSx(!!editExpires)} slotProps={{ inputLabel: { shrink: true } }} />
                </>
              ) : (
                <Alert severity="info" sx={{ fontSize: '0.8rem' }}>
                  {detailTarget.revokedAt
                    ? t('bekey.admin.revokedNote', { defaultValue: 'Esta concesión está revocada.' })
                    : t('bekey.admin.autoManaged', { source: sourceLabel(detailTarget.source), defaultValue: 'Gestionada automáticamente por {{source}}. Edita la reserva o suscripción para cambiarla.' })}
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
            {confirmTarget && t('bekey.admin.revokeConfirm', { contact: confirmTarget.contactName || t('bekey.admin.contactNo', { id: confirmTarget.contactId, defaultValue: 'Contacto {{id}}' }), group: groupLabel[confirmTarget.memberGroupId] || confirmTarget.memberGroupId, defaultValue: '¿Revocar el acceso de {{contact}} al grupo {{group}}? La persona dejará de poder abrir esa puerta de inmediato.' })}
            {confirmTarget && confirmTarget.source !== 'manual' && ` ${t('bekey.admin.revokeAutoNote', { defaultValue: 'Aviso: es una concesión automática; la reconciliación podría restaurarla.' })}`}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmTarget(null)} disabled={revoking} sx={{ textTransform: 'none' }}>{t('bekey.cancel', { defaultValue: 'Cancelar' })}</Button>
          <Button onClick={() => confirmTarget && handleRevoke(confirmTarget.id)} color="error" variant="contained" disableElevation disabled={revoking} startIcon={revoking ? <CircularProgress size={14} color="inherit" /> : <DeleteOutlineRoundedIcon />} sx={{ textTransform: 'none', fontWeight: 600 }}>{t('bekey.admin.revoke', { defaultValue: 'Revocar' })}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {toast && <Alert onClose={() => setToast(null)} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>{toast.message}</Alert>}
      </Snackbar>
    </Paper>
  );
};

export default AdminBeKey;
