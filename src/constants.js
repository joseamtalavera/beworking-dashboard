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
  CrmAIIcon,
  MarketingAIIcon,
  CodeAIIcon,
  CommunityAIIcon,
} from './components/icons/Icons.js';

export const TAB_GROUPS = [
  { id: null },
  { id: 'tools', i18nKey: 'sidebar.groups.tools' },
  { id: 'community', i18nKey: 'sidebar.groups.community' },
];

const BASE_TABS = [
  // Ungrouped (top)
  { id: 'Overview', label: 'Overview', icon: OverviewIcon, group: null },
  { id: 'Business Address', label: 'Business Address', icon: MailboxIcon, group: null },
  { id: 'Booking', label: 'Spaces', icon: BookingIcon, group: null },
  { id: 'Integrations', label: 'Integrations', icon: IntegrationsIcon, group: null },
  { id: 'Automation', label: 'Automation', icon: AutomationIcon, soon: true, group: null },
  { id: 'SpaceCatalog', label: 'Space Catalog', icon: SpaceCatalogIcon, group: null },
  { id: 'Reports', label: 'Reports', icon: ReportsIcon, soon: true, group: null },
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
  { id: 'AccountsAI', label: 'Accounts', icon: AccountsAIIcon, subtabs: [
    { id: 'Invoices', label: 'Invoices', icon: InvoicesIcon },
    { id: 'Expenses', label: 'Expenses', icon: ExpensesIcon, soon: true },
    { id: 'BankReconciliation', label: 'Banks', icon: BankReconciliationIcon, soon: true },
    { id: 'CryptWallet', label: 'Crypto Wallet', icon: CryptWalletIcon, soon: true },
  ]},
  { id: 'SupportAI', label: 'Support', icon: SupportAIIcon },
  { id: 'HumanResourcesAI', label: 'Human Resources', icon: HumanResourcesAIIcon },
  { id: 'ProjectsAI', label: 'Projects', icon: ProjectsAIIcon },
  { id: 'CRM', label: 'CRM', icon: CrmAIIcon, subtabs: [
    { id: 'Contacts', label: 'Contacts', icon: ContactsIcon },
  ]},
  { id: 'MarketingAI', label: 'Marketing', icon: MarketingAIIcon },
  { id: 'CodeAI', label: 'Code', icon: CodeAIIcon },
  { id: 'CommunityAI', label: 'Community', icon: CommunityAIIcon },
];

export const DEFAULT_TABS = BASE_TABS;

export const ADMIN_TABS = BASE_TABS;

export const USER_TABS = BASE_TABS.filter(tab => tab.id !== 'SpaceCatalog');
