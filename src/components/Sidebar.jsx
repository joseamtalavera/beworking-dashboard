import { useState, useCallback, useMemo, useRef } from 'react';
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
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { alpha, useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { SettingsIcon } from './icons/Icons.js';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { DEPT_TABS } from '../constants.js';
import { ALWAYS_VISIBLE_ADMIN, useActivatedServices } from '../utils/serviceActivations.js';

const STORAGE_KEY = 'bw_sidebar_collapsed_groups';

function loadCollapsedGroups() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    // Default: all groups collapsed on first visit
    const allGroupIds = DEPT_TABS.filter(d => d.subtabs?.length > 0).map(d => d.id);
    return allGroupIds;
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

const Sidebar = ({ activeTab, setActiveTab, tabs, onOpenSettings, onLogout, mobileOpen, onMobileClose, collapsed, onToggleCollapse, isAdmin, viewRole }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const activeColor = theme.palette.primary.dark;
  const activeHover = alpha(theme.palette.primary.main, 0.12);

  const currentWidth = collapsed ? collapsedDrawerWidth : drawerWidth;

  const [collapsedGroupIds, setCollapsedGroupIds] = useState(loadCollapsedGroups);
  const [popoverDept, setPopoverDept] = useState(null);
  const [popoverAnchor, setPopoverAnchor] = useState(null);
  const activatedServices = useActivatedServices();

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
    const filtered = dept.subtabs.filter(s => (!s.adminOnly || isAdmin) && (!s.userOnly || !isAdmin));
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

  // For users: only show Platform-related tabs (hide CRM, Accounts, HR, Projects, etc.)
  const USER_VISIBLE_TABS = new Set(['Platform', 'DomicilioFiscal']);
  // For accountants: only show the Accounts dept (Invoices + future Expenses/Banks/Crypto)
  const ACCOUNTANT_VISIBLE_TABS = new Set(['AccountsAI']);
  // Hidden from admin sidebar (still routable if invoked directly)
  const ADMIN_HIDDEN_TABS = new Set();
  const isAccountant = (viewRole || '').toUpperCase() === 'ACCOUNTANT';
  const isAdminTabVisible = (d) => {
    if (ADMIN_HIDDEN_TABS.has(d.id)) return false;
    if (ALWAYS_VISIBLE_ADMIN.has(d.id)) return true;
    return activatedServices.has(d.id);
  };
  const allTabs = isAccountant
    ? DEPT_TABS.filter(d => ACCOUNTANT_VISIBLE_TABS.has(d.id))
    : isAdmin
      ? DEPT_TABS.filter(isAdminTabVisible)
      : DEPT_TABS.filter(d => USER_VISIBLE_TABS.has(d.id));

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
          <span
            role="button"
            tabIndex={0}
            onClick={() => handleTabClick('Overview')}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTabClick('Overview'); }}
            style={{ fontFamily: '"Poppins", sans-serif', fontWeight: 600, fontSize: '1.8rem', color: '#007a1d', letterSpacing: '-0.01em', lineHeight: 1, cursor: 'pointer' }}
          >
            beworking<span style={{ display: 'inline-block', width: '0.26em', height: '0.26em', borderRadius: '50%', backgroundColor: '#d4a843', marginLeft: '0.08em', verticalAlign: 'baseline', position: 'relative', top: '0.05em' }} />
          </span>
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
            // In user view, only Platform can expand
            const canExpand = isAdmin || dept.id === 'Platform';
            const expanded = hasSubtabs && canExpand && !isItemCollapsed(dept.id);

            return (
              <Box key={dept.id}>
                <Divider sx={{ mx: collapsed ? 0 : 2 }} />
                {collapsed ? (
                  <Tooltip title={!hasSubtabs || !canExpand ? t(`departments.${dept.id}.name`, { defaultValue: dept.label }) : ''} placement="right" arrow>
                    <ButtonBase
                      onClick={(e) => {
                        if (hasSubtabs && canExpand) {
                          setPopoverAnchor(e.currentTarget);
                          setPopoverDept(dept);
                        } else {
                          handleTabClick(dept.id);
                        }
                      }}
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        width: '100%',
                        py: 1.5,
                        ...(active && { backgroundColor: alpha(theme.palette.primary.main, 0.06) }),
                        '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.04) },
                      }}
                    >
                      <dept.icon sx={{ fontSize: 20, color: active ? activeColor : 'text.secondary' }} />
                    </ButtonBase>
                  </Tooltip>
                ) : (
                  <ButtonBase
                    onClick={() => {
                      if (hasSubtabs && canExpand) {
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
                      '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.04) },
                      ...(activeTab === dept.id && { backgroundColor: alpha(theme.palette.primary.main, 0.06) }),
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <dept.icon sx={{ fontSize: 20, color: active ? activeColor : 'text.secondary' }} />
                      <Typography sx={{
                        fontSize: '0.9rem',
                        fontWeight: active ? 700 : 600,
                        color: active ? activeColor : 'text.primary',
                      }}>
                        {t(`departments.${dept.id}.name`, { defaultValue: dept.label })}
                      </Typography>
                    </Stack>
                    {hasSubtabs && canExpand && (
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
                {hasSubtabs && canExpand && !collapsed && (
                  <Collapse in={expanded} timeout="auto">
                    <Box sx={{ pl: 3, pr: 2, pb: 1, ml: 2, mr: 1, mb: 0.5, borderRadius: 2, backgroundColor: alpha('#000', 0.03) }}>
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
                            ...(activeTab === sub.id && { backgroundColor: alpha(theme.palette.primary.main, 0.1) }),
                          }}
                        >
                          <sub.icon sx={{ fontSize: 18, color: activeTab === sub.id ? activeColor : 'rgba(0,0,0,0.45)', mr: 1.5 }} />
                          <Typography sx={{
                            fontSize: '0.85rem',
                            fontWeight: activeTab === sub.id ? 600 : 500,
                            color: activeTab === sub.id ? activeColor : 'rgba(0,0,0,0.55)',
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
                                borderColor: alpha(theme.palette.primary.main, 0.4),
                                color: theme.palette.primary.main,
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
      <Box sx={{ px: collapsed ? 1 : 0, py: 1, flexShrink: 0 }}>
        <Tooltip title={collapsed ? t('sidebar.settings') : ''} placement="right" arrow>
          <ButtonBase
            onClick={onOpenSettings}
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%',
              px: 3, py: 1.5,
              '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.04) },
            }}
          >
            <SettingsIcon sx={{ fontSize: 20, color: 'text.secondary', mr: collapsed ? 0 : 1.5 }} />
            {!collapsed && (
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'text.primary' }}>
                {t('sidebar.settings')}
              </Typography>
            )}
          </ButtonBase>
        </Tooltip>
        <Tooltip title={collapsed ? t('sidebar.logout') : ''} placement="right" arrow>
          <ButtonBase
            onClick={onLogout}
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-start', width: '100%',
              px: 3, py: 1.5,
              '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.04) },
            }}
          >
            <LogoutRoundedIcon sx={{ fontSize: 20, color: 'primary.main', mr: collapsed ? 0 : 1.5 }} />
            {!collapsed && (
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'primary.main' }}>
                {t('sidebar.logout')}
              </Typography>
            )}
          </ButtonBase>
        </Tooltip>
      </Box>
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

      {/* Subtab popover for collapsed sidebar */}
      <Popover
        open={!!popoverAnchor}
        anchorEl={popoverAnchor}
        onClose={() => { setPopoverAnchor(null); setPopoverDept(null); }}
        anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
        transformOrigin={{ vertical: 'center', horizontal: 'left' }}
        slotProps={{ paper: { sx: { borderRadius: 2, py: 0.5, px: 0.5, ml: 0.5 } } }}
      >
        {popoverDept && (
          <Stack spacing={0.25}>
            {getVisibleSubtabs(popoverDept).map((sub) => (
              <Tooltip key={sub.id} title={t(`tabs.${sub.id}`, { defaultValue: sub.label })} placement="right" arrow>
                <ButtonBase
                  onClick={() => {
                    handleTabClick(sub.id);
                    setPopoverAnchor(null);
                    setPopoverDept(null);
                  }}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: 1.5,
                    ...(activeTab === sub.id && { backgroundColor: alpha(theme.palette.primary.main, 0.1) }),
                    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.06) },
                  }}
                >
                  <sub.icon sx={{ fontSize: 18, color: activeTab === sub.id ? activeColor : 'text.secondary' }} />
                </ButtonBase>
              </Tooltip>
            ))}
          </Stack>
        )}
      </Popover>
    </>
  );
};

export default Sidebar;
