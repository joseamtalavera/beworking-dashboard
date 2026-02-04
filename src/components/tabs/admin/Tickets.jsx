import Paper from '@mui/material/Paper';
import { alpha } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';

const TICKETS = [
  { id: 'SUP-142', subject: 'Mailbox sync delay', requester: 'Glow Agency', priority: 'High', status: 'Open' },
  { id: 'SUP-139', subject: 'Invoice refund request', requester: 'Studio K', priority: 'Medium', status: 'Awaiting reply' },
  { id: 'SUP-136', subject: 'Room door access', requester: 'Cloud Ops', priority: 'Low', status: 'Resolved' }
];

const priorityColor = {
  High: 'error',
  Medium: 'warning',
  Low: 'default'
};

const Tickets = () => (
  <Paper elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid', borderColor: 'divider' }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" sx={{ mb: 3 }}>
      <Stack spacing={0.5}>
        <Typography variant="h6" fontWeight={700}>
          Support tickets
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track tenant requests and SLA across the workspace.
        </Typography>
      </Stack>
      <Button 
        variant="outlined" 
        size="small" 
        sx={{ 
          minWidth: 120,
          height: 36,
          textTransform: 'none',
          fontWeight: 600,
          borderColor: 'secondary.main', 
          color: 'secondary.main', 
          '&:hover': { 
            borderColor: (theme) => theme.palette.brand.greenHover, 
            color: (theme) => theme.palette.brand.greenHover,
            backgroundColor: (theme) => alpha(theme.palette.brand.green, 0.08),
            transform: 'translateY(-1px)',
            boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.brand.green, 0.2)}`
          },
          transition: 'all 0.2s ease-in-out'
        }}
      >
        OPEN TICKET
      </Button>
    </Stack>
    <List disablePadding>
      {TICKETS.map((ticket) => (
        <ListItem key={ticket.id} divider sx={{ alignItems: 'flex-start' }}>
          <ListItemText
            primary={
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body1" fontWeight={600}>
                  {ticket.subject}
                </Typography>
                <Chip label={ticket.priority} size="small" color={priorityColor[ticket.priority] ?? 'default'} />
              </Stack>
            }
            secondary={
              <>
                <Typography variant="caption" color="text.secondary">
                  #{ticket.id} · {ticket.requester}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Status: {ticket.status}
                </Typography>
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  </Paper>
);

export default Tickets;
