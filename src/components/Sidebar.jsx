import { useState, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { alpha, useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { SettingsIcon, HelpIcon, AgentIcon } from './icons/Icons.js';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { TAB_GROUPS } from '../constants.js';

const STORAGE_KEY = 'bw_sidebar_collapsed_groups';

function loadCollapsedGroups() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCollapsedGroups(groups) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  } catch { /* ignore */ }
}

export const drawerWidth = 260;
export const collapsedDrawerWidth = 72;

const Sidebar = ({ activeTab, setActiveTab, tabs, onOpenSettings, onOpenAgent, onLogout, mobileOpen, onMobileClose, collapsed, onToggleCollapse }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const accentColor = theme.palette.primary.main;
  const activeColor = theme.palette.primary.dark;
  const accentHover = alpha(theme.palette.primary.main, 0.12);
  const activeHover = accentHover;

  const currentWidth = collapsed ? collapsedDrawerWidth : drawerWidth;

  const [collapsedGroupIds, setCollapsedGroupIds] = useState(loadCollapsedGroups);

  // Auto-expand the group that contains the active tab
  const activeGroup = useMemo(
    () => tabs.find(tab => tab.id === activeTab)?.group,
    [tabs, activeTab]
  );

  const isGroupCollapsed = useCallback(
    (groupId) => groupId && groupId !== activeGroup && collapsedGroupIds.includes(groupId),
    [collapsedGroupIds, activeGroup]
  );

  const toggleGroup = useCallback((groupId) => {
    setCollapsedGroupIds(prev => {
      const next = prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId];
      saveCollapsedGroups(next);
      return next;
    });
  }, []);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (isMobile) onMobileClose?.();
  };

  const drawerContent = (
    <>
      <Box
        sx={{
          height: 64,
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: collapsed ? 0 : 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          backgroundColor: theme.palette.background.paper,
        }}
      >
        {!collapsed && (
          <img
            src="/assets/beworking_logo_clean.svg"
            alt="BeWorking Logo"
            style={{ maxHeight: '36px', maxWidth: '140px', objectFit: 'contain' }}
          />
        )}
        <IconButton
          onClick={onToggleCollapse}
          sx={{
            color: 'text.secondary',
            '&:hover': { backgroundColor: activeHover, color: activeColor },
          }}
        >
          <MenuRoundedIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <List sx={{ px: collapsed ? 1 : 2, py: 2 }}>
          {TAB_GROUPS.map((group) => {
            const groupTabs = tabs.filter(tab => tab.group === group.id);
            if (groupTabs.length === 0) return null;
            return (
              <Box key={group.id ?? '_ungrouped'}>
                {group.id && !collapsed && (
                  <ButtonBase
                    onClick={() => toggleGroup(group.id)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      px: 2,
                      pt: 2,
                      pb: 0.5,
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: alpha(theme.palette.text.secondary, 0.04) },
                    }}
                  >
                    <Typography
                      variant="overline"
                      sx={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: 'text.secondary',
                        lineHeight: 1,
                      }}
                    >
                      {t(group.i18nKey)}
                    </Typography>
                    <ExpandMoreRoundedIcon
                      sx={{
                        fontSize: 16,
                        color: 'text.secondary',
                        transition: theme.transitions.create('transform', { duration: theme.transitions.duration.short }),
                        transform: isGroupCollapsed(group.id) ? 'rotate(-90deg)' : 'rotate(0deg)',
                      }}
                    />
                  </ButtonBase>
                )}
                {group.id && collapsed && <Divider sx={{ my: 1 }} />}
                <Collapse in={!isGroupCollapsed(group.id)} timeout="auto">
                {groupTabs.map((tab) => (
                  <ListItem key={tab.id} disablePadding>
                    <Tooltip title={collapsed ? t('tabs.' + tab.id, { defaultValue: tab.label }) : ''} placement="right" arrow>
                      <ListItemButton
                        selected={activeTab === tab.id}
                        onClick={() => handleTabClick(tab.id)}
                        sx={{
                          borderRadius: 2,
                          mb: 0.5,
                          minHeight: 44,
                          justifyContent: collapsed ? 'center' : 'initial',
                          px: collapsed ? 1.5 : 2,
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
                        <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, justifyContent: 'center' }}>
                          <tab.icon sx={{ fontSize: 20, color: 'inherit' }} />
                        </ListItemIcon>
                        {!collapsed && (
                          <ListItemText
                            primary={
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Typography variant="body1" sx={{ fontSize: '0.95rem', fontWeight: 500 }}>{t('tabs.' + tab.id, { defaultValue: tab.label })}</Typography>
                                {tab.soon && (
                                  <Chip
                                    label={t('sidebar.soon')}
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
                        )}
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                ))}
                </Collapse>
              </Box>
            );
          })}
        </List>
        </Box>
      <Divider />
      <List sx={{ px: collapsed ? 1 : 2, py: 2, flexShrink: 0 }}>
        <ListItem disablePadding>
          <Tooltip title={collapsed ? t('sidebar.settings') : ''} placement="right" arrow>
            <ListItemButton
              sx={{ borderRadius: 2, mb: 0.5, justifyContent: collapsed ? 'center' : 'initial', px: collapsed ? 1.5 : 2 }}
              onClick={onOpenSettings}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, justifyContent: 'center' }}>
                <SettingsIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              {!collapsed && <ListItemText primary={t('sidebar.settings')} />}
            </ListItemButton>
          </Tooltip>
        </ListItem>
        <ListItem disablePadding>
          <Tooltip title={collapsed ? t('sidebar.logout') : ''} placement="right" arrow>
            <ListItemButton
              sx={{
                borderRadius: 2,
                justifyContent: collapsed ? 'center' : 'initial',
                px: collapsed ? 1.5 : 2,
                color: 'primary.main',
                '& .MuiListItemIcon-root': { color: 'primary.main' },
                '&:hover': {
                  backgroundColor: (theme) => theme.palette.brand.greenSoft,
                  color: 'primary.dark',
                  '& .MuiListItemIcon-root': { color: 'primary.dark' }
                }
              }}
              onClick={onLogout}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, justifyContent: 'center' }}>
                <LogoutRoundedIcon sx={{ fontSize: 20 }} />
              </ListItemIcon>
              {!collapsed && <ListItemText primary={t('sidebar.logout')} />}
            </ListItemButton>
          </Tooltip>
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
          width: currentWidth,
          flexShrink: 0,
          transition: theme.transitions.create('width', { duration: theme.transitions.duration.shorter }),
          '& .MuiDrawer-paper': {
            width: currentWidth,
            boxSizing: 'border-box',
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            overflowX: 'hidden',
            transition: theme.transitions.create('width', { duration: theme.transitions.duration.shorter }),
          }
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;
