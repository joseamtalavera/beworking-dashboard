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
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n.js';
import esBooking from '../../i18n/locales/es/booking.json';
import enBooking from '../../i18n/locales/en/booking.json';

import { BookingFlowProvider, useBookingFlow } from './BookingFlowContext';
import RoomCatalog from './RoomCatalog';
import RoomDetail from './RoomDetail';
import SelectDetailsStep from './steps/SelectDetailsStep';
import ContactBillingStep from './steps/ContactBillingStep';

const PaymentStep = lazy(() => import('./steps/PaymentStep'));

if (!i18n.hasResourceBundle('es', 'booking')) {
  i18n.addResourceBundle('es', 'booking', esBooking);
  i18n.addResourceBundle('en', 'booking', enBooking);
}

function StepperContent({ onClose, onCreated, mode, userProfile }) {
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
      return <ContactBillingStep mode={mode} userProfile={userProfile} />;
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

function BookingFlowInner({ onClose, onCreated, defaultDate, mode, selectedRoom, onBackToDetail, userProfile, initialTime }) {
  const { t } = useTranslation('booking');
  const { state, reset, setFields } = useBookingFlow();

  const STEP_LABELS = [t('stepper.selectDetails'), t('stepper.contactBilling'), t('stepper.reviewPayment')];

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
    if (initialTime) {
      if (initialTime.startTime) fields.startTime = initialTime.startTime;
      if (initialTime.endTime) fields.endTime = initialTime.endTime;
    }
    if (Object.keys(fields).length > 0) {
      setFields(fields);
    }
  }, [selectedRoom, initialTime, setFields]);

  const centroName = state.centro?.name || state.centro?.label || state.centro?.code || '';
  const productoName = state.producto?.name || selectedRoom?.name || '';

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', width: '100%', py: 4 }}>
      <Button
        onClick={onBackToDetail}
        startIcon={<ArrowBackRoundedIcon />}
        sx={{ mb: 2, textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}
      >
        {t('dialog.backToRoom')}
      </Button>

      {productoName && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="overline" sx={{ color: 'text.disabled' }}>
            {t('dialog.booking')}{centroName ? ` · ${centroName}` : ''}
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

      <StepperContent onClose={onClose} onCreated={onCreated} mode={mode} userProfile={userProfile} />
    </Box>
  );
}

// Phase enum: 'catalog' → 'detail' → 'booking'

export default function BookingFlowPage({ onClose, onCreated, defaultDate, mode = 'admin', userProfile, initialRoom, initialTime }) {
  const [selectedRoom, setSelectedRoom] = useState(initialRoom || null);
  const [phase, setPhase] = useState(initialRoom ? 'booking' : 'catalog');

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
    if (initialRoom) {
      onClose?.();
    } else {
      setPhase('detail');
    }
  }, [initialRoom, onClose]);

  const handleCreated = useCallback((response) => {
    onCreated?.(response);
    setSelectedRoom(null);
    setPhase('catalog');
  }, [onCreated]);

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
        onCreated={handleCreated}
        defaultDate={defaultDate}
        mode={mode}
        selectedRoom={selectedRoom}
        onBackToDetail={handleBackToDetail}
        userProfile={userProfile}
        initialTime={initialTime}
      />
    </BookingFlowProvider>
  );
}
