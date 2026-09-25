// Maps raw Postgres rows to the camelCase API response shapes.
// The `audits` and `subscriptions` tables use snake_case columns;
// the frontend's AuditResult / Subscription types are camelCase.
// This is the single place that translation happens.

export interface SubscriptionRow {
  id: string
  audit_id: string
  user_id: string
  name: string
  amount: string | number
  currency: string
  frequency: string
  category: string
  last_charged: string | null
  next_charge: string | null
  active: boolean
  logo_url: string | null
}

export interface MappedSubscription {
  id: string
  name: string
  amount: number
  currency: 'NGN' | 'USD' | 'GBP'
  frequency: 'monthly' | 'quarterly' | 'annual'
  category: 'streaming' | 'software' | 'finance' | 'utilities' | 'other'
  lastCharged: string
  nextCharge?: string
  active: boolean
  logoUrl?: string
}

export function mapSubscriptionRow(row: SubscriptionRow): MappedSubscription {
  return {
    id: row.id,
    name: row.name,
    amount: typeof row.amount === 'string' ? parseFloat(row.amount) : row.amount,
    currency: (row.currency as MappedSubscription['currency']) || 'NGN',
    frequency: row.frequency as MappedSubscription['frequency'],
    category: row.category as MappedSubscription['category'],
    lastCharged: row.last_charged ?? '',
    ...(row.next_charge ? { nextCharge: row.next_charge } : {}),
    active: row.active,
    ...(row.logo_url ? { logoUrl: row.logo_url } : {}),
  }
}

export interface AuditRow {
  id: string
  user_id: string
  created_at: string
  total_subscriptions: number | null
  total_monthly_spend: string | number | null
  potential_savings: string | number | null
  duplicates: unknown
  unused_count: number | null
  file_url: string | null
  // The generated PDF report's storage URL — distinct from file_url,
  // which holds the original uploaded bank statement. Populated by
  // processAudit() after report generation completes.
  report_url: string | null
  status: 'processing' | 'complete' | 'failed'
}

export interface MappedAudit {
  id: string
  userId: string
  createdAt: string
  totalSubscriptions: number
  totalMonthlySpend: number
  potentialSavings: number
  duplicates: MappedSubscription[][]
  unusedCount: number
  reportUrl?: string
  status: 'processing' | 'complete' | 'failed'
}

function toNumber(value: string | number | null): number {
  if (value === null) return 0
  return typeof value === 'string' ? parseFloat(value) : value
}

/**
 * Maps an audit row plus its subscriptions into the full AuditResult shape.
 * `duplicates` is stored as JSONB (already parsed by node-postgres into a
 * plain array of subscription objects, snake_case) — this re-maps each
 * one through mapSubscriptionRow so the response is consistently camelCase.
 */
export function mapAuditRow(
  row: AuditRow,
  subscriptionRows: SubscriptionRow[]
): MappedAudit {
  const rawDuplicates = Array.isArray(row.duplicates)
    ? (row.duplicates as SubscriptionRow[][])
    : []

  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    totalSubscriptions: row.total_subscriptions ?? subscriptionRows.length,
    totalMonthlySpend: toNumber(row.total_monthly_spend),
    potentialSavings: toNumber(row.potential_savings),
    duplicates: rawDuplicates.map((group) => group.map(mapSubscriptionRow)),
    unusedCount: row.unused_count ?? 0,
    ...(row.report_url ? { reportUrl: row.report_url } : {}),
    status: row.status,
  }
}
