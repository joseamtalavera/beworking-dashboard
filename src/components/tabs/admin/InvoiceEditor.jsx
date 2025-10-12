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
import Menu from '@mui/material/Menu';
import Stack from '@mui/material/Stack';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PreviewRoundedIcon from '@mui/icons-material/PreviewRounded';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { fetchBookingContacts } from '../../../api/bookings.js';

// A reasonably complete invoice editor UI in a Dialog.
// onCreate(payload, { openPreview }) should be provided by the caller.
const DEFAULT_LINE = { concept: '', description: '', quantity: 1, price: 0, vatPercent: 21 };

const InvoiceEditor = ({ open, onClose, onCreate, initial = {} }) => {
  const [client, setClient] = useState(initial.client || null);
  const [invoiceNum, setInvoiceNum] = useState(initial.invoiceNum || '');
  const [date, setDate] = useState(initial.date || new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(initial.dueDate || '');
  const [lines, setLines] = useState(initial.lines || [DEFAULT_LINE]);
  const [note, setNote] = useState(initial.note || '');
  const [contactOptions, setContactOptions] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);

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
  const [previewOpen, setPreviewOpen] = useState(false);

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

  const openPreview = () => setPreviewOpen(true);

  const printPreview = () => {
    // Render a simple printable HTML document and open in new window
    const html = `
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice preview</title>
        <style>body{font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; padding:24px} table{width:100%;border-collapse:collapse} th,td{padding:8px;border-bottom:1px solid #eee;text-align:left} .right{text-align:right}</style>
      </head>
      <body>
        <h2>Invoice ${invoiceNum || ''}</h2>
        <div>Client: ${(client && (client.label || client)) || ''}</div>
        <div>Date: ${date}</div>
        <table>
          <thead><tr><th>Concept</th><th>Description</th><th class="right">Qty</th><th class="right">Price</th><th class="right">VAT</th><th class="right">Line total</th></tr></thead>
          <tbody>
            ${lines.map(l => `<tr><td>${(l.concept||'')}</td><td>${(l.description||'')}</td><td class="right">${l.quantity}</td><td class="right">${formatCurrency(l.price)}</td><td class="right">${l.vatPercent}%</td><td class="right">${formatCurrency((Number(l.quantity||0)*Number(l.price||0))*(1+Number(l.vatPercent||0)/100))}</td></tr>`).join('')}
          </tbody>
        </table>
        <h3>Total: ${formatCurrency(total)}</h3>
      </body>
      </html>
    `;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
  };

  useEffect(() => {
    let active = true;
    const load = async (q = '') => {
      setContactsLoading(true);
      try {
        const res = await fetchBookingContacts({ q, size: 10 });
        if (!active) return;
        // map to label/value for autocomplete
        const opts = (res?.content || []).map((c) => ({ label: c.nombre || c.name || c.email || String(c.id), value: c.id, raw: c }));
        setContactOptions(opts);
      } catch (e) {
        // ignore
      } finally {
        setContactsLoading(false);
      }
    };
    load('');
    return () => {
      active = false;
    };
  }, []);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>New invoice</span>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button startIcon={<PreviewRoundedIcon />} onClick={openPreview} size="small">
            Preview
          </Button>
          <Button onClick={printPreview} size="small">Print</Button>
          <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} size="small"><MoreVertIcon /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, mb: 2 }} elevation={0}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    freeSolo
                    value={client}
                    onChange={(_e, v) => setClient(v)}
                    options={contactOptions}
                    loading={contactsLoading}
                    renderInput={(params) => (
                      <TextField {...params} label="Client" size="small" fullWidth InputProps={{ ...params.InputProps, endAdornment: (<>{contactsLoading ? <CircularProgress size={16} /> : null}{params.InputProps.endAdornment}</>) }} />
                    )}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField label="Invoice #" value={invoiceNum} onChange={(e) => setInvoiceNum(e.target.value)} fullWidth size="small" />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
                </Grid>
              </Grid>
            </Paper>

            <Paper elevation={0} sx={{ p: 0 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Concept</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">VAT %</TableCell>
                    <TableCell align="right">Line total</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <TextField value={l.concept} onChange={(e) => updateLine(i, { concept: e.target.value })} size="small" fullWidth />
                      </TableCell>
                      <TableCell>
                        <TextField value={l.description} onChange={(e) => updateLine(i, { description: e.target.value })} size="small" fullWidth />
                      </TableCell>
                      <TableCell align="right">
                        <TextField value={l.quantity} onChange={(e) => updateLine(i, { quantity: Number(e.target.value || 0) })} size="small" inputProps={{ inputMode: 'numeric' }} sx={{ width: 100 }} />
                      </TableCell>
                      <TableCell align="right">
                        <TextField value={l.price} onChange={(e) => updateLine(i, { price: Number(e.target.value || 0) })} size="small" inputProps={{ inputMode: 'decimal' }} sx={{ width: 120 }} />
                      </TableCell>
                      <TableCell align="right">
                        <TextField select value={l.vatPercent} onChange={(e) => updateLine(i, { vatPercent: Number(e.target.value) })} size="small" sx={{ width: 100 }}>
                          <MenuItem value={0}>0%</MenuItem>
                          <MenuItem value={10}>10%</MenuItem>
                          <MenuItem value={21}>21%</MenuItem>
                        </TextField>
                      </TableCell>
                      <TableCell align="right">{((Number(l.quantity || 0) * Number(l.price || 0)) * (1 + Number(l.vatPercent || 0) / 100)).toFixed(2)}€</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => removeLine(i)}>
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={7}>
                      <Button startIcon={<AddRoundedIcon />} onClick={addLine} size="small">
                        Add line
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>

            <Box sx={{ mt: 2 }}>
              <TextField label="Note" value={note} onChange={(e) => setNote(e.target.value)} fullWidth multiline rows={3} size="small" />
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, position: 'sticky', top: 24 }} elevation={1}>
              <Typography variant="subtitle1" fontWeight={700}>Summary</Typography>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', my: 1 }}>
                <Typography variant="body2">Subtotal</Typography>
                <Typography variant="body2">{formatCurrency(subtotal)}</Typography>
              </Box>
              {Object.entries(vatTotals).map(([k, v]) => (
                <Box key={k} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">IVA {k}%</Typography>
                  <Typography variant="body2">{formatCurrency(v)}</Typography>
                </Box>
              ))}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="h6" fontWeight={700}>Total</Typography>
                <Typography variant="h6" fontWeight={700}>{formatCurrency(total)}</Typography>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button variant="outlined" fullWidth onClick={() => handleCreate('draft')}>Save draft</Button>
                <Button variant="contained" fullWidth onClick={() => handleCreate('approved')}>Approve</Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => { setMenuAnchor(null); openPreview(); }}>Preview</MenuItem>
        <MenuItem onClick={() => { setMenuAnchor(null); printPreview(); }}>Print</MenuItem>
      </Menu>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Invoice preview</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">{invoiceNum || 'Invoice'}</Typography>
            <Typography variant="subtitle2">Client: {(client && (client.label || client)) || ''}</Typography>
            <Box sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Concept</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">VAT</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell>{l.concept}</TableCell>
                      <TableCell>{l.description}</TableCell>
                      <TableCell align="right">{l.quantity}</TableCell>
                      <TableCell align="right">{formatCurrency(l.price)}</TableCell>
                      <TableCell align="right">{l.vatPercent}%</TableCell>
                      <TableCell align="right">{formatCurrency((Number(l.quantity || 0) * Number(l.price || 0)) * (1 + Number(l.vatPercent || 0) / 100))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1">Total</Typography>
              <Typography variant="subtitle1">{formatCurrency(total)}</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          <Button variant="contained" onClick={printPreview}>Print</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default InvoiceEditor;
