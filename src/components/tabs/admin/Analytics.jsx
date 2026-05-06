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
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { apiFetch } from '../../../api/client';

const formatNumber = (n) => (typeof n === 'number' ? n.toLocaleString('es-ES') : '—');

const Analytics = () => {
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

  const counts = stats?.counts || {};
  const total = Object.values(counts).reduce((a, b) => a + (b || 0), 0);
  const recoveryByTpl = stats?.recoveryEmailsByTemplate30d || {};
  const opensByTpl = stats?.recoveryOpensByTemplate30d || {};
  const reengagementOpens = stats?.reengagementOpens30d ?? 0;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Analytics</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Métricas del funnel y movimientos recientes.
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : !stats ? null : (
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
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Aperturas únicas</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Tasa</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(recoveryByTpl).map(([n, count]) => {
                      const opens = opensByTpl[n] ?? 0;
                      const rate = count > 0 ? `${Math.round((opens / count) * 100)}%` : '—';
                      return (
                        <TableRow key={n}>
                          <TableCell>Email #{n}</TableCell>
                          <TableCell align="right">{formatNumber(count)}</TableCell>
                          <TableCell align="right">{formatNumber(opens)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: opens > 0 ? 'success.main' : 'text.secondary' }}>
                            {rate}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow>
                      <TableCell colSpan={2} sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                        Reactivación (Inactivo)
                      </TableCell>
                      <TableCell align="right">{formatNumber(reengagementOpens)}</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </Stack>
      )}
    </Box>
  );
};

export default Analytics;
