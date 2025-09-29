import React from 'react';
import AdminApp from './apps/admin/AdminApp.jsx';
import UserApp from './apps/user/UserApp.jsx';
import { useAuthProfile } from './components/hooks/useAuthProfile.js';

const App = () => {
  const { status, profile, error, loginUrl } = useAuthProfile();

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <span>Loading workspace…</span>
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

  const isAdmin = profile.role?.toUpperCase() === 'ADMIN';
  return isAdmin ? <AdminApp userProfile={profile} /> : <UserApp userProfile={profile} />;
};

export default App;
