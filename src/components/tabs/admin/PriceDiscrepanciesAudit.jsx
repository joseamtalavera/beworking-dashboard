import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import { useTheme, alpha } from '@mui/material/styles';
import { tokens } from '../../../theme/tokens.js';
import { fetchPriceDiscrepancies } from '../../../api/reports.js';

const formatEur = (n) => {
  if (n === null || n === undefined) return '€0.00';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(n));
};

const PriceDiscrepanciesAudit = () => {
  const theme = useTheme();
  const errorRed = theme.palette.error.main;
  const [data, setData] = useState({ rows: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPriceDiscrepancies();
      setData({
        rows: Array.isArray(res?.rows) ? res.rows : [],
        count: res?.count ?? 0,
      });
    } catch (e) {
      setError(e.message || 'Failed to load discrepancies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Paper elevation={0} sx={{ borderRadius: `${tokens.radius.lg}px`, p: 3, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.015em' }}>
            Auditoría de precios — DB vs Stripe
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Facturas Pagado (últimos 30 días) con diferencia &gt; 0,01€ entre el total de la BBDD y <code>amount_paid</code> de Stripe.
          </Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          onClick={load}
          disabled={loading}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          {loading ? <CircularProgress size={14} sx={{ mr: 1 }} /> : null}{loading ? 'Cargando…' : 'Refrescar'}
        </Button>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontStyle: 'italic' }}>
        Stripe es la fuente de verdad. Ajusta la BBDD o investiga cada caso.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
      ) : data.rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          Sin discrepancias. ✅
        </Typography>
      ) : (
        <>
          <Chip label={`${data.count} discrepancias`} color="warning" variant="outlined" sx={{ fontWeight: 600, mb: 2 }} />
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: alpha(errorRed, 0.04) }}>
                <TableCell sx={{ fontWeight: 700 }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Factura</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>DB</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Stripe</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Δ</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.rows.map((r) => (
                <TableRow key={r.facturaId} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 500 }}>{r.customerName || '—'}</Typography>
                    {r.customerEmail && (
                      <Typography variant="caption" color="text.secondary">{r.customerEmail}</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                    {r.idfactura ? `${r.cuenta || 'PT'}${r.idfactura}` : '—'}
                  </TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatEur(r.dbAmount)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatEur(r.stripeAmount)}</TableCell>
                  <TableCell align="right" sx={{ color: errorRed, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {formatEur(r.delta)}
                  </TableCell>
                  <TableCell align="right">
                    {r.stripeInvoiceId && (
                      <Button
                        size="small"
                        component="a"
                        href={`https://dashboard.stripe.com/invoices/${r.stripeInvoiceId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                      >
                        Open in Stripe →
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </Paper>
  );
};

export default PriceDiscrepanciesAudit;
