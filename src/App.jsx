import React from 'react';
import AdminApp from './apps/admin/AdminApp.jsx';
import UserApp from './apps/user/UserApp.jsx';

const adminEmails = ['john.doe@beworking.io'];

const App = () => {
  const userProfile = {
    name: 'John Doe',
    role: 'Admin',
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

  const isAdmin = adminEmails.includes(userProfile.email);

  if (isAdmin) {
    return <AdminApp userProfile={userProfile} />;
  }

  return <UserApp userProfile={userProfile} />;
};

export default App;
