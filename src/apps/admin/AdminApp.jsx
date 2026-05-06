import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import Sidebar from '../../components/Sidebar.jsx';
import Header from '../../components/Header.jsx';
import UserSettingsDrawer from '../../components/UserSettingsDrawer.jsx';
import HelpSupportDrawer from '../../components/HelpSupportDrawer.jsx';
import ChatSupportDrawer from '../../components/ChatSupportDrawer.jsx';
import { DEPT_TABS } from '../../constants.js';
import SpiralLoader from '../../components/SpiralLoader.jsx';

const Overview = React.lazy(() => import('../../components/tabs/Overview.jsx'));
const Storage = React.lazy(() => import('../../components/tabs/Storage.jsx'));
const VirtualOffice = React.lazy(() => import('../../components/tabs/VirtualOffice.jsx'));
const Booking = React.lazy(() => import('../../components/tabs/Booking.jsx'));
const MariaAI = React.lazy(() => import('../../components/tabs/MariaAI.jsx'));
const Services = React.lazy(() => import('../../components/tabs/Services.jsx'));
const Integrations = React.lazy(() => import('../../components/tabs/Integrations.jsx'));
const Automation = React.lazy(() => import('../../components/tabs/Automation.jsx'));
const Community = React.lazy(() => import('../../components/tabs/Community.jsx'));
const Events = React.lazy(() => import('../../components/tabs/Events.jsx'));
const Contacts = React.lazy(() => import('../../components/tabs/admin/Contacts.jsx'));
const Leads = React.lazy(() => import('../../components/tabs/admin/Leads.jsx'));
const Analytics = React.lazy(() => import('../../components/tabs/admin/Analytics.jsx'));
const Invoices = React.lazy(() => import('../../components/tabs/admin/Invoices.jsx'));
const Expenses = React.lazy(() => import('../../components/tabs/Expenses.jsx'));
const Tickets = React.lazy(() => import('../../components/tabs/admin/Tickets.jsx'));
const Reports = React.lazy(() => import('../../components/tabs/admin/Reports.jsx'));
const SpaceCatalog = React.lazy(() => import('../../components/tabs/admin/SpaceCatalog.jsx'));
import Marketplace from '../../components/tabs/Marketplace.jsx';
const DeptComingSoon = React.lazy(() => import('../../components/tabs/DeptComingSoon.jsx'));

const TAB_COMPONENTS = {
  Overview,
  Contacts,
  Leads,
  Analytics,
  Booking,
  Invoices,
  Expenses,
  Community,
  Events,
  Storage,
  Tickets,
  Reports,
  SpaceCatalog,
  Marketplace,
  MariaAI,
  ...Object.fromEntries(DEPT_TABS.map(d => [d.id, DeptComingSoon])),
  DomicilioFiscal: VirtualOffice,
  Integrations,
  Automation,
  Services,
};

const AdminApp = ({ userProfile, refreshProfile, logout }) => {
  const theme = useTheme();
  const role = (userProfile?.role || '').toUpperCase();
  const isAccountant = role === 'ACCOUNTANT';
  const [activeTab, setActiveTab] = useState(isAccountant ? 'Invoices' : 'MariaAI');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
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
      return <Booking mode="admin" />;
    }
    if (activeTab === 'Invoices') {
      return <Invoices mode="admin" userProfile={userProfile} />;
    }
    const Component = TAB_COMPONENTS[activeTab] ?? Contacts;
    if (activeTab === 'Overview') {
      return <Component userType="admin" />;
    }
    if (activeTab === 'Contacts') {
      return <Component key={contactsKey} userType="admin" refreshProfile={refreshProfile} userProfile={userProfile} />;
    }
    if (activeTab === 'DomicilioFiscal') {
      return <Component userType="admin" userProfile={userProfile} />;
    }
    if (activeTab === 'MariaAI') {
      return <Component userProfile={userProfile} />;
    }
    return <Component deptId={activeTab} />;
  }, [activeTab, contactsKey]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default }}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={logout}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        isAdmin
        viewRole={role}
      />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflow: 'auto' }}>
        <Header
          activeTab={activeTab}
          userProfile={userProfile}
          onOpenHelp={() => setHelpOpen(true)}
          onOpenChat={() => setChatOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          setActiveTab={setActiveTab}
          onMenuToggle={() => setMobileOpen(true)}
          isAdmin
        />
        <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 3, lg: 4 } }}>
          <React.Suspense fallback={<SpiralLoader />}>
            <Box key={`${activeTab}-${contactsKey}`}>
              {TabContent}
            </Box>
          </React.Suspense>
        </Box>
        <Box component="footer" sx={{ py: 1.5, px: 2, textAlign: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
            BeWorking — A Globaltechno Product. · Málaga · Tallinn
          </Typography>
        </Box>
      </Box>
      <UserSettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} user={userProfile} refreshProfile={refreshProfile} onLogout={logout} />
      <HelpSupportDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ChatSupportDrawer open={chatOpen} onClose={() => setChatOpen(false)} />
    </Box>
  );
};

export default AdminApp;
