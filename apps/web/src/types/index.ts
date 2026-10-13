export interface AuditResult {
  id: string
  status: 'pending' | 'processing' | 'complete' | 'failed'
  createdAt: string
  totalSubscriptions: number
  totalMonthlySpend: number
  potentialSavings: number
  subscriptions: Subscription[]
  duplicates: Subscription[][]
  unusedCount: number
  reportUrl?: string
}

export interface User {
  id: string
  email: string
  name: string
  currency: 'NGN' | 'USD' | 'EUR'
  timezone: string
  createdAt: string
}

export interface Transaction {
  id: string
  transactionDate: string
  description: string
  amount: number
  currency: string
  type: 'debit' | 'credit' | 'unknown'
  merchantHint: string | null
  category: string | null
  importId: string | null
  createdAt: string
}

export interface Subscription {
  id: string
  name: string
  amount: number
  currency: string
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual' | 'irregular'
  monthlyAmount: number
  yearlyAmount: number
  occurrences: number
  lastPaymentDate: string | null
  estimatedNextPaymentDate: string | null
  confidenceScore: number
  reason: string
  status: 'active' | 'possiblyInactive' | 'needsReview'
  merchantHint: string | null
  categories: string[]
  detectedAt: string
  createdAt: string
}

export interface Import {
  id: string
  originalFilename: string
  status: 'pending' | 'confirmed' | 'cancelled'
  rowCount: number
  validRowCount: number
  invalidRowCount: number
  chosenCurrency: string
  createdAt: string
  completedAt: string | null
}

export interface Insights {
  totalSubscriptions: number
  activeSubscriptions: number
  possiblyInactiveSubscriptions: number
  needsReviewSubscriptions: number
  totalMonthlyAmount: number
  totalYearlyAmount: number
  topSpendingCategories: Array<{ name: string; monthlyAmount: number; count: number }>
  likelyForgotten: Subscription[]
  potentialMonthlySavings: number
  potentialAnnualSavings: number
}

export interface DashboardMetrics {
  monthlyRecurringSpending: number
  estimatedAnnualRecurringSpending: number
  activeSubscriptionCount: number
  potentialMonthlySavings: number
  potentialAnnualSavings: number
  activeSubscriptions: Subscription[]
  recentlyDetected: Subscription[]
  spendingByCategory: Array<{ category: string; monthlyAmount: number; count: number; subscriptions: Subscription[] }>
  upcomingPayments: Array<{ subscription: Subscription; estimatedDate: string; daysUntil: number }>
  savingsOpportunities: Array<{
    subscription: Subscription
    reason: string
    potentialMonthlySaving: number
    potentialAnnualSaving: number
  }>
}

export interface ImportPreview {
  headers: string[]
  columnProfile: {
    date: string | null
    description: string | null
    amount: string | null
    debit: string | null
    credit: string | null
    currency: string | null
  }
  suggestedMapping: Record<string, string>
  totalRows: number
  validRowCount: number
  invalidRowCount: number
  invalidRows: Array<{ rowIndex: number; reason: string; sample: Record<string, string> }>
  validRows: Array<{
    transactionDate: string
    description: string
    amount: number
    currency: string
    type: string
    merchantHint: string | null
  }>
}

// Category configuration types (for extensibility)
export interface CategoryRule {
  id: string
  name: string
  group?: string
  priority?: number
  patterns: RegExp[]
}

export interface CategoryMatch {
  category: CategoryRule
  matchedPattern: string
  confidence: number
}

export interface CategorizedMerchant {
  merchantName: string
  description: string
  categories: CategoryRule[]
  primaryCategory: CategoryRule | null
  allMatches: CategoryMatch[]
}

// ── Audit types ─────────────────────────────────────────────────────────────
export interface AuditCategory {
  id: string
  name: string
  description: string
  icon: string | null
  sortOrder: number
}

export interface AuditSummary {
  monthlyRecurringSpending: number
  estimatedAnnualRecurringSpending: number
  activeSubscriptionCount: number
  needsReviewCount: number
  possiblyInactiveCount: number
  potentialMonthlySavings: number
  potentialAnnualSavings: number
}

export interface AuditReport {
  auditDate: string
  auditPeriodStart: string
  auditPeriodEnd: string
  userId: string
  summary: AuditSummary
  topExpenses: TopExpenseItem[]
  reviewItems: ReviewItem[]
  savingsOpportunities: SavingsOpportunityWithDedup[]
  recommendations: SavingsRecommendation[]
  calculationNotes: string[]
  empty: boolean
}

export interface TopExpenseItem {
  subscription: Subscription
  monthlyEquivalent: number
  annualEstimate: number
  calculationNote: string
  lastPaymentDate: string | null
  nextExpectedPayment: string | null
}

export interface ReviewItem {
  subscription: Subscription
  reason: string
  actions: ReviewAction[]
}

export interface ReviewAction {
  label: string
  action: 'confirm' | 'edit' | 'correctCategory' | 'markInactive' | 'dismiss' | 'viewHistory'
  href?: string
}

export interface SavingsRecommendation {
  id: string
  title: string
  subscriptionId: string | null
  subscriptionName: string | null
  categoryId: string | null
  categoryName: string | null
  explanation: string
  reason: string
  estimatedMonthlySaving: number
  estimatedAnnualSaving: number
  estimatedSavingNote: string
  action: 'review' | 'cancel' | 'consolidate' | 'correctMerchant' | 'correctCategory'
  status: 'open' | 'relevant' | 'dismissed' | 'resolved'
}

export interface SavingsOpportunityWithDedup {
  subscription: Subscription
  reason: string
  potentialMonthlySaving: number
  potentialAnnualSaving: number
  dedupKey: string
  dedupGroup: string
}

// ── Merchant registry types ─────────────────────────────────────────────────
export interface MerchantCategory {
  id: string
  name: string
  description: string
  icon: string | null
  sortOrder: number
}

export interface Merchant {
  id: string
  categoryId: string
  canonicalName: string
  website: string | null
  country: string | null
  status: string
  notes: string | null
}

export interface MerchantAlias {
  alias: string
  matchType: 'exact' | 'token' | 'fuzzy'
}

export interface TransactionMatchResult {
  transactionId: string
  originalDescription: string
  normalisedDescription: string
  isManual: boolean
  merchantName: string | null
  categoryId: string
  categoryName: string
  notes: string | null
  confidenceScore: number
  matchMethod: 'alias_exact' | 'alias_token' | 'merchant_exact' | 'manual' | 'none'
}
