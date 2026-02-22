import { useMemo, useState, useEffect, useCallback } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../api/client.js';
import { useColorMode } from '../main.jsx';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import ReceiptRoundedIcon from '@mui/icons-material/ReceiptRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

// Add CSS animation for loading spinner
const spinAnimation = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Header = ({ activeTab, userProfile, onOpenHelp, onOpenSettings, setActiveTab, onMenuToggle, isAdmin = true }) => {
  const theme = useTheme();
  const { t, i18n } = useTranslation();
  const { mode, toggleColorMode } = useColorMode();
  const accentColor = theme.palette.brand.green;
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const open = Boolean(anchorEl);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'es' ? 'en' : 'es';
    i18n.changeLanguage(newLang);
    localStorage.setItem('beworking_lang', newLang);
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('greeting.morning');
    if (hour < 18) return t('greeting.afternoon');
    return t('greeting.evening');
  }, [t]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Search functionality
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    console.log('Searching for:', query);
    console.log('Current token:', localStorage.getItem('beworking_token'));
    setIsSearching(true);
    try {
      // Search multiple endpoints in parallel
      const [contactsData, centrosData, productosData] = await Promise.allSettled([
        // Search contacts/tenants - use same endpoint as main contacts list
        apiFetch(`/contact-profiles?search=${encodeURIComponent(query)}&size=10000&sort=lastActive,desc`),
        // Search centros (rooms/locations)
        apiFetch(`/bookings/lookups/centros`),
        // Search productos (automations/services)
        apiFetch(`/bookings/lookups/productos`)
      ]);

      console.log('Search results:', { contactsData, centrosData, productosData });

      const results = [];

      // Process contacts/tenants
      if (contactsData.status === 'fulfilled' && contactsData.value?.items) {
        console.log('Processing contacts:', contactsData.value.items);
        contactsData.value.items.forEach(contact => {
          const result = {
            type: 'tenant',
            name: contact.name || contact.contactName || 'Unknown',
            id: contact.id,
            email: contact.emailPrimary,
            avatar: contact.avatar
          };
          console.log('Adding contact result:', result);
          console.log('Full contact object from search:', contact);
          results.push(result);
        });
      } else {
        console.log('Contacts search failed or no items:', contactsData);
      }

      // Process centros (rooms)
      if (centrosData.status === 'fulfilled' && centrosData.value) {
        centrosData.value
          .filter(centro => centro.name.toLowerCase().includes(query.toLowerCase()))
          .forEach(centro => {
            results.push({
              type: 'room',
              name: centro.name,
              id: centro.id,
              code: centro.code
            });
          });
      }

      // Process productos (automations/services)
      if (productosData.status === 'fulfilled' && productosData.value) {
        productosData.value
          .filter(producto => producto.name.toLowerCase().includes(query.toLowerCase()))
          .forEach(producto => {
            results.push({
              type: 'automation',
              name: producto.name,
              id: producto.id,
              productType: producto.type,
              centerCode: producto.centerCode
            });
          });
      }

      console.log('Final search results:', results);
      setSearchResults(results.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const handleSearchSubmit = (event) => {
    if (event.key === 'Enter') {
      performSearch(searchQuery);
    }
  };

  const actionOptions = [
    { label: t('header.addBloqueo'), icon: <EventNoteRoundedIcon />, action: () => console.log('Add bloqueo') },
    { label: t('header.createInvoice'), icon: <ReceiptRoundedIcon />, action: () => console.log('Create invoice') },
    { label: t('header.addContact'), icon: <PersonAddRoundedIcon />, action: () => console.log('Add contact') },
    { label: t('header.settings'), icon: <SettingsRoundedIcon />, action: () => console.log('Settings') }
  ];

  return (
    <Box component="header" sx={{ position: 'sticky', top: 0, zIndex: 1100, bgcolor: 'background.paper', borderBottom: '1px solid', borderBottomColor: 'divider', px: { xs: 2, sm: 3, lg: 4 }, py: { xs: 2, sm: 3 } }}>
      <style>{spinAnimation}</style>
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
          <Stack spacing={0.75}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              {/* Hamburger menu — mobile only */}
              <IconButton
                onClick={onMenuToggle}
                sx={{ display: { xs: 'inline-flex', md: 'none' }, color: 'text.primary', ml: -1 }}
                aria-label={t('header.openNav')}
              >
                <MenuRoundedIcon />
              </IconButton>
              <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' } }}>
                {t('tabs.' + activeTab, { defaultValue: activeTab })}
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {greeting}, {userProfile?.name || 'User'}. {t('header.subtitle')}
            </Typography>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ width: { xs: '100%', md: 'auto' } }}>
            {isAdmin && <Box sx={{ position: 'relative', width: { xs: '100%', sm: 220, md: 280, lg: 320 }, order: { xs: 1, sm: 0 } }}>
            <TextField
              placeholder={t('header.search')}
              size="small"
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyPress={handleSearchSubmit}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end" sx={{ gap: 0.5 }}>
                    {isSearching && (
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          border: '2px solid',
                          borderColor: 'divider',
                          borderTopColor: (theme) => theme.palette.brand.green,
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}
                      />
                    )}
                    {searchQuery && (
                      <IconButton
                        size="small"
                        edge="end"
                        aria-label={t('header.clearSearch')}
                        onClick={handleClearSearch}
                        sx={{
                          color: 'text.disabled',
                          '&:hover': { color: 'primary.main', backgroundColor: 'action.hover' }
                        }}
                      >
                        <CloseRoundedIcon fontSize="small" />
                      </IconButton>
                    )}
                  </InputAdornment>
                ),
                sx: {
                  backgroundColor: 'background.default',
                  '& fieldset': { borderColor: 'divider' },
                 '&:hover fieldset': { borderColor: accentColor },
                 '&:focus-within fieldset': { borderColor: accentColor },
                 '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
                 '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: accentColor },
                 '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: accentColor }
               }
                }}
                sx={{ width: '100%' }}
              />

              {/* Search Results Dropdown */}
              {searchQuery && searchResults.length > 0 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    mt: 1,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: (theme) => theme.shadows[4],
                    border: '1px solid',
                    borderColor: 'divider',
                    maxHeight: 300,
                    overflow: 'auto'
                  }}
                >
                  {searchResults.map((result, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        borderBottom: index < searchResults.length - 1 ? '1px solid' : 'none',
                        borderBottomColor: 'divider',
                        '&:hover': {
                          bgcolor: 'background.default'
                        }
                      }}
                      onClick={() => {
                        console.log('Selected:', result);

                        // Navigate to the appropriate section based on result type
                        if (result.type === 'tenant') {
                          console.log('Navigate to specific contact:', result.name, 'ID:', result.id, 'Type:', typeof result.id);
                          setActiveTab('Contacts');
                          // Store contact ID for Contacts component to pick up
                          localStorage.setItem('selectedContactId', result.id.toString());
                          console.log('Stored selectedContactId:', result.id.toString());
                        } else if (result.type === 'room') {
                          console.log('Navigate to Booking tab for:', result.name);
                          setActiveTab('Booking');
                        } else if (result.type === 'automation') {
                          console.log('Navigate to Automation tab for:', result.name);
                          setActiveTab('Automation');
                        }

                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        {result.avatar ? (
                          <Avatar
                            src={result.avatar}
                            sx={{ width: 24, height: 24 }}
                          >
                            {result.name.charAt(0)}
                          </Avatar>
                        ) : (
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor:
                                result.type === 'tenant'
                                  ? theme.palette.success.main
                                  : result.type === 'room'
                                  ? theme.palette.info.main
                                  : result.type === 'automation'
                                  ? theme.palette.secondary.main
                                  : theme.palette.warning.main
                            }}
                          />
                        )}
                        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>
                            {result.name}
                          </Typography>
                          {result.email && (
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {result.email}
                            </Typography>
                          )}
                          {result.code && (
                            <Typography variant="caption" color="text.secondary">
                              {t('search.code')}: {result.code}
                            </Typography>
                          )}
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', flexShrink: 0 }}>
                          {t('search.' + result.type, { defaultValue: result.type })}
                        </Typography>
                      </Stack>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>}

            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
              {isAdmin && <Button
                variant="outlined"
                size="small"
                startIcon={<AddRoundedIcon />}
                onClick={handleClick}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  px: { xs: 1.5, sm: 3 },
                  py: 1,
                  height: 36,
                  borderColor: accentColor,
                  color: accentColor,
                  '&:hover': {
                    borderColor: accentColor,
                    color: accentColor,
                    backgroundColor: theme.palette.brand.accentSoft,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 12px ${alpha(accentColor, 0.2)}`
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {t('header.action')}
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 180,
                    borderRadius: 2,
                    boxShadow: (theme) => theme.shadows[4]
                  }
                }}
              >
                {actionOptions.map((option, index) => (
                  <MenuItem
                    key={index}
                    onClick={() => {
                      option.action();
                      handleClose();
                    }}
                    sx={{
                      py: 1.5,
                      px: 2,
                      '&:hover': {
                        backgroundColor: (theme) => theme.palette.brand.greenSoft
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: 'primary.main', minWidth: 36 }}>
                      {option.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={option.label}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: 500
                      }}
                    />
                  </MenuItem>
                ))}
              </Menu>}
              {/* Full button on sm+, icon-only on xs */}
              <Button
                variant="contained"
                size="small"
                startIcon={<HelpOutlineIcon />}
                onClick={onOpenHelp}
                sx={{
                  bgcolor: 'primary.main',
                  color: 'common.white',
                  height: 36,
                  display: { xs: 'none', sm: 'inline-flex' },
                  '&:hover': { bgcolor: theme.palette.brand.green }
                }}
              >
                {t('header.help')}
              </Button>
              <IconButton
                onClick={onOpenHelp}
                sx={{
                  display: { xs: 'inline-flex', sm: 'none' },
                  color: 'primary.main'
                }}
                aria-label={t('header.helpSupport')}
              >
                <HelpOutlineIcon />
              </IconButton>
              <IconButton
                onClick={toggleColorMode}
                size="small"
                sx={{
                  color: accentColor,
                  width: 36,
                  height: 36,
                  '&:hover': {
                    backgroundColor: theme.palette.brand.accentSoft,
                  },
                }}
                aria-label="Toggle dark mode"
              >
                {mode === 'dark' ? <LightModeRoundedIcon /> : <DarkModeRoundedIcon />}
              </IconButton>
              <Button
                variant="outlined"
                size="small"
                onClick={toggleLanguage}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  minWidth: 40,
                  px: 1.5,
                  height: 36,
                  borderColor: accentColor,
                  color: accentColor,
                  '&:hover': {
                    borderColor: accentColor,
                    color: accentColor,
                    backgroundColor: theme.palette.brand.accentSoft,
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 12px ${alpha(accentColor, 0.2)}`
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {i18n.language === 'es' ? 'EN' : 'ES'}
              </Button>
              <Avatar
                src={userProfile?.avatar || userProfile?.photo}
                alt={userProfile?.name || userProfile?.email || 'User'}
                onClick={onOpenSettings}
                sx={{
                  width: { xs: 36, sm: 44 },
                  height: { xs: 36, sm: 44 },
                  border: '3px solid',
                  borderColor: (theme) => alpha(theme.palette.warning.light, 0.6),
                  bgcolor: accentColor,
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {userProfile?.name ? userProfile.name.split(' ').map(n => n[0]).join('') : 'U'}
              </Avatar>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
};

export default Header;
