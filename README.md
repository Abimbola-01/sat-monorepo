# Qorvi

**See More. Spend Less.**

Qorvi is a personal finance subscription and recurring-payment auditor. The first version is designed for Nigerian users and is built to support other regions later.

The product helps users understand recurring payments by analysing transaction data they upload themselves. In this MVP:

- Users sign up and log in.
- Users import a transaction CSV from their bank.
- The application validates and parses the CSV and shows a preview.
- Users can cancel before saving anything.
- A rule-based engine detects likely recurring payments and subscriptions.
- Users can review monthly/yearly costs, categories, and savings opportunities.
- Users can manage settings and delete their data.

Qorvi does **not** connect to bank accounts, does **not** move money, and does **not** use AI to make financial decisions in this MVP.

## Architecture

```
apps/
  api/        Express API (auth, imports, transactions, subscriptions, insights, settings)
  web/        Next.js 16 app (landing, dashboard, transactions, subscriptions, settings)
```

### Backend

- Runtime: Node.js >= 22
- Framework: Express
- Auth: Clerk (JWT verification via `@clerk/backend`)
- Database: PostgreSQL
- CSV parsing: `csv-parse`
- File upload: `multer` (CSV only in MVP)

Key backend modules:

- `src/config/database.ts` — PostgreSQL pool and Supabase client setup. Supabase client is
  kept in the codebase but is **not used** by the current MVP import/detection flow.
- `src/db/schema.sql` — Qorvi schema: users, imports, transactions, subscription_occurrences,
  subscriptions, user_settings.
- `src/db/runMigrations.ts` — applies `schema.sql` on startup.
- `src/db/userQueries.ts` — user lookup / creation scoped by `clerk_id`.
- `src/services/csvImporter.ts` — column detection, validation, malformed-row reporting,
  preview building.
- `src/services/recurringDetection.ts` — rule-based recurring-payment detection and insights.
- `src/routes/*` — imports, transactions, subscriptions, insights, settings.

### Frontend

- Framework: Next.js 16 with app router
- UI: React components, Tailwind CSS 4, Lucide icons, Sonner toasts
- Auth: Clerk (`@clerk/nextjs`)
- HTTP client: axios against the Express API

Key frontend modules:

- `src/lib/api.ts` — API client for the Qorvi endpoints.
- `src/hooks/useQorvi.ts` — React hooks for imports, transactions, subscriptions, insights,
  settings.
- `src/types/index.ts` — shared frontend types.
- `src/app/(marketing)/` — landing page and marketing layout.
- `src/app/(dashboard)/` — authenticated dashboard, transactions, subscriptions, upload,
  settings.

## Data model

All financial data is scoped to `user_id` and must be queried with that scope.

### users

One row per signed-in account. `clerk_id` is the source of truth for identity.

### imports

Each CSV upload is an import with status:

- `pending` — parsed, awaiting confirmation
- `confirmed` — saved
- `cancelled` — discarded

Stores column mapping, row counts, invalid rows, and chosen currency.

### transactions

Parsed, user-owned transaction rows. Amounts are `NUMERIC`. Includes `import_id` so rows can
be traced back to the import they came from.

### subscription_occurrences

One row per detected repeat of a recurring pattern. Useful for future price-change review.

### subscriptions

Detected recurring payments. Includes:

- merchant name / hint
- amount / currency
- frequency
- monthly and yearly equivalents
- last payment date
- estimated next payment date
- confidence score (`low`, `medium`, `high`)
- status (`active`, `review`)

Confidence and estimated dates are estimates, not guarantees.

### user_settings

Small per-user preferences.

## API

### Auth

- `GET /api/me` — current user identity (requires Bearer token)

### Imports

- `POST /api/imports/upload` — upload a CSV and get a preview
- `POST /api/imports/confirm` — save a confirmed import + its valid transactions
- `POST /api/imports/:importId/cancel` — cancel a pending import
- `GET /api/imports` — list imports for the current user

### Transactions

- `GET /api/transactions` — list transactions for the current user
- `DELETE /api/transactions/:id` — delete one transaction
- `DELETE /api/transactions` — clear all transactions for the current user

### Subscriptions

- `GET /api/subscriptions` — list detected subscriptions for the current user
- `POST /api/subscriptions/detect` — re-run detection from current transactions
- `DELETE /api/subscriptions/:id` — remove one subscription

### Insights

- `GET /api/insights` — deterministic subscription and spending insights

### Settings

- `GET /api/settings` — account settings
- `PATCH /api/settings` — update name, currency, timezone, preferences
- `DELETE /api/settings/data` — clear all financial data for the current user

## Setup

### Prerequisites

- Node.js >= 22
- PostgreSQL
- A Clerk project (sign-in/sign-up)

### Backend

```
cd apps/api
npm install
cp .env.example .env
# Edit .env with your DB + Clerk values
npm run dev
```

On first start, the app runs `schema.sql` against the configured PostgreSQL database.

### Frontend

```
cd apps/web
npm install
cp .env.local.example .env.local
# Edit .env.local with your Clerk publishable key and API URL
npm run dev
```

Open `http://localhost:3000`.

## CSV import format

Qorvi does not assume one bank format. It detects likely columns for:

- transaction date
- description / narration
- amount
- debit / credit
- currency

It accepts CSVs that have at least a date column and an amount source. Amount sources can be:

- a single amount column, or
- separate debit and credit columns

Malformed rows are reported in the preview so the user can decide whether to continue.

Future bank formats can be added by extending the column-detection logic in `csvImporter.ts`.

## Recurring detection

Detection is rule-based and intentionally conservative:

- Group transactions by a normalised merchant key.
- Check amount consistency within each group.
- Estimate the interval from observed dates.
- Classify frequency as weekly, monthly, quarterly, annual, or irregular.
- Compute monthly and yearly equivalents.
- Assign a confidence estimate based on occurrence count, interval clarity, and amount
  consistency.

Confidence and estimated next-payment dates are estimates, not guarantees.

## Security

- Authentication is handled by Clerk. The backend verifies the Bearer token.
- Every financial query is scoped to the authenticated user.
- Imported files are processed temporarily and are not stored after parsing.
- Users can delete transactions, subscriptions, and import history.
- No bank login credentials are requested.

## Limitations

This is an MVP.

- No bank integrations.
- No AI-based financial decisions.
- Detection confidence is an estimate.
- Savings opportunities are estimates based on detected patterns.
- Category inference is a simple heuristic and can be improved later.

## Future work

- More bank CSV profiles.
- Better merchant normalisation and fuzzy matching.
- Explicit categorization UI.
- Price-change detection over time using `subscription_occurrences`.
- Optional AI-assisted suggestions that do not make financial decisions autonomously.
- International currency and region support.

## Naming

The product is Qorvi. The earlier working name was SAT. Code and copy in this repository have
been updated to Qorvi for the MVP.
