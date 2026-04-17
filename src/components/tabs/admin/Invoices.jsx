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
import TableSortLabel from '@mui/material/TableSortLabel';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import TextField from '../../common/ClearableTextField';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';

import * as XLSX from 'xlsx';
import { fetchInvoices, fetchInvoicePdfUrl, fetchInvoicePdfBlob, createInvoice, createManualInvoice, updateInvoiceStatus, creditInvoice } from '../../../api/invoices.js';
import InvoiceEditor from './InvoiceEditor.jsx';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
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
  // "Rectificado" = the original invoice that was cancelled by a credit note.
  // "Rectificativa" is the credit note itself — handled separately.
  return key.includes('rectificad');
};

const isRectificativa = (estado) => {
  const key = (estado || '').toLowerCase();
  return key.includes('rectificativ');
};

const isCreditNote = (inv) => {
  return inv.total != null && Number(inv.total) < 0;
};

const getStatusInfo = (inv, t) => {
  if (isRectificativa(inv.estado) || (isCreditNote(inv) && !isRectificado(inv.estado))) {
    return { label: t('rectificativa'), color: 'warning' };
  }
  if (isRectificado(inv.estado)) {
    return { label: t('rectificado'), color: 'warning' };
  }
  if (isPaid(inv.estado)) {
    return { label: t('paid'), color: 'success' };
  }
  return { label: t('unpaid'), color: 'error' };
};

const PAGE_SIZE = 25; // Server-side pagination

const pillFieldSx = (hasValue) => ({
  '& .MuiInputLabel-root': { fontSize: '0.75rem', fontWeight: 700, color: hasValue ? 'primary.main' : 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em', transition: 'color 0.2s' },
  '& .MuiInput-input': { fontSize: '0.875rem', color: hasValue ? 'text.primary' : 'text.secondary', py: 0.25 },
});

const Invoices = ({ mode = 'admin', userProfile }) => {
  const theme = useTheme();
  const { t } = useTranslation('invoices');
  const isAdmin = mode === 'admin';
  const isAccountant = (userProfile?.role || '').toUpperCase() === 'ACCOUNTANT';
  const canEdit = isAdmin && !isAccountant;
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
    cuenta: isAccountant ? 'PT' : '',
    startDate: `${new Date().getFullYear()}-01-01`,
    endDate: ''
  });
  const [queryFilters, setQueryFilters] = useState(filters);
  const [newInvoiceOpen, setNewInvoiceOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [sortDir, setSortDir] = useState('desc');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [creditDialog, setCreditDialog] = useState({ open: false, invoice: null });
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // In user mode, always filter by the logged-in user's email
  const effectiveFilters = useMemo(() => {
    if (!isAdmin && userProfile?.email) {
      return { ...queryFilters, email: userProfile.email };
    }
    return { ...queryFilters };
  }, [queryFilters, isAdmin, userProfile?.email]);

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
          cuenta: effectiveFilters.cuenta,
          startDate: effectiveFilters.startDate,
          endDate: effectiveFilters.endDate,
          from: effectiveFilters.startDate,
          to: effectiveFilters.endDate,
          sortDir
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
  }, [effectiveFilters, sortDir]);

  // Client-side filtering (disabled since backend now handles date filtering)
  const rows = useMemo(() => {
    return data.content || [];
  }, [data.content]);

  // Server-side pagination
  const totalPages = Math.ceil((data.totalElements || 0) / PAGE_SIZE);
  const paginatedRows = rows;

  const EXPORT_HEADERS = [
    'Invoice Number', 'Issue Date', 'Client', 'CIF/NIF', 'Client Email', 'User Type',
    'Base (EUR)', 'VAT %', 'VAT (EUR)', 'Total (EUR)', 'Status', 'Description',
  ];

  const buildExportRows = (items) => items.map((inv) => {
    const total = Number(inv.total || 0);
    const vat = Number(inv.totalIva ?? inv.totaliva ?? 0);
    const base = total - vat;
    const toDate = (ts) => {
      if (!ts) return '';
      const d = new Date(ts);
      if (Number.isNaN(d.getTime())) return '';
      // Use LOCAL time to avoid timezone shifts (UTC conversion would turn
      // "2026-01-01 00:00 local" into "2025-12-31 23:00 UTC").
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };
    return {
      number: inv.holdedInvoiceNum || inv.holdedinvoicenum || '',
      date: toDate(inv.createdAt || inv.creacionfecha),
      client: inv.clientName || '',
      taxId: inv.clientTaxId || '',
      email: inv.clientEmail || '',
      userType: inv.tenantType || '',
      base: Number(base.toFixed(2)),
      vatRate: inv.iva == null ? '' : Number(inv.iva),
      vat: Number(vat.toFixed(2)),
      total: Number(total.toFixed(2)),
      status: inv.estado || '',
      description: (inv.descripcion || '').replace(/[\r\n]+/g, ' '),
    };
  });

  const fetchAllForExport = async () => {
    const response = await fetchInvoices({
      page: 0,
      size: 10000,
      name: effectiveFilters.name,
      email: effectiveFilters.email,
      idFactura: effectiveFilters.idFactura,
      status: effectiveFilters.status,
      tenantType: effectiveFilters.tenantType,
      product: effectiveFilters.product,
      cuenta: effectiveFilters.cuenta,
      startDate: effectiveFilters.startDate,
      endDate: effectiveFilters.endDate,
      from: effectiveFilters.startDate,
      to: effectiveFilters.endDate,
    });
    return response.content || [];
  };

  const exportFileSuffix = () => [
    effectiveFilters.cuenta || 'all',
    effectiveFilters.startDate || 'start',
    effectiveFilters.endDate || 'end',
  ].join('_');

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const items = await fetchAllForExport();
      const rows = buildExportRows(items);
      const csvEscape = (v) => {
        if (v == null) return '';
        const s = String(v);
        return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const toCsvNum = (n) => (n === '' || n == null ? '' : String(n).replace('.', ','));
      const headerLine = EXPORT_HEADERS.join(';');
      const rowLines = rows.map((r) => [
        r.number, r.date, r.client, r.taxId, r.email, r.userType,
        toCsvNum(r.base), r.vatRate, toCsvNum(r.vat), toCsvNum(r.total),
        r.status, r.description,
      ].map(csvEscape).join(';'));
      const csv = '\uFEFF' + [headerLine, ...rowLines].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices_${exportFileSuffix()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('CSV export failed:', e);
      setError(e.message || 'CSV export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const items = await fetchAllForExport();
      const rows = buildExportRows(items);
      const data = rows.map((r) => ({
        'Invoice Number': r.number,
        'Issue Date': r.date,
        'Client': r.client,
        'CIF/NIF': r.taxId,
        'Client Email': r.email,
        'User Type': r.userType,
        'Base (EUR)': r.base,
        'VAT %': r.vatRate,
        'VAT (EUR)': r.vat,
        'Total (EUR)': r.total,
        'Status': r.status,
        'Description': r.description,
      }));
      const ws = XLSX.utils.json_to_sheet(data, { header: EXPORT_HEADERS });
      ws['!cols'] = [
        { wch: 14 }, { wch: 11 }, { wch: 28 }, { wch: 14 }, { wch: 28 }, { wch: 14 },
        { wch: 12 }, { wch: 6 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 40 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Invoices');
      XLSX.writeFile(wb, `invoices_${exportFileSuffix()}.xlsx`);
    } catch (e) {
      console.error('Excel export failed:', e);
      setError(e.message || 'Excel export failed');
    } finally {
      setExporting(false);
    }
  };

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
      cuenta: effectiveFilters.cuenta,
      startDate: effectiveFilters.startDate,
      endDate: effectiveFilters.endDate,
      from: effectiveFilters.startDate,
      to: effectiveFilters.endDate,
      sortDir
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

      {/* Primary Search Bar */}
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
          flexDirection: { xs: 'column', sm: 'row' },
          borderRadius: { xs: 3, sm: 999 },
        }}
      >
        {/* Name */}
        {isAdmin && (
          <>
            <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
              <TextField
                variant="standard"
                value={filters.name}
                onChange={handleFilterChange('name')}
                label={t('searchByName')}
                placeholder={t('searchByName')}
                fullWidth
                slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true } }}
                sx={pillFieldSx(filters.name)}
              />
            </Box>
            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
            <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />
          </>
        )}

        {/* Invoice ID */}
        <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
          <TextField
            variant="standard"
            value={filters.idFactura}
            onChange={handleFilterChange('idFactura')}
            label={t('invoiceId')}
            placeholder={t('searchById')}
            fullWidth
            slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true } }}
            sx={pillFieldSx(filters.idFactura)}
          />
        </Box>
        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
        <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />

        {/* Status */}
        <Box sx={{ flex: 0.5, px: 2, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.25 }}>
            {t('status')}
          </Typography>
          <Select
            variant="standard"
            value={filters.status}
            onChange={handleFilterChange('status')}
            displayEmpty
            fullWidth
            disableUnderline
            sx={{ fontSize: '0.875rem', color: filters.status ? 'text.primary' : 'text.secondary' }}
          >
            <MenuItem value="">{t('all')}</MenuItem>
            <MenuItem value="pagado">{t('paid')}</MenuItem>
            <MenuItem value="pendiente">{t('unpaid')}</MenuItem>
          </Select>
        </Box>
        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
        <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />

        {/* Date From */}
        <Box sx={{ flex: 0.8, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
          <TextField
            variant="standard"
            type="date"
            value={filters.startDate}
            onChange={handleFilterChange('startDate')}
            label={t('startDate')}
            fullWidth
            slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true } }}
            sx={pillFieldSx(filters.startDate)}
          />
        </Box>
        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
        <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />

        {/* Date To */}
        <Box sx={{ flex: 0.8, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
          <TextField
            variant="standard"
            type="date"
            value={filters.endDate}
            onChange={handleFilterChange('endDate')}
            label={t('endDate')}
            fullWidth
            slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true } }}
            sx={pillFieldSx(filters.endDate)}
          />
        </Box>

        {/* Search Button */}
        <Box sx={{ px: { xs: 2, sm: 1.5 }, py: { xs: 1.5, sm: 0 }, width: { xs: '100%', sm: 'auto' }, display: 'flex', justifyContent: 'center' }}>
          <IconButton
            aria-label="search"
            sx={{
              bgcolor: 'primary.main',
              color: 'common.white',
              width: 44,
              height: 44,
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            <SearchRoundedIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Secondary Filters Row */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        {isAdmin && (
          <Button
            size="small"
            startIcon={showMoreFilters ? <KeyboardArrowUpRoundedIcon /> : <KeyboardArrowDownRoundedIcon />}
            onClick={() => setShowMoreFilters((v) => !v)}
            sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
          >
            {t('filters')}
          </Button>
        )}
        <Button
          variant="outlined"
          size="small"
          onClick={() => setFilters({
            name: '',
            email: '',
            idFactura: '',
            status: '',
            tenantType: '',
            cuenta: '',
            startDate: `${new Date().getFullYear()}-01-01`,
            endDate: ''
          })}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderColor: 'divider',
            color: 'text.secondary',
            borderRadius: 999,
            px: 2,
            '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
          }}
        >
          {t('reset')}
        </Button>
        {canEdit && (
          <Button
            onClick={() => setNewInvoiceOpen(true)}
            variant="contained"
            size="small"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 999,
              px: 2,
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': { backgroundColor: 'primary.dark' },
            }}
          >
            {t('newInvoice')}
          </Button>
        )}
        {isAdmin && (
          <Button
            onClick={handleExportCsv}
            disabled={exporting}
            variant="outlined"
            size="small"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 999,
              px: 2,
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': { borderColor: 'primary.dark', color: 'primary.dark' },
            }}
          >
            {exporting ? t('exporting') : t('exportCsv')}
          </Button>
        )}
        {isAdmin && (
          <Button
            onClick={handleExportExcel}
            disabled={exporting}
            variant="outlined"
            size="small"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: 999,
              px: 2,
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': { borderColor: 'primary.dark', color: 'primary.dark' },
            }}
          >
            {exporting ? t('exporting') : t('exportExcel')}
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Typography variant="body2" color="text.secondary">
          {t('showingInvoices', { count: rows.length })}
        </Typography>
        {isAdmin && totalRevenue > 0 && (
          <Typography variant="body2" color="text.primary" sx={{ fontWeight: 'bold' }}>
            {t('totalRevenue', { amount: formatCurrency(totalRevenue) })}
          </Typography>
        )}
      </Stack>

      {/* Collapsible Extra Filters */}
      {isAdmin && (
        <Collapse in={showMoreFilters}>
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
              flexDirection: { xs: 'column', sm: 'row' },
              borderRadius: { xs: 3, sm: 999 },
            }}
          >
            {/* Email */}
            <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
              <TextField
                variant="standard"
                value={filters.email}
                onChange={handleFilterChange('email')}
                label={t('searchByEmail')}
                placeholder={t('searchByEmail')}
                fullWidth
                slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true } }}
                sx={pillFieldSx(filters.email)}
              />
            </Box>
            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
            <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />

            {/* User Type */}
            <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.25 }}>
                {t('userType')}
              </Typography>
              <Select
                variant="standard"
                value={filters.tenantType}
                onChange={handleFilterChange('tenantType')}
                displayEmpty
                fullWidth
                disableUnderline
                sx={{ fontSize: '0.875rem', color: filters.tenantType ? 'text.primary' : 'text.secondary' }}
              >
                <MenuItem value="">{t('allUserTypes')}</MenuItem>
                <MenuItem value="Distribuidor">{t('userTypes.Distribuidor')}</MenuItem>
                <MenuItem value="Proveedor">{t('userTypes.Proveedor')}</MenuItem>
                <MenuItem value="Servicios">{t('userTypes.Servicios')}</MenuItem>
                <MenuItem value="Usuario Aulas">{t('userTypes.Usuario Aulas')}</MenuItem>
                <MenuItem value="Usuario Mesa">{t('userTypes.Usuario Mesa')}</MenuItem>
                <MenuItem value="Usuario Nómada">{t('userTypes.Usuario Nómada')}</MenuItem>
                <MenuItem value="Usuario Portal">{t('userTypes.Usuario Portal')}</MenuItem>
                <MenuItem value="Usuario Virtual">{t('userTypes.Usuario Virtual')}</MenuItem>
              </Select>
            </Box>
            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
            <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />

            {/* Account */}
            <Box sx={{ flex: 0.8, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.25 }}>
                {t('account')}
              </Typography>
              <Select
                variant="standard"
                value={isAccountant ? 'PT' : filters.cuenta}
                onChange={handleFilterChange('cuenta')}
                displayEmpty
                fullWidth
                disableUnderline
                disabled={isAccountant}
                sx={{ fontSize: '0.875rem', color: (isAccountant || filters.cuenta) ? 'text.primary' : 'text.secondary' }}
              >
                {!isAccountant && <MenuItem value="">{t('all')}</MenuItem>}
                <MenuItem value="PT">Beworking</MenuItem>
                {!isAccountant && <MenuItem value="GT">Globaltechno</MenuItem>}
              </Select>
            </Box>
          </Paper>
        </Collapse>
      )}

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
          <Table size="small" sx={{ width: '100%', '& .MuiTableCell-root': { px: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', md: 'table-cell' } }}>{t('table.invoiceId')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>{t('table.client')}</TableCell>
                {isAdmin && <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', md: 'table-cell' } }}>{t('table.userType')}</TableCell>}
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{t('table.total')}</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>{t('status')}</TableCell>
                <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', md: 'table-cell' } }} sortDirection={sortDir}>
                  <TableSortLabel
                    active
                    direction={sortDir}
                    onClick={() => { setSortDir(prev => prev === 'asc' ? 'desc' : 'asc'); setPage(0); }}
                  >
                    {t('table.issued')}
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', display: { xs: 'none', sm: 'table-cell' } }}>{t('table.document')}</TableCell>
                {canEdit && <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', md: 'table-cell' } }}>{t('table.actions')}</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((inv) => {
                const openPdf = async () => {
                  // Open window SYNCHRONOUSLY (during user gesture) to avoid mobile popup blocker
                  const popup = window.open('', '_blank');
                  try {
                    const blob = await fetchInvoicePdfBlob(inv.id);
                    const objectUrl = URL.createObjectURL(blob);
                    if (popup && !popup.closed) {
                      popup.location.href = objectUrl;
                    } else {
                      window.location.href = objectUrl;
                    }
                    setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
                  } catch {
                    try {
                      const url = inv.holdedinvoicepdf || (await fetchInvoicePdfUrl(inv.id));
                      if (url) {
                        if (popup && !popup.closed) {
                          popup.location.href = url;
                        } else {
                          window.location.href = url;
                        }
                      } else if (popup) {
                        popup.close();
                      }
                    } catch {
                      if (popup) popup.close();
                    }
                  }
                };
                return (
          <TableRow
            key={inv.id}
            hover
            onClick={(e) => {
              // Avoid triggering when clicking interactive elements
              if (e.target.closest('button, a, .MuiChip-root')) return;
              openPdf();
            }}
            sx={{ cursor: 'pointer' }}
          >
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{inv.holdedInvoiceNum || inv.idFactura || inv.id}</TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.clientName || '\u2014'}</TableCell>
                  {isAdmin && <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{inv.tenantType ? t(`userTypes.${inv.tenantType}`, inv.tenantType) : '\u2014'}</TableCell>}
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                      {formatCurrency(inv.total)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {(() => {
                      const si = getStatusInfo(inv, t);
                      const isClickable = canEdit && !isRectificado(inv.estado) && !isCreditNote(inv);
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
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('es-ES') : '\u2014'}</TableCell>
                  <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <Chip
                      label="PDF"
                      size="small"
                      variant="outlined"
                      clickable
                      onClick={openPdf}
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
                  {canEdit && (
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Chip
                      label={t('credit')}
                      size="small"
                      variant="outlined"
                      clickable
                      onClick={() => setCreditDialog({ open: true, invoice: inv })}
                      sx={{
                        borderColor: 'secondary.main',
                        color: 'secondary.main',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        height: 24,
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.08),
                        },
                      }}
                    />
                  </TableCell>
                  )}
                </TableRow>
                );
              })}
              {paginatedRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdmin ? (canEdit ? 9 : 8) : 7} align="center" sx={{ py: 6 }}>
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

      {canEdit && (
        <InvoiceEditor
          open={newInvoiceOpen}
          onClose={() => setNewInvoiceOpen(false)}
          onCreate={async (payload) => {
              try {
                setLoading(true);
                const created = payload?.lineItems?.length
                  ? await createManualInvoice(payload)
                  : await createInvoice(payload);
                // Show specific feedback based on Stripe result
                if (created.stripeError) {
                  setSnackbar({ open: true, message: t('stripeError'), severity: 'warning' });
                } else if (created.paymentMethod === 'card_charged') {
                  setSnackbar({ open: true, message: t('stripeChargeSuccess'), severity: 'success' });
                } else if (created.paymentMethod === 'stripe_invoice') {
                  setSnackbar({ open: true, message: t('stripeInvoiceSent'), severity: 'info' });
                } else {
                  setSnackbar({ open: true, message: t('invoiceCreated'), severity: 'success' });
                }
                setNewInvoiceOpen(false);
                await refreshList();
                try {
                  // Generate PDF locally (works for invoices not in Holded)
                  const blob = await fetchInvoicePdfBlob(created.id || created.idFactura);
                  const objectUrl = URL.createObjectURL(blob);
                  window.open(objectUrl, '_blank', 'noopener');
                  setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
                } catch {
                  // Fallback to remote URL (Holded) if local generation fails
                  try {
                    const url = await fetchInvoicePdfUrl(created.id || created.idFactura);
                    if (url) window.open(url, '_blank', 'noopener');
                  } catch {}
                }
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
      <Dialog
        open={creditDialog.open}
        onClose={() => setCreditDialog({ open: false, invoice: null })}
        PaperProps={{ sx: { borderRadius: 3, px: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>{t('credit')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('creditConfirm', { invoiceNum: creditDialog.invoice?.holdedInvoiceNum || creditDialog.invoice?.idFactura || creditDialog.invoice?.id })}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreditDialog({ open: false, invoice: null })} color="inherit">
            {t('editor.close')}
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={async () => {
              const inv = creditDialog.invoice;
              setCreditDialog({ open: false, invoice: null });
              try {
                const result = await creditInvoice(inv.id, {});
                const refundId = result?.holdedInvoiceNum || result?.idFactura || result?.id || '';
                setSnackbar({ open: true, message: t('refundCreated', { refundId }), severity: 'success' });
                await refreshList();
              } catch (e) {
                setSnackbar({ open: true, message: e.message || t('refundError'), severity: 'error' });
              }
            }}
          >
            {t('credit')}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default Invoices;
