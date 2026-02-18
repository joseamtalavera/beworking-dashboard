# BeWorking Dashboard

Admin and tenant dashboard for managing bookings, contacts, invoices, mailroom, and workspace operations.

## Tech Stack

- Vite, React 19, JavaScript
- Material UI 7
- Stripe.js (payment methods, invoicing)
- i18n (ES/EN)

## Development

```bash
npm install
npm run dev
```

Or via docker-compose (runs on port 5173):

```bash
cd ../beworking-orchestration
docker-compose up beworking-dashboard
```

Copy `.env.example` to `.env` and configure variables.

### Tests

```bash
npm run test
```

## Project Structure

```text
src/
├── api/             # API client functions (bookings, contacts, invoices, stripe)
├── apps/
│   ├── admin/       # Admin app entry (AdminApp.jsx)
│   └── user/        # User app entry (UserApp.jsx)
├── components/
│   ├── tabs/        # Main feature tabs
│   │   ├── admin/   # Admin-only tabs
│   │   ├── user/    # User-only tabs
│   │   ├── Booking.jsx
│   │   ├── Community.jsx
│   │   ├── Events.jsx
│   │   ├── Expenses.jsx
│   │   ├── Integrations.jsx
│   │   ├── Marketplace.jsx
│   │   ├── Overview.jsx
│   │   ├── Storage.jsx
│   │   └── VirtualOffice.jsx
│   ├── booking/     # Booking flow (multi-step wizard)
│   ├── hooks/       # Shared component hooks
│   └── icons/       # Custom icons
├── i18n/            # Translations (es, en)
├── utils/           # Helper functions
├── theme.js         # MUI theme configuration
├── App.jsx          # Root component with routing
└── main.jsx         # Vite entry point
```

## Routes

- `/admin` — Admin dashboard (all tabs)
- `/user` — Tenant dashboard (limited tabs)

Both roles use tab-based navigation. The admin view includes contacts, invoices, bookings management, mailroom, and integrations.

## Build

```bash
npm run build
npm run preview
```

## Deployment

AWS ECS Fargate. See `../beworking-orchestration/docs/deployment/ops-runbook.md`.
