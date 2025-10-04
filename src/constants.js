import {
  StorageIcon,
  MailboxIcon,
  BookingIcon,
  IntegrationsIcon,
  AutomationIcon,
  CommunityIcon,
  EventsIcon,
  ContactsIcon,
  InvoicesIcon,
  TicketsIcon,
  ReportsIcon
} from './components/icons/Icons.js';

const BASE_TABS = [
  { id: 'Contacts', label: 'Contacts', icon: ContactsIcon },
  { id: 'Mailbox', label: 'Mailbox', icon: MailboxIcon },
  { id: 'Booking', label: 'Booking', icon: BookingIcon },
  { id: 'Invoices', label: 'Invoices', icon: InvoicesIcon },
  { id: 'Integrations', label: 'Integrations', icon: IntegrationsIcon },
  { id: 'Automation', label: 'Automation', icon: AutomationIcon },
  { id: 'Community', label: 'Community', icon: CommunityIcon },
  { id: 'Events', label: 'Events', icon: EventsIcon },
  { id: 'Storage', label: 'Storage', icon: StorageIcon },
  { id: 'Tickets', label: 'Tickets', icon: TicketsIcon },
  { id: 'Reports', label: 'Reports', icon: ReportsIcon }
];

export const DEFAULT_TABS = BASE_TABS;

export const ADMIN_TABS = BASE_TABS;
