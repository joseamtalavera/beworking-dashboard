import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

import { BookingFlowProvider, useBookingFlow } from './BookingFlowContext';
import RoomCatalog from './RoomCatalog';
import RoomDetail from './RoomDetail';
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
    },
    [onCreated]
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

function BookingFlowInner({ onClose, onCreated, defaultDate, mode, selectedRoom, onBackToDetail }) {
  const { state, reset, setFields } = useBookingFlow();

  useEffect(() => {
    reset(defaultDate);
  }, [defaultDate, reset]);

  // Pre-populate centro & producto from the selected room
  useEffect(() => {
    if (!selectedRoom) return;

    const producto = selectedRoom._producto || null;
    const centro = selectedRoom._centro || null;

    const fields = {};
    if (producto) {
      fields.producto = producto;
    }
    if (centro) {
      fields.centro = centro;
    }
    if (Object.keys(fields).length > 0) {
      setFields(fields);
    }
  }, [selectedRoom, setFields]);

  const centroName = state.centro?.name || state.centro?.label || state.centro?.code || '';
  const productoName = state.producto?.name || selectedRoom?.name || '';

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', width: '100%', px: { xs: 2, md: 3 }, py: 4 }}>
      <Button
        onClick={onBackToDetail}
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ mb: 2, textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}
      >
        Back to room details
      </Button>

      {productoName && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="overline" sx={{ color: 'text.disabled' }}>
            Booking{centroName ? ` · ${centroName}` : ''}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {productoName}
          </Typography>
        </Box>
      )}

      <Paper variant="outlined" sx={{ px: 3, py: 2, borderRadius: 3, mb: 4 }}>
        <Stepper activeStep={state.activeStep} alternativeLabel>
          {STEP_LABELS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      <StepperContent onClose={onClose} onCreated={onCreated} mode={mode} />
    </Box>
  );
}

// Phase enum: 'catalog' → 'detail' → 'booking'

export default function BookingFlowPage({ onClose, onCreated, defaultDate, mode = 'admin' }) {
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [phase, setPhase] = useState('catalog');

  const handleBookNow = useCallback((space) => {
    setSelectedRoom(space);
    setPhase('detail');
  }, []);

  const handleBackToCatalog = useCallback(() => {
    setSelectedRoom(null);
    setPhase('catalog');
  }, []);

  const handleStartBooking = useCallback(() => {
    setPhase('booking');
  }, []);

  const handleBackToDetail = useCallback(() => {
    setPhase('detail');
  }, []);

  // Phase 1: Room catalog
  if (phase === 'catalog') {
    return <RoomCatalog onClose={onClose} onBookNow={handleBookNow} />;
  }

  // Phase 2: Room detail
  if (phase === 'detail' && selectedRoom) {
    return (
      <RoomDetail
        space={selectedRoom}
        onBack={handleBackToCatalog}
        onStartBooking={handleStartBooking}
      />
    );
  }

  // Phase 3: Booking flow with pre-selected room
  return (
    <BookingFlowProvider defaultDate={defaultDate}>
      <BookingFlowInner
        onClose={onClose}
        onCreated={onCreated}
        defaultDate={defaultDate}
        mode={mode}
        selectedRoom={selectedRoom}
        onBackToDetail={handleBackToDetail}
      />
    </BookingFlowProvider>
  );
}
