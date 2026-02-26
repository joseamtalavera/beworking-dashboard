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
  ExpensesIcon,
  BankReconciliationIcon,
  CryptWalletIcon,
  PasswordManagementIcon,
  DigitalSignatureIcon,
  SpaceCatalogIcon
} from './components/icons/Icons.js';

const BASE_TABS = [
  { id: 'Overview', label: 'Overview', icon: OverviewIcon },
  { id: 'Contacts', label: 'Contacts', icon: ContactsIcon },
  { id: 'Business Address', label: 'Business Address', icon: MailboxIcon },
  { id: 'Booking', label: 'Meeting Rooms', icon: BookingIcon },
  { id: 'Invoices', label: 'Invoices', icon: InvoicesIcon },
  { id: 'Expenses', label: 'Expenses', icon: ExpensesIcon, soon: true },
  { id: 'BankReconciliation', label: 'Banks', icon: BankReconciliationIcon, soon: true },
  { id: 'CryptWallet', label: 'Crypto Wallet', icon: CryptWalletIcon, soon: true },
  { id: 'PasswordManagement', label: 'Passwords', icon: PasswordManagementIcon, soon: true },
  { id: 'DigitalSignature', label: 'Signature', icon: DigitalSignatureIcon, soon: true },
  { id: 'Integrations', label: 'Integrations', icon: IntegrationsIcon, soon: true },
  { id: 'Automation', label: 'Automation', icon: AutomationIcon, soon: true },
  { id: 'Community', label: 'Community', icon: CommunityIcon, soon: true },
  { id: 'Events', label: 'Events', icon: EventsIcon, soon: true },
  { id: 'Storage', label: 'Storage', icon: StorageIcon, soon: true },
  { id: 'Tickets', label: 'Tickets', icon: TicketsIcon, soon: true },
  { id: 'Reports', label: 'Reports', icon: ReportsIcon, soon: true },
  { id: 'Marketplace', label: 'Marketplace', icon: MarketplaceIcon, soon: true },
  { id: 'SpaceCatalog', label: 'Space Catalog', icon: SpaceCatalogIcon },
];

export const DEFAULT_TABS = BASE_TABS;

export const ADMIN_TABS = BASE_TABS.filter(tab => !tab.soon);

export const USER_TABS = BASE_TABS.filter(tab => !tab.soon && tab.id !== 'SpaceCatalog' && tab.id !== 'Contacts');
