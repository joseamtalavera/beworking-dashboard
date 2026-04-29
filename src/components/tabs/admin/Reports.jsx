import { useEffect, useMemo, useState } from 'react';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Chip from '@mui/material/Chip';
import { fetchInvoiceAudit } from '../../../api/reports.js';

const CUENTA_OPTIONS = ['PT', 'OF', 'GT'];

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const formatEuro = (value) => {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(value));
};

const downloadCsv = (filename, rows) => {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) => {
    if (v === null || v === undefined) return '';
    const s = Array.isArray(v) ? `[${v.join(' ')}]` : String(v);
    return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
  };
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const Section = ({ title, count, amount, rows, columns, csvName, emptyText = 'No rows.' }) => (
  <Paper elevation={0} sx={{ borderRadius: 3, p: 2.5, border: '1px solid', borderColor: 'divider' }}>
    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        {typeof count === 'number' && (
          <Chip size="small" label={`${count} rows`} />
        )}
        {typeof amount === 'number' && (
          <Chip size="small" color="primary" variant="outlined" label={formatEuro(amount)} />
        )}
      </Stack>
      <Button
        size="small"
        variant="outlined"
        disabled={!rows || rows.length === 0}
        onClick={() => downloadCsv(`${csvName}.csv`, rows)}
      >
        Export CSV
      </Button>
    </Stack>
    {(!rows || rows.length === 0) ? (
      <Typography variant="body2" color="text.secondary">{emptyText}</Typography>
    ) : (
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((c) => <TableCell key={c.key} sx={{ fontWeight: 600 }}>{c.label}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i} hover>
              {columns.map((c) => (
                <TableCell key={c.key} sx={c.cellSx}>
                  {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )}
  </Paper>
);

const Reports = () => {
  const [month, setMonth] = useState(currentMonth());
  const [cuentas, setCuentas] = useState(['PT', 'OF']);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runAudit = async () => {
    if (cuentas.length === 0) { setError('Selecciona al menos un cuenta'); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetchInvoiceAudit({ month, cuentas });
      setData(res);
    } catch (e) {
      setError(e.message || 'Failed to load audit');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { runAudit(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const totals = useMemo(() => {
    if (!data?.statusBreakdown) return { count: 0, amount: 0 };
    return data.statusBreakdown.reduce((acc, r) => ({
      count: acc.count + Number(r.count || 0),
      amount: acc.amount + Number(r.amount || 0),
    }), { count: 0, amount: 0 });
  }, [data]);

  return (
    <Stack spacing={2}>
      {/* Filters */}
      <Paper elevation={0} sx={{ borderRadius: 3, p: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <TextField
            label="Month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ minWidth: 180 }}
          />
          <ToggleButtonGroup
            value={cuentas}
            onChange={(_, v) => v && setCuentas(v)}
            size="small"
            color="primary"
          >
            {CUENTA_OPTIONS.map((c) => (
              <ToggleButton key={c} value={c}>{c}</ToggleButton>
            ))}
          </ToggleButtonGroup>
          <Button variant="contained" onClick={runAudit} disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Run audit'}
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}

      {data && (
        <>
          <Section
            title="Status breakdown"
            count={totals.count}
            amount={totals.amount}
            rows={data.statusBreakdown}
            csvName={`audit-${data.month}-status`}
            columns={[
              { key: 'estado', label: 'Estado' },
              { key: 'count', label: 'Count' },
              { key: 'amount', label: 'Amount', render: (v) => formatEuro(v) },
            ]}
          />

          <Section
            title="Outstanding (Pendiente)"
            count={data.outstanding?.length || 0}
            rows={data.outstanding}
            csvName={`audit-${data.month}-outstanding`}
            emptyText="No outstanding invoices."
            columns={[
              { key: 'idfactura', label: 'Nº' },
              { key: 'idcliente', label: 'Cliente' },
              { key: 'total', label: 'Total', render: (v) => formatEuro(v) },
              { key: 'dia', label: 'Fecha' },
              { key: 'fechacobro1', label: 'Cobro' },
            ]}
          />

          <Section
            title="Same-day duplicates"
            count={data.sameDayDuplicates?.length || 0}
            rows={data.sameDayDuplicates}
            csvName={`audit-${data.month}-sameday`}
            emptyText="No same-day duplicates."
            columns={[
              { key: 'client_name', label: 'Cliente' },
              { key: 'total', label: 'Total', render: (v) => formatEuro(v) },
              { key: 'dia', label: 'Fecha' },
              { key: 'dupes', label: 'Dupes' },
              { key: 'facturas', label: 'Facturas', render: (v) => Array.isArray(v) ? v.join(', ') : v },
            ]}
          />

          <Section
            title="Cross-day duplicates (same amount, different days)"
            count={data.crossDayDuplicates?.length || 0}
            rows={data.crossDayDuplicates}
            csvName={`audit-${data.month}-crossday`}
            emptyText="No cross-day duplicates."
            columns={[
              { key: 'client_name', label: 'Cliente' },
              { key: 'total', label: 'Total', render: (v) => formatEuro(v) },
              { key: 'dupes', label: 'Dupes' },
              { key: 'facturas', label: 'Facturas', render: (v) => Array.isArray(v) ? v.join(', ') : v },
              { key: 'dates', label: 'Dates', render: (v) => Array.isArray(v) ? v.join(', ') : v },
            ]}
          />

          <Section
            title="Paid without Stripe ref"
            count={data.paidWithoutStripe?.length || 0}
            rows={data.paidWithoutStripe}
            csvName={`audit-${data.month}-nostripe`}
            emptyText="All paid invoices have a Stripe reference."
            columns={[
              { key: 'idfactura', label: 'Nº' },
              { key: 'client_name', label: 'Cliente' },
              { key: 'total', label: 'Total', render: (v) => formatEuro(v) },
              { key: 'dia', label: 'Fecha' },
              { key: 'fechacobro1', label: 'Cobro' },
            ]}
          />

          <Section
            title="Anomalies"
            count={data.anomalies?.length || 0}
            rows={data.anomalies}
            csvName={`audit-${data.month}-anomalies`}
            emptyText="No anomalies."
            columns={[
              { key: 'idfactura', label: 'Nº' },
              { key: 'client_name', label: 'Cliente' },
              { key: 'total', label: 'Total', render: (v) => formatEuro(v) },
              { key: 'estado', label: 'Estado' },
              { key: 'descripcion', label: 'Descripción' },
              { key: 'dia', label: 'Fecha' },
            ]}
          />
        </>
      )}
    </Stack>
  );
};

export default Reports;
