import { useEffect, useState } from 'react';
import { fetchCurrentUser } from '../../api/auth.js';
import { getStoredToken, setStoredToken } from '../../api/client.js';

const LOGIN_URL = import.meta.env.VITE_LOGIN_URL || 'http://localhost:3020/main/login';

const BASE_PROFILE = {
  name: 'John Doe',
  role: 'ADMIN',
  tenantId: null,
  email: 'john.doe@beworking.io',
  phone: '+34 600 123 456',
  status: 'Active tenant',
  plan: 'Scale plan',
  avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80',
  billing: {
    brand: 'visa',
    last4: '4242',
    expMonth: 7,
    expYear: 2027,
    stripeCustomerId: 'cus_P4X9Y8B12'
  },
  invoices: [
    { id: 'INV-2025-004', amount: '€320.00', issuedAt: '2025-09-01', status: 'Paid', url: '#' },
    { id: 'INV-2025-003', amount: '€295.00', issuedAt: '2025-08-01', status: 'Paid', url: '#' },
    { id: 'INV-2025-002', amount: '€295.00', issuedAt: '2025-07-01', status: 'Paid', url: '#' }
  ],
  address: {
    line1: 'Av. Andalucía 123',
    city: 'Málaga',
    country: 'Spain',
    postal: '29004'
  }
};

const composeProfile = (apiProfile = {}) => ({
  ...BASE_PROFILE,
  ...apiProfile,
  role: apiProfile.role || BASE_PROFILE.role,
  email: apiProfile.email || BASE_PROFILE.email,
  tenantId: apiProfile.tenantId ?? BASE_PROFILE.tenantId
});

export const useAuthProfile = () => {
  const [state, setState] = useState({ status: 'loading', profile: null, error: '' });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      setStoredToken(tokenFromUrl);
      params.delete('token');
      const newSearch = params.toString();
      const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', newUrl);
    }

    const token = getStoredToken();
    if (!token) {
      setState({ status: 'unauthenticated', profile: null, error: '' });
      return;
    }

    let active = true;
    (async () => {
      try {
        const apiProfile = await fetchCurrentUser();
        if (!active) return;
        setState({ status: 'authenticated', profile: composeProfile(apiProfile), error: '' });
      } catch (error) {
        if (!active) return;
        console.error('Failed to fetch current user', error);
        setStoredToken(null);
        setState({ status: 'unauthenticated', profile: null, error: error.message || 'Authentication required.' });
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const logout = () => {
    setStoredToken(null);
    window.location.href = LOGIN_URL;
  };

  return { ...state, profile: state.profile ?? composeProfile(), logout, loginUrl: LOGIN_URL };
};
