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
  InvoicesIcon,
  TicketsIcon,
  ReportsIcon,
  MarketplaceIcon,
  AgentIcon,
  ExpensesIcon
} from './components/icons/Icons.js';

const BASE_TABS = [
  { id: 'Overview', label: 'Overview', icon: OverviewIcon },
  { id: 'Contacts', label: 'Contacts', icon: ContactsIcon },
  { id: 'Mailbox', label: 'Virtual Office', icon: MailboxIcon },
  { id: 'Booking', label: 'Meeting Rooms', icon: BookingIcon },
  { id: 'Invoices', label: 'Invoices', icon: InvoicesIcon },
  { id: 'Expenses', label: 'Expenses', icon: ExpensesIcon },
  { id: 'Integrations', label: 'Integrations', icon: IntegrationsIcon, soon: true },
  { id: 'Automation', label: 'Automation', icon: AutomationIcon, soon: true },
  { id: 'Community', label: 'Community', icon: CommunityIcon, soon: true },
  { id: 'Events', label: 'Events', icon: EventsIcon, soon: true },
  { id: 'Storage', label: 'Storage', icon: StorageIcon, soon: true },
  { id: 'Tickets', label: 'Tickets', icon: TicketsIcon, soon: true },
  { id: 'Reports', label: 'Reports', icon: ReportsIcon, soon: true },
  { id: 'Marketplace', label: 'Marketplace', icon: MarketplaceIcon, soon: true }
];

export const DEFAULT_TABS = BASE_TABS;

export const ADMIN_TABS = BASE_TABS;
