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
import { TAB_GROUPS, DEPT_TABS } from '../constants.js';

const STORAGE_KEY = 'bw_sidebar_collapsed_groups';

function loadCollapsedGroups() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : ['_departments'];
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

  // Auto-expand the section/group that contains the active tab
  const activeGroup = useMemo(
    () => tabs.find(tab => tab.id === activeTab)?.group,
    [tabs, activeTab]
  );

  const activeSection = useMemo(() => {
    if (DEPT_TABS.some(d => !d.hero && (d.id === activeTab || d.subtabs?.some(s => s.id === activeTab)))) return '_departments';
    if (tabs.some(tab => tab.id === activeTab)) return '_platform';
    return null;
  }, [tabs, activeTab]);

  const isGroupCollapsed = useCallback(
    (groupId) => {
      if (!groupId) return false;
      if (!collapsedGroupIds.includes(groupId)) return false;
      // Auto-expand section containing active tab
      if ((groupId === '_departments' || groupId === '_platform') && groupId === activeSection) return false;
      // Auto-expand sub-group containing active tab
      if (groupId === activeGroup) return false;
      return true;
    },
    [collapsedGroupIds, activeGroup, activeSection]
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
        {/* MariaAI hero — always visible */}
        <List sx={{ px: collapsed ? 1 : 2, pt: 2, pb: 0 }}>
          {DEPT_TABS.filter(d => d.hero).map((dept) => (
            <ListItem key={dept.id} disablePadding>
              <Tooltip title={collapsed ? t(`departments.${dept.id}.name`, { defaultValue: dept.label }) : ''} placement="right" arrow>
                <ListItemButton
                  selected={activeTab === dept.id}
                  onClick={() => handleTabClick(dept.id)}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    minHeight: 44,
                    justifyContent: collapsed ? 'center' : 'initial',
                    px: collapsed ? 1.5 : 2,
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                    color: 'primary.main',
                    '& .MuiListItemIcon-root': { color: 'primary.main' },
                    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.16), color: activeColor },
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.16),
                      color: activeColor,
                      border: 'none',
                      boxShadow: theme.shadows[1],
                    },
                    '&.Mui-selected .MuiListItemIcon-root': { color: activeColor },
                    '&.Mui-selected:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.16), color: activeColor },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, justifyContent: 'center' }}>
                    <dept.icon sx={{ fontSize: 20, color: 'inherit' }} />
                  </ListItemIcon>
                  {!collapsed && (
                    <ListItemText
                      primary={
                        <Typography variant="body1" sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
                          {t(`departments.${dept.id}.name`, { defaultValue: dept.label })}
                        </Typography>
                      }
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            </ListItem>
          ))}
        </List>

        {/* Platform section — collapsible */}
        <List sx={{ px: collapsed ? 1 : 2, pt: 1, pb: 0 }}>
          {!collapsed ? (
            <ButtonBase
              onClick={() => toggleGroup('_platform')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                px: 2,
                py: 0.5,
                borderRadius: 1,
                '&:hover': { backgroundColor: alpha(theme.palette.text.secondary, 0.04) },
              }}
            >
              <Typography
                variant="overline"
                sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', color: 'text.secondary', lineHeight: 1 }}
              >
                {t('sidebar.sections.platform')}
              </Typography>
              <ExpandMoreRoundedIcon
                sx={{
                  fontSize: 16,
                  color: 'text.secondary',
                  transition: theme.transitions.create('transform', { duration: theme.transitions.duration.short }),
                  transform: isGroupCollapsed('_platform') ? 'rotate(-90deg)' : 'rotate(0deg)',
                }}
              />
            </ButtonBase>
          ) : (
            <Divider sx={{ my: 0.5 }} />
          )}
        </List>
        <Collapse in={!isGroupCollapsed('_platform')} timeout="auto">
        <List sx={{ px: collapsed ? 1 : 2, py: 0 }}>
          {TAB_GROUPS.map((group) => {
            const groupTabs = tabs.filter(tab => tab.group === group.id);
            if (groupTabs.length === 0) return null;
            return (
              <Box key={group.id ?? '_ungrouped'}>
                {group.id && !collapsed && (
                  <ButtonBase
                    onClick={() => {
                      const wasCollapsed = isGroupCollapsed(group.id);
                      toggleGroup(group.id);
                      if (wasCollapsed && groupTabs.length > 0) {
                        handleTabClick(groupTabs[0].id);
                      }
                    }}
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
        </Collapse>

        {/* Departments section — collapsible */}
        <List sx={{ px: collapsed ? 1 : 2, pt: 0.5, pb: 0 }}>
          {!collapsed ? (
            <ButtonBase
              onClick={() => toggleGroup('_departments')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                px: 2,
                py: 0.5,
                borderRadius: 1,
                '&:hover': { backgroundColor: alpha(theme.palette.text.secondary, 0.04) },
              }}
            >
              <Typography
                variant="overline"
                sx={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', color: 'text.secondary', lineHeight: 1 }}
              >
                {t('sidebar.sections.departments')}
              </Typography>
              <ExpandMoreRoundedIcon
                sx={{
                  fontSize: 16,
                  color: 'text.secondary',
                  transition: theme.transitions.create('transform', { duration: theme.transitions.duration.short }),
                  transform: isGroupCollapsed('_departments') ? 'rotate(-90deg)' : 'rotate(0deg)',
                }}
              />
            </ButtonBase>
          ) : (
            <Divider sx={{ my: 0.5 }} />
          )}
          <Collapse in={!isGroupCollapsed('_departments')} timeout="auto">
            {DEPT_TABS.filter(d => !d.hero).map((dept) => {
              const hasSubtabs = dept.subtabs && dept.subtabs.length > 0;
              const isExpanded = hasSubtabs && (activeTab === dept.id || dept.subtabs.some(s => s.id === activeTab));
              return (
                <Box key={dept.id}>
                  <ListItem disablePadding>
                    <Tooltip title={collapsed ? t(`departments.${dept.id}.name`, { defaultValue: dept.label }) : ''} placement="right" arrow>
                      <ListItemButton
                        selected={activeTab === dept.id}
                        onClick={() => handleTabClick(dept.id)}
                        sx={{
                          borderRadius: 2,
                          mb: hasSubtabs && isExpanded ? 0 : 0.5,
                          minHeight: 44,
                          justifyContent: collapsed ? 'center' : 'initial',
                          px: collapsed ? 1.5 : 2,
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                          color: 'text.primary',
                          '& .MuiListItemIcon-root': { color: accentColor },
                          '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.10), color: activeColor },
                          '&.Mui-selected': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.12),
                            color: activeColor,
                            border: 'none',
                            boxShadow: theme.shadows[1],
                          },
                          '&.Mui-selected .MuiListItemIcon-root': { color: activeColor },
                          '&.Mui-selected:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.12), color: activeColor },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, justifyContent: 'center' }}>
                          <dept.icon sx={{ fontSize: 20, color: 'inherit' }} />
                        </ListItemIcon>
                        {!collapsed && (
                          <>
                            <ListItemText
                              primary={
                                <Typography variant="body1" sx={{ fontSize: '0.95rem', fontWeight: 500 }}>
                                  {t(`departments.${dept.id}.name`, { defaultValue: dept.label })}
                                </Typography>
                              }
                            />
                            {hasSubtabs && (
                              <ExpandMoreRoundedIcon
                                sx={{
                                  fontSize: 16,
                                  color: 'text.secondary',
                                  transition: theme.transitions.create('transform', { duration: theme.transitions.duration.short }),
                                  transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                                }}
                              />
                            )}
                          </>
                        )}
                      </ListItemButton>
                    </Tooltip>
                  </ListItem>
                  {hasSubtabs && !collapsed && (
                    <Collapse in={isExpanded} timeout="auto">
                      {dept.subtabs.map((sub) => (
                        <ListItem key={sub.id} disablePadding>
                          <ListItemButton
                            selected={activeTab === sub.id}
                            onClick={() => handleTabClick(sub.id)}
                            sx={{
                              borderRadius: 2,
                              mb: 0.5,
                              minHeight: 36,
                              pl: 6,
                              pr: 2,
                              color: 'text.secondary',
                              '& .MuiListItemIcon-root': { color: 'text.secondary' },
                              '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.06), color: activeColor },
                              '&.Mui-selected': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.10),
                                color: activeColor,
                                '& .MuiListItemIcon-root': { color: activeColor },
                              },
                              '&.Mui-selected:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.10), color: activeColor },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 32, justifyContent: 'center' }}>
                              <sub.icon sx={{ fontSize: 18, color: 'inherit' }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="body2" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                  {t(`tabs.${sub.id}`, { defaultValue: sub.label })}
                                </Typography>
                              }
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </Collapse>
                  )}
                </Box>
              );
            })}
          </Collapse>
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
