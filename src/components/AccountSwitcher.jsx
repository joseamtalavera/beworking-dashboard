import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { alpha, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import { fetchMyAccounts, switchAccount } from '../api/auth.js';
import { setStoredToken } from '../api/client.js';

const AccountSwitcher = ({ currentTenantId }) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const accentColor = theme.palette.brand.green;
  const [anchorEl, setAnchorEl] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    fetchMyAccounts()
      .then(setAccounts)
      .catch(() => setAccounts([]));
  }, []);

  if (accounts.length < 2) return null;

  const currentAccount = accounts.find(a => a.id === currentTenantId);
  const open = Boolean(anchorEl);

  const handleSwitch = async (contactProfileId) => {
    if (contactProfileId === currentTenantId) {
      setAnchorEl(null);
      return;
    }
    setSwitching(true);
    try {
      const data = await switchAccount(contactProfileId);
      if (data?.token) {
        setStoredToken(data.token);
      }
      window.location.reload();
    } catch (err) {
      console.error('Failed to switch account:', err);
      setSwitching(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={switching ? <CircularProgress size={16} /> : <SwapHorizRoundedIcon />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        disabled={switching}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          px: { xs: 1, sm: 1.5 },
          py: 0.75,
          height: 36,
          maxWidth: { xs: 140, sm: 180 },
          borderColor: accentColor,
          color: accentColor,
          '&:hover': {
            borderColor: accentColor,
            backgroundColor: theme.palette.brand.accentSoft,
          },
        }}
      >
        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
          {currentAccount?.companyName || t('accountSwitcher.account')}
        </Typography>
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 240,
            maxWidth: 320,
            borderRadius: 2,
            boxShadow: theme.shadows[4],
          },
        }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase">
            {t('accountSwitcher.title')}
          </Typography>
        </Box>
        {accounts.map((account) => (
          <MenuItem
            key={account.id}
            onClick={() => handleSwitch(account.id)}
            selected={account.id === currentTenantId}
            sx={{
              py: 1.5,
              px: 2,
              '&.Mui-selected': {
                bgcolor: alpha(accentColor, 0.08),
              },
              '&:hover': {
                bgcolor: alpha(accentColor, 0.04),
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>
              {account.id === currentTenantId ? (
                <CheckRoundedIcon sx={{ color: accentColor }} />
              ) : (
                <BusinessRoundedIcon sx={{ color: 'text.secondary' }} />
              )}
            </ListItemIcon>
            <ListItemText
              primary={account.companyName || 'Sin nombre'}
              secondary={account.billingTaxId || account.tenantType || ''}
              primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: account.id === currentTenantId ? 700 : 500, noWrap: true }}
              secondaryTypographyProps={{ fontSize: '0.75rem', noWrap: true }}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default AccountSwitcher;
