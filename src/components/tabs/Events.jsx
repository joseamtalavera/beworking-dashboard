import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

const GenericCard = ({ title, children }) => (
  <Paper elevation={0} sx={{ borderRadius: 3, p: 3, border: '1px solid', borderColor: 'divider' }}>
    <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ mb: 2 }}>
      {title}
    </Typography>
    {children}
  </Paper>
);

const Events = () => (
  <GenericCard title="Events Calendar">
    <Typography color="text.secondary">
      The events management system is on its way. You'll soon be able to track, create, and manage both virtual and in-person events.
    </Typography>
  </GenericCard>
);

export default Events;
