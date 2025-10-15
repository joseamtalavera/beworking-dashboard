import { useMemo, useState } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded';
import ReceiptRoundedIcon from '@mui/icons-material/ReceiptRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

const accentColor = '#fb923c';

const Header = ({ activeTab, userProfile, onOpenHelp }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const actionOptions = [
    { label: 'Add bloqueo', icon: <EventNoteRoundedIcon />, action: () => console.log('Add bloqueo') },
    { label: 'Create invoice', icon: <ReceiptRoundedIcon />, action: () => console.log('Create invoice') },
    { label: 'Add contact', icon: <PersonAddRoundedIcon />, action: () => console.log('Add contact') },
    { label: 'Settings', icon: <SettingsRoundedIcon />, action: () => console.log('Settings') }
  ];

  return (
    <Box component="header" sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e2e8f0', px: { xs: 3, lg: 4 }, py: 3 }}>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between">
          <Stack spacing={0.75}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="h4" fontWeight={700} color="text.primary">
                {activeTab}
              </Typography>
              <Chip label="Workspace" size="small" sx={{ bgcolor: 'rgba(251,146,60,0.12)', color: accentColor, borderRadius: 1.5 }} />
            </Stack>
            <Typography variant="body1" color="text.secondary">
              {greeting}, John. Here’s the latest across your spaces.
            </Typography>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
            <TextField
              placeholder="Search tenants, rooms, automations…"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 2,
                  backgroundColor: '#f8fafc',
                  '& fieldset': { borderColor: '#e2e8f0' },
                  '&:hover fieldset': { borderColor: accentColor }
                }
              }}
              sx={{ width: { xs: '100%', sm: 260, md: 320 } }}
            />
            <Stack direction="row" spacing={1} alignItems="center">
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<AddRoundedIcon />} 
                onClick={handleClick}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderColor: '#10b981',
                  color: '#10b981',
                  '&:hover': {
                    borderColor: '#059669',
                    color: '#059669',
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                New action
              </Button>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 200,
                    borderRadius: 2,
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
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
                        backgroundColor: 'rgba(22, 163, 74, 0.08)'
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: '#16a34a', minWidth: 36 }}>
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
              </Menu>
              <Button
                variant="outlined"
                size="small"
                startIcon={<HelpOutlineIcon />}
                onClick={onOpenHelp}
                sx={{ 
                  borderRadius: 1, 
                  borderColor: '#e2e8f0', 
                  color: 'text.primary', 
                  minWidth: 120,
                  height: 36,
                  '&:hover': { borderColor: accentColor, color: accentColor } 
                }}
              >
                Help & Support
              </Button>
              <IconButton sx={{ color: accentColor, bgcolor: 'rgba(251,146,60,0.12)', '&:hover': { bgcolor: 'rgba(251,146,60,0.2)' } }}>
                <NotificationsRoundedIcon />
              </IconButton>
              <Avatar 
                src={userProfile?.avatar || userProfile?.photo} 
                alt={userProfile?.name || userProfile?.email || 'User'} 
                sx={{ width: 44, height: 44, border: '2px solid #f1f5f9', bgcolor: accentColor }}
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
