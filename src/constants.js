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
  ExpensesIcon,
  BankReconciliationIcon,
  CryptWalletIcon,
  PasswordManagementIcon,
  DigitalSignatureIcon,
  SpaceCatalogIcon,
  MariaAIIcon,
  AccountsAIIcon,
  SupportAIIcon,
  HumanResourcesAIIcon,
  ProjectsAIIcon,
  SalesAIIcon,
  MarketingAIIcon,
  CodeAIIcon,
  CommunityAIIcon,
} from './components/icons/Icons.js';

export const TAB_GROUPS = [
  { id: null },
  { id: 'sales', i18nKey: 'sidebar.groups.sales' },
  { id: 'operations', i18nKey: 'sidebar.groups.operations' },
  { id: 'finance', i18nKey: 'sidebar.groups.finance' },
  { id: 'tools', i18nKey: 'sidebar.groups.tools' },
  { id: 'community', i18nKey: 'sidebar.groups.community' },
];

const BASE_TABS = [
  // Ungrouped (top)
  { id: 'Overview', label: 'Overview', icon: OverviewIcon, group: null },
  { id: 'Business Address', label: 'Business Address', icon: MailboxIcon, group: null },
  { id: 'Booking', label: 'Spaces', icon: BookingIcon, group: null },
  // Sales
  { id: 'Contacts', label: 'Contacts', icon: ContactsIcon, group: 'sales' },
  // Operations
  { id: 'Integrations', label: 'Integrations', icon: IntegrationsIcon, group: 'operations' },
  { id: 'Automation', label: 'Automation', icon: AutomationIcon, soon: true, group: 'operations' },
  { id: 'SpaceCatalog', label: 'Space Catalog', icon: SpaceCatalogIcon, group: 'operations' },
  // Finance
  { id: 'Invoices', label: 'Invoices', icon: InvoicesIcon, group: 'finance' },
  { id: 'Expenses', label: 'Expenses', icon: ExpensesIcon, soon: true, group: 'finance' },
  { id: 'BankReconciliation', label: 'Banks', icon: BankReconciliationIcon, soon: true, group: 'finance' },
  { id: 'CryptWallet', label: 'Crypto Wallet', icon: CryptWalletIcon, soon: true, group: 'finance' },
  { id: 'Reports', label: 'Reports', icon: ReportsIcon, soon: true, group: 'finance' },
  // Tools
  { id: 'Storage', label: 'Storage', icon: StorageIcon, soon: true, group: 'tools' },
  { id: 'DigitalSignature', label: 'Signature', icon: DigitalSignatureIcon, soon: true, group: 'tools' },
  { id: 'PasswordManagement', label: 'Passwords', icon: PasswordManagementIcon, soon: true, group: 'tools' },
  { id: 'Tickets', label: 'Tickets', icon: TicketsIcon, soon: true, group: 'tools' },
  // Community
  { id: 'Community', label: 'Community', icon: CommunityIcon, soon: true, group: 'community' },
  { id: 'Events', label: 'Events', icon: EventsIcon, soon: true, group: 'community' },
];

export const DEPT_TABS = [
  { id: 'MariaAI', label: 'MariaAI', icon: MariaAIIcon, hero: true },
  { id: 'AccountsAI', label: 'Accounts', icon: AccountsAIIcon },
  { id: 'SupportAI', label: 'Support', icon: SupportAIIcon },
  { id: 'HumanResourcesAI', label: 'Human Resources', icon: HumanResourcesAIIcon },
  { id: 'ProjectsAI', label: 'Projects', icon: ProjectsAIIcon },
  { id: 'SalesAI', label: 'Sales', icon: SalesAIIcon },
  { id: 'MarketingAI', label: 'Marketing', icon: MarketingAIIcon },
  { id: 'CodeAI', label: 'Code', icon: CodeAIIcon },
  { id: 'CommunityAI', label: 'Community', icon: CommunityAIIcon },
];

export const DEFAULT_TABS = BASE_TABS;

export const ADMIN_TABS = BASE_TABS;

export const USER_TABS = BASE_TABS.filter(tab => tab.id !== 'SpaceCatalog' && tab.id !== 'Contacts');
