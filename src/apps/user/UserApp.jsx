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
const BookingFlow = React.lazy(() => import('../../components/BookingFlow.jsx'));
const MariaAI = React.lazy(() => import('../../components/tabs/MariaAI.jsx'));
const Integrations = React.lazy(() => import('../../components/tabs/Integrations.jsx'));
const Automation = React.lazy(() => import('../../components/tabs/Automation.jsx'));
const Community = React.lazy(() => import('../../components/tabs/Community.jsx'));
const Events = React.lazy(() => import('../../components/tabs/Events.jsx'));
const Invoices = React.lazy(() => import('../../components/tabs/admin/Invoices.jsx'));
const Expenses = React.lazy(() => import('../../components/tabs/Expenses.jsx'));
const Tickets = React.lazy(() => import('../../components/tabs/admin/Tickets.jsx'));
const Reports = React.lazy(() => import('../../components/tabs/admin/Reports.jsx'));
import Marketplace from '../../components/tabs/Marketplace.jsx';
const DeptComingSoon = React.lazy(() => import('../../components/tabs/DeptComingSoon.jsx'));

const TAB_COMPONENTS = {
  Overview,
  Booking,
  MyInvoices: Invoices,
  Invoices,
  Expenses,
  Community,
  Events,
  Storage,
  Tickets,
  Reports,
  Marketplace,
  MariaAI,
  ...Object.fromEntries(DEPT_TABS.map(d => [d.id, DeptComingSoon])),
  DomicilioFiscal: VirtualOffice,
  Integrations,
  Automation,
  Services: DeptComingSoon,
};

const UserApp = ({ userProfile, refreshProfile, logout }) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('Overview');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [bookingKey, setBookingKey] = useState(0);

  const handleTabChange = (tabId) => {
    // Force remount of Booking when clicking the same tab to reset internal sub-flow state
    if (tabId === activeTab && (tabId === 'Booking' || tabId === 'MyBookings')) {
      setBookingKey((k) => k + 1);
    }
    setActiveTab(tabId);
  };

  const isSubscribed = userProfile?.hasActiveSubscription || userProfile?.role === 'ADMIN';

  const TabContent = useMemo(() => {
    if (activeTab === 'Booking') {
      return <Booking key={`booking-${bookingKey}`} mode="user" userProfile={userProfile} />;
    }
    if (activeTab === 'MyBookings') {
      return <Booking key={`mybookings-${bookingKey}`} mode="user" userProfile={userProfile} initialView="bookings" />;
    }
    if (activeTab === 'MyInvoices') {
      return <Invoices mode="user" userProfile={userProfile} />;
    }
    if (activeTab === 'Invoices') {
      return (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
            Invoices
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
            Create and manage invoices for your clients. This feature is coming soon.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Your BeWorking subscription invoices are available in Settings.
          </Typography>
        </Box>
      );
    }
    const Component = TAB_COMPONENTS[activeTab];
    if (!Component) return null;
    if (activeTab === 'Overview') {
      return <Component userType="user" userProfile={userProfile} setActiveTab={handleTabChange} />;
    }
    if (activeTab === 'DomicilioFiscal') {
      return <Component userType="user" userProfile={userProfile} hasActiveSubscription={isSubscribed} />;
    }
    if (activeTab === 'MariaAI') {
      return <Component userProfile={userProfile} />;
    }
    return <Component deptId={activeTab} />;
  }, [activeTab, userProfile, isSubscribed, bookingKey]);

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
        isAdmin={false}
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
          isAdmin={false}
        />
        <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 3, lg: 4 } }}>
          <React.Suspense fallback={<SpiralLoader />}>
            <Box key={activeTab}>
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

export default UserApp;
