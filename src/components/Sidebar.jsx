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
import { DEPT_TABS } from '../constants.js';

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

const Sidebar = ({ activeTab, setActiveTab, tabs, onOpenSettings, onOpenAgent, onLogout, mobileOpen, onMobileClose, collapsed, onToggleCollapse, isAdmin }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const activeColor = theme.palette.primary.dark;
  const activeHover = alpha(theme.palette.primary.main, 0.12);

  const currentWidth = collapsed ? collapsedDrawerWidth : drawerWidth;

  const [collapsedGroupIds, setCollapsedGroupIds] = useState(loadCollapsedGroups);

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

  // Filter subtabs based on admin status
  const getVisibleSubtabs = useCallback((dept) => {
    if (!dept.subtabs) return null;
    const filtered = dept.subtabs.filter(s => !s.adminOnly || isAdmin);
    return filtered.length > 0 ? filtered : null;
  }, [isAdmin]);

  // Check if a dept item or any of its subtabs is active
  const isDeptActive = useCallback((dept) => {
    if (activeTab === dept.id) return true;
    return dept.subtabs?.some(s => s.id === activeTab) || false;
  }, [activeTab]);

  const isItemCollapsed = useCallback((deptId) => {
    return collapsedGroupIds.includes(deptId);
  }, [collapsedGroupIds]);

  const allTabs = DEPT_TABS;

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
        {/* Accordion items */}
        <Box sx={{ px: collapsed ? 1 : 0, pt: 1 }}>
          {allTabs.map((dept) => {
            const visibleSubtabs = getVisibleSubtabs(dept);
            const hasSubtabs = visibleSubtabs && visibleSubtabs.length > 0;
            const active = isDeptActive(dept);
            const expanded = hasSubtabs && active && !isItemCollapsed(dept.id);

            const isHero = dept.hero;
            return (
              <Box key={dept.id}>
                {!isHero && <Divider sx={{ mx: collapsed ? 0 : 2 }} />}
                {collapsed ? (
                  <Tooltip title={t(`departments.${dept.id}.name`, { defaultValue: dept.label })} placement="right" arrow>
                    <ButtonBase
                      onClick={() => handleTabClick(dept.id)}
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        width: '100%',
                        py: 1.5,
                        ...(isHero && {
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                          mb: 0.5,
                          borderRadius: 2,
                        }),
                        ...(active && { backgroundColor: alpha(theme.palette.primary.main, isHero ? 0.16 : 0.06) }),
                        '&:hover': { backgroundColor: alpha(theme.palette.primary.main, isHero ? 0.16 : 0.04) },
                      }}
                    >
                      <dept.icon sx={{ fontSize: 20, color: isHero ? theme.palette.primary.main : (active ? activeColor : 'text.secondary') }} />
                    </ButtonBase>
                  </Tooltip>
                ) : (
                  <ButtonBase
                    onClick={() => {
                      if (hasSubtabs && active) {
                        toggleGroup(dept.id);
                      } else {
                        handleTabClick(dept.id);
                      }
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      px: 3,
                      py: 1.5,
                      ...(isHero && {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        mx: 2,
                        width: 'calc(100% - 32px)',
                        borderRadius: 2,
                        mb: 0.5,
                      }),
                      '&:hover': { backgroundColor: alpha(theme.palette.primary.main, isHero ? 0.16 : 0.04) },
                      ...(activeTab === dept.id && !isHero && { backgroundColor: alpha(theme.palette.primary.main, 0.06) }),
                      ...(activeTab === dept.id && isHero && { backgroundColor: alpha(theme.palette.primary.main, 0.16) }),
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <dept.icon sx={{ fontSize: 20, color: isHero ? theme.palette.primary.main : (active ? activeColor : 'text.secondary') }} />
                      <Typography sx={{
                        fontSize: '0.9rem',
                        fontWeight: isHero ? 700 : (active ? 700 : 600),
                        color: isHero ? theme.palette.primary.main : (active ? activeColor : 'text.primary'),
                      }}>
                        {t(`departments.${dept.id}.name`, { defaultValue: dept.label })}
                      </Typography>
                    </Stack>
                    {hasSubtabs && (
                      <ExpandMoreRoundedIcon
                        sx={{
                          fontSize: 18,
                          color: 'text.secondary',
                          transition: theme.transitions.create('transform', { duration: theme.transitions.duration.short }),
                          transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                        }}
                      />
                    )}
                  </ButtonBase>
                )}
                {hasSubtabs && !collapsed && (
                  <Collapse in={expanded} timeout="auto">
                    <Box sx={{ pl: 3, pr: 2, pb: 1 }}>
                      {visibleSubtabs.map((sub) => (
                        <ButtonBase
                          key={sub.id}
                          onClick={() => handleTabClick(sub.id)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            px: 2,
                            py: 1,
                            borderRadius: 1.5,
                            '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.06) },
                            ...(activeTab === sub.id && { backgroundColor: alpha(theme.palette.primary.main, 0.08) }),
                          }}
                        >
                          <sub.icon sx={{ fontSize: 18, color: activeTab === sub.id ? activeColor : 'text.secondary', mr: 1.5 }} />
                          <Typography sx={{
                            fontSize: '0.85rem',
                            fontWeight: activeTab === sub.id ? 600 : 400,
                            color: activeTab === sub.id ? activeColor : 'text.secondary',
                            flex: 1,
                            textAlign: 'left',
                          }}>
                            {t(`tabs.${sub.id}`, { defaultValue: sub.label })}
                          </Typography>
                          {sub.soon && (
                            <Chip
                              label={t('sidebar.soon')}
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: theme.palette.secondary.light,
                                color: theme.palette.secondary.light,
                                fontSize: '0.55rem',
                                height: 14,
                                minWidth: 'auto',
                                '& .MuiChip-label': { px: 0.5, py: 0 }
                              }}
                            />
                          )}
                        </ButtonBase>
                      ))}
                    </Box>
                  </Collapse>
                )}
              </Box>
            );
          })}
          <Divider sx={{ mx: collapsed ? 0 : 2 }} />
        </Box>
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
