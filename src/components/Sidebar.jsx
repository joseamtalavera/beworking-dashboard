import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { SettingsIcon, HelpIcon } from './icons/Icons.js';

const drawerWidth = 260;
const accentColor = '#fb923c';
const activeColor = '#16a34a';
const accentHover = 'rgba(251, 146, 60, 0.12)';
const activeHover = 'rgba(22, 163, 74, 0.12)';

const Sidebar = ({ activeTab, setActiveTab, tabs, onOpenSettings, onOpenHelp }) => (
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
    <List sx={{ flex: 1, px: 2, py: 3 }}>
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
                backgroundColor: activeColor,
                color: 'common.white',
                boxShadow: 2
              },
              '&.Mui-selected .MuiListItemIcon-root': {
                color: 'common.white'
              },
              '&.Mui-selected:hover': {
                backgroundColor: activeColor,
                color: 'common.white'
              }
            }}
          >
            <ListItemIcon>
              <tab.icon sx={{ fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText primary={tab.label} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
    <Divider />
    <List sx={{ px: 2, py: 3 }}>
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
          <ListItemText primary="Help & Support" />
        </ListItemButton>
      </ListItem>
    </List>
  </Drawer>
);

export default Sidebar;
