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

const Community = () => (
  <GenericCard title="Community Hub">
    <Typography color="text.secondary">
      Our community forums and discussion boards are coming soon. Connect with other users, share ideas, and get support from peers.
    </Typography>
  </GenericCard>
);

export default Community;
