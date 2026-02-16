import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import SpiralLoader from '../SpiralLoader.jsx';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n.js';
import esMailbox from '../../i18n/locales/es/mailbox.json';
import enMailbox from '../../i18n/locales/en/mailbox.json';
if (!i18n.hasResourceBundle('es', 'mailbox')) {
  i18n.addResourceBundle('es', 'mailbox', esMailbox);
  i18n.addResourceBundle('en', 'mailbox', enMailbox);
}

// Lazy load the subtab components
const MailboxUser = React.lazy(() => import('./user/MailboxUser.jsx'));
const MailboxAdmin = React.lazy(() => import('./admin/MailboxAdmin.jsx'));
const VirtualOfficeAddress = React.lazy(() => import('./VirtualOfficeAddress.jsx'));

const VirtualOffice = ({ userType = 'user', userProfile }) => {
  const { t } = useTranslation('mailbox');
  const [activeSubTab, setActiveSubTab] = useState(0);

  const handleSubTabChange = (event, newValue) => {
    setActiveSubTab(newValue);
  };

  const subtabs = [
    {
      id: 'mailbox',
      label: t('virtualOffice.mailboxTab'),
      icon: <MailOutlineIcon />,
      component: userType === 'admin' ? MailboxAdmin : MailboxUser
    },
    {
      id: 'address',
      label: t('virtualOffice.addressTab'),
      icon: <LocationOnOutlinedIcon />,
      component: VirtualOfficeAddress
    }
  ];

  const ActiveComponent = subtabs[activeSubTab]?.component;

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          {t('virtualOffice.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('virtualOffice.subtitle')}
        </Typography>
      </Stack>

      {/* Subtab Navigation */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Tabs
          value={activeSubTab}
          onChange={handleSubTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              minHeight: 64,
              '&.Mui-selected': {
                color: 'secondary.main'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'secondary.main',
              height: 3
            }
          }}
        >
          {subtabs.map((tab, index) => (
            <Tab
              key={tab.id}
              icon={tab.icon}
              label={tab.label}
              iconPosition="start"
              sx={{ gap: 1 }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Subtab Content */}
      <Box sx={{ minHeight: 400 }}>
        {ActiveComponent && (
          <React.Suspense
            fallback={<SpiralLoader />}
          >
            <ActiveComponent userType={userType} userProfile={userProfile} />
          </React.Suspense>
        )}
      </Box>
    </Stack>
  );
};

export default VirtualOffice;
