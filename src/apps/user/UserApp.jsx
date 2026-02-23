import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import Sidebar from '../../components/Sidebar.jsx';
import Header from '../../components/Header.jsx';
import UserSettingsDrawer from '../../components/UserSettingsDrawer.jsx';
import HelpSupportDrawer from '../../components/HelpSupportDrawer.jsx';
import { USER_TABS } from '../../constants.js';
import SpiralLoader from '../../components/SpiralLoader.jsx';

const Overview = React.lazy(() => import('../../components/tabs/Overview.jsx'));
const Storage = React.lazy(() => import('../../components/tabs/Storage.jsx'));
const VirtualOffice = React.lazy(() => import('../../components/tabs/VirtualOffice.jsx'));
const Booking = React.lazy(() => import('../../components/tabs/Booking.jsx'));
const BookingFlow = React.lazy(() => import('../../components/BookingFlow.jsx'));
const Agent = React.lazy(() => import('../../components/tabs/Agent.jsx'));
const Integrations = React.lazy(() => import('../../components/tabs/Integrations.jsx'));
const Automation = React.lazy(() => import('../../components/tabs/Automation.jsx'));
const Community = React.lazy(() => import('../../components/tabs/Community.jsx'));
const Events = React.lazy(() => import('../../components/tabs/Events.jsx'));
const Contacts = React.lazy(() => import('../../components/tabs/user/UserContacts.jsx'));
const Invoices = React.lazy(() => import('../../components/tabs/admin/Invoices.jsx'));
const Expenses = React.lazy(() => import('../../components/tabs/Expenses.jsx'));
const Tickets = React.lazy(() => import('../../components/tabs/admin/Tickets.jsx'));
const Reports = React.lazy(() => import('../../components/tabs/admin/Reports.jsx'));
import Marketplace from '../../components/tabs/Marketplace.jsx';

const TAB_COMPONENTS = {
  Overview,
  Contacts,
  'Business Address': VirtualOffice,
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

const UserApp = ({ userProfile, refreshProfile, logout }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('Overview');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [agentOpen, setAgentOpen] = useState(false);
  const [contactsKey, setContactsKey] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Force remount of Contacts component when Contacts tab is clicked
    if (tabId === 'Contacts') {
      setContactsKey(prev => prev + 1);
    }
  };

  const TabContent = useMemo(() => {
    if (activeTab === 'Booking') {
      return <Booking mode="user" userProfile={userProfile} />;
    }
    if (activeTab === 'Invoices') {
      return <Invoices mode="user" userProfile={userProfile} />;
    }
    const Component = TAB_COMPONENTS[activeTab] ?? Contacts;
    if (activeTab === 'Overview') {
      return <Component userType="user" userProfile={userProfile} setActiveTab={handleTabChange} />;
    }
    if (activeTab === 'Contacts') {
      return <Component key={contactsKey} refreshProfile={refreshProfile} userProfile={userProfile} />;
    }
    if (activeTab === 'Business Address') {
      return <Component userType="user" userProfile={userProfile} />;
    }
    return <Component />;
  }, [activeTab, contactsKey, userProfile]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        tabs={USER_TABS}
        onOpenAgent={() => setAgentOpen(true)}
        onLogout={logout}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
      />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'auto' }}>
        <Header
          activeTab={activeTab}
          userProfile={userProfile}
          onOpenHelp={() => setHelpOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          setActiveTab={setActiveTab}
          onMenuToggle={() => setMobileOpen(true)}
          isAdmin={false}
        />
        <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 3, lg: 4 } }}>
          <React.Suspense fallback={<SpiralLoader />}>
            <Box key={`${activeTab}-${contactsKey}`}>
              {TabContent}
            </Box>
          </React.Suspense>
        </Box>
      </Box>
      <UserSettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} user={userProfile} refreshProfile={refreshProfile} onLogout={logout} />
      <HelpSupportDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
      {agentOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: { xs: '100%', sm: '80%', md: '33.333%' },
            minWidth: { md: '400px' },
            bgcolor: theme.palette.background.paper,
            borderLeft: `1px solid ${theme.palette.divider}`,
            zIndex: 1300,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: theme.shadows[6]
          }}
        >
          <Agent onClose={() => setAgentOpen(false)} />
        </Box>
      )}
    </Box>
  );
};

export default UserApp;
