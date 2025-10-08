import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Sidebar from '../../components/Sidebar.jsx';
import Header from '../../components/Header.jsx';
import UserSettingsDrawer from '../../components/UserSettingsDrawer.jsx';
import HelpSupportDrawer from '../../components/HelpSupportDrawer.jsx';
import { ADMIN_TABS } from '../../constants.js';

const Overview = React.lazy(() => import('../../components/tabs/Overview.jsx'));
const Storage = React.lazy(() => import('../../components/tabs/Storage.jsx'));
const Mailbox = React.lazy(() => import('../../components/tabs/admin/MailboxAdmin.jsx'));
const Booking = React.lazy(() => import('../../components/tabs/Booking.jsx'));
const Integrations = React.lazy(() => import('../../components/tabs/Integrations.jsx'));
const Automation = React.lazy(() => import('../../components/tabs/Automation.jsx'));
const Community = React.lazy(() => import('../../components/tabs/Community.jsx'));
const Events = React.lazy(() => import('../../components/tabs/Events.jsx'));
const Contacts = React.lazy(() => import('../../components/tabs/admin/Contacts.jsx'));
const Invoices = React.lazy(() => import('../../components/tabs/admin/Invoices.jsx'));
const Tickets = React.lazy(() => import('../../components/tabs/admin/Tickets.jsx'));
const Reports = React.lazy(() => import('../../components/tabs/admin/Reports.jsx'));
import Marketplace from '../../components/tabs/Marketplace.jsx';

const TAB_COMPONENTS = {
  Overview,
  Contacts,
  Mailbox,
  Invoices,
  Integrations,
  Automation,
  Community,
  Events,
  Storage,
  Tickets,
  Reports,
  Marketplace
};

const AdminApp = ({ userProfile }) => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const TabContent = useMemo(() => {
    if (activeTab === 'Booking') {
      return <Booking mode="admin" />;
    }
    const Component = TAB_COMPONENTS[activeTab] ?? Contacts;
    return <Component />;
  }, [activeTab]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f1f5f9' }}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={ADMIN_TABS}
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

export default AdminApp;
