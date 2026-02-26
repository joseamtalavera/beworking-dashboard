import React, { useMemo, useState, useEffect } from 'react';
import { alpha, useTheme } from '@mui/material/styles';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import EmailIcon from '@mui/icons-material/Email';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { fetchBookingContacts } from '../../../api/bookings.js';
import { fetchNextInvoiceNumber, fetchPaymentInfo } from '../../../api/invoices.js';
import { fetchCuentas, fetchNextInvoiceNumberByCodigo } from '../../../api/cuentas.js';
import { useTranslation } from 'react-i18next';
import i18n from '../../../i18n/i18n.js';
import esInvoices from '../../../i18n/locales/es/invoices.json';
import enInvoices from '../../../i18n/locales/en/invoices.json';
import { formatCurrency } from '../../../i18n/formatters.js';

if (!i18n.hasResourceBundle('es', 'invoices')) {
  i18n.addResourceBundle('es', 'invoices', esInvoices);
  i18n.addResourceBundle('en', 'invoices', enInvoices);
}

const parseDecimal = (val) => {
  if (val === '' || val == null) return 0;
  return parseFloat(String(val).replace(',', '.')) || 0;
};

const DEFAULT_LINE = { description: '', quantity: 1, price: '', vatPercent: 21, totalInput: '' };

const InvoiceEditor = ({ open, onClose, onCreate, onUpdate, initial = {}, editMode = false }) => {
  const theme = useTheme();
  const { t } = useTranslation('invoices');
  const [client, setClient] = useState(initial.client || null);
  const [clientSearch, setClientSearch] = useState('');
  const [invoiceNum, setInvoiceNum] = useState(initial.invoiceNum || '');
  const [date, setDate] = useState(initial.date || new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(initial.dueDate || '');
  const [lines, setLines] = useState(initial.lines || [DEFAULT_LINE]);
  const [note, setNote] = useState(initial.note || '');
  const [contactOptions, setContactOptions] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [userType, setUserType] = useState(initial.userType || '');
  const [center, setCenter] = useState(initial.center || '');
  const [cuenta, setCuenta] = useState(initial.cuenta || '');
  const [cuentaOptions, setCuentaOptions] = useState([]);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [paymentInfoLoading, setPaymentInfoLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const addLine = () => setLines((s) => [...s, { ...DEFAULT_LINE }]);
  const updateLine = (idx, patch) => setLines((s) => s.map((r, i) => {
    if (i !== idx) return r;
    const updated = { ...r, ...patch };
    // Clear totalInput when price/qty/vat changes directly (not from total back-calc)
    if (!('totalInput' in patch) && ('price' in patch || 'quantity' in patch || 'vatPercent' in patch)) {
      updated.totalInput = '';
    }
    return updated;
  }));
  const removeLine = (idx) => setLines((s) => s.filter((_, i) => i !== idx));

  const subtotal = useMemo(() => lines.reduce((acc, l) => acc + (Number(l.quantity || 0) * parseDecimal(l.price)), 0), [lines]);
  const vatTotals = useMemo(() => {
    const map = {};
    for (const l of lines) {
      const vat = Number(l.vatPercent || 0);
      const base = Number(l.quantity || 0) * parseDecimal(l.price);
      map[vat] = (map[vat] || 0) + base * (vat / 100);
    }
    return map;
  }, [lines]);
  const totalVat = useMemo(() => Object.values(vatTotals).reduce((a, b) => a + b, 0), [vatTotals]);
  const total = useMemo(() => subtotal + totalVat, [subtotal, totalVat]);

  const handleSubmit = async (status = 'Pendiente') => {
    if (submitting) return;
    setSubmitting(true);

    const payload = {
      clientName: client?.label || client || '',
      clientId: client?.value || client?.id || undefined,
      userType: userType || undefined,
      center: center || undefined,
      cuenta: cuenta || undefined,
      invoiceNum: invoiceNum || undefined,
      date,
      dueDate: dueDate || undefined,
      status,
      note: note || undefined,
      lineItems: lines.map((l) => ({
        description: l.description || 'Item',
        quantity: Number(l.quantity || 0),
        price: parseDecimal(l.price),
        vatPercent: Number(l.vatPercent || 0)
      })),
      computed: { subtotal, totalVat, total }
    };

    try {
      if (editMode && onUpdate) {
        await onUpdate(initial.id, payload);
      } else if (onCreate) {
        await onCreate(payload);
      }
    } catch (error) {
      console.error('Failed to save invoice:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Contact search with debounce (simplified pattern from ContactBillingStep)
  useEffect(() => {
    if (!clientSearch.trim()) {
      setContactOptions([]);
      return;
    }
    setContactsLoading(true);
    const timeout = setTimeout(() => {
      fetchBookingContacts({ search: clientSearch.trim() })
        .then((contacts) => setContactOptions(Array.isArray(contacts) ? contacts : []))
        .catch(() => setContactOptions([]))
        .finally(() => setContactsLoading(false));
    }, 300);
    return () => {
      clearTimeout(timeout);
      setContactsLoading(false);
    };
  }, [clientSearch]);

  // Fetch next invoice number when dialog opens (only for create mode)
  useEffect(() => {
    if (open && !invoiceNum && !editMode) {
      fetchNextInvoiceNumber()
        .then(response => {
          if (response.nextNumber) setInvoiceNum(response.nextNumber);
        })
        .catch(() => {});
    }
  }, [open, invoiceNum, editMode]);

  // Load cuentas when dialog opens
  useEffect(() => {
    if (open && cuentaOptions.length === 0) {
      fetchCuentas()
        .then((cuentas) => setCuentaOptions(cuentas || []))
        .catch(() => {});
    }
  }, [open, cuentaOptions.length]);

  // Update invoice number when cuenta changes
  useEffect(() => {
    if (cuenta && open) {
      fetchNextInvoiceNumberByCodigo(cuenta)
        .then((response) => {
          if (response.nextNumber) setInvoiceNum(response.nextNumber);
        })
        .catch(() => {});
    }
  }, [cuenta, open]);

  // Fetch payment info when client and cuenta are set
  useEffect(() => {
    const contactId = client?.value || client?.id;
    if (!contactId || !cuenta) {
      setPaymentInfo(null);
      return;
    }
    setPaymentInfoLoading(true);
    fetchPaymentInfo(contactId, cuenta)
      .then((info) => setPaymentInfo(info))
      .catch(() => setPaymentInfo(null))
      .finally(() => setPaymentInfoLoading(false));
  }, [client?.value, client?.id, cuenta]);

  // Reset states when dialog opens (use open + editMode only — not `initial`,
  // because initial={} default creates a new object on every render)
  useEffect(() => {
    if (open) {
      if (editMode && initial) {
        setClient(initial.client || null);
        setClientSearch(initial.clientName || initial.client?.label || '');
        setInvoiceNum(initial.invoiceNum || '');
        setDate(initial.date || new Date().toISOString().slice(0, 10));
        setDueDate(initial.dueDate || '');
        setLines(initial.lines && initial.lines.length > 0
          ? initial.lines.map(l => ({ ...l, price: String(l.price ?? ''), totalInput: '' }))
          : [{ ...DEFAULT_LINE }]);
        setNote(initial.note || '');
        setUserType(initial.userType || '');
        setCenter(initial.center || '');
        setCuenta(initial.cuenta || '');
      } else {
        setClient(null);
        setClientSearch('');
        setInvoiceNum('');
        setDate(new Date().toISOString().slice(0, 10));
        setDueDate('');
        setLines([{ ...DEFAULT_LINE }]);
        setNote('');
        setUserType('');
        setCenter('');
        setCuenta('');
      }
      setContactOptions([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editMode]);

  const handleSelectContact = (contact) => {
    const label = contact.name || contact.email || `Contact ${contact.id}`;
    setClient({ label, value: contact.id, raw: contact });
    setClientSearch(label);
    if (contact.tenantType) setUserType(contact.tenantType);
    setContactOptions([]);
  };

  const handleClearContact = () => {
    setClient(null);
    setClientSearch('');
    setContactOptions([]);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xl"
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'divider'
        }
      }}
    >
      <DialogTitle sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        pb: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="text.primary">
            {editMode ? t('editor.editTitle') : t('editor.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            {editMode ? t('editor.editSubtitle') : t('editor.subtitle')}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Box>
          {/* Invoice Details Card */}
          <Paper sx={{
            mb: 3,
            mt: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            p: 3
          }}>
            <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ mb: 2 }}>
              {t('editor.invoiceDetails')}
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ position: 'relative' }}>
                  <TextField
                    label={t('editor.searchByName')}
                    size="small"
                    fullWidth
                    placeholder={t('editor.searchByName')}
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      if (client) setClient(null);
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchRoundedIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: contactsLoading ? (
                        <CircularProgress color="inherit" size={18} />
                      ) : client ? (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={handleClearContact} sx={{ color: 'text.disabled' }}>
                            <CloseRoundedIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ) : null
                    }}
                  />
                  {clientSearch.trim() && contactOptions.length > 0 && !client && (
                    <Paper
                      elevation={3}
                      sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        mt: 0.5,
                        maxHeight: 240,
                        overflow: 'auto',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2
                      }}
                    >
                      {contactOptions.map((contact) => (
                        <Box
                          key={contact.id}
                          sx={{
                            px: 2,
                            py: 1.5,
                            cursor: 'pointer',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            '&:hover': { backgroundColor: 'action.hover' },
                            '&:last-child': { borderBottom: 'none' }
                          }}
                          onClick={() => handleSelectContact(contact)}
                        >
                          <Typography variant="body2" fontWeight={600}>
                            {contact.name || contact.email || `Contact ${contact.id}`}
                          </Typography>
                          {contact.email && contact.name && (
                            <Typography variant="caption" color="text.secondary">
                              {contact.email}
                            </Typography>
                          )}
                        </Box>
                      ))}
                    </Paper>
                  )}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="user-type-label">{t('editor.userType')}</InputLabel>
                  <Select
                    labelId="user-type-label"
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                    label={t('editor.userType')}
                    displayEmpty
                    startAdornment={
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="">
                      <span style={{ color: theme.palette.text.disabled }}>{t('editor.selectUserType')}</span>
                    </MenuItem>
                    <MenuItem value="Distribuidor">Distribuidor</MenuItem>
                    <MenuItem value="Imported">Imported</MenuItem>
                    <MenuItem value="Proveedor">Proveedor</MenuItem>
                    <MenuItem value="Servicios">Servicios</MenuItem>
                    <MenuItem value="Usuario Aulas">Usuario Aulas</MenuItem>
                    <MenuItem value="Usuario Mesa">Usuario Mesa</MenuItem>
                    <MenuItem value="Usuario Nómada">Usuario Nómada</MenuItem>
                    <MenuItem value="Usuario Portal">Usuario Portal</MenuItem>
                    <MenuItem value="Usuario Virtual">Usuario Virtual</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="center-label">{t('editor.center')}</InputLabel>
                  <Select
                    labelId="center-label"
                    value={center}
                    onChange={(e) => setCenter(e.target.value)}
                    label={t('editor.center')}
                    displayEmpty
                    startAdornment={
                      <InputAdornment position="start">
                        <LocationOnIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="">
                      <span style={{ color: theme.palette.text.disabled }}>{t('editor.selectCenter')}</span>
                    </MenuItem>
                    <MenuItem value="1">MALAGA DUMAS (MA1)</MenuItem>
                    <MenuItem value="8">Oficina Virtual (MAOV)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="cuenta-label">{t('editor.company')}</InputLabel>
                  <Select
                    labelId="cuenta-label"
                    value={cuenta}
                    onChange={(e) => setCuenta(e.target.value)}
                    label={t('editor.company')}
                    displayEmpty
                    startAdornment={
                      <InputAdornment position="start">
                        <BusinessIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    }
                  >
                    <MenuItem value="">
                      <span style={{ color: theme.palette.text.disabled }}>{t('editor.selectCompany')}</span>
                    </MenuItem>
                    {cuentaOptions.map((cuentaOption) => (
                      <MenuItem key={cuentaOption.id} value={cuentaOption.codigo}>
                        {cuentaOption.nombre} ({cuentaOption.codigo})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, md: 2 }}>
                <TextField
                  label={t('editor.invoiceNumber')}
                  value={invoiceNum}
                  onChange={(e) => setInvoiceNum(e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 6, md: 2 }}>
                <TextField
                  label={t('editor.date')}
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  fullWidth
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Line Items Card */}
          <Paper sx={{
            mb: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden'
          }}>
            <Table size="small">
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: 'background.default',
                    '& .MuiTableCell-head': {
                      position: 'relative',
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      letterSpacing: '0.04em',
                      fontSize: '0.85rem',
                      color: 'text.secondary',
                      borderBottom: '1px solid',
                      borderBottomColor: 'divider',
                      py: 1.6,
                      px: 3,
                      backgroundColor: 'background.default'
                    },
                    '& .MuiTableCell-head:first-of-type': {
                      pl: 3,
                      pr: 4,
                      borderTopLeftRadius: 12
                    },
                    '& .MuiTableCell-head:last-of-type': {
                      pr: 3,
                      borderTopRightRadius: 12
                    }
                  }}
                >
                  <TableCell>{t('editor.description')}</TableCell>
                  <TableCell align="right">{t('editor.qty')}</TableCell>
                  <TableCell align="right">{t('editor.price')}</TableCell>
                  <TableCell align="right">{t('editor.vatPercent')}</TableCell>
                  <TableCell align="right">{t('editor.lineTotal')}</TableCell>
                  <TableCell sx={{ width: 60 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.map((l, i) => (
                  <TableRow key={i} hover>
                    <TableCell>
                      <TextField
                        value={l.description}
                        onChange={(e) => updateLine(i, { description: e.target.value })}
                        size="small"
                        fullWidth
                        placeholder={t('editor.enterDescription')}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        value={l.quantity}
                        onChange={(e) => updateLine(i, { quantity: Number(e.target.value || 0) })}
                        size="small"
                        inputProps={{ inputMode: 'numeric' }}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        value={l.price}
                        onChange={(e) => updateLine(i, { price: e.target.value })}
                        size="small"
                        inputProps={{ inputMode: 'decimal' }}
                        sx={{ width: 120 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        select
                        value={l.vatPercent}
                        onChange={(e) => updateLine(i, { vatPercent: Number(e.target.value) })}
                        size="small"
                        sx={{ width: 100 }}
                      >
                        <MenuItem value={0}>0%</MenuItem>
                        <MenuItem value={10}>10%</MenuItem>
                        <MenuItem value={21}>21%</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell align="right">
                      <TextField
                        value={l.totalInput || (parseDecimal(l.price) ? (parseDecimal(l.price) * Number(l.quantity || 0) * (1 + Number(l.vatPercent || 0) / 100)).toFixed(2) : '')}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const totalVal = parseDecimal(raw);
                          const qty = Number(l.quantity || 0) || 1;
                          const vatMult = 1 + Number(l.vatPercent || 0) / 100;
                          const newPrice = (totalVal / vatMult / qty).toFixed(2);
                          updateLine(i, { totalInput: raw, price: newPrice });
                        }}
                        size="small"
                        inputProps={{ inputMode: 'decimal' }}
                        sx={{ width: 120 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => removeLine(i)}>
                        <DeleteOutlineRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={7}>
                    <Button
                      startIcon={<AddRoundedIcon />}
                      onClick={addLine}
                      size="small"
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        color: 'secondary.main',
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.brand.green, 0.08)
                        }
                      }}
                    >
                      {t('editor.addLine')}
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Paper>

          {/* Invoice Summary Card */}
          <Paper sx={{
            mb: 3,
            borderRadius: 3,
            border: '2px solid',
            borderColor: 'secondary.main',
            p: 3,
            backgroundColor: 'background.default'
          }}>
            <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ mb: 2 }}>
              {t('editor.invoiceSummary')}
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">{t('editor.subtotal')}</Typography>
                <Typography variant="body2" fontWeight={600} color="text.primary">
                  {formatCurrency(subtotal)}
                </Typography>
              </Box>

              {Object.entries(vatTotals).map(([k, v]) => (
                <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('editor.vatAmount', { percent: k })}
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="text.primary">
                    {formatCurrency(v)}
                  </Typography>
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" fontWeight={600} color="text.primary">{t('editor.total')}</Typography>
                <Typography variant="h6" fontWeight={600} color="text.primary">
                  {formatCurrency(total)}
                </Typography>
              </Box>
            </Box>

            {/* Payment method indicator */}
            {!editMode && client?.value && cuenta && (
              <Box sx={{
                mt: 2,
                mb: 1,
                p: 2,
                borderRadius: 2,
                border: '1px solid',
                borderColor: paymentInfoLoading ? 'divider'
                  : paymentInfo?.hasPaymentMethod ? 'success.main'
                  : 'warning.main',
                backgroundColor: paymentInfoLoading ? 'transparent'
                  : paymentInfo?.hasPaymentMethod ? alpha(theme.palette.success.main, 0.06)
                  : alpha(theme.palette.warning.main, 0.06),
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}>
                {paymentInfoLoading ? (
                  <>
                    <CircularProgress size={18} />
                    <Typography variant="body2" color="text.secondary">
                      {t('editor.checkingPaymentMethod')}
                    </Typography>
                  </>
                ) : paymentInfo?.hasPaymentMethod ? (
                  <>
                    <CreditCardIcon sx={{ color: 'success.main', fontSize: 20 }} />
                    <Typography variant="body2" fontWeight={600} color="success.dark">
                      {paymentInfo.paymentMethods?.[0]?.brand?.toUpperCase()} ****{paymentInfo.paymentMethods?.[0]?.last4} — {t('editor.willChargeCard')}
                    </Typography>
                  </>
                ) : paymentInfo ? (
                  <>
                    <EmailIcon sx={{ color: 'warning.main', fontSize: 20 }} />
                    <Typography variant="body2" fontWeight={600} color="warning.dark">
                      {t('editor.noCardOnFile')} — {t('editor.willSendStripeInvoice')}
                    </Typography>
                  </>
                ) : null}
              </Box>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                disabled={submitting}
                onClick={() => handleSubmit(editMode ? (initial.status || 'Pendiente') : 'Pendiente')}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  borderRadius: 1,
                  '&:hover': { backgroundColor: 'primary.dark' }
                }}
              >
                {editMode ? t('editor.saveChanges') : t('editor.approveInvoice')}
              </Button>
            </Box>
          </Paper>

          {/* Notes Card */}
          <Paper sx={{
            mb: 3,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            p: 3
          }}>
            <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ mb: 2 }}>
              {t('editor.additionalNotes')}
            </Typography>
            <TextField
              label={t('editor.note')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              fullWidth
              multiline
              rows={3}
              size="small"
              placeholder={t('editor.notePlaceholder')}
            />
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{
        p: 3,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            borderColor: 'secondary.main',
            color: 'secondary.main',
            '&:hover': {
              borderColor: theme.palette.brand.greenHover,
              backgroundColor: alpha(theme.palette.brand.green, 0.08)
            }
          }}
        >
          {t('editor.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceEditor;
