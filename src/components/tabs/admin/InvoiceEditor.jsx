import React, { useMemo, useState, useEffect, useRef } from 'react';
import { alpha, useTheme } from '@mui/material/styles';

// Colors are now defined in theme.js - use theme palette: primary.main/dark for green, secondary.main/dark for orange

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
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import InputAdornment from '@mui/material/InputAdornment';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { fetchBookingContacts } from '../../../api/bookings.js';
import { fetchNextInvoiceNumber } from '../../../api/invoices.js';
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

// A reasonably complete invoice editor UI in a Dialog.
// onCreate(payload, { openPreview }) should be provided by the caller.
const DEFAULT_LINE = { description: '', quantity: 1, price: 0, vatPercent: 21 };

const InvoiceEditor = ({ open, onClose, onCreate, initial = {} }) => {
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
  const [showDropdown, setShowDropdown] = useState(false);
  const [userType, setUserType] = useState(initial.userType || '');
  const [center, setCenter] = useState(initial.center || '');
  const [cuenta, setCuenta] = useState(initial.cuenta || '');
  const [cuentaOptions, setCuentaOptions] = useState([]);
  const searchContainerRef = useRef(null);

  const addLine = () => setLines((s) => [...s, { ...DEFAULT_LINE }]);
  const updateLine = (idx, patch) => setLines((s) => s.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const removeLine = (idx) => setLines((s) => s.filter((_, i) => i !== idx));

  const subtotal = useMemo(() => lines.reduce((acc, l) => acc + (Number(l.quantity || 0) * Number(l.price || 0)), 0), [lines]);
  const vatTotals = useMemo(() => {
    const map = {};
    for (const l of lines) {
      const vat = Number(l.vatPercent || 0);
      const base = Number(l.quantity || 0) * Number(l.price || 0);
      map[vat] = (map[vat] || 0) + base * (vat / 100);
    }
    return map;
  }, [lines]);
  const totalVat = useMemo(() => Object.values(vatTotals).reduce((a, b) => a + b, 0), [vatTotals]);
  const total = useMemo(() => subtotal + totalVat, [subtotal, totalVat]);

  const handleCreate = async (status = 'Pendiente') => {
    // Build a payload for manual invoice creation
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
        price: Number(l.price || 0), 
        vatPercent: Number(l.vatPercent || 0) 
      })),
      computed: { subtotal, totalVat, total }
    };
    console.log('Creating manual invoice with payload:', payload);
    console.log('Selected client:', client);
    
    try {
      if (!onCreate) {
        throw new Error('No create handler provided');
      }
      const created = await onCreate(payload);
      console.log('Invoice created successfully:', created);
    } catch (error) {
      console.error('Failed to create invoice:', error);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async (searchQuery = '') => {
      if (!searchQuery.trim()) {
        setContactOptions([]);
        setShowDropdown(false);
        return;
      }
      console.log('Searching for contacts with query:', searchQuery);
      setContactsLoading(true);
      try {
        // Backend expects 'search' parameter, not 'q'
        const res = await fetchBookingContacts({ search: searchQuery });
        console.log('Search response:', res);
        if (!active) return;
        
        // Backend returns a direct array, not wrapped in content
        const contacts = res || [];
        console.log('Contacts array:', contacts);
        
        const opts = contacts.map((c) => {
          console.log('Contact object:', c);
          // Backend returns: { id, name, email, tenantType, avatar }
          const label = c.name || c.email || `Contact ${c.id}`;
          return { 
            label: label, 
            value: c.id, 
            raw: c 
          };
        });
        
        console.log('Mapped options:', opts);
        setContactOptions(opts);
        setShowDropdown(true);
      } catch (e) {
        console.error('Search error:', e);
        setContactOptions([]);
        setShowDropdown(false);
      } finally {
        setContactsLoading(false);
      }
    };
    
    // Debounce the search
    const timeoutId = setTimeout(() => {
      load(clientSearch);
    }, 300);
    
    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [clientSearch]);

  // Fetch next invoice number when dialog opens
  useEffect(() => {
    if (open && !invoiceNum) {
      fetchNextInvoiceNumber()
        .then(response => {
          if (response.nextNumber) {
            setInvoiceNum(response.nextNumber);
          }
        })
        .catch(error => {
          console.error('Failed to fetch next invoice number:', error);
        });
    }
  }, [open, invoiceNum]);

  // Load cuentas when dialog opens
  useEffect(() => {
    if (open && cuentaOptions.length === 0) {
      const loadCuentas = async () => {
        try {
          const cuentas = await fetchCuentas();
          setCuentaOptions(cuentas || []);
        } catch (e) {
          console.error('Failed to load cuentas:', e);
        }
      };
      loadCuentas();
    }
  }, [open, cuentaOptions.length]);

  // Update invoice number when cuenta changes
  useEffect(() => {
    if (cuenta && open) {
      const updateInvoiceNumber = async () => {
        try {
          const response = await fetchNextInvoiceNumberByCodigo(cuenta);
          if (response.nextNumber) {
            setInvoiceNum(response.nextNumber);
          }
        } catch (e) {
          console.error('Failed to fetch next invoice number for cuenta:', e);
        }
      };
      updateInvoiceNumber();
    }
  }, [cuenta, open]);

  // Reset states when dialog opens
  useEffect(() => {
    if (open) {
      setClient(null);
      setClientSearch('');
      setContactOptions([]);
      setShowDropdown(false);
      setUserType(''); // This will show the placeholder "Select user type"
      setCenter(''); // This will show the placeholder "Select center"
      setCuenta(''); // This will show the placeholder "Select cuenta"
    }
  }, [open]);

  // Load initial contacts when dialog opens
  useEffect(() => {
    if (open && contactOptions.length === 0) {
      const loadInitialContacts = async () => {
        try {
          // Load first 20 contacts without search query
          const res = await fetchBookingContacts({});
          const contacts = res || [];
          const opts = contacts.map((c) => ({
            label: c.name || c.email || `Contact ${c.id}`,
            value: c.id,
            raw: c
          }));
          setContactOptions(opts);
          setShowDropdown(false); // Don't show dropdown initially
        } catch (e) {
          console.error('Failed to load initial contacts:', e);
        }
      };
      loadInitialContacts();
    }
  }, [open, contactOptions.length]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown]);

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
            {t('editor.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            {t('editor.subtitle')}
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
                <Grid item xs={12} md={6}>
                  <Box ref={searchContainerRef} sx={{ position: 'relative' }}>
                    <TextField
                      label={t('editor.searchByName')}
                      size="small"
                      fullWidth
                      placeholder={t('editor.searchByName')}
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        // If user starts typing again, clear the selected client and show dropdown
                        if (client && e.target.value !== client.label) {
                          setClient(null);
                          setShowDropdown(true);
                        }
                      }}
                      InputProps={{ 
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchRoundedIcon sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                        endAdornment: client && (
                          <InputAdornment position="end">
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1,
                              color: 'success.main',
                              fontSize: '0.75rem'
                            }}>
                              ✓ {t('editor.selected')}
                            </Box>
                          </InputAdornment>
                        )
                      }} 
                    />
                    {showDropdown && contactOptions.length > 0 && clientSearch.trim() && !client && (() => {
                      console.log('Rendering dropdown with', contactOptions.length, 'options');
                      console.log('showDropdown:', showDropdown, 'client:', client, 'clientSearch:', clientSearch);
                      return (
                      <Paper sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        mt: 1,
                        maxHeight: 200,
                        overflow: 'auto',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2
                      }}>
                        {contactOptions.map((option) => (
                          <Box
                            key={option.value}
                            sx={{
                              p: 2,
                              cursor: 'pointer',
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                              '&:hover': {
                                backgroundColor: 'action.hover'
                              },
                              '&:last-child': {
                                borderBottom: 'none'
                              }
                            }}
                            onClick={() => {
                              console.log('Selected contact:', option);
                              setClient(option);
                              setClientSearch(option.label);
                              // Auto-populate user type from selected client
                              if (option.raw?.tenantType) {
                                setUserType(option.raw.tenantType);
                              }
                              setContactOptions([]);
                              setShowDropdown(false);
                            }}
                          >
                            <Typography variant="body2" fontWeight={600}>
                              {option.label}
                            </Typography>
                          </Box>
                        ))}
                      </Paper>
                      );
                    })()}
                  </Box>
                </Grid>
                <Grid item xs={12} md={3}>
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
                <Grid item xs={12} md={3}>
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
                <Grid item xs={12} md={3}>
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
                <Grid item xs={6} md={2}>
                  <TextField
                    label={t('editor.invoiceNumber')}
                    value={invoiceNum}
                    onChange={(e) => setInvoiceNum(e.target.value)}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField
                    label={t('editor.date')}
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    fullWidth
                    size="small"
                    InputLabelProps={{ shrink: true }}
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
                          onChange={(e) => updateLine(i, { price: Number(e.target.value || 0) })} 
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
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency((Number(l.quantity || 0) * Number(l.price || 0)) * (1 + Number(l.vatPercent || 0) / 100))}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          size="small" 
                          onClick={() => removeLine(i)}
                        >
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
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="contained" 
                  onClick={() => handleCreate('Pendiente')}
                  sx={{
                    backgroundColor: 'primary.main',
                    color: 'white',
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: 'primary.dark'
                    }
                  }}
                >
                  {t('editor.approveInvoice')}
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
