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
import { SettingsIcon, HelpIcon, AgentIcon } from './icons/Icons.js';

const drawerWidth = 260;
const accentColor = '#fb923c';
const activeColor = '#16a34a';
const accentHover = 'rgba(251, 146, 60, 0.12)';
const activeHover = 'rgba(22, 163, 74, 0.12)';

const Sidebar = ({ activeTab, setActiveTab, tabs, onOpenSettings, onOpenHelp, onOpenAgent }) => (
  <Drawer
    variant="permanent"
    anchor="left"
    sx={{
      width: drawerWidth,
      flexShrink: 0,
      '& .MuiDrawer-paper': {
        width: drawerWidth,
        boxSizing: 'border-box',
        backgroundColor: '#fff',
        borderRight: '1px solid #e5e7eb'
      }
    }}
  >
    <Box sx={{ height: 120, borderBottom: '1px solid', borderColor: 'divider', px: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
      <img src="/public/assets/logo.png" alt="Logo" style={{ maxHeight: '300px', maxWidth: '200px', objectFit: 'contain' }} />
    </Box>
    <Box sx={{ flex: 1, overflowY: 'auto' }}>
      <List sx={{ px: 2, py: 3 }}>
        {tabs.map((tab) => (
          <ListItem key={tab.id} disablePadding>
            <ListItemButton
              selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              sx={{
                borderRadius: 2,
                mb: 1,
                color: 'text.primary',
                '& .MuiListItemIcon-root': { color: accentColor },
                '&:hover': { backgroundColor: activeHover, color: activeColor },
                '&.Mui-selected': {
                  backgroundColor: activeHover,
                  color: activeColor,
                  boxShadow: 2
                },
                '&.Mui-selected .MuiListItemIcon-root': {
                  color: accentColor
                },
                '&.Mui-selected:hover': {
                  backgroundColor: activeHover,
                  color: activeColor
                }
              }}
            >
              <ListItemIcon>
                <tab.icon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="body2">{tab.label}</Typography>
                    {tab.soon && (
                      <Chip 
                        label="Soon" 
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          borderColor: '#fb923c', 
                          color: '#fb923c', 
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
        <ListItemButton sx={{ borderRadius: 2, mb: 1 }} onClick={onOpenAgent}>
          <ListItemIcon>
            <AgentIcon sx={{ fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText 
            primary={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2">AI Agent</Typography>
                <Chip 
                  label="Soon" 
                  size="small" 
                  variant="outlined"
                  sx={{ 
                    borderColor: '#fb923c', 
                    color: '#fb923c', 
                    fontSize: '0.6rem',
                    height: 16,
                    minWidth: 'auto',
                    '& .MuiChip-label': { px: 0.5, py: 0 }
                  }} 
                />
              </Stack>
            } 
          />
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton sx={{ borderRadius: 2, mb: 1 }} onClick={onOpenSettings}>
          <ListItemIcon>
            <SettingsIcon sx={{ fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton sx={{ borderRadius: 2 }} onClick={onOpenHelp}>
          <ListItemIcon>
            <HelpIcon sx={{ fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText 
            primary={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2">Help & Support</Typography>
                <Chip 
                  label="Soon" 
                  size="small" 
                  variant="outlined"
                  sx={{ 
                    borderColor: '#fb923c', 
                    color: '#fb923c', 
                    fontSize: '0.6rem',
                    height: 16,
                    minWidth: 'auto',
                    '& .MuiChip-label': { px: 0.5, py: 0 }
                  }} 
                />
              </Stack>
            } 
          />
        </ListItemButton>
      </ListItem>
    </List>
  </Drawer>
);

export default Sidebar;
