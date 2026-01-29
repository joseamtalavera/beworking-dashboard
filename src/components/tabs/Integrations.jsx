import { alpha, useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

// accentColor and accentHover are defined inside component using theme.palette.brand

const ACTIVE_INTEGRATIONS = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Sync direct messages, mentions, and shared channels.',
    logoUrl: 'https://logo.clearbit.com/slack.com',
    status: 'connected',
    lastSynced: '2025-09-18T16:35:00Z',
    syncInterval: '15 min',
    dataFeeds: ['Notifications', 'Threads', 'Files'],
    syncHealth: 92,
    autoSync: true
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Centralise shared folders and collaborative docs.',
    logoUrl: 'https://logo.clearbit.com/drive.google.com',
    status: 'connected',
    lastSynced: '2025-09-18T14:05:00Z',
    syncInterval: '30 min',
    dataFeeds: ['Folders', 'Shared files', 'Permissions'],
    syncHealth: 88,
    autoSync: true
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Bring CRM deals and activities into dashboards.',
    logoUrl: 'https://logo.clearbit.com/hubspot.com',
    status: 'action_required',
    lastSynced: '2025-09-17T20:10:00Z',
    syncInterval: 'Hourly',
    dataFeeds: ['Deals', 'Contacts', 'Tasks'],
    syncHealth: 54,
    autoSync: false
  }
];

const AVAILABLE_INTEGRATIONS = [
  {
    id: 'monday',
    name: 'Monday.com',
    description: 'Surface workspace boards alongside your project KPIs.',
    logoUrl: 'https://logo.clearbit.com/monday.com'
  },
  {
    id: 'asana',
    name: 'Asana',
    description: 'Bring task lists and sprint timelines into BeWorking.',
    logoUrl: 'https://logo.clearbit.com/asana.com'
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Report invoices and cashflow metrics inside the dashboard.',
    logoUrl: 'https://logo.clearbit.com/quickbooks.intuit.com'
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automate data pushes from thousands of SaaS tools.',
    logoUrl: 'https://logo.clearbit.com/zapier.com'
  }
];

const COMING_SOON = [
  { id: 'jira', name: 'Jira Software', description: 'Sync backlog health, releases, and on-call alerts.', logoUrl: 'https://logo.clearbit.com/jira.com' },
  { id: 'notion', name: 'Notion', description: 'Expose wikis, docs, and product specs in one view.', logoUrl: 'https://logo.clearbit.com/notion.so' },
  { id: 'salesforce', name: 'Salesforce', description: 'Pipeline visualisations and chatter updates.', logoUrl: 'https://logo.clearbit.com/salesforce.com' }
];

const statusChipStyles = {
  connected: { label: 'Connected', color: 'success' },
  action_required: { label: 'Action required', color: 'warning' },
  disconnected: { label: 'Disconnected', color: 'default' }
};

const SummaryCard = ({ title, value, helper, accent }) => (
  <Paper elevation={0} sx={{ borderRadius: 3, p: 3, border: '1px solid', borderColor: 'divider' }}>
    <Stack direction="row" spacing={2} alignItems="center">
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          bgcolor: accent ? accentHover : 'grey.100',
          color: accent ? accentColor : 'text.secondary',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 18
        }}
      >
        {value}
      </Box>
      <Box>
        <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {helper}
        </Typography>
      </Box>
    </Stack>
  </Paper>
);

const formatLastSynced = (isoString) => {
  if (!isoString) return 'Never';
  const last = new Date(isoString);
  const diffMinutes = Math.floor((Date.now() - last.getTime()) / (1000 * 60));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
};

const IntegrationRow = ({ integration }) => {
  const chip = statusChipStyles[integration.status] ?? statusChipStyles.disconnected;
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        alignItems: { xs: 'flex-start', sm: 'center' }
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 200 }}>
        <Avatar
          src={integration.logoUrl}
          alt={integration.name}
          sx={{ width: 48, height: 48, border: '3px solid', borderColor: (theme) => alpha(theme.palette.warning.light, 0.6) }}
          imgProps={{ referrerPolicy: 'no-referrer' }}
        />
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1" fontWeight="bold">
              {integration.name}
            </Typography>
            <Chip label={chip.label} color={chip.color} size="small" />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {integration.description}
          </Typography>
        </Box>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} flex={1} alignItems={{ xs: 'flex-start', md: 'center' }}>
        <Box sx={{ minWidth: 180 }}>
          <Typography variant="caption" color="text.secondary">
            Last sync
          </Typography>
          <Typography variant="body2" fontWeight={600}>
            {formatLastSynced(integration.lastSynced)}
          </Typography>
        </Box>
        <Box sx={{ minWidth: 200 }}>
          <Typography variant="caption" color="text.secondary">
            Data streams
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {integration.dataFeeds.map((feed) => (
              <Chip key={feed} label={feed} size="small" variant="outlined" />
            ))}
          </Stack>
        </Box>
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Typography variant="caption" color="text.secondary">
            Sync health
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <LinearProgress
              variant="determinate"
              value={integration.syncHealth}
              sx={{ flex: 1, height: 6, borderRadius: 999 }}
            />
            <Typography variant="body2" fontWeight={600}>
              {integration.syncHealth}%
            </Typography>
          </Stack>
        </Box>
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center">
        <Tooltip title={integration.autoSync ? 'Auto-sync enabled' : 'Auto-sync disabled'}>
          <Switch checked={integration.autoSync} disabled size="small" />
        </Tooltip>
        <Button
          variant="outlined"
          size="small"
          sx={{
            borderRadius: 2,
            borderColor: accentColor,
            color: accentColor,
            '&:hover': { borderColor: theme.palette.brand.orangeHover, color: theme.palette.brand.orangeHover }
          }}
        >
          Sync now
        </Button>
      </Stack>
    </Paper>
  );
};

const AvailableCard = ({ name, description, logoUrl }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: 3,
      p: 3,
      border: '1px dashed',
      borderColor: accentHover,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }}
  >
    <Stack direction="row" spacing={2} alignItems="center">
      <Avatar
        src={logoUrl}
        alt={name}
        sx={{ width: 44, height: 44, border: '3px solid', borderColor: (theme) => alpha(theme.palette.warning.light, 0.6) }}
        imgProps={{ referrerPolicy: 'no-referrer' }}
      />
      <Typography variant="subtitle1" fontWeight="bold">
        {name}
      </Typography>
    </Stack>
    <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
      {description}
    </Typography>
    <Button
      variant="contained"
      size="small"
      sx={{
        borderRadius: 2,
        bgcolor: accentColor,
        alignSelf: 'flex-start',
        '&:hover': { bgcolor: theme.palette.brand.orangeHover }
      }}
    >
      Request access
    </Button>
  </Paper>
);

const Integrations = () => {
  const theme = useTheme();
  const accentColor = theme.palette.brand.orange;
  const accentHover = theme.palette.brand.orangeSoft;
  const connectedCount = ACTIVE_INTEGRATIONS.filter((item) => item.status === 'connected').length;
  const totalFeeds = ACTIVE_INTEGRATIONS.reduce((acc, item) => acc + item.dataFeeds.length, 0);

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          Integrations hub
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Connect the SaaS tools your teams rely on and stream their data into a single BeWorking dashboard.
        </Typography>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard title="Connected apps" value={connectedCount} helper="Live data sources" accent />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard title="Data channels" value={totalFeeds} helper="Feeds syncing into dashboards" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <SummaryCard title="Pending requests" value={AVAILABLE_INTEGRATIONS.length} helper="Available to connect" />
        </Grid>
      </Grid>

      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight="bold">
            Active connections
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Data pushes occur automatically based on the sync interval configured for each integration.
          </Typography>
        </Stack>
        <Stack spacing={2}>
          {ACTIVE_INTEGRATIONS.map((integration) => (
            <IntegrationRow key={integration.id} integration={integration} />
          ))}
        </Stack>
      </Stack>

      <Stack spacing={2}>
        <Typography variant="h6" fontWeight="bold">
          Available integrations
        </Typography>
        <Grid container spacing={3}>
          {AVAILABLE_INTEGRATIONS.map((integration) => (
            <Grid key={integration.id} item xs={12} md={6} lg={3}>
              <AvailableCard {...integration} />
            </Grid>
          ))}
        </Grid>
      </Stack>

      <Paper elevation={0} sx={{ borderRadius: 3, p: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Roadmap
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          These integrations are already in development. Vote for priority or register early access.
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <List disablePadding>
          {COMING_SOON.map((item, index) => (
            <ListItem key={item.id} disableGutters sx={{ alignItems: 'flex-start', py: 1.5, borderTop: index === 0 ? 'none' : '1px solid', borderColor: 'divider' }}>
              <ListItemAvatar>
                <Avatar
                  src={item.logoUrl}
                  alt={item.name}
                  sx={{ bgcolor: accentHover, color: accentColor }}
                  imgProps={{ referrerPolicy: 'no-referrer' }}
                >
                  {!item.logoUrl && item.name.slice(0, 2)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" fontWeight="bold">
                    {item.name}
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                }
              />
              <Button size="small" variant="text" sx={{ color: accentColor }}>
                Notify me
              </Button>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Stack>
  );
};

export default Integrations;
