import React from 'react';
import AdminApp from './apps/admin/AdminApp.jsx';
import UserApp from './apps/user/UserApp.jsx';
import { useAuthProfile } from './components/hooks/useAuthProfile.js';

const App = () => {
  const { status, profile, error, loginUrl, refreshProfile, logout } = useAuthProfile();
  
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
        <span>{error || 'Redirecting to login…'}</span>
      </div>
    );
  }

  const path = window.location.pathname;
  const isAdminRoute = path.startsWith('/admin');
  return isAdminRoute
    ? <AdminApp userProfile={profile} refreshProfile={refreshProfile} logout={logout} />
    : <UserApp userProfile={profile} refreshProfile={refreshProfile} logout={logout} />;
};

export default App;
