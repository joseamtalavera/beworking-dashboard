import React from 'react';
import { alpha } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';

const Expenses = () => {
  return (
    <Stack spacing={4}>
      {/* Header */}
      <Stack spacing={2}>
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          Expenses
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track and manage your business expenses, receipts, and reimbursements.
        </Typography>
      </Stack>

      {/* Coming Soon Card */}
      <Paper elevation={0} sx={{ borderRadius: 3, p: 6, border: '1px solid', borderColor: 'divider' }}>
        <Stack spacing={3} alignItems="center" textAlign="center">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
              color: 'primary.main'
            }}
          >
            <AccountBalanceWalletOutlinedIcon sx={{ fontSize: 40 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ mb: 1 }}>
              Expenses Management
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Track your business expenses, upload receipts, and manage reimbursements all in one place.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This feature is coming soon and will include expense tracking, receipt management, and automated categorization.
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  );
};

export default Expenses;
