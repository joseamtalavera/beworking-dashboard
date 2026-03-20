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

export const DEPT_TABS = [
  { id: 'MariaAI', label: 'MariaAI', icon: MariaAIIcon, hero: true },
  { id: 'Platform', label: 'Platform', icon: OverviewIcon, subtabs: [
    { id: 'Overview', label: 'Overview', icon: OverviewIcon },
    { id: 'Business Address', label: 'Business Address', icon: MailboxIcon },
    { id: 'Booking', label: 'Spaces', icon: BookingIcon },
    { id: 'Integrations', label: 'Integrations', icon: IntegrationsIcon },
    { id: 'Automation', label: 'Automation', icon: AutomationIcon, soon: true },
    { id: 'SpaceCatalog', label: 'Space Catalog', icon: SpaceCatalogIcon, adminOnly: true },
    { id: 'Reports', label: 'Reports', icon: ReportsIcon, soon: true },
  ]},
  { id: 'SupportAI', label: 'Support', icon: SupportAIIcon },
  { id: 'CRM', label: 'CRM', icon: CrmAIIcon, subtabs: [
    { id: 'Contacts', label: 'Contacts', icon: ContactsIcon },
  ]},
  { id: 'AccountsAI', label: 'Accounts', icon: AccountsAIIcon, subtabs: [
    { id: 'Invoices', label: 'Invoices', icon: InvoicesIcon },
    { id: 'Expenses', label: 'Expenses', icon: ExpensesIcon, soon: true },
    { id: 'BankReconciliation', label: 'Banks', icon: BankReconciliationIcon, soon: true },
    { id: 'CryptWallet', label: 'Crypto Wallet', icon: CryptWalletIcon, soon: true },
  ]},
  { id: 'HumanResourcesAI', label: 'Human Resources', icon: HumanResourcesAIIcon },
  { id: 'ProjectsAI', label: 'Projects', icon: ProjectsAIIcon },
  { id: 'MarketingAI', label: 'Marketing', icon: MarketingAIIcon },
  { id: 'CodeAI', label: 'Code', icon: CodeAIIcon },
  { id: 'CommunityAI', label: 'Community', icon: CommunityAIIcon, subtabs: [
    { id: 'Events', label: 'Events', icon: EventsIcon, soon: true },
  ]},
  { id: 'Tools', label: 'Tools', icon: StorageIcon, subtabs: [
    { id: 'Storage', label: 'Storage', icon: StorageIcon, soon: true },
    { id: 'DigitalSignature', label: 'Signature', icon: DigitalSignatureIcon, soon: true },
    { id: 'PasswordManagement', label: 'Passwords', icon: PasswordManagementIcon, soon: true },
    { id: 'Tickets', label: 'Tickets', icon: TicketsIcon, soon: true },
  ]},
];

// Flat list of all renderable tab IDs (for AdminApp/UserApp TAB_COMPONENTS)
export const ALL_TAB_IDS = DEPT_TABS.flatMap(d => [d.id, ...(d.subtabs?.map(s => s.id) || [])]);
