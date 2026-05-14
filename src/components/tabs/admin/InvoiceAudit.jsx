import { useState } from 'react';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import InvoiceAuditView from './InvoiceAuditView.jsx';
import PriceDiscrepanciesAudit from './PriceDiscrepanciesAudit.jsx';

const InvoiceAudit = () => {
  const [tab, setTab] = useState('audit');

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab value="audit" label="Invoice Audit" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab value="discrepancies" label="Price Discrepancies" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>
      </Box>

      {tab === 'audit' && <InvoiceAuditView />}
      {tab === 'discrepancies' && <PriceDiscrepanciesAudit />}
    </Box>
  );
};

export default InvoiceAudit;
