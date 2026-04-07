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
  <Dialog open={open} disableEscapeKeyDown PaperProps={{ sx: { borderRadius: 4, maxWidth: 380, mx: 2 } }}>
    <Box sx={{ px: 4, pt: 5, pb: 4, textAlign: 'center' }}>
      <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: 'rgba(0,150,36,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2.5 }}>
        <Icon sx={{ fontSize: 26, color: '#009624' }} />
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: '1.125rem', color: 'text.primary', mb: 1 }}>{title}</Typography>
      <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem', lineHeight: 1.6, mb: 3.5 }}>{message}</Typography>
      <Button variant="contained" fullWidth onClick={onAction} sx={{ borderRadius: 2, py: 1.2, fontWeight: 600, textTransform: 'none', fontSize: '0.875rem' }}>
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
    const url = loginUrl || import.meta.env.VITE_LOGIN_URL || 'https://be-working.com/login';
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
      {/* WhatsApp floating button */}
      <a
        href="https://wa.me/34640369759?text=Hola,%20me%20interesa%20información%20sobre%20BeWorking"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        style={{ position: 'fixed', bottom: 28, right: 28, width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, transition: 'transform 0.2s ease' }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.12)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <svg width="44" height="44" viewBox="0 0 24 24" fill="#25D366">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </>
  );
};

export default App;
