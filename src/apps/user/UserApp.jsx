import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Sidebar from '../../components/Sidebar.jsx';
import Header from '../../components/Header.jsx';
import UserSettingsDrawer from '../../components/UserSettingsDrawer.jsx';
import HelpSupportDrawer from '../../components/HelpSupportDrawer.jsx';
import { DEFAULT_TABS } from '../../constants.js';

const Overview = React.lazy(() => import('../../components/tabs/Overview.jsx'));
const Storage = React.lazy(() => import('../../components/tabs/Storage.jsx'));
const Mailbox = React.lazy(() => import('../../components/tabs/user/MailboxUser.jsx'));
const Booking = React.lazy(() => import('../../components/tabs/Booking.jsx'));
const Integrations = React.lazy(() => import('../../components/tabs/Integrations.jsx'));
const Automation = React.lazy(() => import('../../components/tabs/Automation.jsx'));
const Community = React.lazy(() => import('../../components/tabs/Community.jsx'));
const Events = React.lazy(() => import('../../components/tabs/Events.jsx'));

const TAB_COMPONENTS = {
  Overview,
  Storage,
  Mailbox,
  Booking,
  Integrations,
  Automation,
  Community,
  Events
};

const UserApp = ({ userProfile }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const TabContent = useMemo(() => {
    const Component = TAB_COMPONENTS[activeTab] ?? Overview;
    return <Component />;
  }, [activeTab]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={DEFAULT_TABS}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
      />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header activeTab={activeTab} />
        <Box component="main" sx={{ flex: 1, p: { xs: 3, lg: 4 }, overflowY: 'auto' }}>
          <React.Suspense
            fallback={(
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <Typography variant="body1" color="text.secondary">
                  Loading...
                </Typography>
              </Box>
            )}
          >
            {TabContent}
          </React.Suspense>
        </Box>
      </Box>
      <UserSettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} user={userProfile} />
      <HelpSupportDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
    </Box>
  );
};

export default UserApp;
