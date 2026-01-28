import { useTheme } from '@mui/material/styles';
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

// accentColor is defined inside component using theme.palette.brand.orange

const helpArticles = [
  {
    id: 'getting-started',
    title: 'Getting started with BeWorking',
    summary: 'Set up your tenant spaces, invite teammates, and configure branding.',
    url: '#'
  },
  {
    id: 'billing',
    title: 'Manage billing and invoices',
    summary: 'Understand Stripe charges, update payment methods, download invoices.',
    url: '#'
  },
  {
    id: 'automations',
    title: 'Build automations with n8n',
    summary: 'Create workflows that connect your apps and streamline BeWorking tasks.',
    url: '#'
  }
];

const quickAnswers = [
  'How do I update my card on file?',
  'Where can I see all tenant invoices?',
  'How do automations sync with n8n?',
  'Is there an API for booking rooms?'
];

const HelpSupportDrawer = ({ open, onClose }) => {
  const theme = useTheme();
  const accentColor = theme.palette.brand.orange;
  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', md: 420 } } }}>
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack spacing={0.5}>
            <Typography variant="h6" fontWeight="bold">
              Help & Support
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Chat with us, search documentation, or watch quick walkthroughs.
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
                Live chat
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Our support engineers respond within a few minutes during business hours.
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
                      backgroundColor: '#f97316' 
                    } 
                  }} 
                  startIcon={<ChatBubbleRoundedIcon fontSize="small" />}
                >
                  START CHAT
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
                      borderColor: '#f97316',
                      color: '#f97316',
                      backgroundColor: 'rgba(251, 146, 60, 0.08)',
                      transform: 'translateY(-1px)',
                      boxShadow: '0 4px 12px rgba(251, 146, 60, 0.2)'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  BOOK CALL
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Paper>

        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Quick answers
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
                      Tap to open the relevant article
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
            Documentation
          </Typography>
          <List dense>
            {helpArticles.map((article) => (
              <ListItem key={article.id} disableGutters sx={{ mb: 1.5 }}>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'rgba(251,146,60,0.12)', color: accentColor }}>
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
            Tutorials
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: '#0f172a', width: 44, height: 44 }}>
                    <PlayCircleRoundedIcon sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      Introduction to BeWorking dashboard
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      6 min video · core navigation, tabs, and key features
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: '#0f172a', width: 44, height: 44 }}>
                    <PlayCircleRoundedIcon sx={{ color: 'white' }} />
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight={600}>
                      Automations with n8n
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      9 min video · building flows and syncing executions
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
            Leave us a note
          </Typography>
          <TextField
            multiline
            minRows={3}
            fullWidth
            placeholder="How can we help? Share your question and we’ll reply by email."
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
              color: 'white',
              '&:hover': { 
                backgroundColor: '#f97316' 
              } 
            }}
          >
            SEND MESSAGE
          </Button>
        </Paper>
      </Box>
    </Drawer>
  );
};

export default HelpSupportDrawer;
