import { useState } from 'react';
import { updateUserAvatar } from '../api/auth.js';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';

const accentColor = '#fb923c';

const UserSettingsDrawer = ({ open, onClose, user, refreshProfile }) => {
  const [avatarPreview, setAvatarPreview] = useState(null);

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      // Create preview URL
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target.result;
        setAvatarPreview(dataUrl);
        
        try {
          // Update the avatar in the backend
          await updateUserAvatar(dataUrl);
          console.log('Avatar updated successfully');
          // Refresh the user profile to update the avatar in the header and other components
          if (refreshProfile) {
            refreshProfile();
          }
        } catch (error) {
          console.error('Failed to update avatar:', error);
          // You might want to show an error message to the user
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) return null;

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', md: 420 } } }}>
      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar src={user.avatar} alt={user.name} sx={{ width: 56, height: 56, border: '3px solid #fde7d2' }} />
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.role}
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Contact
          </Typography>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <EmailRoundedIcon fontSize="small" color="action" />
              <Typography variant="body2">{user.email}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <PhoneRoundedIcon fontSize="small" color="action" />
              <Typography variant="body2">{user.phone}</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <HomeRoundedIcon fontSize="small" color="action" />
              <Typography variant="body2">
                {user.address.line1}
                <br />
                {user.address.city}, {user.address.country} {user.address.postal}
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Profile Photo
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar 
              src={avatarPreview || user.avatar} 
              alt={user.name} 
              sx={{ width: 64, height: 64, border: '2px solid #e2e8f0' }}
            >
              {user.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
            </Avatar>
            <Stack spacing={1}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="avatar-upload"
                type="file"
                onChange={handlePhotoUpload}
              />
              <label htmlFor="avatar-upload">
                <Button 
                  component="span"
                  variant="outlined" 
                  size="small" 
                  startIcon={<PhotoCameraRoundedIcon />}
                  sx={{ 
                    borderColor: accentColor, 
                    color: accentColor,
                    '&:hover': { 
                      borderColor: accentColor, 
                      backgroundColor: `${accentColor}10` 
                    } 
                  }}
                >
                  Change Photo
                </Button>
              </label>
              <Typography variant="caption" color="text.secondary">
                Click to upload a new profile photo
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Account
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <VerifiedRoundedIcon fontSize="small" sx={{ color: accentColor }} />
            <Chip label={user.status} color="success" size="small" />
            <Chip label={user.plan} color="primary" size="small" />
          </Stack>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Billing & Stripe
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CreditCardRoundedIcon fontSize="small" color="action" />
                <Typography variant="body2" fontWeight="bold">
                  {user.billing.brand.toUpperCase()} •••• {user.billing.last4}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Expires {user.billing.expMonth}/{user.billing.expYear}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Stripe customer ID: {user.billing.stripeCustomerId}
              </Typography>
            </Stack>
          </Paper>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={2} sx={{ flex: 1, overflowY: 'auto' }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Invoices
          </Typography>
          {user.invoices.map((invoice) => (
            <Paper key={invoice.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="bold">
                    {invoice.id}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Issued {invoice.issuedAt}
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="body2">{invoice.amount}</Typography>
                </Grid>
                <Grid item xs={3} sx={{ textAlign: 'right' }}>
                  <Link href={invoice.url} variant="body2" underline="hover" color={accentColor} sx={{ fontWeight: 600 }}>
                    {invoice.status}
                  </Link>
                </Grid>
              </Grid>
            </Paper>
          ))}
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Button variant="outlined" size="small" sx={{ borderRadius: 2 }} onClick={onClose}>
            Close
          </Button>
          <Button variant="contained" size="small" sx={{ borderRadius: 2, bgcolor: accentColor, '&:hover': { bgcolor: '#f97316' } }}>
            Manage subscription
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
};

export default UserSettingsDrawer;
