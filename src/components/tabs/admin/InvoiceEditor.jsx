import React, { useMemo, useState, useEffect } from 'react';
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
import { fetchBookingContacts } from '../../../api/bookings.js';
import { fetchNextInvoiceNumber } from '../../../api/invoices.js';

// A reasonably complete invoice editor UI in a Dialog.
// onCreate(payload, { openPreview }) should be provided by the caller.
const DEFAULT_LINE = { concept: '', description: '', quantity: 1, price: 0, vatPercent: 21 };

const InvoiceEditor = ({ open, onClose, onCreate, initial = {} }) => {
  const [client, setClient] = useState(initial.client || null);
  const [clientSearch, setClientSearch] = useState('');
  const [invoiceNum, setInvoiceNum] = useState(initial.invoiceNum || '');
  const [date, setDate] = useState(initial.date || new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(initial.dueDate || '');
  const [lines, setLines] = useState(initial.lines || [DEFAULT_LINE]);
  const [note, setNote] = useState(initial.note || '');
  const [contactOptions, setContactOptions] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);

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

  const handleCreate = async (status = 'approved') => {
    // Build a payload that backend may accept. We'll include lineItems but backend may expect bloqueoIds instead.
    const payload = {
      clientName: client?.label || client || '',
      invoiceNum: invoiceNum || undefined,
      date,
      dueDate: dueDate || undefined,
      status,
      note: note || undefined,
      lineItems: lines.map((l) => ({ concept: l.concept || l.description || 'Item', description: l.description, quantity: Number(l.quantity || 0), price: Number(l.price || 0), vatPercent: Number(l.vatPercent || 0) })),
      computed: { subtotal, totalVat, total }
    };
    if (onCreate) await onCreate(payload);
  };

  const formatCurrency = (v) => {
    const n = Number(v || 0);
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
  };


  useEffect(() => {
    let active = true;
    const load = async (q = '') => {
      if (!q.trim()) {
        setContactOptions([]);
        return;
      }
      console.log('Searching for contacts with query:', q);
      setContactsLoading(true);
      try {
        const res = await fetchBookingContacts({ q, size: 10 });
        console.log('Search response:', res);
        if (!active) return;
        // map to label/value for autocomplete
        // The response might be directly an array, not wrapped in content
        const contacts = res?.content || res || [];
        console.log('Contacts array:', contacts);
        const opts = contacts.map((c) => {
          console.log('Contact object:', c);
          // Use name as primary label, fallback to email, then id
          const label = c.name || c.nombre || c.email || `Contact ${c.id}`;
          return { 
            label: label, 
            value: c.id, 
            raw: c 
          };
        });
        console.log('Mapped options:', opts);
        
        // Filter options client-side to match the search query
        const filteredOpts = opts.filter(option => {
          const searchLower = clientSearch.toLowerCase();
          const labelLower = option.label.toLowerCase();
          return labelLower.includes(searchLower);
        });
        
        console.log('Filtered options:', filteredOpts);
        setContactOptions(filteredOpts);
      } catch (e) {
        console.error('Search error:', e);
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
            New Invoice
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Create and manage your invoice details
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
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
                Invoice Details
              </Typography>
              <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
                  <Box sx={{ position: 'relative' }}>
                    <TextField 
                      label="Search by Name" 
                      size="small" 
                      fullWidth 
                      placeholder="Search by name"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      InputProps={{ 
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchRoundedIcon sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        )
                      }} 
                    />
                    {contactOptions.length > 0 && clientSearch.trim() && (() => {
                      console.log('Rendering dropdown with', contactOptions.length, 'options');
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
                              setClient(option);
                              setClientSearch(option.label);
                              setContactOptions([]);
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
                <Grid item xs={6} md={2}>
                  <TextField 
                    label="Invoice #" 
                    value={invoiceNum} 
                    onChange={(e) => setInvoiceNum(e.target.value)} 
                    fullWidth 
                    size="small" 
                  />
                </Grid>
                <Grid item xs={6} md={2}>
                  <TextField 
                    label="Date" 
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
                    backgroundColor: '#f5f5f5',
                    '& .MuiTableCell-head': {
                      position: 'relative',
                      fontWeight: 700,
                      textTransform: 'capitalize',
                      letterSpacing: '0.04em',
                      fontSize: '0.85rem',
                      color: '#374151',
                      borderBottom: '1px solid #e5e7eb',
                      py: 1.6,
                      px: 3,
                      backgroundColor: '#f5f5f5'
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
                    <TableCell>Concept</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">VAT %</TableCell>
                    <TableCell align="right">Line total</TableCell>
                    <TableCell sx={{ width: 60 }} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.map((l, i) => (
                    <TableRow key={i} hover>
                      <TableCell>
                        <TextField 
                          value={l.concept} 
                          onChange={(e) => updateLine(i, { concept: e.target.value })} 
                          size="small" 
                          fullWidth 
                          placeholder="Enter concept"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField 
                          value={l.description} 
                          onChange={(e) => updateLine(i, { description: e.target.value })} 
                          size="small" 
                          fullWidth 
                          placeholder="Enter description"
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
                          <DeleteOutlineRoundedIcon fontSize="small" sx={{ color: '#6b7280' }} />
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
                          color: '#fb923c',
                          '&:hover': {
                            backgroundColor: 'rgba(251, 146, 60, 0.08)'
                          }
                        }}
                      >
                        Add line
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
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
                Additional Notes
              </Typography>
              <TextField 
                label="Note" 
                value={note} 
                onChange={(e) => setNote(e.target.value)} 
                fullWidth 
                multiline 
                rows={3} 
                size="small"
                placeholder="Add any additional notes or terms for this invoice..."
              />
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            {/* Summary Card */}
            <Paper sx={{ 
              position: 'sticky', 
              top: 24,
              borderRadius: 3,
              border: '2px solid',
              borderColor: '#fb923c',
              p: 3,
              backgroundColor: '#fafafa',
              minHeight: '400px'
            }}>
              <Typography variant="h6" fontWeight={600} color="text.primary" sx={{ mb: 2 }}>
                Invoice Summary
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                  <Typography variant="body2" fontWeight={600} color="text.primary">
                    {formatCurrency(subtotal)}
                  </Typography>
              </Box>
                
              {Object.entries(vatTotals).map(([k, v]) => (
                  <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      VAT {k}%
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="text.primary">
                      {formatCurrency(v)}
                    </Typography>
                  </Box>
                ))}
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight={600} color="text.primary">Total</Typography>
                  <Typography variant="h6" fontWeight={600} color="text.primary">
                    {formatCurrency(total)}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ mt: 3, mb: 2 }}>
                <Button 
                  variant="contained" 
                  fullWidth 
                  onClick={() => handleCreate('approved')}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    py: 1.5,
                    px: 2,
                    backgroundColor: '#fb923c',
                    color: 'white',
                    borderRadius: 1,
                    boxShadow: '0 2px 8px rgba(251, 146, 60, 0.2)',
                    minHeight: '40px',
                    border: 'none',
                    '&:hover': {
                      backgroundColor: '#f97316',
                      boxShadow: '0 4px 12px rgba(251, 146, 60, 0.3)',
                      transform: 'translateY(-1px)'
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                      boxShadow: '0 2px 8px rgba(251, 146, 60, 0.2)'
                    }
                  }}
                >
                  Approve & Send Invoice
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
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
            borderColor: '#6b7280',
            color: '#6b7280',
              '&:hover': {
              borderColor: '#4b5563',
              backgroundColor: 'rgba(107, 114, 128, 0.08)'
            }
          }}
        >
          Close
          </Button>
        </DialogActions>

    </Dialog>
  );
};

export default InvoiceEditor;
