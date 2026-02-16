import { useState, useEffect } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { updateUserAvatar, updateUserProfile } from '../api/auth.js';
import { apiFetch } from '../api/client.js';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Drawer from '@mui/material/Drawer';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CreditCardRoundedIcon from '@mui/icons-material/CreditCardRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import PhoneRoundedIcon from '@mui/icons-material/PhoneRounded';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import PhotoCameraRoundedIcon from '@mui/icons-material/PhotoCameraRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n.js';
import esSettings from '../i18n/locales/es/settings.json';
import enSettings from '../i18n/locales/en/settings.json';

if (!i18n.hasResourceBundle('es', 'settings')) {
  i18n.addResourceBundle('es', 'settings', esSettings);
  i18n.addResourceBundle('en', 'settings', enSettings);
}

const UserSettingsDrawer = ({ open, onClose, user, refreshProfile, onLogout }) => {
  const theme = useTheme();
  const { t } = useTranslation('settings');
  const accentColor = theme.palette.brand.green;
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: {
      line1: user?.address?.line1 || '',
      city: user?.address?.city || '',
      country: user?.address?.country || '',
      postal: user?.address?.postal || ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [contactStatus, setContactStatus] = useState(null);
  const [isEditingBilling, setIsEditingBilling] = useState(false);
  const [billingData, setBillingData] = useState({
    brand: user?.billing?.brand || '',
    fullCardNumber: '', // Full card number for editing
    last4: user?.billing?.last4 || '',
    expMonth: user?.billing?.expMonth || '',
    expYear: user?.billing?.expYear || '',
    stripeCustomerId: user?.billing?.stripeCustomerId || ''
  });
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [userSubscription, setUserSubscription] = useState(null);

  // Subscription plans
  const subscriptionPlans = [
    {
      id: 'virtual-office',
      name: t('plans.virtualOffice.name'),
      price: 15,
      currency: 'EUR',
      description: t('plans.virtualOffice.description'),
      features: t('plans.virtualOffice.features', { returnObjects: true })
    },
    {
      id: 'automation',
      name: t('plans.automation.name'),
      price: 18,
      currency: 'EUR',
      description: t('plans.automation.description'),
      features: t('plans.automation.features', { returnObjects: true })
    }
  ];

  // Fetch user subscription status
  const fetchUserSubscription = async () => {
    if (!user?.email) return;
    try {
      // TODO: Replace with actual API call to fetch subscription status
      // const data = await apiFetch(`/subscriptions?email=${encodeURIComponent(user.email)}`);
      
      // For now, simulate subscription data (this would come from your backend)
      const mockSubscription = {
        id: 'sub_123456789',
        planId: 'virtual-office',
        planName: 'Virtual Office',
        status: 'active', // active, canceled, past_due, etc.
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        price: 15,
        currency: 'EUR'
      };
      
      setUserSubscription(mockSubscription);
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
      setUserSubscription(null);
    }
  };

  // Handle subscription payment
  const handleSubscriptionPayment = async (plan) => {
    setProcessingPayment(true);
    try {
      // TODO: Integrate with Stripe payment processing
      console.log('Processing payment for plan:', plan);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Show success message
      alert(`Successfully subscribed to ${plan.name} for €${plan.price} + VAT`);
      
      // Update subscription status
      const newSubscription = {
        id: `sub_${Date.now()}`,
        planId: plan.id,
        planName: plan.name,
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        price: plan.price,
        currency: plan.currency
      };
      setUserSubscription(newSubscription);
      
      // Close dialog
      setSubscriptionDialogOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      console.error('Payment processing error:', error);
      alert('Payment processing failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Fetch contact profile status
  const fetchContactStatus = async () => {
    if (!user?.email) return;
    
    try {
      const data = await apiFetch(`/contact-profiles?email=${encodeURIComponent(user.email)}`);
      if (data?.items && data.items.length > 0) {
        const contactProfile = data.items[0];
        setContactStatus(contactProfile.status || 'Active');
      }
    } catch (error) {
      console.error('Failed to fetch contact status:', error);
      setContactStatus('Active'); // fallback
    }
  };

  // Update form data when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: {
          line1: user.address?.line1 || '',
          city: user.address?.city || '',
          country: user.address?.country || '',
          postal: user.address?.postal || ''
        }
      });
      
      // Fetch contact profile status
      fetchContactStatus();
      
      // Fetch subscription status
      fetchUserSubscription();
      
      // Initialize billing data
      setBillingData({
        brand: user.billing?.brand || '',
        fullCardNumber: '', // Don't populate full card number for security
        last4: user.billing?.last4 || '',
        expMonth: user.billing?.expMonth || '',
        expYear: user.billing?.expYear || '',
        stripeCustomerId: user.billing?.stripeCustomerId || ''
      });
    }
  }, [user]);

  const handleFormChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await updateUserProfile(formData);
      console.log('Profile updated successfully');
      setIsEditing(false);
      if (refreshProfile) {
        refreshProfile();
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: {
        line1: user?.address?.line1 || '',
        city: user?.address?.city || '',
        country: user?.address?.country || '',
        postal: user?.address?.postal || ''
      }
    });
    setIsEditing(false);
  };

  const handleBillingChange = (field, value) => {
    let processedValue = value;
    
    // Format card number with spaces for better readability
    if (field === 'fullCardNumber') {
      // Remove all non-digits
      const digitsOnly = value.replace(/\D/g, '');
      // Add spaces every 4 digits
      processedValue = digitsOnly.replace(/(\d{4})(?=\d)/g, '$1 ');
    }
    
    setBillingData(prev => ({
      ...prev,
      [field]: processedValue
    }));
  };

  const handleSaveBilling = async () => {
    setLoading(true);
    try {
      // Extract last 4 digits from full card number if provided
      const cardNumberToSave = billingData.fullCardNumber;
      let last4Digits = billingData.last4; // Default to existing last4
      
      if (cardNumberToSave) {
        // Remove spaces and get last 4 digits
        const digitsOnly = cardNumberToSave.replace(/\D/g, '');
        last4Digits = digitsOnly.slice(-4);
      }
      
      const billingDataToSave = {
        brand: billingData.brand,
        last4: last4Digits,
        expMonth: billingData.expMonth,
        expYear: billingData.expYear,
        stripeCustomerId: billingData.stripeCustomerId
        // Don't send the full card number to the backend for security
      };
      
      await updateUserProfile({ billing: billingDataToSave });
      console.log('Billing updated successfully');
      setIsEditingBilling(false);
      if (refreshProfile) {
        refreshProfile();
      }
    } catch (error) {
      console.error('Failed to update billing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBillingEdit = () => {
    setBillingData({
      brand: user?.billing?.brand || '',
      fullCardNumber: '', // Clear the full card number
      last4: user?.billing?.last4 || '',
      expMonth: user?.billing?.expMonth || '',
      expYear: user?.billing?.expYear || '',
      stripeCustomerId: user?.billing?.stripeCustomerId || ''
    });
    setIsEditingBilling(false);
  };

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
            <Avatar
              src={user.avatar}
              alt={user.name}
              sx={{ width: 56, height: 56, border: '3px solid', borderColor: alpha(theme.palette.warning.light, 0.6) }}
            />
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
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('contact.title')}
            </Typography>
            {!isEditing ? (
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => setIsEditing(true)}
                sx={{ 
                  minWidth: 120,
                  height: 36,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: accentColor, 
                  color: accentColor,
                  '&:hover': { 
                    borderColor: theme.palette.brand.greenHover,
                    color: theme.palette.brand.greenHover,
                    backgroundColor: alpha(theme.palette.brand.green, 0.08),
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.brand.green, 0.2)}`
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {t('actions.edit')}
              </Button>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handleCancelEdit}
                  disabled={loading}
                  color="secondary"
                  sx={{
                    minWidth: 120,
                    height: 36,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: theme.palette.secondary.main,
                    color: theme.palette.secondary.main,
                    '&:hover': {
                      borderColor: theme.palette.secondary.dark,
                      color: theme.palette.secondary.dark,
                      backgroundColor: theme.palette.brand.greenSoft,
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.2)}`
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  {t('actions.cancel')}
                </Button>
                <Button 
                  variant="contained" 
                  size="small" 
                  onClick={handleSaveProfile}
                  disabled={loading}
                  sx={{
                    minWidth: 120,
                    height: 36,
                    textTransform: 'none',
                    fontWeight: 600,
                    backgroundColor: accentColor,
                    color: 'common.white',
                    '&:hover': {
                      backgroundColor: theme.palette.brand.greenHover
                    }
                  }}
                >
                  {loading ? t('actions.saving') : t('actions.save')}
                </Button>
              </Stack>
            )}
          </Stack>
          
          <Stack spacing={2}>
            <TextField
              label={t('contact.fullName')}
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              disabled={!isEditing}
              fullWidth
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: accentColor,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: accentColor,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: accentColor,
                },
              }}
            />
            
            <TextField
              label={t('contact.email')}
              value={formData.email}
              onChange={(e) => handleFormChange('email', e.target.value)}
              disabled={!isEditing}
              fullWidth
              size="small"
              type="email"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: accentColor,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: accentColor,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: accentColor,
                },
              }}
            />
            
            <TextField
              label={t('contact.phone')}
              value={formData.phone}
              onChange={(e) => handleFormChange('phone', e.target.value)}
              disabled={!isEditing}
              fullWidth
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: accentColor,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: accentColor,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: accentColor,
                },
              }}
            />
            
            <TextField
              label={t('contact.address')}
              value={formData.address.line1}
              onChange={(e) => handleFormChange('address.line1', e.target.value)}
              disabled={!isEditing}
              fullWidth
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: accentColor,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: accentColor,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: accentColor,
                },
              }}
            />
            
            <Stack direction="row" spacing={2}>
              <TextField
                label={t('contact.city')}
                value={formData.address.city}
                onChange={(e) => handleFormChange('address.city', e.target.value)}
                disabled={!isEditing}
                fullWidth
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: accentColor,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: accentColor,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: accentColor,
                  },
                }}
              />
              <TextField
                label={t('contact.postalCode')}
                value={formData.address.postal}
                onChange={(e) => handleFormChange('address.postal', e.target.value)}
                disabled={!isEditing}
                fullWidth
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: accentColor,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: accentColor,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: accentColor,
                  },
                }}
              />
            </Stack>
            
            <TextField
              label={t('contact.country')}
              value={formData.address.country}
              onChange={(e) => handleFormChange('address.country', e.target.value)}
              disabled={!isEditing}
              fullWidth
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: accentColor,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: accentColor,
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: accentColor,
                },
              }}
            />
          </Stack>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('photo.title')}
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar 
              src={avatarPreview || user.avatar} 
              alt={user.name} 
              sx={{ width: 64, height: 64, border: '2px solid', borderColor: 'divider' }}
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
                    minWidth: 120,
                    height: 36,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: accentColor, 
                    color: accentColor,
                    '&:hover': { 
                      borderColor: theme.palette.brand.greenHover,
                      color: theme.palette.brand.greenHover,
                      backgroundColor: alpha(theme.palette.brand.green, 0.08),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.brand.green, 0.2)}`
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  {t('photo.change')}
                </Button>
              </label>
              <Typography variant="caption" color="text.secondary">
                {t('photo.hint')}
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('account.title')}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <VerifiedRoundedIcon fontSize="small" sx={{ color: accentColor }} />
            <Chip label={contactStatus || user.status || 'Active'} color="success" size="small" />
          </Stack>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={2}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('subscription.title')}
          </Typography>
          {userSubscription ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CreditCardRoundedIcon fontSize="small" sx={{ color: accentColor }} />
                <Chip 
                  label={userSubscription.planName} 
                  color={userSubscription.status === 'active' ? 'success' : 'default'} 
                  size="small" 
                />
              </Stack>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {t('subscription.status')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {userSubscription.status === 'active' ? t('subscription.active') : userSubscription.status}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {t('subscription.price')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    €{userSubscription.price} + VAT
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {t('subscription.nextBilling')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {new Date(userSubscription.currentPeriodEnd).toLocaleDateString(i18n.language === 'es' ? 'es-ES' : 'en-US')}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              <CreditCardRoundedIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {t('subscription.noActive')}
              </Typography>
            </Stack>
          )}
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('billing.title')}
          </Typography>
            {!isEditingBilling ? (
              <Button 
                variant="outlined" 
                size="small" 
                onClick={() => setIsEditingBilling(true)}
                sx={{ 
                  minWidth: 120,
                  height: 36,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: accentColor, 
                  color: accentColor,
                  '&:hover': { 
                    borderColor: theme.palette.brand.greenHover,
                    color: theme.palette.brand.greenHover,
                    backgroundColor: alpha(theme.palette.brand.green, 0.08),
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.brand.green, 0.2)}`
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {t('billing.editPayment')}
              </Button>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={handleCancelBillingEdit}
                  disabled={loading}
                  color="secondary"
                  sx={{
                    minWidth: 120,
                    height: 36,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: theme.palette.secondary.main,
                    color: theme.palette.secondary.main,
                    '&:hover': {
                      borderColor: theme.palette.secondary.dark,
                      color: theme.palette.secondary.dark,
                      backgroundColor: theme.palette.brand.greenSoft,
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.2)}`
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  {t('actions.cancel')}
                </Button>
                <Button 
                  variant="contained" 
                  size="small" 
                  onClick={handleSaveBilling}
                  disabled={loading}
                  sx={{
                    minWidth: 120,
                    height: 36,
                    textTransform: 'none',
                    fontWeight: 600,
                    backgroundColor: accentColor,
                    color: 'common.white',
                    '&:hover': {
                      backgroundColor: theme.palette.brand.greenHover
                    }
                  }}
                >
                  {loading ? t('actions.saving') : t('actions.save')}
                </Button>
              </Stack>
            )}
          </Stack>
          
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <CreditCardRoundedIcon fontSize="small" color="action" />
                {!isEditingBilling ? (
                <Typography variant="body2" fontWeight="bold">
                  {user.billing.brand.toUpperCase()} •••• {user.billing.last4}
                </Typography>
                ) : (
                  <Stack spacing={2} sx={{ flex: 1 }}>
                    <TextField
                      label={t('billing.cardBrand')}
                      value={billingData.brand}
                      onChange={(e) => handleBillingChange('brand', e.target.value)}
                      size="small"
                      fullWidth
                    />
                    <TextField
                      label={t('billing.fullCardNumber')}
                      value={billingData.fullCardNumber}
                      onChange={(e) => handleBillingChange('fullCardNumber', e.target.value)}
                      size="small"
                      fullWidth
                      placeholder="1234 5678 9012 3456"
                      inputProps={{ 
                        maxLength: 19, // 16 digits + 3 spaces
                        pattern: "[0-9 ]*"
                      }}
                      helperText={t('billing.cardHint')}
                    />
                  </Stack>
                )}
              </Stack>
              
              {!isEditingBilling ? (
                <>
              <Typography variant="caption" color="text.secondary">
                {t('billing.expires')} {user.billing.expMonth}/{user.billing.expYear}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('billing.stripeCustomerId')} {user.billing.stripeCustomerId}
              </Typography>
                </>
              ) : (
                <Stack direction="row" spacing={2}>
                  <TextField
                    label={t('billing.expiryMonth')}
                    value={billingData.expMonth}
                    onChange={(e) => handleBillingChange('expMonth', e.target.value)}
                    size="small"
                    type="number"
                    inputProps={{ min: 1, max: 12 }}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    label={t('billing.expiryYear')}
                    value={billingData.expYear}
                    onChange={(e) => handleBillingChange('expYear', e.target.value)}
                    size="small"
                    type="number"
                    inputProps={{ min: new Date().getFullYear() }}
                    sx={{ flex: 1 }}
                  />
                </Stack>
              )}
              
              {isEditingBilling && (
                <TextField
                  label={t('billing.stripeCustomerId')}
                  value={billingData.stripeCustomerId}
                  onChange={(e) => handleBillingChange('stripeCustomerId', e.target.value)}
                  size="small"
                  fullWidth
                />
              )}
            </Stack>
          </Paper>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Stack spacing={2} sx={{ flex: 1, overflowY: 'auto' }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('invoices.title')}
          </Typography>
          {user.invoices.map((invoice) => (
            <Paper key={invoice.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Grid container spacing={1} alignItems="center">
                <Grid item xs={6}>
                  <Typography variant="body2" fontWeight="bold">
                    {invoice.id}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('invoices.issued')} {invoice.issuedAt}
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

        <Stack direction="row" spacing={1} justifyContent="space-between" sx={{ pb: 2 }}>
          <Button 
            variant="outlined" 
            size="small"
            startIcon={<LogoutRoundedIcon />}
            sx={{ 
              minWidth: 120,
              height: 36,
              textTransform: 'none',
              fontWeight: 600,
              borderColor: 'secondary.main', 
              color: 'secondary.main', 
              '&:hover': { 
                borderColor: 'secondary.dark', 
                color: 'secondary.dark',
                backgroundColor: theme.palette.brand.greenSoft,
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 12px ${theme.palette.brand.greenSoft}`
              },
              transition: 'all 0.2s ease-in-out'
            }} 
            onClick={onLogout}
          >
            {t('actions.logout')}
          </Button>
          <Stack direction="row" spacing={1}>
            <Button 
              variant="outlined" 
              size="small" 
              sx={{ 
                minWidth: 100,
                height: 36,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: accentColor, 
                color: accentColor, 
                '&:hover': { 
                  borderColor: theme.palette.brand.greenHover, 
                  color: theme.palette.brand.greenHover,
                  backgroundColor: alpha(theme.palette.brand.green, 0.08),
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 12px ${alpha(theme.palette.brand.green, 0.2)}`
                },
                transition: 'all 0.2s ease-in-out'
              }} 
              onClick={onClose}
            >
              {t('actions.close')}
            </Button>
            <Button 
              variant="contained" 
              size="small" 
              sx={{ 
                minWidth: 120,
                height: 36,
                textTransform: 'none',
                fontWeight: 600,
                backgroundColor: accentColor, 
                color: 'common.white',
                '&:hover': { 
                  backgroundColor: theme.palette.brand.greenHover 
                } 
              }} 
              onClick={() => setSubscriptionDialogOpen(true)}
            >
              {userSubscription ? t('subscription.manage') : t('subscription.subscribe')}
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Subscription Dialog */}
      <Dialog 
        open={subscriptionDialogOpen} 
        onClose={() => setSubscriptionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            {t('subscription.choosePlan')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('subscription.selectPlan')}
          </Typography>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3}>
            {subscriptionPlans.map((plan) => (
              <Grid item xs={12} md={6} key={plan.id}>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 3, 
                    height: '100%',
                    cursor: 'pointer',
                    border: selectedPlan?.id === plan.id ? '2px solid' : '1px solid',
                    borderColor: selectedPlan?.id === plan.id ? accentColor : 'divider',
                    '&:hover': {
                      borderColor: accentColor,
                      boxShadow: `0 4px 12px ${alpha(accentColor, 0.2)}`
                    }
                  }}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {plan.name}
                      </Typography>
                      <Chip 
                        label={selectedPlan?.id === plan.id ? t('subscription.selected') : t('subscription.select')}
                        color={selectedPlan?.id === plan.id ? "primary" : "default"}
                        size="small"
                      />
                    </Stack>
                    
                    <Stack direction="row" alignItems="baseline" spacing={1}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: accentColor }}>
                        €{plan.price}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('subscription.vatSuffix')}
                      </Typography>
                    </Stack>
                    
                    <Typography variant="body2" color="text.secondary">
                      {plan.description}
                    </Typography>
                    
                    <Stack spacing={1}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {t('subscription.featuresIncluded')}
                      </Typography>
                      {plan.features.map((feature, index) => (
                        <Stack key={index} direction="row" alignItems="center" spacing={1}>
                          <Box 
                            sx={{ 
                              width: 6, 
                              height: 6, 
                              borderRadius: '50%', 
                              bgcolor: accentColor 
                            }} 
                          />
                          <Typography variant="body2">
                            {feature}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setSubscriptionDialogOpen(false)}
            disabled={processingPayment}
          >
            {t('actions.cancel')}
          </Button>
          <Button 
            variant="contained"
            onClick={() => selectedPlan && handleSubscriptionPayment(selectedPlan)}
            disabled={!selectedPlan || processingPayment}
            sx={{ 
              bgcolor: accentColor, 
              '&:hover': { bgcolor: theme.palette.brand.greenHover },
              minWidth: 120
            }}
          >
            {processingPayment ? (
              <Stack direction="row" alignItems="center" spacing={1}>
                <CircularProgress size={16} color="inherit" />
                <Typography variant="body2">{t('subscription.processing')}</Typography>
              </Stack>
            ) : (
              t('subscription.subscribePrice', { price: selectedPlan?.price || 0 })
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
};

export default UserSettingsDrawer;
