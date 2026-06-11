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
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useTheme, alpha } from '@mui/material/styles';
import { tokens } from '../../../theme/tokens.js';
import { fetchMeetingRoomPastDue } from '../../../api/reports.js';

const formatEur = (n) => {
  if (n === null || n === undefined) return '€0.00';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(n));
};

const MeetingRoomReconciliationCard = () => {
  const theme = useTheme();
  const errorRed = theme.palette.error.main;
  const [data, setData] = useState({ rows: [], count: 0, totalAmount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchMeetingRoomPastDue();
      setData({
        rows: Array.isArray(res?.rows) ? res.rows : [],
        count: res?.count ?? 0,
        totalAmount: res?.totalAmount ?? 0,
      });
    } catch (e) {
      setError(e.message || 'Failed to load meeting-room past-due');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Paper elevation={0} sx={{ borderRadius: `${tokens.radius.lg}px`, p: 3, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.015em' }}>
            Salas — facturas past-due (PT)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Pendiente con +24h desde la creación · cuenta PT · tenant_type = Usuario Aulas
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

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
      ) : data.rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          Ninguna factura past-due. 🎉
        </Typography>
      ) : (
        <>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <Chip label={`${data.count} facturas`} color="warning" variant="outlined" sx={{ fontWeight: 600 }} />
            <Chip label={formatEur(data.totalAmount)} color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
          </Stack>

          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: alpha(errorRed, 0.04) }}>
                <TableCell sx={{ fontWeight: 700 }}>Cliente</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>WhatsApp</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Factura</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Importe</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Días</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.rows.map((r) => {
                // Bilingual (ES + EN) reminder + the customer-facing Stripe
                // payment link (hostedInvoiceUrl). Falls back to a link-less
                // message when the hosted URL is missing.
                const payUrl = r.hostedInvoiceUrl || null;
                const amountStr = formatEur(r.total);
                const esName = r.customerName ? `Hola ${r.customerName}, ` : 'Hola, ';
                const enName = r.customerName ? `Hi ${r.customerName}, ` : 'Hi, ';
                const waEs = `${esName}tu recibo de BeWorking por ${amountStr} está pendiente de pago.${payUrl ? ` Puedes pagarlo aquí: ${payUrl}` : ''}`;
                const waEn = `${enName}your BeWorking invoice for ${amountStr} is pending payment.${payUrl ? ` You can pay it here: ${payUrl}` : ''}`;
                const waHref = r.customerPhone
                  ? `https://wa.me/${String(r.customerPhone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`${waEs}\n\n${waEn}`)}`
                  : null;
                return (
                <TableRow key={r.facturaId} hover>
                  <TableCell>
                    <Typography sx={{ fontWeight: 500 }}>{r.customerName || '—'}</Typography>
                    {r.customerEmail && (
                      <Typography variant="caption" color="text.secondary">{r.customerEmail}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.customerPhone ? (
                      <Tooltip title="WhatsApp">
                        <IconButton
                          size="small"
                          component="a"
                          href={waHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ color: '#25D366', '&:hover': { bgcolor: alpha('#25D366', 0.12) } }}
                        >
                          <WhatsAppIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}>
                    {r.idfactura ? `PT${r.idfactura}` : '—'}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {formatEur(r.total)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: errorRed, fontWeight: 600 }}>
                    {r.daysPastDue}
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </>
      )}
    </Paper>
  );
};

export default MeetingRoomReconciliationCard;
