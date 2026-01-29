import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';

const BOOKINGS = [
  { id: 'BK-2042', tenant: 'Glow Agency', room: 'A2 Boardroom', date: '2025-09-20', time: '10:00 - 12:00', status: 'Confirmed' },
  { id: 'BK-2041', tenant: 'Cloud Ops', room: 'Lisbon Hub / L3', date: '2025-09-20', time: '14:00 - 16:30', status: 'Pending payment' },
  { id: 'BK-2039', tenant: 'Studio K', room: 'Creative Loft', date: '2025-09-21', time: '09:00 - 11:00', status: 'Cancelled' }
];

const statusColor = {
  Confirmed: 'success',
  'Pending payment': 'warning',
  Cancelled: 'default'
};

const AdminBookings = () => (
  <Paper elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid', borderColor: 'divider' }}>
    <Stack spacing={0.5} sx={{ mb: 3 }}>
      <Typography variant="h6" fontWeight={700}>
        Bookings overview
      </Typography>
      <Typography variant="body2" color="text.secondary">
        All reservations across BeWorking locations. Integrate with your booking API to surface real data.
      </Typography>
    </Stack>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Booking ID</TableCell>
          <TableCell>Tenant</TableCell>
          <TableCell>Room</TableCell>
          <TableCell>Date</TableCell>
          <TableCell>Time</TableCell>
          <TableCell>Status</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {BOOKINGS.map((row) => (
          <TableRow key={row.id} hover>
            <TableCell>{row.id}</TableCell>
            <TableCell>{row.tenant}</TableCell>
            <TableCell>{row.room}</TableCell>
            <TableCell>{row.date}</TableCell>
            <TableCell>{row.time}</TableCell>
            <TableCell>
              <Chip label={row.status} color={statusColor[row.status] ?? 'default'} size="small" variant="outlined" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Paper>
);

export default AdminBookings;
