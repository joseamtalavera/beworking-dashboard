import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
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

const formatNumber = (n) => (typeof n === 'number' ? n.toLocaleString('es-ES') : '—');

const EmailAutomation = () => {
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

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Email Automation</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Panel de control de los procesos automáticos de email y movimientos del funnel. Cada trabajo corre según su programación; usa "Ejecutar ahora" para forzar una pasada manual.
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Stack spacing={2}>
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
                      <Chip
                        size="small"
                        label={formatNumber(job.candidates)}
                        color={job.candidates > 0 ? 'warning' : 'default'}
                        variant="outlined"
                        sx={{ borderRadius: 1.5, fontWeight: 600 }}
                      />
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
        </Stack>
      )}

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
    </Box>
  );
};

export default EmailAutomation;
