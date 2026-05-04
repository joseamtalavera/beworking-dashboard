import { useEffect, useMemo, useState } from 'react';
import {
  Box, Paper, Stack, Typography, TextField, IconButton, Chip, CircularProgress,
  Alert, Pagination, Dialog, DialogTitle, DialogContent, DialogActions, Button, Tooltip,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import OpenInNewRoundedIcon from '@mui/icons-material/OpenInNewRounded';
import { useTranslation } from 'react-i18next';
import { tokens } from '../../../theme/tokens.js';
import { fetchLeads, fetchLead, deleteLead } from '../../../api/leads.js';

const PAGE_SIZE = 25;

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
  const { t } = useTranslation('contacts');
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 1 });
  const [page, setPage] = useState(0);
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

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
    } catch (e) {
      setError(e?.message || 'Failed to load lead');
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
    { key: 'name', label: 'Nombre', width: '20%' },
    { key: 'email', label: 'Email', width: '22%' },
    { key: 'phone', label: 'Teléfono', width: '14%' },
    { key: 'subject', label: 'Asunto', width: '18%' },
    { key: 'source', label: 'Origen', width: '12%' },
    { key: 'createdAt', label: 'Fecha', width: '14%' },
  ]), []);

  return (
    <Paper elevation={0} sx={{ borderRadius: `${tokens.radius.lg}px`, p: 3, border: '1px solid', borderColor: 'divider' }}>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.015em' }}>
          Leads
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Inbound del formulario de contacto y captaciones de Oficina Virtual. Cuando un lead se convierte en cliente (registra perfil), se elimina automáticamente.
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
            placeholder="Buscar por nombre, email, teléfono o asunto"
            fullWidth
            slotProps={{ input: { disableUnderline: true } }}
            sx={{
              '& .MuiInput-input': { fontSize: '0.875rem', py: 0.25 },
            }}
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
        <Box sx={{ display: 'grid', gridTemplateColumns: headerCells.map(c => c.width).join(' '), bgcolor: 'background.default', px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
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
            {debouncedQ ? 'Sin resultados para esa búsqueda.' : 'Aún no hay leads.'}
          </Box>
        ) : (
          data.content.map((lead) => (
            <Box
              key={lead.id}
              onClick={() => openDetail(lead.id)}
              sx={{
                display: 'grid',
                gridTemplateColumns: headerCells.map(c => c.width).join(' '),
                px: 2, py: 1.5,
                borderBottom: '1px solid', borderColor: 'divider',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
                '&:last-child': { borderBottom: 'none' },
              }}
            >
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 500 }}>{lead.name || '—'}</Typography>
              <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{lead.email || '—'}</Typography>
              <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{lead.phone || '—'}</Typography>
              <Typography sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>{lead.subject || '—'}</Typography>
              <Box>
                {lead.source ? (
                  <Chip size="small" label={lead.source} color={sourceColor(lead.source)} sx={{ fontSize: '0.7rem', height: 22 }} />
                ) : <Typography sx={{ fontSize: '0.85rem', color: 'text.disabled' }}>—</Typography>}
              </Box>
              <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>{formatDate(lead.createdAt)}</Typography>
            </Box>
          ))
        )}
      </Paper>

      {data.totalPages > 1 && (
        <Stack direction="row" justifyContent="center" sx={{ mt: 3 }}>
          <Pagination
            count={data.totalPages}
            page={page + 1}
            onChange={(_, p) => setPage(p - 1)}
            color="primary"
            shape="rounded"
          />
        </Stack>
      )}

      {/* Detail dialog */}
      <Dialog open={!!detail} onClose={() => setDetail(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: `${tokens.radius.lg}px` } }}>
        <DialogTitle sx={{ fontWeight: 600 }}>
          {detail?.name || 'Lead'}
        </DialogTitle>
        <DialogContent dividers>
          {detail && (
            <Stack spacing={1.5}>
              <Field label="Nombre" value={detail.name} />
              <Field label="Email" value={detail.email} copy />
              <Field label="Teléfono" value={detail.phone} copy />
              <Field label="Asunto" value={detail.subject} />
              <Field label="Origen" value={detail.source} />
              <Field label="Fecha" value={formatDate(detail.createdAt)} />
              {detail.message && (
                <Box>
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>
                    Mensaje
                  </Typography>
                  <Typography sx={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{detail.message}</Typography>
                </Box>
              )}
              <Box sx={{ pt: 1 }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>
                  HubSpot
                </Typography>
                <Typography sx={{ fontSize: '0.85rem' }}>
                  {detail.hubspotSyncStatus
                    ? <>Estado: <strong>{detail.hubspotSyncStatus}</strong>{detail.hubspotId ? ` · id ${detail.hubspotId}` : ''}</>
                    : 'No sincronizado'}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(detail)} startIcon={<DeleteOutlineRoundedIcon />} color="error">
            Eliminar
          </Button>
          <Box sx={{ flex: 1 }} />
          {detail?.email && (
            <Tooltip title="Abrir en nuevo email">
              <IconButton component="a" href={`mailto:${detail.email}`} size="small">
                <OpenInNewRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Button onClick={() => setDetail(null)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm delete */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle>¿Eliminar lead?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.9rem' }}>
            Vas a eliminar permanentemente el lead de <strong>{confirmDelete?.name}</strong> ({confirmDelete?.email}). No se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disableElevation>Eliminar</Button>
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
