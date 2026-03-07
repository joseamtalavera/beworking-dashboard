import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { alpha, useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Fade from '@mui/material/Fade';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded';

const favicon = (domain) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

const CONNECTORS = [
  // Productivity
  { id: 'notion', name: 'Notion', category: 'productivity', status: 'available', popular: true, logo: favicon('notion.so'), description: 'Sync wikis, docs, and databases.' },
  { id: 'asana', name: 'Asana', category: 'productivity', status: 'available', popular: true, logo: favicon('asana.com'), description: 'Import tasks, projects, and timelines.' },
  { id: 'monday', name: 'Monday.com', category: 'productivity', status: 'available', popular: false, logo: favicon('monday.com'), description: 'Surface boards and project KPIs.' },
  { id: 'trello', name: 'Trello', category: 'productivity', status: 'available', popular: false, logo: favicon('trello.com'), description: 'Bring Kanban boards into your workspace.' },
  { id: 'clickup', name: 'ClickUp', category: 'productivity', status: 'coming_soon', popular: false, logo: favicon('clickup.com'), description: 'Unified project management data.' },
  { id: 'todoist', name: 'Todoist', category: 'productivity', status: 'coming_soon', popular: false, logo: favicon('todoist.com'), description: 'Sync personal and team task lists.' },

  // Communication
  { id: 'slack', name: 'Slack', category: 'communication', status: 'connected', popular: true, logo: favicon('slack.com'), description: 'Sync messages, mentions, and channels.' },
  { id: 'teams', name: 'Microsoft Teams', category: 'communication', status: 'available', popular: true, logo: favicon('teams.microsoft.com'), description: 'Bridge Teams chats and meetings.' },
  { id: 'discord', name: 'Discord', category: 'communication', status: 'available', popular: false, logo: favicon('discord.com'), description: 'Connect community server channels.' },
  { id: 'zoom', name: 'Zoom', category: 'communication', status: 'available', popular: true, logo: favicon('zoom.us'), description: 'Import meeting recordings and transcripts.' },

  // Calendar
  { id: 'google-calendar', name: 'Google Calendar', category: 'calendar', status: 'connected', popular: true, logo: favicon('calendar.google.com'), description: 'Two-way sync of events and bookings.' },
  { id: 'outlook-calendar', name: 'Outlook Calendar', category: 'calendar', status: 'available', popular: true, logo: favicon('outlook.com'), description: 'Sync Outlook events with your agenda.' },
  { id: 'calendly', name: 'Calendly', category: 'calendar', status: 'available', popular: false, logo: favicon('calendly.com'), description: 'Auto-book rooms from Calendly events.' },

  // Storage
  { id: 'google-drive', name: 'Google Drive', category: 'storage', status: 'connected', popular: true, logo: favicon('drive.google.com'), description: 'Centralise shared folders and docs.' },
  { id: 'dropbox', name: 'Dropbox', category: 'storage', status: 'available', popular: true, logo: favicon('dropbox.com'), description: 'Access Dropbox files from the dashboard.' },
  { id: 'onedrive', name: 'OneDrive', category: 'storage', status: 'available', popular: false, logo: favicon('onedrive.live.com'), description: 'Sync OneDrive folders and documents.' },
  { id: 'box', name: 'Box', category: 'storage', status: 'coming_soon', popular: false, logo: favicon('box.com'), description: 'Enterprise content management sync.' },

  // Finance
  { id: 'quickbooks', name: 'QuickBooks', category: 'finance', status: 'available', popular: true, logo: favicon('quickbooks.intuit.com'), description: 'Report invoices and cashflow metrics.' },
  { id: 'xero', name: 'Xero', category: 'finance', status: 'available', popular: false, logo: favicon('xero.com'), description: 'Sync accounting data and reports.' },
  { id: 'stripe', name: 'Stripe', category: 'finance', status: 'connected', popular: true, logo: favicon('stripe.com'), description: 'Payment data already integrated.' },
  { id: 'wise', name: 'Wise', category: 'finance', status: 'coming_soon', popular: false, logo: favicon('wise.com'), description: 'Track international transfers.' },

  // CRM
  { id: 'hubspot', name: 'HubSpot', category: 'crm', status: 'connected', popular: true, logo: favicon('hubspot.com'), description: 'Bring CRM deals and contacts.' },
  { id: 'salesforce', name: 'Salesforce', category: 'crm', status: 'available', popular: true, logo: favicon('salesforce.com'), description: 'Pipeline and opportunity data.' },
  { id: 'pipedrive', name: 'Pipedrive', category: 'crm', status: 'available', popular: false, logo: favicon('pipedrive.com'), description: 'Sales pipeline visualisations.' },
  { id: 'zoho', name: 'Zoho CRM', category: 'crm', status: 'coming_soon', popular: false, logo: favicon('zoho.com'), description: 'Unified CRM and business apps.' },

  // Developer
  { id: 'github', name: 'GitHub', category: 'developer', status: 'available', popular: true, logo: favicon('github.com'), description: 'Track repos, PRs, and deployments.' },
  { id: 'jira', name: 'Jira', category: 'developer', status: 'available', popular: true, logo: favicon('atlassian.com'), description: 'Sync backlog, sprints, and releases.' },
  { id: 'gitlab', name: 'GitLab', category: 'developer', status: 'coming_soon', popular: false, logo: favicon('gitlab.com'), description: 'CI/CD pipelines and merge requests.' },

  // Identity
  { id: 'google-workspace', name: 'Google Workspace', category: 'identity', status: 'available', popular: true, logo: favicon('workspace.google.com'), description: 'SSO and directory sync.' },
  { id: 'okta', name: 'Okta', category: 'identity', status: 'coming_soon', popular: false, logo: favicon('okta.com'), description: 'Enterprise identity management.' },
  { id: 'auth0', name: 'Auth0', category: 'identity', status: 'coming_soon', popular: false, logo: favicon('auth0.com'), description: 'Flexible authentication provider.' },

  // Automation
  { id: 'zapier', name: 'Zapier', category: 'automation', status: 'available', popular: true, logo: favicon('zapier.com'), description: 'Automate workflows across apps.' },
  { id: 'make', name: 'Make', category: 'automation', status: 'available', popular: false, logo: favicon('make.com'), description: 'Visual automation scenarios.' },
  { id: 'n8n', name: 'n8n', category: 'automation', status: 'available', popular: false, logo: favicon('n8n.io'), description: 'Self-hosted workflow automation.' },
];

const CATEGORIES = [
  { id: 'all', label: 'connectors.categories.all' },
  { id: 'productivity', label: 'connectors.categories.productivity' },
  { id: 'communication', label: 'connectors.categories.communication' },
  { id: 'calendar', label: 'connectors.categories.calendar' },
  { id: 'storage', label: 'connectors.categories.storage' },
  { id: 'finance', label: 'connectors.categories.finance' },
  { id: 'crm', label: 'connectors.categories.crm' },
  { id: 'developer', label: 'connectors.categories.developer' },
  { id: 'identity', label: 'connectors.categories.identity' },
  { id: 'automation', label: 'connectors.categories.automation' },
];

const FILTER_TABS = ['popular', 'all', 'connected', 'available'];

const Integrations = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const green = theme.palette.brand.green;
  const greenHover = theme.palette.brand.greenHover;
  const greenSoft = theme.palette.brand.greenSoft;

  const [activeFilter, setActiveFilter] = useState('popular');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [connectors, setConnectors] = useState(CONNECTORS);
  const [connectingId, setConnectingId] = useState(null);
  const [hoveredConnected, setHoveredConnected] = useState(null);

  const filtered = useMemo(() => {
    let items = [...connectors];

    if (activeFilter === 'popular') items = items.filter((c) => c.popular);
    else if (activeFilter === 'connected') items = items.filter((c) => c.status === 'connected');
    else if (activeFilter === 'available') items = items.filter((c) => c.status === 'available');

    if (category !== 'all') items = items.filter((c) => c.category === category);

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }

    return items;
  }, [connectors, activeFilter, category, search]);

  const connectedCount = connectors.filter((c) => c.status === 'connected').length;
  const availableCount = connectors.filter((c) => c.status === 'available').length;

  const handleConnect = (id) => {
    setConnectingId(id);
    setTimeout(() => {
      setConnectors((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'connected' } : c)));
      setConnectingId(null);
    }, 1800);
  };

  const handleDisconnect = (id) => {
    setConnectors((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'available' } : c)));
  };

  return (
    <Stack spacing={4}>
      {/* Header */}
      <Box>
        <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
          {t('stubs.connectors.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('stubs.connectors.subtitle')}
        </Typography>
      </Box>

      {/* Stats row */}
      <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
        {[
          { label: t('stubs.connectors.totalConnectors'), value: connectors.length },
          { label: t('stubs.connectors.connected'), value: connectedCount, accent: true },
          { label: t('stubs.connectors.available'), value: availableCount },
        ].map((stat) => (
          <Box
            key={stat.label}
            sx={{
              px: 3,
              py: 2,
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              minWidth: 140,
              bgcolor: stat.accent ? alpha(green, 0.04) : 'background.paper',
            }}
          >
            <Typography variant="h4" fontWeight={700} color={stat.accent ? green : 'text.primary'}>
              {stat.value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stat.label}
            </Typography>
          </Box>
        ))}
      </Stack>

      {/* Filter tabs + Search + Category */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} flexWrap="wrap" useFlexGap>
        <Stack direction="row" spacing={0.5} sx={{ bgcolor: alpha(theme.palette.text.primary, 0.04), borderRadius: 2, p: 0.5 }}>
          {FILTER_TABS.map((tab) => (
            <Button
              key={tab}
              size="small"
              onClick={() => setActiveFilter(tab)}
              sx={{
                px: 2,
                py: 0.75,
                borderRadius: 1.5,
                fontSize: '0.8125rem',
                fontWeight: activeFilter === tab ? 600 : 400,
                color: activeFilter === tab ? '#fff' : 'text.secondary',
                bgcolor: activeFilter === tab ? green : 'transparent',
                '&:hover': {
                  bgcolor: activeFilter === tab ? greenHover : alpha(theme.palette.text.primary, 0.06),
                },
              }}
            >
              {t(`stubs.connectors.filter.${tab}`)}
            </Button>
          ))}
        </Stack>

        <TextField
          size="small"
          placeholder={t('stubs.connectors.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ minWidth: 220 }}
        />

        <TextField
          select
          size="small"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          {CATEGORIES.map((cat) => (
            <MenuItem key={cat.id} value={cat.id}>
              {t(cat.label)}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="body1" color="text.secondary">
            {t('stubs.connectors.noResults')}
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 2.5,
          }}
        >
          {filtered.map((connector, index) => (
            <Fade in key={connector.id} timeout={300 + index * 60} style={{ transitionDelay: `${index * 40}ms` }}>
              <Box
                onMouseEnter={() => connector.status === 'connected' && setHoveredConnected(connector.id)}
                onMouseLeave={() => setHoveredConnected(null)}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: connector.status === 'connected' ? alpha(green, 0.3) : 'divider',
                  bgcolor: connector.status === 'coming_soon' ? alpha(theme.palette.text.primary, 0.02) : 'background.paper',
                  opacity: connector.status === 'coming_soon' ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                  '&:hover': connector.status !== 'coming_soon' ? {
                    borderColor: alpha(green, 0.4),
                    boxShadow: `0 0 0 1px ${alpha(green, 0.08)}`,
                    transform: 'translateY(-2px)',
                  } : {},
                }}
              >
                <Stack spacing={2}>
                  {/* Top row: logo + status */}
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Avatar
                      src={connector.logo}
                      alt={connector.name}
                      sx={{
                        width: 44,
                        height: 44,
                        border: '2px solid',
                        borderColor: connector.status === 'connected' ? alpha(green, 0.3) : 'divider',
                        bgcolor: alpha(green, 0.08),
                        color: green,
                        fontSize: 16,
                        fontWeight: 700,
                      }}
                    >
                      {connector.name.slice(0, 2)}
                    </Avatar>
                    {connector.status === 'connected' && (
                      <Chip
                        size="small"
                        icon={<CheckCircleRoundedIcon sx={{ fontSize: 14 }} />}
                        label={t('stubs.connectors.connectedBadge')}
                        sx={{
                          bgcolor: alpha(green, 0.1),
                          color: green,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          '& .MuiChip-icon': { color: green },
                        }}
                      />
                    )}
                    {connector.status === 'coming_soon' && (
                      <Chip
                        size="small"
                        label={t('stubs.connectors.soonBadge')}
                        sx={{
                          bgcolor: alpha(theme.palette.text.secondary, 0.1),
                          color: 'text.secondary',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      />
                    )}
                  </Stack>

                  {/* Name + description */}
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                      {connector.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
                      {connector.description}
                    </Typography>
                  </Box>

                  {/* Category chip */}
                  <Box>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={t(`connectors.categories.${connector.category}`)}
                      sx={{ fontSize: '0.7rem', height: 22, borderColor: alpha(theme.palette.text.primary, 0.12) }}
                    />
                  </Box>

                  {/* Action button */}
                  {connector.status === 'available' && (
                    <Button
                      variant="outlined"
                      size="small"
                      fullWidth
                      onClick={() => handleConnect(connector.id)}
                      sx={{
                        borderRadius: 2,
                        borderColor: green,
                        color: green,
                        fontWeight: 600,
                        '&:hover': { bgcolor: alpha(green, 0.06), borderColor: greenHover, color: greenHover },
                      }}
                    >
                      {t('stubs.connectors.connect')}
                    </Button>
                  )}
                  {connector.status === 'connected' && (
                    <Button
                      variant={hoveredConnected === connector.id ? 'outlined' : 'contained'}
                      size="small"
                      fullWidth
                      onClick={() => handleDisconnect(connector.id)}
                      startIcon={hoveredConnected === connector.id ? <LinkOffRoundedIcon sx={{ fontSize: 16 }} /> : null}
                      sx={{
                        borderRadius: 2,
                        fontWeight: 600,
                        ...(hoveredConnected === connector.id
                          ? {
                              borderColor: theme.palette.error.main,
                              color: theme.palette.error.main,
                              bgcolor: 'transparent',
                              '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.06), borderColor: theme.palette.error.dark },
                            }
                          : {
                              bgcolor: green,
                              '&:hover': { bgcolor: greenHover },
                            }),
                      }}
                    >
                      {hoveredConnected === connector.id ? t('stubs.connectors.disconnect') : t('stubs.connectors.connectedBadge')}
                    </Button>
                  )}
                  {connector.status === 'coming_soon' && (
                    <Button variant="outlined" size="small" fullWidth disabled sx={{ borderRadius: 2, fontWeight: 600 }}>
                      {t('stubs.connectors.comingSoon')}
                    </Button>
                  )}
                </Stack>
              </Box>
            </Fade>
          ))}
        </Box>
      )}

      {/* Connecting modal */}
      <Dialog
        open={!!connectingId}
        PaperProps={{
          sx: { borderRadius: 3, p: 2, minWidth: 300, textAlign: 'center' },
        }}
      >
        <DialogContent>
          <Stack spacing={3} alignItems="center" sx={{ py: 2 }}>
            {connectingId && (
              <Avatar
                src={connectors.find((c) => c.id === connectingId)?.logo}
                alt=""
                sx={{ width: 56, height: 56, border: '2px solid', borderColor: alpha(green, 0.3), bgcolor: alpha(green, 0.08), color: green, fontSize: 18, fontWeight: 700 }}
              >
                {connectors.find((c) => c.id === connectingId)?.name.slice(0, 2)}
              </Avatar>
            )}
            <CircularProgress size={32} sx={{ color: green }} />
            <Typography variant="subtitle1" fontWeight={600}>
              {t('stubs.connectors.connecting')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {connectingId && connectors.find((c) => c.id === connectingId)?.name}
            </Typography>
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  );
};

export default Integrations;
