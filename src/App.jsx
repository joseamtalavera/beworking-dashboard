import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AdminApp from './apps/admin/AdminApp.jsx';
import UserApp from './apps/user/UserApp.jsx';
import { useAuthProfile } from './components/hooks/useAuthProfile.js';

const BrandedDialog = ({ open, icon: Icon, title, message, buttonText, onAction }) => (
  <Dialog open={open} disableEscapeKeyDown PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden', maxWidth: 400 } }}>
    <Box sx={{ background: 'linear-gradient(135deg, #009624 0%, #00c853 100%)', px: 4, pt: 4, pb: 3, textAlign: 'center' }}>
      <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
        <Icon sx={{ fontSize: 28, color: '#fff' }} />
      </Box>
      <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem' }}>{title}</Typography>
    </Box>
    <Box sx={{ px: 4, pt: 3, pb: 4, textAlign: 'center' }}>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.9375rem', lineHeight: 1.6, mb: 3 }}>{message}</Typography>
      <Button variant="contained" fullWidth onClick={onAction} sx={{ borderRadius: 2, py: 1.2, fontWeight: 600, textTransform: 'none', fontSize: '0.9375rem' }}>
        {buttonText}
      </Button>
    </Box>
  </Dialog>
);

const App = () => {
  const { t } = useTranslation();
  const { status, profile, error, loginUrl, refreshProfile, logout } = useAuthProfile();
  const [sessionExpired, setSessionExpired] = useState(false);

  const handleSessionExpired = useCallback(() => setSessionExpired(true), []);

  useEffect(() => {
    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, [handleSessionExpired]);

  const handleLogin = () => {
    const url = loginUrl || import.meta.env.VITE_LOGIN_URL || 'https://www.be-working.com/main/login';
    window.location.href = url;
  };
  
  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spiral-spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '3px solid transparent',
          borderTopColor: '#22c55e', borderRightColor: 'rgba(34,197,94,0.4)', borderBottomColor: 'rgba(34,197,94,0.1)',
          animation: 'spiral-spin 0.8s cubic-bezier(0.5,0,0.5,1) infinite',
        }} />
      </div>
    );
  }

  if (status === 'fetch_error') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <BrandedDialog
          open
          icon={ErrorOutlineIcon}
          title={t('app.sessionErrorTitle', 'Sesión no disponible')}
          message={t('app.sessionErrorMessage', 'No hemos podido cargar tu sesión. Por favor, inicia sesión de nuevo.')}
          buttonText={t('app.login', 'Iniciar sesión')}
          onAction={handleLogin}
        />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    if (loginUrl) {
      window.location.href = loginUrl;
    }
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <span>{error || t('app.redirecting')}</span>
      </div>
    );
  }

  const path = window.location.pathname;
  const isAdminRoute = path.startsWith('/admin');
  const mainApp = isAdminRoute
    ? <AdminApp userProfile={profile} refreshProfile={refreshProfile} logout={logout} />
    : <UserApp userProfile={profile} refreshProfile={refreshProfile} logout={logout} />;

  return (
    <>
      {mainApp}
      <BrandedDialog
        open={sessionExpired}
        icon={LockOutlinedIcon}
        title={t('app.sessionExpiredTitle', 'Sesión expirada')}
        message={t('app.sessionExpiredMessage', 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.')}
        buttonText={t('app.login', 'Iniciar sesión')}
        onAction={handleLogin}
      />
    </>
  );
};

export default App;
