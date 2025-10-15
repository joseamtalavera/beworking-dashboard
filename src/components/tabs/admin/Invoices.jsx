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
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

import { fetchInvoices, fetchInvoicePdfUrl, fetchInvoicePdfBlob, createInvoice, creditInvoice } from '../../../api/invoices.js';
import InvoiceEditor from './InvoiceEditor.jsx';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const formatCurrency = (value) => {
  if (value == null) return '—';
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(number);
};

const statusColor = (estado) => {
  const key = (estado || '').toLowerCase();
  if (key.includes('pag') || key.includes('paid') || key.includes('pagado')) return 'success';
  // invoice/facturas should be shown as warning (yellow) until paid
  if (key.includes('fact') || key.includes('invoice') || key.includes('invoiced')) return 'warning';
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
  const [newInvoiceOpen, setNewInvoiceOpen] = useState(false);
  const [newInvoiceForm, setNewInvoiceForm] = useState({ bloqueoIds: '', description: '', reference: '', vatPercent: 21 });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

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

      {/* Filters Section */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2, border: '1px solid #e5e7eb' }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#374151', fontWeight: 600 }}>
          Filters
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={2}>
            <TextField
              label="Client Name"
              value={filters.name}
              onChange={handleFilterChange('name')}
              fullWidth
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#22c55e',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#22c55e',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#22c55e',
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              label="Email"
              value={filters.email}
              onChange={handleFilterChange('email')}
              fullWidth
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#22c55e',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#22c55e',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#22c55e',
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              label="Invoice ID"
              value={filters.idFactura}
              onChange={handleFilterChange('idFactura')}
              fullWidth
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#22c55e',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#22c55e',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#22c55e',
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ '&.Mui-focused': { color: '#22c55e' } }}>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={handleFilterChange('status')}
                label="Status"
                sx={{
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#22c55e',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#22c55e',
                  },
                }}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="pagado">Paid</MenuItem>
                <MenuItem value="facturado">Invoiced</MenuItem>
                <MenuItem value="pendiente">Pending</MenuItem>
                <MenuItem value="cancelado">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ '&.Mui-focused': { color: '#22c55e' } }}>User Type</InputLabel>
              <Select
                value={filters.tenantType}
                onChange={handleFilterChange('tenantType')}
                label="User Type"
                sx={{
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#22c55e',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#22c55e',
                  },
                }}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="USER">User</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              label="Product"
              value={filters.product}
              onChange={handleFilterChange('product')}
              fullWidth
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#22c55e',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#22c55e',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#22c55e',
                },
              }}
            />
          </Grid>
        </Grid>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            onClick={() => setNewInvoiceOpen(true)} 
            variant="contained" 
            size="small"
            sx={{
              backgroundColor: '#22c55e',
              '&:hover': {
                backgroundColor: '#16a34a',
              },
            }}
          >
            New Invoice
          </Button>
        </Box>
      </Paper>

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
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={async () => {
                        // open credit dialog in a new window/tab (simple flow for now)
                        const shouldCredit = window.confirm('Create a credit (rectification) for this invoice? This action is irreversible.');
                        if (!shouldCredit) return;
                        try {
                          await creditInvoice(inv.id, {});
                          alert('Credit created successfully. Refreshing list.');
                          // Refresh the list quickly
                          setLoading(true);
                          const refreshed = await fetchInvoices({ page, size: rowsPerPage, ...queryFilters });
                          setData({ content: refreshed.content || [], totalElements: refreshed.totalElements || 0 });
                        } catch (e) {
                          alert(e.message || 'Failed to create credit.');
                        } finally {
                          setLoading(false);
                        }
                      }}
                    >
                      Credit
                    </Button>
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

      <InvoiceEditor
        open={newInvoiceOpen}
        onClose={() => setNewInvoiceOpen(false)}
        onCreate={async (payload) => {
            try {
              setLoading(true);
              const created = await createInvoice(payload);
              setSnackbar({ open: true, message: 'Invoice created', severity: 'success' });
              setNewInvoiceOpen(false);
              const refreshed = await fetchInvoices({ page, size: rowsPerPage, ...queryFilters });
              setData({ content: refreshed.content || [], totalElements: refreshed.totalElements || 0 });
              try {
                const url = await fetchInvoicePdfUrl(created.id || created.idFactura || created.id);
                if (url) window.open(url, '_blank', 'noopener');
              } catch {}
            } catch (e) {
              setSnackbar({ open: true, message: e.message || 'Failed to create invoice', severity: 'error' });
            } finally {
              setLoading(false);
            }
        }}
      />
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default Invoices;
