import { useEffect, useMemo, useState } from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

import { fetchInvoices, fetchInvoicePdfUrl, fetchInvoicePdfBlob } from '../../../api/invoices.js';

const formatCurrency = (value) => {
  if (value == null) return '—';
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(number);
};

const statusColor = (estado) => {
  const key = (estado || '').toLowerCase();
  if (key.includes('pagado')) return 'success';
  if (key.includes('pend') || key.includes('confir')) return 'warning';
  if (key.includes('cancel')) return 'default';
  return 'default';
};

const Invoices = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState({ content: [], totalElements: 0 });
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    idFactura: '',
    status: '',
    tenantType: '',
    product: ''
  });
  const [queryFilters, setQueryFilters] = useState(filters);

  useEffect(() => {
    const handler = setTimeout(() => {
      setQueryFilters((prev) => {
        const next = { ...filters };
        if (JSON.stringify(prev) === JSON.stringify(next)) {
          return prev;
        }
        setPage(0);
        return next;
      });
    }, 300);
    return () => clearTimeout(handler);
  }, [filters]);

  useEffect(() => {
    setLoading(true);
    setError('');
    fetchInvoices({ page, size: rowsPerPage, ...queryFilters })
      .then((res) => {
        setData({ content: res.content || [], totalElements: res.totalElements || 0 });
      })
      .catch((e) => setError(e.message || 'Failed to load invoices'))
      .finally(() => setLoading(false));
  }, [page, rowsPerPage, queryFilters]);

  const rows = useMemo(() => data.content || [], [data]);

  const handleChangePage = (_e, newPage) => setPage(newPage);
  const handleFilterChange = (field) => (event) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, [field]: value }));
  };
  const handleClearFilters = () => {
    setFilters({
      name: '',
      email: '',
      idFactura: '',
      status: '',
      tenantType: '',
      product: ''
    });
  };

  return (
    <Paper elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid #e2e8f0' }}>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={700}>
          Billing & invoices
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Imported from legacy system (`beworking.facturas`).
        </Typography>
      </Stack>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Client name"
              value={filters.name}
              onChange={handleFilterChange('name')}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Email"
              value={filters.email}
              onChange={handleFilterChange('email')}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Invoice ID"
              value={filters.idFactura}
              onChange={handleFilterChange('idFactura')}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Status"
              value={filters.status}
              onChange={handleFilterChange('status')}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="User type"
              value={filters.tenantType}
              onChange={handleFilterChange('tenantType')}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Product"
              value={filters.product}
              onChange={handleFilterChange('product')}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={handleClearFilters} variant="text" size="small">
                Clear filters
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="error">{error}</Typography>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Invoice ID</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>User type</TableCell>
                <TableCell>Products</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Issued</TableCell>
                <TableCell align="right">Document</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((inv) => (
                <TableRow key={inv.id} hover>
                  <TableCell>{inv.holdedInvoiceNum || inv.idFactura || inv.id}</TableCell>
                  <TableCell>{inv.clientName || '—'}</TableCell>
                  <TableCell>{inv.tenantType || '—'}</TableCell>
                  <TableCell>{inv.products || '—'}</TableCell>
                  <TableCell align="right">{formatCurrency(inv.total)}</TableCell>
                  <TableCell>
                    <Chip label={inv.estado || '—'} size="small" color={statusColor(inv.estado)} variant="outlined" />
                  </TableCell>
                  <TableCell>{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('es-ES') : '—'}</TableCell>
                  <TableCell align="right">
                    <Link
                      component="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        try {
                          // Prefer on-demand generated PDF and open in a new tab without saving
                          const blob = await fetchInvoicePdfBlob(inv.id);
                          const objectUrl = URL.createObjectURL(blob);
                          window.open(objectUrl, '_blank', 'noopener');
                          // Revoke later to avoid memory leaks
                          setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
                        } catch {
                          // Fallback to legacy URL resolution
                          try {
                            const url = inv.holdedinvoicepdf || (await fetchInvoicePdfUrl(inv.id));
                            if (url) window.open(url, '_blank', 'noopener');
                          } catch {}
                        }
                      }}
                      color="#16a34a"
                      underline="hover"
                    >
                      Open
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  {/* empty rows fallback */}
                  <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">No invoices found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={data.totalElements}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[rowsPerPage]}
          />
        </>
      )}
    </Paper>
  );
};

export default Invoices;
