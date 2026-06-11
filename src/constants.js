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
  BeKeyIcon,
  DigitalSignatureIcon,
  SpaceCatalogIcon,
  DomicilioFiscalIcon,
  ServicesIcon,
  LegalIcon,
  MariaAIIcon,
  AccountsAIIcon,
  SupportAIIcon,
  HumanResourcesAIIcon,
  ProjectsAIIcon,
  CrmAIIcon,
  MarketingAIIcon,
  CodeAIIcon,
  WebGenIcon,
  QAIcon,
  CommunityAIIcon,
} from './components/icons/Icons.js';

export const DEPT_TABS = [
  { id: 'Platform', label: 'Platform', icon: OverviewIcon, subtabs: [
    { id: 'MariaAI', label: 'MariaAI', icon: MariaAIIcon, adminOnly: true },
    { id: 'Overview', label: 'Overview', icon: OverviewIcon },
    { id: 'MyBookings', label: 'My Bookings', icon: BookingIcon, userOnly: true },
    { id: 'MyInvoices', label: 'My Invoices', icon: InvoicesIcon, userOnly: true },
    { id: 'BeKey', label: 'BeKey', icon: BeKeyIcon, landingView: true, subtabs: [
      { id: 'BeKeyAccess', label: 'Access', icon: BeKeyIcon, adminOnly: true },
    ]},
    { id: 'Services', label: 'Services', icon: ServicesIcon, adminOnly: true },
  ]},
  { id: 'Booking', label: 'Spaces', icon: SpaceCatalogIcon },
  { id: 'DomicilioFiscal', label: 'Domicilio Fiscal', icon: DomicilioFiscalIcon },
  { id: 'CRM', label: 'CRM', icon: CrmAIIcon, subtabs: [
    { id: 'Contacts', label: 'Contacts', icon: ContactsIcon },
    { id: 'Leads', label: 'Leads', icon: MarketingAIIcon, adminOnly: true },
    { id: 'Analytics', label: 'Analytics', icon: ReportsIcon, adminOnly: true },
  ]},
  { id: 'AccountsAI', label: 'Accounts', icon: AccountsAIIcon, subtabs: [
    { id: 'Invoices', label: 'Invoices', icon: InvoicesIcon },
    { id: 'Expenses', label: 'Expenses', icon: ExpensesIcon, soon: true },
    { id: 'BankReconciliation', label: 'Banks', icon: BankReconciliationIcon, soon: true },
    { id: 'CryptWallet', label: 'Crypto Wallet', icon: CryptWalletIcon, soon: true },
  ]},
  { id: 'Reports', label: 'Reports', icon: ReportsIcon, subtabs: [
    { id: 'Reconciliation', label: 'Reconciliation', icon: ReportsIcon, adminOnly: true },
    { id: 'InvoiceAudit', label: 'Invoice Audit', icon: ReportsIcon, adminOnly: true },
  ]},
  { id: 'CronJobs', label: 'Cron Jobs', icon: AutomationIcon, subtabs: [
    { id: 'EmailAutomation', label: 'Contacts & Leads', icon: AutomationIcon, adminOnly: true },
    { id: 'EmailAutomationBilling', label: 'Billing', icon: AutomationIcon, adminOnly: true },
    { id: 'BeKeyCron', label: 'Access (BeKey)', icon: AutomationIcon, adminOnly: true },
  ]},
  { id: 'Legal', label: 'Legal', icon: LegalIcon, soon: true },
  { id: 'Automation', label: 'Automation', icon: AutomationIcon, soon: true },
  { id: 'SupportAI', label: 'Support', icon: SupportAIIcon },
  { id: 'HumanResourcesAI', label: 'Human Resources', icon: HumanResourcesAIIcon },
  { id: 'ProjectsAI', label: 'Projects', icon: ProjectsAIIcon },
  { id: 'MarketingAI', label: 'Marketing', icon: MarketingAIIcon },
  { id: 'WebAI', label: 'Web', icon: CodeAIIcon, subtabs: [
    { id: 'WebGen', label: 'Site', icon: WebGenIcon, soon: true },
    { id: 'SpaceCatalog', label: 'Space Catalog', icon: SpaceCatalogIcon, adminOnly: true },
    { id: 'QA', label: 'QA', icon: QAIcon, soon: true },
  ]},
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

// Flat list of all renderable tab IDs (for AdminApp/UserApp TAB_COMPONENTS).
// Handles up to 3 levels of nesting: dept → subtab → sub-subtab.
const flattenTabIds = (node) => {
  const childIds = (node.subtabs || []).flatMap(flattenTabIds);
  return [node.id, ...childIds];
};
export const ALL_TAB_IDS = DEPT_TABS.flatMap(flattenTabIds);
