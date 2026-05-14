import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import ReconciliationCard from './ReconciliationCard.jsx';
import MeetingRoomReconciliationCard from './MeetingRoomReconciliationCard.jsx';

const Reconciliation = () => {
  const [tab, setTab] = useState('subscriptions');

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab value="subscriptions" label="Subscription" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab value="meetingRooms" label="Meeting Rooms" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>
      </Box>

      {tab === 'subscriptions' && <ReconciliationCard />}
      {tab === 'meetingRooms' && <MeetingRoomReconciliationCard />}
    </Box>
  );
};

export default Reconciliation;
