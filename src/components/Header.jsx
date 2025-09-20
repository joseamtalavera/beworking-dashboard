import { useMemo } from 'react';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

const accentColor = '#fb923c';

const Header = ({ activeTab }) => {
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

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
              <Button variant="contained" size="small" startIcon={<AddRoundedIcon />} sx={{ borderRadius: 3, bgcolor: accentColor, '&:hover': { bgcolor: '#f97316' } }}>
                New action
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<CalendarMonthRoundedIcon />}
                sx={{ borderRadius: 3, borderColor: '#e2e8f0', color: 'text.primary', '&:hover': { borderColor: accentColor, color: accentColor } }}
              >
                Schedule
              </Button>
              <IconButton sx={{ color: accentColor, bgcolor: 'rgba(251,146,60,0.12)', '&:hover': { bgcolor: 'rgba(251,146,60,0.2)' } }}>
                <NotificationsRoundedIcon />
              </IconButton>
              <Avatar src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=160&q=80" alt="John Doe" sx={{ width: 44, height: 44, border: '2px solid #f1f5f9' }} />
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Box>
  );
};

export default Header;
