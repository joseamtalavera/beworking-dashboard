import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import { apiFetch } from '../../../api/client';

const TabPanel = ({ value, index, children }) =>
  value === index ? <Box sx={{ pt: 3 }}>{children}</Box> : null;

const formatNumber = (n) => (typeof n === 'number' ? n.toLocaleString('es-ES') : '—');

function FunnelPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/admin/automation/funnel-stats');
      setStats(data);
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar las métricas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  if (!stats) return null;

  const counts = stats.counts || {};
  const total = Object.values(counts).reduce((a, b) => a + (b || 0), 0);
  const recoveryByTpl = stats.recoveryEmailsByTemplate30d || {};

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Funnel actual</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          {[
            { key: 'Activo', color: 'success' },
            { key: 'Potencial', color: 'warning' },
            { key: 'Inactivo', color: 'default' },
          ].map(({ key, color }) => (
            <Paper
              key={key}
              elevation={0}
              sx={{ p: 2.5, minWidth: 180, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                {key}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                {formatNumber(counts[key])}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {total > 0 ? `${Math.round((counts[key] / total) * 100)}%` : '—'} del total
              </Typography>
              <Chip size="small" color={color} label={key} sx={{ mt: 1, borderRadius: 1.5, fontWeight: 600 }} />
            </Paper>
          ))}
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Movimiento últimos 30 días</Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Paper elevation={0} sx={{ p: 2.5, minWidth: 220, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">Conversiones Potencial → Activo</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: 'success.main' }}>
              {formatNumber(stats.potencialesConverted30d)}
            </Typography>
          </Paper>
          <Paper elevation={0} sx={{ p: 2.5, minWidth: 220, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary">Caducados Potencial → Inactivo</Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5, color: 'text.secondary' }}>
              {formatNumber(stats.potencialesAgedOut30d)}
            </Typography>
          </Paper>
        </Stack>
      </Box>

      <Box>
        <Typography variant="h6" sx={{ mb: 2 }}>Correos de recuperación enviados (30 días)</Typography>
        {Object.keys(recoveryByTpl).length === 0 ? (
          <Typography variant="body2" color="text.secondary">Sin envíos en los últimos 30 días.</Typography>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.100' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Plantilla</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Envíos</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(recoveryByTpl).map(([n, count]) => (
                  <TableRow key={n}>
                    <TableCell>Email #{n}</TableCell>
                    <TableCell align="right">{formatNumber(count)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Stack>
  );
}

function EmailAutomationPanel() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [runningId, setRunningId] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/admin/automation/jobs');
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'No se pudieron cargar los trabajos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const runJob = async (job) => {
    setRunningId(job.name);
    try {
      const result = await apiFetch(`/admin/automation/jobs/${job.name}/run`, { method: 'POST' });
      const summary = Object.entries(result || {})
        .filter(([k]) => !['name'].includes(k))
        .map(([k, v]) => `${k}=${v}`)
        .join(' · ');
      setToast({ severity: 'success', message: `${job.label}: ${summary || 'ejecutado'}` });
      await load();
    } catch (err) {
      setToast({ severity: 'error', message: err?.message || `Falló ${job.label}` });
    } finally {
      setRunningId(null);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Cada trabajo corre automáticamente según su programación. Usa "Ejecutar ahora" para forzar una pasada manual sin esperar al próximo ciclo.
      </Typography>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell sx={{ fontWeight: 700 }}>Trabajo</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Programación</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Candidatos</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.name}>
                <TableCell>
                  <Typography fontWeight={600}>{job.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{job.description}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{job.cadence}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                    {job.cron}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Chip size="small" label={formatNumber(job.candidates)} color={job.candidates > 0 ? 'warning' : 'default'} variant="outlined" sx={{ borderRadius: 1.5, fontWeight: 600 }} />
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={runningId === job.name ? <CircularProgress size={14} /> : <PlayArrowRoundedIcon />}
                    onClick={() => runJob(job)}
                    disabled={runningId === job.name}
                    sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 999 }}
                  >
                    Ejecutar ahora
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar
        open={!!toast}
        autoHideDuration={6000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast && (
          <Alert onClose={() => setToast(null)} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
            {toast.message}
          </Alert>
        )}
      </Snackbar>
    </Stack>
  );
}

const Analytics = () => {
  const [tab, setTab] = useState(0);
  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>CRM Analytics</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Métricas del funnel y panel de control de los procesos automáticos.
      </Typography>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Funnel" sx={{ textTransform: 'none', fontWeight: 600 }} />
        <Tab label="Email Automation" sx={{ textTransform: 'none', fontWeight: 600 }} />
      </Tabs>
      <TabPanel value={tab} index={0}><FunnelPanel /></TabPanel>
      <TabPanel value={tab} index={1}><EmailAutomationPanel /></TabPanel>
    </Box>
  );
};

export default Analytics;
