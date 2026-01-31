import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';

// Lazy load the subtab components
const MailboxUser = React.lazy(() => import('./user/MailboxUser.jsx'));
const MailboxAdmin = React.lazy(() => import('./admin/MailboxAdmin.jsx'));
const VirtualOfficeAddress = React.lazy(() => import('./VirtualOfficeAddress.jsx'));

const VirtualOffice = ({ userType = 'user' }) => {
  const [activeSubTab, setActiveSubTab] = useState(0);

  const handleSubTabChange = (event, newValue) => {
    setActiveSubTab(newValue);
  };

  const subtabs = [
    {
      id: 'mailbox',
      label: 'Business Address',
      icon: <MailOutlineIcon />,
      component: userType === 'admin' ? MailboxAdmin : MailboxUser
    },
    {
      id: 'address',
      label: 'Office Address',
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
          Your Professional Business Address
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your Business Address services including mail handling and office address information.
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
            fallback={
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: 400,
                  color: 'text.secondary'
                }}
              >
                <Typography>Loading...</Typography>
              </Box>
            }
          >
            <ActiveComponent userType={userType} />
          </React.Suspense>
        )}
      </Box>
    </Stack>
  );
};

export default VirtualOffice;
