import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Link from '@mui/material/Link';

const INVOICES = [
  { id: 'INV-2025-004', tenant: 'Glow Agency', amount: '€320.00', issuedAt: '2025-09-01', status: 'Paid' },
  { id: 'INV-2025-003', tenant: 'Cloud Ops', amount: '€295.00', issuedAt: '2025-08-01', status: 'Paid' },
  { id: 'INV-2025-002', tenant: 'Studio K', amount: '€180.00', issuedAt: '2025-07-14', status: 'Overdue' }
];

const Invoices = () => (
  <Paper elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid #e2e8f0' }}>
    <Stack spacing={0.5} sx={{ mb: 3 }}>
      <Typography variant="h6" fontWeight={700}>
        Billing & invoices
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Connect Stripe or your finance API to populate invoice data and download links.
      </Typography>
    </Stack>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Invoice ID</TableCell>
          <TableCell>Tenant</TableCell>
          <TableCell>Amount</TableCell>
          <TableCell>Issued</TableCell>
          <TableCell>Status</TableCell>
          <TableCell align="right">Link</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {INVOICES.map((invoice) => (
          <TableRow key={invoice.id} hover>
            <TableCell>{invoice.id}</TableCell>
            <TableCell>{invoice.tenant}</TableCell>
            <TableCell>{invoice.amount}</TableCell>
            <TableCell>{invoice.issuedAt}</TableCell>
            <TableCell>{invoice.status}</TableCell>
            <TableCell align="right">
              <Link href="#" color="#16a34a" underline="hover">
                View
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Paper>
);

export default Invoices;
