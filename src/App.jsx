import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import AdminApp from './apps/admin/AdminApp.jsx';
import UserApp from './apps/user/UserApp.jsx';
import { useAuthProfile } from './components/hooks/useAuthProfile.js';

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
      <Dialog open={sessionExpired} disableEscapeKeyDown>
        <DialogTitle>{t('app.sessionExpiredTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('app.sessionExpiredMessage')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={handleLogin}>{t('app.login')}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default App;
