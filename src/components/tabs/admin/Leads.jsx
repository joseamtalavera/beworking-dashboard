import { useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Stack, Typography, TextField, IconButton, Chip, CircularProgress,
  Alert, Pagination, Dialog, DialogTitle, DialogContent, DialogActions, Button, Tooltip,
  Snackbar, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import PersonAddAltRoundedIcon from '@mui/icons-material/PersonAddAltRounded';
import { useTranslation } from 'react-i18next';
import { tokens } from '../../../theme/tokens.js';
import { fetchLeads, fetchLead, deleteLead, updateLead, convertLeadToContact } from '../../../api/leads.js';
import { pillFieldSx } from '../../common/pillField.js';

const PAGE_SIZE = 25;

const LEAD_STATUSES = ['Nuevo', 'Contactado', 'Calificado', 'Convertido', 'No-go'];
const STATUS_COLOR = {
  Nuevo:      'info',
  Contactado: 'primary',
  Calificado: 'warning',
  Convertido: 'success',
  'No-go':    'default',
};

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return iso;
  }
};

const sourceColor = (src) => {
  if (!src) return 'default';
  if (src === 'contact-page') return 'primary';
  if (src === 'ov-interest') return 'success';
  return 'default';
};

const Leads = () => {
  const { t, i18n } = useTranslation('contacts');
  const theme = useTheme();
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 1 });
  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editStatus, setEditStatus] = useState('Nuevo');
  const [editNotes, setEditNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [toast, setToast] = useState(null);

  // Debounce search
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);

  // Reset to page 0 when query changes
  useEffect(() => { setPage(0); }, [debouncedQ]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchLeads({ q: debouncedQ, page, size: PAGE_SIZE });
      setData({
        content: res.content || [],
        totalElements: res.totalElements || 0,
        totalPages: res.totalPages || 1,
      });
    } catch (e) {
      setError(e?.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [debouncedQ, page]);

  const openDetail = async (id) => {
    try {
      const lead = await fetchLead(id);
      setDetail(lead);
      setEditStatus(lead.status || 'Nuevo');
      setEditNotes(lead.notes || '');
    } catch (e) {
      setError(e?.message || 'Failed to load lead');
    }
  };

  const handleSaveLead = async () => {
    if (!detail?.id) return;
    setSaving(true);
    try {
      const updated = await updateLead(detail.id, {
        status: editStatus,
        notes: editNotes,
      });
      setDetail(updated);
      setToast({ severity: 'success', message: 'Lead actualizado' });
      load();
    } catch (e) {
      setToast({ severity: 'error', message: e?.message || t('leads.toast.saveError') });
    } finally {
      setSaving(false);
    }
  };

  const handleConvert = async () => {
    if (!detail?.id) return;
    setConverting(true);
    try {
      const result = await convertLeadToContact(detail.id);
      const msg = result?.created
        ? t('leads.toast.convertedNew')
        : t('leads.toast.convertedExisting', { id: result?.contactId });
      setToast({ severity: 'success', message: msg });
      // Refresh local detail to show 'Convertido' status
      const refreshed = await fetchLead(detail.id);
      setDetail(refreshed);
      setEditStatus(refreshed.status || 'Convertido');
      load();
    } catch (e) {
      setToast({ severity: 'error', message: e?.message || t('leads.toast.convertError') });
    } finally {
      setConverting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteLead(confirmDelete.id);
      setConfirmDelete(null);
      setDetail(null);
      load();
    } catch (e) {
      setError(e?.message || 'Failed to delete lead');
    }
  };

  const headerCells = useMemo(() => ([
    { key: 'name', label: t('leads.table.name'), width: '17%' },
    { key: 'email', label: t('leads.table.email'), width: '19%' },
    { key: 'phone', label: t('leads.table.phone'), width: '11%' },
    { key: 'subject', label: t('leads.table.subject'), width: '14%' },
    { key: 'status', label: t('leads.table.status'), width: '9%' },
    { key: 'source', label: t('leads.table.source'), width: '10%' },
    { key: 'createdAt', label: t('leads.table.createdAt'), width: '13%' },
    { key: 'actions', label: '', width: '7%' },
  ]), [t, i18n.language]);

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
        <Typography variant="h5" sx={{ fontWeight: 600, letterSpacing: '-0.02em' }}>
          {t('leads.title')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('leads.subtitle')}
        </Typography>
      </Stack>

      {/* Search bar */}
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
          borderRadius: 999,
        }}
      >
        <Box sx={{ flex: 1, px: 3, py: 2, minWidth: 0 }}>
          <TextField
            variant="standard"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            label={t('leads.searchPlaceholder')}
            placeholder={t('leads.searchPlaceholder')}
            fullWidth
            slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true } }}
            sx={pillFieldSx(q)}
          />
        </Box>
        <Box sx={{ px: 1.5 }}>
          <IconButton
            onClick={load}
            sx={{ bgcolor: 'brand.green', color: 'common.white', width: 44, height: 44, '&:hover': { bgcolor: 'brand.greenHover' } }}
          >
            <SearchRoundedIcon />
          </IconButton>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Table */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: `${tokens.radius.md}px`, overflow: 'hidden' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: headerCells.map(c => c.width).join(' '), alignItems: 'center', bgcolor: alpha(theme.palette.background.default, 0.6), px: 2, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
          {headerCells.map((c) => (
            <Typography key={c.key} sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {c.label}
            </Typography>
          ))}
        </Box>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress size={24} /></Box>
        ) : data.content.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary', fontSize: '0.9rem' }}>
            {debouncedQ ? t('leads.noResults') : t('leads.empty')}
          </Box>
        ) : (
          data.content.map((lead) => (
            <Box
              key={lead.id}
              onClick={() => openDetail(lead.id)}
              sx={{
                display: 'grid',
                gridTemplateColumns: headerCells.map(c => c.width).join(' '),
                alignItems: 'center',
                px: 2, py: 1.75,
                borderBottom: '1px solid', borderColor: 'divider',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
                '&:hover': { bgcolor: 'action.hover' },
                '&:last-child': { borderBottom: 'none' },
              }}
            >
              <Typography noWrap sx={{ fontSize: '0.9rem', fontWeight: 500, pr: 1 }}>{lead.name || '—'}</Typography>
              <Typography noWrap sx={{ fontSize: '0.875rem', color: 'text.secondary', pr: 1 }}>{lead.email || '—'}</Typography>
              <Typography noWrap sx={{ fontSize: '0.875rem', color: 'text.secondary', pr: 1 }}>{lead.phone || '—'}</Typography>
              <Typography noWrap sx={{ fontSize: '0.875rem', color: 'text.secondary', pr: 1 }}>{lead.subject || '—'}</Typography>
              <Box>
                <Chip
                  size="small"
                  label={lead.status || 'Nuevo'}
                  color={STATUS_COLOR[lead.status] || 'default'}
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 24, fontWeight: 600, borderRadius: 1.5 }}
                />
              </Box>
              <Box>
                {lead.source ? (
                  <Chip size="small" label={lead.source} color={sourceColor(lead.source)} variant="outlined" sx={{ fontSize: '0.7rem', height: 24, fontWeight: 600, borderRadius: 1.5 }} />
                ) : <Typography sx={{ fontSize: '0.85rem', color: 'text.disabled' }}>—</Typography>}
              </Box>
              <Typography noWrap sx={{ fontSize: '0.85rem', color: 'text.secondary', pr: 1 }}>{formatDate(lead.createdAt)}</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                <Tooltip title={t('leads.actions.delete')}>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={(e) => { e.stopPropagation(); setConfirmDelete(lead); }}
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))
        )}
      </Paper>

      {data.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
          <Pagination
            count={data.totalPages}
            page={page + 1}
            onChange={(_, p) => setPage(p - 1)}
            color="success"
            size="large"
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': {
                color: 'secondary.main',
                '&.Mui-selected': {
                  backgroundColor: 'secondary.main',
                  color: 'secondary.contrastText',
                  '&:hover': { backgroundColor: 'secondary.main' },
                },
                '&:hover': {
                  backgroundColor: alpha(theme.palette.secondary.main, 0.12),
                },
              },
            }}
          />
        </Box>
      )}

      {/* Pagination Info */}
      <Box
        sx={{
          px: 4,
          py: 2,
          borderTop: '1px solid',
          borderTopColor: 'divider',
          bgcolor: alpha(theme.palette.background.default, 0.6),
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="body2" color="text.secondary">
            {data.totalElements === 0
              ? t('list.noResults')
              : `${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, data.totalElements)} ${t('list.of')} ${data.totalElements}`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('list.page')} {page + 1} {t('list.of')} {data.totalPages}
          </Typography>
        </Stack>
      </Box>

      {/* Detail dialog */}
      <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: `${tokens.radius.lg}px` } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {detail?.name || 'Lead'}
        </DialogTitle>
        <DialogContent dividers>
          {detail && (
            <Stack spacing={1.5}>
              <Field label={t('leads.fields.name')} value={detail.name} />
              <Field label={t('leads.fields.email')} value={detail.email} copy />
              <Field label={t('leads.fields.phone')} value={detail.phone} copy />
              <Field label={t('leads.fields.subject')} value={detail.subject} />
              <Field label={t('leads.fields.source')} value={detail.source} />
              <Field label={t('leads.fields.createdAt')} value={formatDate(detail.createdAt)} />
              {detail.message && (
                <Box>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>
                    {t('leads.fields.message')}
                  </Typography>
                  <Typography sx={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{detail.message}</Typography>
                </Box>
              )}

              {/* Pipeline editor */}
              <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel id="lead-status-label">{t('leads.fields.status')}</InputLabel>
                  <Select
                    labelId="lead-status-label"
                    label={t('leads.fields.status')}
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                  >
                    {LEAD_STATUSES.map((s) => (
                      <MenuItem key={s} value={s}>{s}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label={t('leads.fields.notes')}
                  placeholder={t('leads.fields.notesPlaceholder')}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>

              <Box sx={{ pt: 1 }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>
                  {t('leads.fields.hubspot')}
                </Typography>
                <Typography sx={{ fontSize: '0.85rem' }}>
                  {detail.hubspotSyncStatus
                    ? <>{t('leads.hubspotStatus', { status: detail.hubspotSyncStatus })}{detail.hubspotId ? ` · id ${detail.hubspotId}` : ''}</>
                    : t('leads.hubspotNotSynced')}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(detail)} startIcon={<DeleteOutlineRoundedIcon />} color="error">
            {t('leads.actions.delete')}
          </Button>
          <Button
            onClick={handleConvert}
            startIcon={converting ? <CircularProgress size={14} /> : <PersonAddAltRoundedIcon />}
            disabled={converting || detail?.status === 'Convertido'}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {detail?.status === 'Convertido' ? t('leads.actions.alreadyConverted') : t('leads.actions.convert')}
          </Button>
          <Box sx={{ flex: 1 }} />
          {detail?.email && (
            <Tooltip title={t('leads.actions.openMail')}>
              <IconButton component="a" href={`mailto:${detail.email}`} size="small">
                <OpenInNewRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Button onClick={() => setDetail(null)}>{t('leads.actions.close')}</Button>
          <Button
            onClick={handleSaveLead}
            variant="contained"
            disabled={saving}
            disableElevation
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {saving ? t('leads.actions.saving') : t('leads.actions.save')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast && (
          <Alert onClose={() => setToast(null)} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
            {toast.message}
          </Alert>
        )}
      </Snackbar>

      {/* Confirm delete */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('leads.deleteDialog.title')}</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.9rem' }}>
            {t('leads.deleteDialog.warningPrefix')} <strong>{confirmDelete?.name}</strong> ({confirmDelete?.email}). {t('leads.deleteDialog.warningSuffix')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>{t('leads.deleteDialog.cancel')}</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disableElevation>{t('leads.deleteDialog.confirm')}</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

const Field = ({ label, value, copy }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', minWidth: 80 }}>
      {label}
    </Typography>
    <Typography
      sx={{ fontSize: '0.9rem', flex: 1, cursor: copy && value ? 'pointer' : 'default' }}
      onClick={() => { if (copy && value) navigator.clipboard?.writeText(value); }}
      title={copy && value ? 'Click para copiar' : undefined}
    >
      {value || '—'}
    </Typography>
  </Box>
);

export default Leads;
