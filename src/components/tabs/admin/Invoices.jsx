import { useEffect, useMemo, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';

// Colors are now defined in theme.js - use theme palette: primary.main/dark for green, secondary.main/dark for orange

import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Pagination from '@mui/material/Pagination';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import ReceiptOutlinedIcon from '@mui/icons-material/ReceiptOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';

import { fetchInvoices, fetchInvoice, fetchInvoicePdfUrl, fetchInvoicePdfBlob, createInvoice, createManualInvoice, updateInvoice, updateInvoiceStatus, creditInvoice } from '../../../api/invoices.js';
import InvoiceEditor from './InvoiceEditor.jsx';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n/i18n.js';
import esInvoices from '../../../i18n/locales/es/invoices.json';
import enInvoices from '../../../i18n/locales/en/invoices.json';
import { formatCurrency } from '../../../i18n/formatters.js';

if (!i18n.hasResourceBundle('es', 'invoices')) {
  i18n.addResourceBundle('es', 'invoices', esInvoices);
  i18n.addResourceBundle('en', 'invoices', enInvoices);
}

const isPaid = (estado) => {
  const key = (estado || '').toLowerCase();
  return key.includes('pag') || key.includes('paid');
};

const isRectificado = (estado) => {
  const key = (estado || '').toLowerCase();
  return key.includes('rectificad');
};

const isCreditNote = (inv) => {
  return inv.total != null && Number(inv.total) < 0;
};

const getStatusInfo = (inv, t) => {
  if (isRectificado(inv.estado)) {
    return { label: t('rectificado'), color: 'warning' };
  }
  if (isCreditNote(inv)) {
    return { label: t('credited'), color: 'warning' };
  }
  if (isPaid(inv.estado)) {
    return { label: t('paid'), color: 'success' };
  }
  return { label: t('unpaid'), color: 'error' };
};

const PAGE_SIZE = 100; // Server-side pagination - 100 invoices per page

const Invoices = ({ mode = 'admin', userProfile }) => {
  const theme = useTheme();
  const { t } = useTranslation('invoices');
  const isAdmin = mode === 'admin';
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
  const [editInvoice, setEditInvoice] = useState(null); // { id, ...initial data }
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Build the effective filters: for user mode, always filter by user email
  const effectiveFilters = useMemo(() => {
    const base = { ...queryFilters };
    if (!isAdmin && userProfile?.email) {
      base.email = userProfile.email;
    }
    return base;
  }, [queryFilters, isAdmin, userProfile]);

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

    const fetchInitialInvoices = async () => {
      try {
        const response = await fetchInvoices({
          page: 0,
          size: PAGE_SIZE,
          name: effectiveFilters.name,
          email: effectiveFilters.email,
          idFactura: effectiveFilters.idFactura,
          status: effectiveFilters.status,
          tenantType: effectiveFilters.tenantType,
          product: effectiveFilters.product,
          startDate: effectiveFilters.startDate,
          endDate: effectiveFilters.endDate,
          from: effectiveFilters.startDate,
          to: effectiveFilters.endDate
        });

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
  }, [effectiveFilters]);

  // Client-side filtering (disabled since backend now handles date filtering)
  const rows = useMemo(() => {
    return data.content || [];
  }, [data.content]);

  // Server-side pagination
  const totalPages = Math.ceil((data.totalElements || 0) / PAGE_SIZE);
  const paginatedRows = rows;

  const handleChangePage = (_e, newPage) => {
    setPage(newPage - 1);
    setLoading(true);

    fetchInvoices({
      page: newPage - 1,
      size: PAGE_SIZE,
      name: effectiveFilters.name,
      email: effectiveFilters.email,
      idFactura: effectiveFilters.idFactura,
      status: effectiveFilters.status,
      tenantType: effectiveFilters.tenantType,
      product: effectiveFilters.product,
      startDate: effectiveFilters.startDate,
      endDate: effectiveFilters.endDate,
      from: effectiveFilters.startDate,
      to: effectiveFilters.endDate
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

  const normalizeDateInput = (value) => {
    if (typeof value !== 'string') return value;
    const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
    return value;
  };

  const handleFilterChange = (field) => (event) => {
    let value = event.target.value;
    if (field === 'startDate' || field === 'endDate') {
      value = normalizeDateInput(value);
    }
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const refreshList = async () => {
    setLoading(true);
    try {
      const refreshed = await fetchInvoices({ page, size: PAGE_SIZE, ...effectiveFilters });
      setData({ content: refreshed.content || [], totalElements: refreshed.totalElements || 0 });
      setTotalRevenue(refreshed.totalRevenue || 0);
    } catch (e) {
      setError(e.message || 'Failed to refresh invoices');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid', borderColor: 'divider' }}>
      <Stack spacing={0.5} sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={700}>
          {t(isAdmin ? 'title' : 'titleUser')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t(isAdmin ? 'subtitle' : 'subtitleUser')}
        </Typography>
      </Stack>

      {/* Filters Section */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          {t('filters')}
        </Typography>
        <Grid container spacing={3}>
          {/* Admin-only filters: name, email, user type */}
          {isAdmin && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label={t('searchByName')}
                  value={filters.name}
                  onChange={handleFilterChange('name')}
                  placeholder={t('searchByName')}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlinedIcon sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label={t('searchByEmail')}
                  value={filters.email}
                  onChange={handleFilterChange('email')}
                  placeholder={t('searchByEmail')}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MailOutlinedIcon sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </>
          )}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label={t('invoiceId')}
              value={filters.idFactura}
              onChange={handleFilterChange('idFactura')}
              placeholder={t('searchById')}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ReceiptOutlinedIcon sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={isAdmin ? 1.5 : 3}>
            <FormControl fullWidth size="small">
              <InputLabel shrink>{t('status')}</InputLabel>
              <Select
                value={filters.status}
                onChange={handleFilterChange('status')}
                label={t('status')}
                displayEmpty
              >
                <MenuItem value="">{t('all')}</MenuItem>
                <MenuItem value="pagado">{t('paid')}</MenuItem>
                <MenuItem value="pendiente">{t('unpaid')}</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {isAdmin && (
            <Grid item xs={12} sm={6} md={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel shrink>{t('userType')}</InputLabel>
                <Select
                  value={filters.tenantType}
                  onChange={handleFilterChange('tenantType')}
                  label={t('userType')}
                  displayEmpty
                >
                  <MenuItem value="">{t('allUserTypes')}</MenuItem>
                  <MenuItem value="Distribuidor">Distribuidor</MenuItem>
                  <MenuItem value="Proveedor">Proveedor</MenuItem>
                  <MenuItem value="Servicios">Servicios</MenuItem>
                  <MenuItem value="Usuario Aulas">Usuario Aulas</MenuItem>
                  <MenuItem value="Usuario Mesa">Usuario Mesa</MenuItem>
                  <MenuItem value="Usuario N\u00f3mada">Usuario N\u00f3mada</MenuItem>
                  <MenuItem value="Usuario Portal">Usuario Portal</MenuItem>
                  <MenuItem value="Usuario Virtual">Usuario Virtual</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Shared filters: product, dates */}
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label={t('product')}
              value={filters.product}
              onChange={handleFilterChange('product')}
              placeholder={t('searchByProduct')}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CategoryOutlinedIcon sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label={t('startDate')}
              type="date"
              value={filters.startDate}
              onChange={handleFilterChange('startDate')}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label={t('endDate')}
              type="date"
              value={filters.endDate}
              onChange={handleFilterChange('endDate')}
              InputLabelProps={{ shrink: true }}
              size="small"
            />
          </Grid>
        </Grid>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
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
                startDate: '',
                endDate: ''
              })}
              sx={{
                minWidth: 100,
                height: 36,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  color: 'primary.dark',
                  backgroundColor: (theme) => `${theme.palette.primary.main}14`,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {t('reset')}
            </Button>
            {isAdmin && (
              <Button
                onClick={() => setNewInvoiceOpen(true)}
                variant="contained"
                size="small"
                sx={{
                  minWidth: 100,
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
                {t('newInvoice')}
              </Button>
            )}
          </Stack>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              {t('showingInvoices', { count: rows.length })}
            </Typography>
            {isAdmin && totalRevenue > 0 && (
              <Typography variant="body2" color="text.primary" sx={{ fontWeight: 'bold' }}>
                {t('totalRevenue', { amount: formatCurrency(totalRevenue) })}
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
          <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <Table size="small" sx={{ tableLayout: 'fixed', width: '100%', '& .MuiTableCell-root': { px: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 'bold', width: '8%' }}>{t('table.invoiceId')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: isAdmin ? '13%' : '20%' }}>{t('table.client')}</TableCell>
                {isAdmin && <TableCell sx={{ fontWeight: 'bold', width: '9%' }}>{t('table.userType')}</TableCell>}
                <TableCell sx={{ fontWeight: 'bold', width: isAdmin ? '20%' : '30%' }}>{t('table.products')}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', width: '8%' }}>{t('table.total')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '8%' }}>{t('status')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', width: '9%' }}>{t('table.issued')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', width: '5%' }}>{t('table.document')}</TableCell>
                {isAdmin && <TableCell sx={{ fontWeight: 'bold', width: '15%' }}>{t('table.actions')}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((inv) => (
          <TableRow key={inv.id} hover>
                  <TableCell>{inv.holdedInvoiceNum || inv.idFactura || inv.id}</TableCell>
                  <TableCell>{inv.clientName || '\u2014'}</TableCell>
                  {isAdmin && <TableCell>{inv.tenantType || '\u2014'}</TableCell>}
                  <TableCell>
                    <Tooltip title={inv.products || ''} placement="top-start" enterDelay={500}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.products || '\u2014'}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                      {formatCurrency(inv.total)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {(() => {
                      const si = getStatusInfo(inv, t);
                      const isClickable = isAdmin && !isRectificado(inv.estado) && !isCreditNote(inv);
                      return (
                        <Chip
                          label={si.label}
                          size="small"
                          color={si.color}
                          clickable={isClickable}
                          onClick={isClickable ? async () => {
                            const newStatus = isPaid(inv.estado) ? 'Pendiente' : 'Pagado';
                            try {
                              await updateInvoiceStatus(inv.id, newStatus);
                              await refreshList();
                              setSnackbar({ open: true, message: t('invoiceUpdated'), severity: 'success' });
                            } catch (e) {
                              setSnackbar({ open: true, message: e.message || t('invoiceUpdateError'), severity: 'error' });
                            }
                          } : undefined}
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            height: 24,
                            minWidth: 80,
                            cursor: isClickable ? 'pointer' : 'default',
                          }}
                        />
                      );
                    })()}
                  </TableCell>
                  <TableCell>{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('es-ES') : '\u2014'}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label="PDF"
                      size="small"
                      variant="outlined"
                      clickable
                      onClick={async () => {
                        try {
                          const blob = await fetchInvoicePdfBlob(inv.id);
                          const objectUrl = URL.createObjectURL(blob);
                          window.open(objectUrl, '_blank', 'noopener');
                          setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
                        } catch {
                          try {
                            const url = inv.holdedinvoicepdf || (await fetchInvoicePdfUrl(inv.id));
                            if (url) window.open(url, '_blank', 'noopener');
                          } catch {}
                        }
                      }}
                      sx={{
                        borderColor: 'primary.main',
                        color: 'primary.main',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 24,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                        },
                      }}
                    />
                  </TableCell>
                  {isAdmin && (
                  <TableCell>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={async () => {
                          try {
                            const detail = await fetchInvoice(inv.id);
                            const lineItems = (detail.lineItems || []).map((li) => ({
                              description: li.conceptodesglose || '',
                              quantity: Number(li.cantidaddesglose || 1),
                              price: Number(li.precioundesglose || 0),
                              vatPercent: 21
                            }));
                            setEditInvoice({
                              id: inv.id,
                              client: inv.clientName ? { label: inv.clientName, value: inv.idCliente } : null,
                              clientName: inv.clientName || '',
                              invoiceNum: inv.holdedInvoiceNum || String(inv.idFactura || ''),
                              date: detail.fechacreacionreal ? String(detail.fechacreacionreal) : (inv.createdAt ? inv.createdAt.slice(0, 10) : ''),
                              dueDate: detail.fechacobro1 ? String(detail.fechacobro1) : '',
                              lines: lineItems.length > 0 ? lineItems : [{ description: '', quantity: 1, price: 0, vatPercent: 21 }],
                              note: detail.notas || '',
                              userType: inv.tenantType || '',
                              center: detail.idcentro ? String(detail.idcentro) : '',
                              cuenta: detail.holdedcuenta || '',
                              status: inv.estado || 'Pendiente'
                            });
                          } catch (e) {
                            setSnackbar({ open: true, message: e.message || t('invoiceUpdateError'), severity: 'error' });
                          }
                        }}
                        sx={{
                          minWidth: 60,
                          height: 28,
                          textTransform: 'none',
                          fontWeight: 600,
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          '&:hover': {
                            borderColor: 'primary.dark',
                            color: 'primary.dark',
                            backgroundColor: (theme) => `${theme.palette.primary.main}14`,
                            transform: 'translateY(-1px)',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                      >
                        {t('edit')}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={async () => {
                          const invoiceNum = inv.holdedInvoiceNum || inv.idFactura || inv.id;
                          const shouldCredit = window.confirm(t('creditConfirm', { invoiceNum }));
                          if (!shouldCredit) return;
                          try {
                            const result = await creditInvoice(inv.id, {});
                            const refundId = result?.holdedInvoiceNum || result?.idFactura || result?.id || '';
                            setSnackbar({ open: true, message: t('refundCreated', { refundId }), severity: 'success' });
                            await refreshList();
                          } catch (e) {
                            setSnackbar({ open: true, message: e.message || t('refundError'), severity: 'error' });
                          }
                        }}
                        sx={{
                          minWidth: 60,
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
                        {t('credit')}
                      </Button>
                    </Stack>
                  </TableCell>
                  )}
                </TableRow>
              ))}
              {paginatedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 9 : 7} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">{t('noInvoices')}</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
              <Pagination
                count={totalPages}
                page={page + 1}
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
                {rows.length === 0 ? t('results') : t('pageRange', { start: page * PAGE_SIZE + 1, end: Math.min((page + 1) * PAGE_SIZE, data.totalElements || 0), total: data.totalElements || 0 })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('pageOf', { page: page + 1, totalPages })}
              </Typography>
            </Stack>
          </Box>
        </>
      )}

      {isAdmin && (
        <InvoiceEditor
          open={newInvoiceOpen}
          onClose={() => setNewInvoiceOpen(false)}
          onCreate={async (payload) => {
              try {
                setLoading(true);
                const created = payload?.lineItems?.length
                  ? await createManualInvoice(payload)
                  : await createInvoice(payload);
                setSnackbar({ open: true, message: t('invoiceCreated'), severity: 'success' });
                setNewInvoiceOpen(false);
                await refreshList();
                try {
                  const url = await fetchInvoicePdfUrl(created.id || created.idFactura);
                  if (url) window.open(url, '_blank', 'noopener');
                } catch {}
                return created;
              } catch (e) {
                setSnackbar({ open: true, message: e.message || t('invoiceCreateError'), severity: 'error' });
                throw e;
              } finally {
                setLoading(false);
              }
          }}
        />
      )}
      {isAdmin && editInvoice && (
        <InvoiceEditor
          open={!!editInvoice}
          onClose={() => setEditInvoice(null)}
          editMode
          initial={editInvoice}
          onUpdate={async (id, payload) => {
            try {
              setLoading(true);
              await updateInvoice(id, payload);
              setSnackbar({ open: true, message: t('invoiceUpdated'), severity: 'success' });
              setEditInvoice(null);
              await refreshList();
            } catch (e) {
              setSnackbar({ open: true, message: e.message || t('invoiceUpdateError'), severity: 'error' });
              throw e;
            } finally {
              setLoading(false);
            }
          }}
        />
      )}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default Invoices;
