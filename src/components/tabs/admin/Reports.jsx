import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';

const reports = [
  {
    id: 'rpt-tenant-health',
    title: 'Tenant health summary',
    description: 'Retention, expansion, and churn metrics by location.',
    frequency: 'Weekly'
  },
  {
    id: 'rpt-bookings',
    title: 'Bookings & utilisation',
    description: 'Occupancy rate, bookings by room type, and cancellations.',
    frequency: 'Daily'
  },
  {
    id: 'rpt-billing',
    title: 'Billing performance',
    description: 'MRR, unpaid invoices, and payout schedule.',
    frequency: 'Monthly'
  }
];

const Reports = () => (
  <Paper elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid', borderColor: 'divider' }}>
    <Stack spacing={0.5} sx={{ mb: 3 }}>
      <Typography variant="h6" fontWeight={700}>
        Analytics & reports
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Connect your data warehouse or BI layer to export curated dashboards.
      </Typography>
    </Stack>
    <Grid container spacing={2}>
      {reports.map((report) => (
        <Grid key={report.id} item xs={12} md={6}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 2.5, height: '100%' }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={600}>
                {report.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {report.description}
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Typography variant="caption" color="text.secondary">
                  Refresh: {report.frequency}
                </Typography>
                <Button variant="outlined" size="small" sx={{ borderRadius: 2 }}>
                  View report
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  </Paper>
);

export default Reports;
