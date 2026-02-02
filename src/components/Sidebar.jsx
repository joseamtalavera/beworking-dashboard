import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { alpha, useTheme } from '@mui/material/styles';
import { SettingsIcon, HelpIcon, AgentIcon } from './icons/Icons.js';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';

export const drawerWidth = 260;

const Sidebar = ({ activeTab, setActiveTab, tabs, onOpenSettings, onOpenAgent, onLogout, mobileOpen, onMobileClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const accentColor = theme.palette.primary.main;
  const activeColor = theme.palette.primary.dark;
  const accentHover = alpha(theme.palette.primary.main, 0.12);
  const activeHover = accentHover;

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (isMobile) onMobileClose?.();
  };

  const drawerContent = (
    <>
      <Box sx={{ height: 120, borderBottom: '1px solid', borderColor: 'divider', px: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.palette.background.paper }}>
        <img src="/assets/beworking_logo_clean.svg" alt="BeWorking Logo" style={{ maxHeight: '60px', maxWidth: '180px', objectFit: 'contain' }} />
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <List sx={{ px: 2, py: 3 }}>
          {tabs.map((tab) => (
            <ListItem key={tab.id} disablePadding>
              <ListItemButton
                selected={activeTab === tab.id}
                onClick={() => handleTabClick(tab.id)}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  color: 'text.primary',
                  '& .MuiListItemIcon-root': { color: accentColor },
                  '&:hover': { backgroundColor: activeHover, color: activeColor },
                  '&.Mui-selected': {
                    backgroundColor: activeHover,
                    color: activeColor,
                    border: 'none',
                    boxShadow: theme.shadows[1]
                  },
                  '&.Mui-selected .MuiListItemIcon-root': {
                    color: activeColor
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: activeHover,
                    color: activeColor
                  }
                }}
              >
                <ListItemIcon>
                  <tab.icon sx={{ fontSize: 20, color: 'inherit' }} />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body1" sx={{ fontSize: '0.95rem', fontWeight: 500 }}>{tab.label}</Typography>
                      {tab.soon && (
                        <Chip
                          label="Soon"
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: theme.palette.secondary.light,
                            color: theme.palette.secondary.light,
                            fontSize: '0.6rem',
                            height: 16,
                            minWidth: 'auto',
                            '& .MuiChip-label': { px: 0.5, py: 0 }
                          }}
                        />
                      )}
                    </Stack>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        </Box>
      <Divider />
      <List sx={{ px: 2, py: 3, flexShrink: 0 }}>
        <ListItem disablePadding>
          <ListItemButton sx={{ borderRadius: 2, mb: 1 }} onClick={onOpenSettings}>
            <ListItemIcon>
              <SettingsIcon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            sx={{
              borderRadius: 2,
              color: 'secondary.main',
              '& .MuiListItemIcon-root': { color: 'secondary.main' },
              '&:hover': {
                backgroundColor: (theme) => theme.palette.brand.orangeSoft,
                color: 'secondary.dark',
                '& .MuiListItemIcon-root': { color: 'secondary.dark' }
              }
            }}
            onClick={onLogout}
          >
            <ListItemIcon>
              <LogoutRoundedIcon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  );

  return (
    <>
      {/* Mobile: temporary drawer with overlay */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`
          }
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop: permanent drawer */}
      <Drawer
        variant="permanent"
        anchor="left"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`
          }
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;
