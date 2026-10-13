-- Qorvi database schema
-- Run once per environment. The app expects these tables to exist before start.
-- All financial data is scoped to user_id and must never be queried without it.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- users
-- One row per signed-in account. clerk_id is the source of truth for identity.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'NGN',
  timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_clerk_id_idx ON users (clerk_id);
CREATE INDEX IF NOT EXISTS users_email_idx ON users (email);

-- ---------------------------------------------------------------------------
-- imports
-- Each CSV upload is an import. Status drives the import workflow:
--   pending   -> parsed and validated, awaiting user confirmation
--   confirmed -> transactions saved and available for detection
--   cancelled -> discarded by the user before confirmation
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  column_mapping JSONB NOT NULL DEFAULT '{}',
  row_count INTEGER NOT NULL DEFAULT 0,
  valid_row_count INTEGER NOT NULL DEFAULT 0,
  invalid_row_count INTEGER NOT NULL DEFAULT 0,
  invalid_rows JSONB NOT NULL DEFAULT '[]',
  chosen_currency TEXT NOT NULL DEFAULT 'NGN',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS imports_user_id_idx ON imports (user_id);
CREATE INDEX IF NOT EXISTS imports_user_status_idx ON imports (user_id, status);

-- ---------------------------------------------------------------------------
-- transactions
-- Parsed, user-owned transaction rows. This is the core financial dataset.
-- amounts are stored as NUMERIC to avoid floating-point money issues.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  import_id UUID REFERENCES imports (id) ON DELETE SET NULL,

  transaction_date DATE NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  type TEXT NOT NULL DEFAULT 'unknown',

  -- Optional normalised metadata for better detection later
  merchant_hint TEXT,
  category TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transactions_user_id_idx ON transactions (user_id);
CREATE INDEX IF NOT EXISTS transactions_user_date_idx ON transactions (user_id, transaction_date);
CREATE INDEX IF NOT EXISTS transactions_user_merchant_idx ON transactions (user_id, merchant_hint);
CREATE INDEX IF NOT EXISTS transactions_import_id_idx ON transactions (import_id);

-- ---------------------------------------------------------------------------
-- subscription_occurrences
-- One row per detected repeat of a recurring pattern. Feeds subscription
-- detection and supports future "price change over time" features.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_occurrences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions (id) ON DELETE CASCADE,

  transaction_id UUID REFERENCES transactions (id) ON DELETE SET NULL,
  occurred_at DATE NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscription_occurrences_user_id_idx ON subscription_occurrences (user_id);
CREATE INDEX IF NOT EXISTS subscription_occurrences_sub_id_idx ON subscription_occurrences (subscription_id);

-- ---------------------------------------------------------------------------
-- subscriptions
-- Detected recurring payments. Confidence is an estimate, not a guarantee.
-- monthly_amount is the normalised monthly equivalent for comparison.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  import_id UUID REFERENCES imports (id) ON DELETE SET NULL,

  name TEXT NOT NULL DEFAULT '',
  merchant_hint TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  frequency TEXT NOT NULL DEFAULT 'monthly',

  monthly_amount NUMERIC NOT NULL,
  yearly_amount NUMERIC NOT NULL,

  last_payment_date DATE,
  estimated_next_payment_date DATE,

  confidence_score INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'needsReview',
  categories JSONB NOT NULL DEFAULT '["Other"]',

  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS subscriptions_user_status_idx ON subscriptions (user_id, status);
CREATE INDEX IF NOT EXISTS subscriptions_import_id_idx ON subscriptions (import_id);

-- ---------------------------------------------------------------------------
-- user_settings
-- Small per-user preferences. Kept separate from the core financial tables.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE subscriptions IS
  'Detected recurring payments. confidence_score and estimated dates are estimates, not guarantees.';
COMMENT ON TABLE subscription_occurrences IS
  'Historical detected occurrences of a subscription. Useful for price-change review later.';
COMMENT ON TABLE transactions IS
  'User-owned parsed transactions. This is the source of truth for detection and insights.';

-- ---------------------------------------------------------------------------
-- merchant_categories
-- Central category registry. Categories are data-driven so new ones can be
-- added without changing the detection engine. IDs are stable so imports and
-- user corrections keep their meaning across deploys.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merchant_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 99,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO merchant_categories (id, name, description, icon, sort_order)
SELECT * FROM (VALUES
  ('streaming',      'Streaming & Entertainment', 'Video, music and audio streaming services', 'tv-playing', 1),
  ('music',          'Music',                     'On-demand music and radio subscriptions', 'music', 2),
  ('software',       'Software & SaaS',           'Developer tools, hosting, productivity and design software', 'code-2', 3),
  ('cloud',          'Cloud Hosting & Infrastructure', 'Cloud compute, storage and infrastructure services', 'cloud', 4),
  ('telecom',        'Telecommunications & Data', 'Mobile airtime, data bundles and internet service providers', 'phone', 5),
  ('utilities',      'Utilities',                 'Electricity, water and household utility providers', 'zap', 6),
  ('insurance',      'Insurance',                 'Insurance policies and protection products', 'shield', 7),
  ('banking',        'Banking & Financial Services', 'Bank fees, transfers, fintech and financial services', 'building', 8),
  ('education',      'Education',                 'Online courses, tutoring and learning platforms', 'book-open', 9),
  ('fitness',        'Fitness & Wellness',        'Gym memberships, health clubs and wellness services', 'heart', 10),
  ('shopping',       'Shopping & Memberships',    'E-commerce, retail and membership clubs', 'shopping-cart', 11),
  ('gaming',         'Gaming',                    'Game passes, consoles and gaming subscriptions', 'controller', 12),
  ('transport',      'Transport & Mobility',      'Ride-hailing, travel and mobility services', 'car', 13),
  ('other',          'Other',                     'Catch-all for payments that do not fit a specific category', 'help-circle', 99)
) AS v(id, name, description, icon, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM merchant_categories WHERE id = v.id)

-- ---------------------------------------------------------------------------
-- merchants
-- Canonical merchant registry. This is separate from subscriptions and
-- transactions. Recognising a merchant does not mean the payment is a
-- subscription. One-off purchases from known merchants stay one-off.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id TEXT NOT NULL REFERENCES merchant_categories (id) ON DELETE RESTRICT,
  canonical_name TEXT NOT NULL,
  website TEXT,
  country TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category_id, LOWER(canonical_name))
);

CREATE INDEX IF NOT EXISTS merchants_category_id_idx ON merchants (category_id);
CREATE INDEX IF NOT EXISTS merchants_status_idx ON merchants (status);

-- ---------------------------------------------------------------------------
-- merchant_aliases
-- Alternative names and transaction-description fragments that map a
-- transaction back to a canonical merchant. Used during import and
-- categorisation. A merchant may have many aliases.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merchant_aliases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id UUID NOT NULL REFERENCES merchants (id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  match_type TEXT NOT NULL DEFAULT 'token',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (merchant_id, LOWER(alias))
);

CREATE INDEX IF NOT EXISTS merchant_aliases_alias_idx ON merchant_aliases (LOWER(alias));
CREATE INDEX IF NOT EXISTS merchant_aliases_merchant_id_idx ON merchant_aliases (merchant_id);

-- ---------------------------------------------------------------------------
-- user_merchant_overrides
-- Per-user corrections and custom merchants. These only apply to the owning
-- user and must never be applied to other users.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_merchant_overrides (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions (id) ON DELETE CASCADE,

  merchant_name TEXT NOT NULL DEFAULT '',
  category_id TEXT NOT NULL REFERENCES merchant_categories (id) ON DELETE RESTRICT,

  source TEXT NOT NULL DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, transaction_id)
);

CREATE INDEX IF NOT EXISTS user_merchant_overrides_user_id_idx ON user_merchant_overrides (user_id);
CREATE INDEX IF NOT EXISTS user_merchant_overrides_transaction_id_idx ON user_merchant_overrides (transaction_id);

-- ---------------------------------------------------------------------------
-- merchant_match_audit
-- Lightweight audit trail for categorisation decisions. Enough to debug
-- incorrect matches and support future explainability features without
-- re-deriving everything from raw transactions.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS merchant_match_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions (id) ON DELETE CASCADE,

  original_description TEXT NOT NULL,
  normalised_description TEXT NOT NULL,

  matched_merchant_id UUID REFERENCES merchants (id) ON DELETE SET NULL,
  matched_merchant_name TEXT,
  matched_alias TEXT,
  matching_method TEXT NOT NULL DEFAULT 'none',

  category_id TEXT NOT NULL REFERENCES merchant_categories (id) ON DELETE RESTRICT,
  category_name TEXT NOT NULL,
  confidence_score NUMERIC NOT NULL DEFAULT 0,

  is_manual BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS merchant_match_audit_user_id_idx ON merchant_match_audit (user_id);
CREATE INDEX IF NOT EXISTS merchant_match_audit_transaction_id_idx ON merchant_match_audit (transaction_id);
