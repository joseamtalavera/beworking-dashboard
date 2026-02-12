import { lazy, Suspense, useCallback, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';

import { BookingFlowProvider, useBookingFlow } from './BookingFlowContext';
import SelectDetailsStep from './steps/SelectDetailsStep';
import ContactBillingStep from './steps/ContactBillingStep';

const PaymentStep = lazy(() => import('./steps/PaymentStep'));

const STEP_LABELS = ['Select details', 'Contact & billing', 'Review & payment'];

function StepperContent({ onClose, onCreated, mode }) {
  const { state } = useBookingFlow();
  const { activeStep } = state;

  const handleCreated = useCallback(
    (response) => {
      onCreated?.(response);
      onClose?.();
    },
    [onCreated, onClose]
  );

  switch (activeStep) {
    case 0:
      return <SelectDetailsStep />;
    case 1:
      return <ContactBillingStep mode={mode} />;
    case 2:
      return (
        <Suspense fallback={<Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>}>
          <PaymentStep mode={mode} onCreated={handleCreated} />
        </Suspense>
      );
    default:
      return null;
  }
}

function StepperDialogInner({ open, onClose, onCreated, defaultDate, mode }) {
  const theme = useTheme();
  const { state, reset } = useBookingFlow();

  useEffect(() => {
    if (open) {
      reset(defaultDate);
    }
  }, [open, defaultDate, reset]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: theme.shadows[6],
          maxWidth: 920,
        },
      }}
    >
      <DialogTitle
        sx={{
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack>
            <Typography variant="h5" fontWeight={700} color="text.primary">
              Create reserva
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add a new reservation to the system
            </Typography>
          </Stack>
          <IconButton onClick={onClose} size="small" sx={{ mt: 0.5 }}>
            <CloseRoundedIcon />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ px: 3, pt: 2.5, pb: 1 }}>
          <Stepper activeStep={state.activeStep} alternativeLabel>
            {STEP_LABELS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
        <Box sx={{ px: 3, py: 2.5 }}>
          <StepperContent onClose={onClose} onCreated={onCreated} mode={mode} />
        </Box>
      </DialogContent>
    </Dialog>
  );
}

export default function BookingStepperDialog({ open, onClose, onCreated, defaultDate, mode = 'admin' }) {
  return (
    <BookingFlowProvider defaultDate={defaultDate}>
      <StepperDialogInner
        open={open}
        onClose={onClose}
        onCreated={onCreated}
        defaultDate={defaultDate}
        mode={mode}
      />
    </BookingFlowProvider>
  );
}
