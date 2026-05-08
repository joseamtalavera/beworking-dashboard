import { useState } from 'react';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import PlanUpgradeDialog from './PlanUpgradeDialog.jsx';

/**
 * Transparent overlay that gates an action for non-subscribers.
 * "Ver planes" opens the in-app PlanUpgradeDialog (BeWorkingVirtual card).
 *
 * Props:
 *   open, onClose         — gate visibility
 *   userProfile           — { email, name } passed to upgrade dialog (required for Stripe SetupIntent)
 *   onUpgraded            — optional callback after successful sub creation
 */
const SubscriptionGate = ({ open, onClose, userProfile, onUpgraded }) => {
  const { t } = useTranslation();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const handleSeeplans = () => {
    onClose?.();
    setUpgradeOpen(true);
  };

  if (!open && !upgradeOpen) return null;

  return (
    <>
      {open && (
        <Backdrop
          open={open}
          onClick={onClose}
          sx={{
            zIndex: (theme) => theme.zIndex.modal,
            backdropFilter: 'blur(6px)',
            backgroundColor: (theme) => alpha(theme.palette.background.default, 0.7),
          }}
        >
          <Paper
            elevation={8}
            onClick={(e) => e.stopPropagation()}
            sx={{
              position: 'relative',
              maxWidth: 440,
              width: '90%',
              p: 5,
              borderRadius: 4,
              textAlign: 'center',
            }}
          >
            <IconButton
              onClick={onClose}
              sx={{ position: 'absolute', top: 12, right: 12, color: 'text.secondary' }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>

            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                bgcolor: (theme) => alpha(theme.palette.brand.green, 0.1),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <LockOutlinedIcon sx={{ fontSize: 36, color: 'brand.green' }} />
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              {t('subscription.gateTitle', { defaultValue: 'Funcionalidad Premium' })}
            </Typography>

            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 1 }}>
              {t('subscription.gateDescription', {
                defaultValue: 'Esta funcionalidad está incluida en BeWorkingVirtual.',
              })}
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, color: 'brand.green', mb: 3 }}>
              {t('subscription.gatePrice', {
                defaultValue: 'Activa BeWorkingVirtual desde 15€/mes',
              })}
            </Typography>

            <Button
              variant="contained"
              size="large"
              onClick={handleSeeplans}
              sx={{
                px: 5,
                py: 1.5,
                fontWeight: 700,
                fontSize: '1rem',
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              {t('subscription.gateCta', { defaultValue: 'Ver planes' })}
            </Button>
          </Paper>
        </Backdrop>
      )}
      <PlanUpgradeDialog
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        currentPlan="free"
        userProfile={userProfile}
        onUpgraded={onUpgraded}
      />
    </>
  );
};

/**
 * Hook to manage SubscriptionGate state.
 * Returns [gateOpen, triggerGate, gateProps] where gateProps = { open, onClose }.
 */
export const useSubscriptionGate = (hasActiveSubscription) => {
  const [open, setOpen] = useState(false);

  const triggerGate = (callback) => {
    if (hasActiveSubscription) {
      callback();
    } else {
      setOpen(true);
    }
  };

  return [open, triggerGate, { open, onClose: () => setOpen(false) }];
};

export default SubscriptionGate;
