import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';

const SAMPLE_CONTACTS = [
  { id: 'tenant-120', name: 'Glow Agency', contact: 'maria@glow.agency', plan: 'Scale', status: 'Active' },
  { id: 'tenant-118', name: 'Cloud Ops', contact: 'ops@cloudops.io', plan: 'Starter', status: 'Trial' },
  { id: 'tenant-110', name: 'Studio K', contact: 'hello@studiok.io', plan: 'Scale', status: 'Active' }
];

const Contacts = () => (
  <Paper elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid #e2e8f0' }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} sx={{ mb: 3 }}>
      <Stack spacing={0.5}>
        <Typography variant="h6" fontWeight={700}>
          Tenants & users
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage tenant accounts, contact emails, and onboarding state.
        </Typography>
      </Stack>
      <Button variant="contained" size="small" sx={{ borderRadius: 2, bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' } }}>
        Invite tenant
      </Button>
    </Stack>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Tenant ID</TableCell>
          <TableCell>Name</TableCell>
          <TableCell>Primary contact</TableCell>
          <TableCell>Plan</TableCell>
          <TableCell>Status</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {SAMPLE_CONTACTS.map((row) => (
          <TableRow key={row.id} hover>
            <TableCell>{row.id}</TableCell>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.contact}</TableCell>
            <TableCell>{row.plan}</TableCell>
            <TableCell>{row.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Paper>
);

export default Contacts;
