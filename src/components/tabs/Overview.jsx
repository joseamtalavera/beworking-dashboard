import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import EventSeatRoundedIcon from '@mui/icons-material/EventSeatRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';

const accentColor = '#fb923c';

const quickStats = [
  { id: 'bookings', label: 'Bookings today', value: '24' },
  { id: 'messages', label: 'Unread messages', value: '8' },
  { id: 'automations', label: 'Automations running', value: '12' }
];

const metricCards = [
  {
    id: 'revenue',
    label: 'MRR',
    value: '€12.4k',
    helper: '+8.2% vs last month',
    icon: <TrendingUpRoundedIcon />,
    color: '#f97316'
  },
  {
    id: 'tenants',
    label: 'Active tenants',
    value: '184',
    helper: '12 pending approvals',
    icon: <PeopleAltRoundedIcon />,
    color: '#2563eb'
  },
  {
    id: 'rooms',
    label: 'Room utilisation',
    value: '68%',
    helper: 'Across all locations today',
    icon: <EventSeatRoundedIcon />,
    color: '#0ea5e9'
  },
  {
    id: 'automations',
    label: 'Automations running',
    value: '27',
    helper: '84% success rate this week',
    icon: <AutoAwesomeRoundedIcon />,
    color: '#22c55e'
  }
];

const activity = [
  { id: 1, title: 'New tenant signed', detail: 'Glow Agency · Málaga Hub', time: '2 hours ago' },
  { id: 2, title: 'Automation executed', detail: 'Invoice payment notifier', time: '4 hours ago' },
  { id: 3, title: 'Room booking created', detail: 'A2 · Creative Boardroom', time: '6 hours ago' },
  { id: 4, title: 'Support ticket closed', detail: 'Mailbox sync delay', time: 'Yesterday' }
];

const locations = [
  { city: 'Málaga', occupancy: 82 },
  { city: 'Madrid', occupancy: 74 },
  { city: 'Lisbon', occupancy: 68 },
  { city: 'Barcelona', occupancy: 64 }
];

const Overview = () => {
  return (
    <Stack spacing={4} sx={{ width: '100%', px: { xs: 1.5, md: 3 }, pb: 4 }}>
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2, lg: 3 },
          gridTemplateColumns: {
            xs: 'repeat(1, minmax(0, 1fr))',
            sm: 'repeat(2, minmax(0, 1fr))',
            xl: 'repeat(3, minmax(0, 1fr))'
          }
        }}
      >
        {quickStats.map((stat) => (
          <Paper key={stat.id} elevation={0} sx={{ borderRadius: 4, p: 2.5, border: '1px solid #e2e8f0', minHeight: 120 }}>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.6 }}>
              {stat.label}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {stat.value}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2, lg: 3 },
          gridTemplateColumns: {
            xs: 'repeat(1, minmax(0, 1fr))',
            md: 'repeat(2, minmax(0, 1fr))',
            xl: 'repeat(4, minmax(0, 1fr))'
          }
        }}
      >
        {metricCards.map((card) => (
          <Paper key={card.id} elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid #e2e8f0', minHeight: 150 }}>
            <Stack spacing={2} direction="row" alignItems="center">
              <Avatar sx={{ bgcolor: `${card.color}1A`, color: card.color }}>{card.icon}</Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {card.label}
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {card.value}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {card.helper}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2, lg: 3 },
          gridTemplateColumns: {
            xs: 'repeat(1, minmax(0, 1fr))',
            xl: 'repeat(2, minmax(0, 1fr))'
          }
        }}
      >
        <Paper elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid #e2e8f0' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Revenue overview
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  MRR vs churn ratio for the past six months.
                </Typography>
              </Box>
              <Chip label="Updated 5 min ago" size="small" sx={{ bgcolor: 'rgba(251,146,60,0.12)', color: accentColor }} />
            </Stack>
            <Box
              sx={{
                height: 220,
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(251,146,60,0.15), rgba(14,165,233,0.08))',
                border: '1px solid #e2e8f0'
              }}
            >
              {/* Placeholder for chart */}
              <Box sx={{ textAlign: 'center', pt: 10 }}>
                <Typography variant="caption" color="text.secondary">
                  Chart placeholder – plug in your favourite charting lib
                </Typography>
              </Box>
            </Box>
          </Paper>
        <Paper elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid #e2e8f0', height: '100%' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Live activity
            </Typography>
            <Stack spacing={2.5}>
              {activity.map((item) => (
                <Box key={item.id}>
                  <Typography variant="body2" fontWeight={600}>
                    {item.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.detail}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    {item.time}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2, lg: 3 },
          gridTemplateColumns: {
            xs: 'repeat(1, minmax(0, 1fr))',
            xl: 'repeat(2, minmax(0, 1fr))'
          }
        }}
      >
        <Paper elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid #e2e8f0' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Workspace occupancy
            </Typography>
            <Stack spacing={2}>
              {locations.map((location) => (
                <Box key={location.city}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" fontWeight={600}>
                      {location.city}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {location.occupancy}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={location.occupancy}
                    sx={{ height: 6, borderRadius: 999, bgcolor: '#f1f5f9', '& .MuiLinearProgress-bar': { bgcolor: accentColor } }}
                  />
                </Box>
              ))}
            </Stack>
          </Paper>
        <Paper elevation={0} sx={{ borderRadius: 4, p: 3, border: '1px solid #e2e8f0', height: '100%' }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Notifications
            </Typography>
            <Stack spacing={2.5}>
              <Stack spacing={1}>
                <Typography variant="body2" fontWeight={600}>
                  Automations beta
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  New AI-powered actions are available in the automation canvas.
                </Typography>
              </Stack>
              <Divider />
              <Stack spacing={1}>
                <Typography variant="body2" fontWeight={600}>
                  Stripe payout scheduled
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  €8,420 transferring to corporate account tomorrow morning.
                </Typography>
              </Stack>
              <Divider />
              <Stack spacing={1}>
                <Typography variant="body2" fontWeight={600}>
                  Support SLA
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Average first response time remains under 4 minutes today.
                </Typography>
              </Stack>
            </Stack>
          </Paper>
      </Box>
    </Stack>
  );
};

export default Overview;
