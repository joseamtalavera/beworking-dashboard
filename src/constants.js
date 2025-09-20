import {
  OverviewIcon,
  StorageIcon,
  MailboxIcon,
  BookingIcon,
  IntegrationsIcon,
  AutomationIcon,
  CommunityIcon,
  EventsIcon,
  ContactsIcon,
  AdminBookingsIcon,
  InvoicesIcon,
  TicketsIcon,
  ReportsIcon
} from './components/icons/Icons.js';

export const DEFAULT_TABS = [
  { id: 'Overview', label: 'Overview', icon: OverviewIcon },
  { id: 'Storage', label: 'Storage', icon: StorageIcon },
  { id: 'Mailbox', label: 'Mailbox', icon: MailboxIcon },
  { id: 'Booking', label: 'Booking', icon: BookingIcon },
  { id: 'Integrations', label: 'Integrations', icon: IntegrationsIcon },
  { id: 'Automation', label: 'Automation', icon: AutomationIcon },
  { id: 'Community', label: 'Community', icon: CommunityIcon },
  { id: 'Events', label: 'Events', icon: EventsIcon }
];

export const ADMIN_EXTRA_TABS = [
  { id: 'Contacts', label: 'Contacts', icon: ContactsIcon },
  { id: 'AdminBookings', label: 'Bookings (Admin)', icon: AdminBookingsIcon },
  { id: 'Invoices', label: 'Invoices', icon: InvoicesIcon },
  { id: 'Tickets', label: 'Tickets', icon: TicketsIcon },
  { id: 'Reports', label: 'Reports', icon: ReportsIcon }
];

export const ADMIN_TABS = [...DEFAULT_TABS, ...ADMIN_EXTRA_TABS];
