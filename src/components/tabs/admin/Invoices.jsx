import { useEffect, useMemo, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';

// Colors are now defined in theme.js - use theme palette: primary.main/dark for green, secondary.main/dark for orange

import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Pagination from '@mui/material/Pagination';
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
import InputAdornment from '@mui/material/InputAdornment';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import ReceiptRoundedIcon from '@mui/icons-material/ReceiptRounded';
import CategoryRoundedIcon from '@mui/icons-material/CategoryRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import CalendarTodayRoundedIcon from '@mui/icons-material/CalendarTodayRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';

import { fetchInvoices, fetchInvoicePdfUrl, fetchInvoicePdfBlob, createInvoice, createManualInvoice, creditInvoice } from '../../../api/invoices.js';
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
  if (key.includes('pend') || key.includes('confir')) return 'error';
  // invoice/facturas should be shown as warning (yellow) until paid
  if (key.includes('fact') || key.includes('invoice') || key.includes('invoiced')) return 'warning';
  if (key.includes('cancel')) return 'default';
  return 'default';
};

const PAGE_SIZE = 100; // Server-side pagination - 100 invoices per page

const Invoices = () => {
  const theme = useTheme();
  const [page, setPage] = useState(0); // Backend uses 0-based pagination
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState({ content: [], totalElements: 0 });
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [filters, setFilters] = useState({
    name: '',
    email: '',
    idFactura: '',
    status: '',
    tenantType: '',
    product: '',
    startDate: '',
    endDate: ''
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
    console.log('Fetching invoices with filters:', queryFilters);
    
    // Fetch invoices (now includes total revenue)
    const fetchInitialInvoices = async () => {
      try {
        const response = await fetchInvoices({ 
          page: 0, 
          size: 25, // Fetch first 25 invoices (1 page)
          name: queryFilters.name,
          email: queryFilters.email,
          idFactura: queryFilters.idFactura,
          status: queryFilters.status,
          tenantType: queryFilters.tenantType,
          product: queryFilters.product,
          startDate: queryFilters.startDate,
          endDate: queryFilters.endDate,
          from: queryFilters.startDate,
          to: queryFilters.endDate
        });
        
        console.log('Fetched initial invoices:', response);
        
        setData({ 
          content: response.content || [], 
          totalElements: response.totalElements || 0 
        });
        setTotalRevenue(response.totalRevenue || 0);
      } catch (e) {
        console.error('Error fetching invoices:', e);
        setError(e.message || 'Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialInvoices();
  }, [queryFilters]);

  // Client-side filtering (disabled since backend now handles date filtering)
  const rows = useMemo(() => {
    // Backend now handles all filtering including date filtering
    // So we just return the content as-is
    return data.content || [];
  }, [data.content]);

  // Server-side pagination
  const totalPages = Math.ceil((data.totalElements || 0) / PAGE_SIZE);
  const paginatedRows = rows; // Use all rows from current page

  const handleChangePage = (_e, newPage) => {
    setPage(newPage - 1); // Convert to 0-based for backend
    setLoading(true);
    
    // Fetch the new page from backend
    fetchInvoices({ 
      page: newPage - 1, // 0-based pagination
      size: PAGE_SIZE,
      name: queryFilters.name,
      email: queryFilters.email,
      idFactura: queryFilters.idFactura,
      status: queryFilters.status,
      tenantType: queryFilters.tenantType,
      product: queryFilters.product,
      startDate: queryFilters.startDate,
      endDate: queryFilters.endDate,
      from: queryFilters.startDate,
      to: queryFilters.endDate
    })
      .then((res) => {
        setData({ 
          content: res.content || [], 
          totalElements: res.totalElements || 0 
        });
        setTotalRevenue(res.totalRevenue || 0);
      })
      .catch((e) => {
        console.error('Error fetching invoices page:', e);
        setError(e.message || 'Failed to load invoices');
      })
      .finally(() => setLoading(false));
  };
  const handleFilterChange = (field) => (event) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Paper elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid', borderColor: 'divider' }}>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={700}>
          Billing & invoices
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Imported from legacy system (`beworking.facturas`).
        </Typography>
      </Stack>

      {/* Filters Section - Always visible like Contacts/MailboxAdmin */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          Filters
        </Typography>
        <Grid container spacing={3}>
          {/* Top Row - Search fields (wider) */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search by Name"
              value={filters.name}
              onChange={handleFilterChange('name')}
              placeholder="Search by name"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search by Email"
              value={filters.email}
              onChange={handleFilterChange('email')}
              placeholder="Search by email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <MailOutlinedIcon sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Invoice ID"
              value={filters.idFactura}
              onChange={handleFilterChange('idFactura')}
              placeholder="Search by ID"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ReceiptRoundedIcon sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={1.5}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={handleFilterChange('status')}
                label="Status"
                displayEmpty
                startAdornment={
                  <InputAdornment position="start">
                    <CheckCircleRoundedIcon sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                }
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="pagado">Pagado</MenuItem>
                <MenuItem value="pendiente">Pendiente</MenuItem>
                <MenuItem value="cancelado">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={1.5}>
            <FormControl fullWidth>
              <InputLabel>User Type</InputLabel>
              <Select
                value={filters.tenantType}
                onChange={handleFilterChange('tenantType')}
                label="User Type"
                displayEmpty
                startAdornment={
                  <InputAdornment position="start">
                    <PersonRoundedIcon sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                }
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="USER">User</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {/* Bottom Row */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Product"
              value={filters.product}
              onChange={handleFilterChange('product')}
              placeholder="Search by product"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CategoryRoundedIcon sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={filters.startDate}
              onChange={handleFilterChange('startDate')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={filters.endDate}
              onChange={handleFilterChange('endDate')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
        <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setFilters({
              name: '',
              email: '',
              idFactura: '',
              status: '',
              tenantType: '',
              product: '',
              startDate: new Date().getFullYear() + '-01-01', // Reset to January 1st of current year
              endDate: ''
            })}
            sx={{
              minWidth: 120,
              height: 36,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: 'secondary.main',
              color: 'secondary.main',
              '&:hover': {
                borderColor: theme.palette.brand.orangeHover,
                color: theme.palette.brand.orangeHover,
                backgroundColor: alpha(theme.palette.brand.orange, 0.08),
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 12px ${alpha(theme.palette.brand.orange, 0.2)}`
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            RESET
          </Button>
          <Button 
            onClick={() => setNewInvoiceOpen(true)} 
            variant="contained" 
            size="small"
            sx={{
              minWidth: 120,
              height: 36,
              textTransform: 'none',
              fontWeight: 600,
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark'
              }
            }}
          >
            NEW INVOICE
          </Button>
          <Stack direction="row" spacing={2} sx={{ alignSelf: 'center', width: '100%' }} justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              Showing {rows.length} invoices
            </Typography>
            {totalRevenue > 0 && (
              <Typography variant="body2" color="text.primary" sx={{ fontWeight: 'bold' }}>
                Total Revenue: {formatCurrency(totalRevenue)}
              </Typography>
            )}
          </Stack>
        </Stack>
      </Paper>

      {error && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: 'secondary.main' }}>{error}</Typography>
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
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Invoice ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>User type</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Products</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Issued</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Document</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((inv) => (
          <TableRow key={inv.id} hover>
                  <TableCell>{inv.holdedInvoiceNum || inv.idFactura || inv.id}</TableCell>
                  <TableCell>{inv.clientName || '—'}</TableCell>
                  <TableCell>{inv.tenantType || '—'}</TableCell>
                  <TableCell>{inv.products || '—'}</TableCell>
                  <TableCell align="right">{formatCurrency(inv.total)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={inv.estado || '—'} 
                      size="small" 
                      color={statusColor(inv.estado)} 
                      variant="outlined" 
                      sx={{ 
                        minWidth: 100,
                        height: 24,
                        fontSize: '0.75rem',
                        fontWeight: 500
                      }} 
                    />
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
                      color="secondary.main"
                      underline="hover"
                    >
                      Open
                    </Link>
                  </TableCell>
                  <TableCell>
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
                      sx={{
                        minWidth: 80,
                        height: 28,
                        textTransform: 'none',
                        fontWeight: 600,
                        borderColor: 'secondary.main',
                        color: 'secondary.main',
                        '&:hover': {
                          borderColor: 'secondary.main',
                          color: 'secondary.main',
                          backgroundColor: (theme) => `${theme.palette.secondary.main}14`,
                          transform: 'translateY(-1px)',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.2)}`
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                    >
                      CREDIT
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedRows.length === 0 && (
                <TableRow>
                  {/* empty rows fallback */}
                  <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">No invoices found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
              <Pagination
                count={totalPages}
                page={page + 1} // Convert back to 1-based for display
                onChange={handleChangePage}
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
                      '&:hover': {
                        backgroundColor: 'secondary.main',
                      },
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
              bgcolor: alpha(theme.palette.background.default, 0.6)
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                {rows.length === 0 ? '0 results' : `${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, data.totalElements || 0)} of ${data.totalElements || 0}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Page {page + 1} of {totalPages}
              </Typography>
            </Stack>
          </Box>
        </>
      )}

      <InvoiceEditor
        open={newInvoiceOpen}
        onClose={() => setNewInvoiceOpen(false)}
        onCreate={async (payload) => {
            try {
              setLoading(true);
              const created = payload?.lineItems?.length
                ? await createManualInvoice(payload)
                : await createInvoice(payload);
              setSnackbar({ open: true, message: 'Invoice created', severity: 'success' });
              setNewInvoiceOpen(false);
              const refreshed = await fetchInvoices({ page, size: rowsPerPage, ...queryFilters });
              setData({ content: refreshed.content || [], totalElements: refreshed.totalElements || 0 });
              try {
                const url = await fetchInvoicePdfUrl(created.id || created.idFactura || created.id);
                if (url) window.open(url, '_blank', 'noopener');
              } catch {}
              return created;
            } catch (e) {
              setSnackbar({ open: true, message: e.message || 'Failed to create invoice', severity: 'error' });
              throw e;
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
