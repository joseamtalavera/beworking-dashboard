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
const VirtualOffice = React.lazy(() => import('../../components/tabs/VirtualOffice.jsx'));
const Booking = React.lazy(() => import('../../components/tabs/Booking.jsx'));
const Agent = React.lazy(() => import('../../components/tabs/Agent.jsx'));
const Integrations = React.lazy(() => import('../../components/tabs/Integrations.jsx'));
const Automation = React.lazy(() => import('../../components/tabs/Automation.jsx'));
const Community = React.lazy(() => import('../../components/tabs/Community.jsx'));
const Events = React.lazy(() => import('../../components/tabs/Events.jsx'));
const Contacts = React.lazy(() => import('../../components/tabs/admin/Contacts.jsx'));
const Invoices = React.lazy(() => import('../../components/tabs/admin/Invoices.jsx'));
const Expenses = React.lazy(() => import('../../components/tabs/Expenses.jsx'));
const Tickets = React.lazy(() => import('../../components/tabs/admin/Tickets.jsx'));
const Reports = React.lazy(() => import('../../components/tabs/admin/Reports.jsx'));
import Marketplace from '../../components/tabs/Marketplace.jsx';

const TAB_COMPONENTS = {
  Overview,
  Contacts,
  Mailbox: VirtualOffice,
  Booking,
  Invoices,
  Expenses,
  Integrations,
  Automation,
  Community,
  Events,
  Storage,
  Tickets,
  Reports,
  Marketplace
};

const UserApp = ({ userProfile, refreshProfile }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [contactsKey, setContactsKey] = useState(0);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Force remount of Contacts component when Contacts tab is clicked
    if (tabId === 'Contacts') {
      setContactsKey(prev => prev + 1);
    }
  };

  const TabContent = useMemo(() => {
    if (activeTab === 'Booking') {
      return <Booking mode="user" />;
    }
    const Component = TAB_COMPONENTS[activeTab] ?? Contacts;
    if (activeTab === 'Overview') {
      return <Component userType="user" />;
    }
    if (activeTab === 'Contacts') {
      return <Component key={contactsKey} userType="user" refreshProfile={refreshProfile} userProfile={userProfile} />;
    }
    if (activeTab === 'Mailbox') {
      return <Component userType="user" />;
    }
    return <Component />;
  }, [activeTab, contactsKey]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        tabs={DEFAULT_TABS}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAgent={() => setAgentOpen(true)}
      />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header activeTab={activeTab} userProfile={userProfile} onOpenHelp={() => setHelpOpen(true)} setActiveTab={setActiveTab} />
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
            <Box key={`${activeTab}-${contactsKey}`}>
              {TabContent}
            </Box>
          </React.Suspense>
        </Box>
      </Box>
      <UserSettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} user={userProfile} refreshProfile={refreshProfile} />
      <HelpSupportDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
      {agentOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '33.333%',
            minWidth: '400px',
            bgcolor: 'white',
            borderLeft: '1px solid #e2e8f0',
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-4px 0 12px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Agent onClose={() => setAgentOpen(false)} />
        </Box>
      )}
    </Box>
  );
};

export default UserApp;
