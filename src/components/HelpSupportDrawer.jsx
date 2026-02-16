import { alpha, useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import ChatBubbleRoundedIcon from '@mui/icons-material/ChatBubbleRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import PlayCircleRoundedIcon from '@mui/icons-material/PlayCircleRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n.js';
import esSettings from '../i18n/locales/es/settings.json';
import enSettings from '../i18n/locales/en/settings.json';

if (!i18n.hasResourceBundle('es', 'settings')) {
  i18n.addResourceBundle('es', 'settings', esSettings);
  i18n.addResourceBundle('en', 'settings', enSettings);
}

const HelpSupportDrawer = ({ open, onClose }) => {
  const theme = useTheme();
  const accentColor = theme.palette.brand.green;
  const { t } = useTranslation('settings');

  const helpArticles = [
    {
      id: 'getting-started',
      title: t('help.articles.gettingStarted.title'),
      summary: t('help.articles.gettingStarted.summary'),
      url: '#'
    },
    {
      id: 'billing',
      title: t('help.articles.billing.title'),
      summary: t('help.articles.billing.summary'),
      url: '#'
    },
    {
      id: 'automations',
      title: t('help.articles.automations.title'),
      summary: t('help.articles.automations.summary'),
      url: '#'
    }
  ];

  const quickAnswers = [
    t('help.questions.card'),
    t('help.questions.invoices'),
    t('help.questions.automations'),
    t('help.questions.api')
  ];

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', md: 420 } } }}>
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack spacing={0.5}>
            <Typography variant="h6" fontWeight="bold">
              {t('help.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('help.subtitle')}
            </Typography>
          </Stack>
          <IconButton onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: accentColor, width: 48, height: 48 }}>
              <SupportAgentRoundedIcon sx={{ color: 'white' }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {t('help.liveChat')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('help.liveChatDesc')}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                <Button 
                  variant="contained" 
                  size="small" 
                  sx={{ 
                    minWidth: 120,
                    height: 36,
                    textTransform: 'none',
                    fontWeight: 600,
                    backgroundColor: accentColor, 
                    color: 'white',
                    '&:hover': { 
                      backgroundColor: theme.palette.brand.greenHover 
                    } 
                  }} 
                  startIcon={<ChatBubbleRoundedIcon fontSize="small" />}
                >
                  {t('help.startChat')}
                </Button>
                <Button 
                  variant="outlined" 
                  size="small" 
                  sx={{ 
                    minWidth: 120,
                    height: 36,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: accentColor,
                    color: accentColor,
                    '&:hover': {
                      borderColor: theme.palette.brand.greenHover,
                      color: theme.palette.brand.greenHover,
                      backgroundColor: alpha(theme.palette.brand.green, 0.08),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.brand.green, 0.2)}`
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  {t('help.bookCall')}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>

        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('help.quickAnswers')}
          </Typography>
          <List dense sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            {quickAnswers.map((question) => (
              <ListItem key={question} disablePadding divider>
                <Button
                  fullWidth
                  variant="text"
                  sx={{ justifyContent: 'flex-start', textTransform: 'none', color: 'text.primary', px: 1.5 }}
                  startIcon={<ArticleRoundedIcon fontSize="small" color="action" />}
                >
                  <Stack spacing={0.25} alignItems="flex-start">
                    <Typography variant="body2" fontWeight={600} color="inherit">
                      {question}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('help.tapToOpen')}
                    </Typography>
                  </Stack>
                </Button>
              </ListItem>
            ))}
          </List>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('help.documentation')}
          </Typography>
          <List dense>
            {helpArticles.map((article) => (
              <ListItem key={article.id} disableGutters sx={{ mb: 1.5 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.brand.green, 0.12), color: accentColor }}>
                    <ArticleRoundedIcon fontSize="small" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Link href={article.url} underline="hover" color="inherit" sx={{ fontWeight: 600 }}>
                      {article.title}
                    </Link>
                  }
                  secondary={article.summary}
                />
              </ListItem>
            ))}
          </List>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('help.tutorials')}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: 'text.primary', width: 44, height: 44 }}>
                    <PlayCircleRoundedIcon sx={{ color: 'common.white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      {t('help.videoIntro.title')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('help.videoIntro.desc')}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: 'text.primary', width: 44, height: 44 }}>
                    <PlayCircleRoundedIcon sx={{ color: 'common.white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      {t('help.videoAutomations.title')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('help.videoAutomations.desc')}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {t('help.leaveNote')}
          </Typography>
          <TextField
            multiline
            minRows={3}
            fullWidth
            placeholder={t('help.notePlaceholder')}
            variant="outlined"
            size="small"
          />
          <Button 
            variant="contained" 
            size="small" 
            sx={{ 
              mt: 1.5,
              minWidth: 120,
              height: 36,
              textTransform: 'none',
              fontWeight: 600,
              backgroundColor: accentColor, 
              color: 'common.white',
              '&:hover': { 
                backgroundColor: theme.palette.brand.greenHover 
              } 
            }}
          >
            {t('help.sendMessage')}
          </Button>
        </Paper>
      </Box>
    </Drawer>
  );
};

export default HelpSupportDrawer;
