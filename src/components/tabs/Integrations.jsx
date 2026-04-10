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
import Divider from '@mui/material/Divider';
import Fade from '@mui/material/Fade';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '../common/ClearableTextField';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import Collapse from '@mui/material/Collapse';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import LinkOffRoundedIcon from '@mui/icons-material/LinkOffRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';

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

const SUITES = [
  {
    id: 'google-workspace-suite',
    name: 'Google Workspace',
    description: 'Gmail, Drive, Docs, Calendar, Meet and more — full suite connected via Service Account + OAuth',
    logo: favicon('workspace.google.com'),
    color: '#4285F4',
    status: 'available',
    apps: [
      { id: 'google-docs', name: 'Google Docs', logo: favicon('docs.google.com'), description: 'Contract generation from templates · auto-fill user data on registration', departments: ['HumanResourcesAI', 'AccountsAI'], status: 'ready' },
      { id: 'google-drive', name: 'Google Drive', logo: favicon('drive.google.com'), description: 'Per-user folders for signed contracts · shared storage for documents and reports', departments: ['AccountsAI', 'HumanResourcesAI', 'ProjectsAI'], status: 'active' },
      { id: 'gmail', name: 'Gmail', logo: favicon('gmail.com'), description: 'Read/send on behalf of your domain · SalesAI outreach · SupportAI inbox · MarketingAI campaigns', departments: ['SalesAI', 'SupportAI', 'MarketingAI'], status: 'ready' },
      { id: 'google-calendar', name: 'Google Calendar', logo: favicon('calendar.google.com'), description: 'Booking sync · interview scheduling (HR) · project milestones · sales call booking', departments: ['HumanResourcesAI', 'ProjectsAI', 'SalesAI'], status: 'ready' },
      { id: 'google-meet', name: 'Google Meet', logo: favicon('meet.google.com'), description: 'Auto-create meeting links for booked slots · interview links · sales demo scheduling', departments: ['HumanResourcesAI', 'SalesAI'], status: 'ready' },
      { id: 'google-sheets', name: 'Google Sheets', logo: favicon('sheets.google.com'), description: 'Export reports, payroll data, financial summaries · bi-directional sync with AccountsAI', departments: ['AccountsAI', 'HumanResourcesAI'], status: 'ready' },
      { id: 'google-analytics', name: 'Google Analytics / Tag Manager', logo: favicon('analytics.google.com'), description: 'MarketingAI reads traffic data · CodeAI manages GTM deployments and event tracking', departments: ['MarketingAI', 'CodeAI'], status: 'ready' },
      { id: 'google-forms', name: 'Google Forms', logo: favicon('forms.google.com'), description: 'Onboarding forms · feedback collection · HR intake · data flows into CRM automatically', departments: ['HumanResourcesAI', 'SalesAI'], status: 'ready' },
    ],
  },
  {
    id: 'microsoft-365-suite',
    name: 'Microsoft 365',
    description: 'Outlook, OneDrive, Teams, Word, Excel and more — connected via Microsoft Graph API',
    logo: favicon('microsoft.com'),
    color: '#0078D4',
    status: 'available',
    apps: [
      { id: 'outlook', name: 'Outlook', logo: favicon('outlook.com'), description: 'Email sync · calendar integration · SalesAI outreach · SupportAI inbox', departments: ['SalesAI', 'SupportAI', 'MarketingAI'], status: 'ready' },
      { id: 'onedrive', name: 'OneDrive', logo: favicon('onedrive.live.com'), description: 'Document storage · shared folders · contract management', departments: ['AccountsAI', 'HumanResourcesAI', 'ProjectsAI'], status: 'ready' },
      { id: 'ms-teams', name: 'Microsoft Teams', logo: favicon('teams.microsoft.com'), description: 'Chat channels · video meetings · team collaboration', departments: ['SupportAI', 'ProjectsAI', 'SalesAI'], status: 'ready' },
      { id: 'ms-word', name: 'Word', logo: favicon('word.office.com'), description: 'Document generation · contract templates · proposal drafts', departments: ['HumanResourcesAI', 'AccountsAI'], status: 'ready' },
      { id: 'ms-excel', name: 'Excel', logo: favicon('excel.office.com'), description: 'Financial reports · payroll exports · data analysis', departments: ['AccountsAI', 'HumanResourcesAI'], status: 'ready' },
      { id: 'sharepoint', name: 'SharePoint', logo: favicon('sharepoint.com'), description: 'Team sites · document libraries · knowledge base', departments: ['ProjectsAI', 'HumanResourcesAI'], status: 'ready' },
    ],
  },
];

const pillFieldSx = (hasValue) => ({
  '& .MuiInputLabel-root': { fontSize: '0.75rem', fontWeight: 700, color: hasValue ? 'primary.main' : 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em', transition: 'color 0.2s' },
  '& .MuiInput-input': { fontSize: '0.875rem', color: hasValue ? 'text.primary' : 'text.secondary', py: 0.25 },
});

const Integrations = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const green = theme.palette.brand.green;
  const greenHover = theme.palette.brand.greenHover;

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('');
  const [connectors, setConnectors] = useState(CONNECTORS);
  const [suites, setSuites] = useState(SUITES);
  const [expandedSuite, setExpandedSuite] = useState(null);
  const [appToggles, setAppToggles] = useState({});
  const [connectingId, setConnectingId] = useState(null);
  const [hoveredConnected, setHoveredConnected] = useState(null);

  const toggleApp = (appId) => {
    setAppToggles((prev) => ({ ...prev, [appId]: !prev[appId] }));
  };

  const filtered = useMemo(() => {
    let items = [...connectors];

    if (statusFilter === 'connected') items = items.filter((c) => c.status === 'connected');
    else if (statusFilter === 'available') items = items.filter((c) => c.status === 'available');
    else if (statusFilter === 'coming_soon') items = items.filter((c) => c.status === 'coming_soon');

    if (category !== 'all') items = items.filter((c) => c.category === category);

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
    }

    return items;
  }, [connectors, statusFilter, category, search]);

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

  const handleSuiteConnect = (suiteId) => {
    setConnectingId(suiteId);
    setTimeout(() => {
      setSuites((prev) => prev.map((s) => (s.id === suiteId ? { ...s, status: 'connected' } : s)));
      setConnectingId(null);
    }, 1800);
  };

  const handleSuiteDisconnect = (suiteId) => {
    setSuites((prev) => prev.map((s) => (s.id === suiteId ? { ...s, status: 'available' } : s)));
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
              px: 3, py: 2, borderRadius: 3,
              border: '1px solid', borderColor: 'divider',
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

      {/* Pill-bar search/filter */}
      <Paper
        elevation={0}
        sx={{
          border: '1px solid', borderColor: 'divider',
          backgroundColor: 'background.paper',
          display: 'flex', alignItems: 'center', overflow: 'hidden',
          boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
          flexDirection: { xs: 'column', sm: 'row' },
          borderRadius: { xs: 3, sm: 999 },
        }}
      >
        {/* Search */}
        <Box sx={{ flex: 1, px: 3, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
          <TextField
            variant="standard"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            label={t('stubs.connectors.searchPlaceholder', 'Search')}
            placeholder={t('stubs.connectors.searchPlaceholder')}
            fullWidth
            slotProps={{ input: { disableUnderline: true }, inputLabel: { shrink: true } }}
            sx={pillFieldSx(search)}
          />
        </Box>
        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
        <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />

        {/* Category */}
        <Box sx={{ flex: 0.7, px: 2, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.25 }}>
            {t('stubs.connectors.categoryLabel', 'Category')}
          </Typography>
          <Select
            variant="standard"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            displayEmpty
            fullWidth
            disableUnderline
            sx={{ fontSize: '0.875rem', color: category !== 'all' ? 'text.primary' : 'text.secondary' }}
          >
            {CATEGORIES.map((cat) => (
              <MenuItem key={cat.id} value={cat.id}>{t(cat.label)}</MenuItem>
            ))}
          </Select>
        </Box>
        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
        <Divider sx={{ display: { xs: 'block', sm: 'none' }, width: '90%', mx: 'auto' }} />

        {/* Status */}
        <Box sx={{ flex: 0.6, px: 2, py: { xs: 1.5, sm: 2 }, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}>
          <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: 'text.primary', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.25 }}>
            {t('stubs.connectors.statusLabel', 'Status')}
          </Typography>
          <Select
            variant="standard"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            displayEmpty
            fullWidth
            disableUnderline
            sx={{ fontSize: '0.875rem', color: statusFilter ? 'text.primary' : 'text.secondary' }}
          >
            <MenuItem value="">{t('stubs.connectors.allStatuses', 'All statuses')}</MenuItem>
            <MenuItem value="connected">{t('stubs.connectors.connectedBadge')}</MenuItem>
            <MenuItem value="available">{t('stubs.connectors.filter.available')}</MenuItem>
            <MenuItem value="coming_soon">{t('stubs.connectors.comingSoon')}</MenuItem>
          </Select>
        </Box>

        {/* Search button */}
        <Box sx={{ px: { xs: 2, sm: 1.5 }, py: { xs: 1.5, sm: 0 }, width: { xs: '100%', sm: 'auto' }, display: 'flex', justifyContent: 'center' }}>
          <IconButton
            aria-label="Search"
            sx={{
              bgcolor: 'primary.main', color: 'common.white',
              width: 44, height: 44,
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            <SearchRoundedIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* Featured Suites */}
      <Stack spacing={2}>
        {suites.map((suite) => {
          const isExpanded = expandedSuite === suite.id;
          const DEPT_COLORS = {
            AccountsAI: '#8B5CF6', HumanResourcesAI: '#EC4899', ProjectsAI: '#F59E0B',
            SalesAI: '#10B981', SupportAI: '#6366F1', MarketingAI: '#EF4444', CodeAI: '#6B7280',
          };
          return (
            <Paper
              key={suite.id}
              elevation={0}
              sx={{
                borderRadius: 3, border: '1px solid',
                borderColor: suite.status === 'connected' ? alpha(suite.color, 0.4) : 'divider',
                overflow: 'hidden',
              }}
            >
              {/* Suite header */}
              <Box
                onClick={() => setExpandedSuite(isExpanded ? null : suite.id)}
                sx={{
                  p: 2.5, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  bgcolor: alpha(suite.color, 0.03),
                  '&:hover': { bgcolor: alpha(suite.color, 0.06) },
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={suite.logo} alt={suite.name}
                    sx={{ width: 44, height: 44, border: '2px solid', borderColor: alpha(suite.color, 0.3), bgcolor: alpha(suite.color, 0.08) }}
                  >
                    {suite.name.slice(0, 2)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} color="text.primary">{suite.name}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>{suite.description}</Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  {suite.status === 'connected' ? (
                    <Chip
                      size="small"
                      icon={<CheckCircleRoundedIcon sx={{ fontSize: 14 }} />}
                      label={t('stubs.connectors.connectedBadge')}
                      sx={{ bgcolor: alpha(green, 0.1), color: green, fontWeight: 600, fontSize: '0.75rem', '& .MuiChip-icon': { color: green } }}
                    />
                  ) : (
                    <Button
                      variant="outlined" size="small"
                      onClick={(e) => { e.stopPropagation(); handleSuiteConnect(suite.id); }}
                      sx={{ borderRadius: 2, borderColor: suite.color, color: suite.color, fontWeight: 600, '&:hover': { bgcolor: alpha(suite.color, 0.06) } }}
                    >
                      {t('stubs.connectors.suites.connectSuite', 'Connect Suite')}
                    </Button>
                  )}
                  <ExpandMoreRoundedIcon sx={{
                    fontSize: 20, color: 'text.secondary',
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                  }} />
                </Stack>
              </Box>

              {/* Expanded sub-apps */}
              <Collapse in={isExpanded} timeout="auto">
                <Divider />
                <Box sx={{ px: 1, py: 1 }}>
                  {suite.apps.map((app) => {
                    const isOn = appToggles[app.id] ?? (app.status === 'active');
                    return (
                      <Box
                        key={app.id}
                        sx={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          px: 2, py: 1.5,
                          borderBottom: '1px solid', borderColor: 'divider',
                          '&:last-child': { borderBottom: 'none' },
                          '&:hover': { bgcolor: alpha(suite.color, 0.02) },
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                          <Avatar
                            src={app.logo} alt={app.name}
                            sx={{ width: 32, height: 32, bgcolor: alpha(suite.color, 0.06) }}
                          >
                            {app.name.slice(0, 2)}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} color="text.primary">{app.name}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>{app.description}</Typography>
                          </Box>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, ml: 2 }}>
                          <Chip
                            size="small"
                            label={isOn ? 'Active' : 'Ready'}
                            sx={{
                              fontSize: '0.625rem', height: 20, fontWeight: 600,
                              bgcolor: isOn ? alpha(green, 0.1) : alpha('#666', 0.08),
                              color: isOn ? green : 'text.secondary',
                            }}
                          />
                          <Switch
                            size="small"
                            checked={isOn}
                            onChange={() => toggleApp(app.id)}
                            sx={{
                              '& .MuiSwitch-switchBase.Mui-checked': { color: green },
                              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: green },
                            }}
                          />
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>
              </Collapse>
            </Paper>
          );
        })}
      </Stack>

      {/* Connector Grid */}
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
                  p: 3, borderRadius: 3,
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
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Avatar
                      src={connector.logo}
                      alt={connector.name}
                      sx={{
                        width: 44, height: 44,
                        border: '2px solid',
                        borderColor: connector.status === 'connected' ? alpha(green, 0.3) : 'divider',
                        bgcolor: alpha(green, 0.08), color: green,
                        fontSize: 16, fontWeight: 700,
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
                          bgcolor: alpha(green, 0.1), color: green,
                          fontWeight: 600, fontSize: '0.75rem',
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
                          fontWeight: 600, fontSize: '0.75rem',
                        }}
                      />
                    )}
                  </Stack>

                  <Box>
                    <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                      {connector.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
                      {connector.description}
                    </Typography>
                  </Box>

                  <Box>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={t(`connectors.categories.${connector.category}`)}
                      sx={{ fontSize: '0.7rem', height: 22, borderColor: alpha(theme.palette.text.primary, 0.12) }}
                    />
                  </Box>

                  {connector.status === 'available' && (
                    <Button
                      variant="outlined" size="small" fullWidth
                      onClick={() => handleConnect(connector.id)}
                      sx={{
                        borderRadius: 2, borderColor: green, color: green, fontWeight: 600,
                        '&:hover': { bgcolor: alpha(green, 0.06), borderColor: greenHover, color: greenHover },
                      }}
                    >
                      {t('stubs.connectors.connect')}
                    </Button>
                  )}
                  {connector.status === 'connected' && (
                    <Button
                      variant={hoveredConnected === connector.id ? 'outlined' : 'contained'}
                      size="small" fullWidth
                      onClick={() => handleDisconnect(connector.id)}
                      startIcon={hoveredConnected === connector.id ? <LinkOffRoundedIcon sx={{ fontSize: 16 }} /> : null}
                      sx={{
                        borderRadius: 2, fontWeight: 600,
                        ...(hoveredConnected === connector.id
                          ? {
                              borderColor: theme.palette.error.main, color: theme.palette.error.main,
                              bgcolor: 'transparent',
                              '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.06), borderColor: theme.palette.error.dark },
                            }
                          : { bgcolor: green, '&:hover': { bgcolor: greenHover } }),
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
        PaperProps={{ sx: { borderRadius: 3, p: 2, minWidth: 300, textAlign: 'center' } }}
      >
        <DialogContent>
          <Stack spacing={3} alignItems="center" sx={{ py: 2 }}>
            {connectingId && (() => {
              const item = connectors.find((c) => c.id === connectingId) || suites.find((s) => s.id === connectingId);
              return item ? (
                <Avatar
                  src={item.logo}
                  alt=""
                  sx={{ width: 56, height: 56, border: '2px solid', borderColor: alpha(green, 0.3), bgcolor: alpha(green, 0.08), color: green, fontSize: 18, fontWeight: 700 }}
                >
                  {item.name.slice(0, 2)}
                </Avatar>
              ) : null;
            })()}
            <CircularProgress size={32} sx={{ color: green }} />
            <Typography variant="subtitle1" fontWeight={600}>
              {t('stubs.connectors.connecting')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {(() => {
                const item = connectors.find((c) => c.id === connectingId) || suites.find((s) => s.id === connectingId);
                return item?.name || '';
              })()}
            </Typography>
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  );
};

export default Integrations;
