// Shared internal types used by the detection pipeline.
// Kept in the service layer on purpose so the API routes can stay thin.

export interface Occurrence {
  date: Date
  amount: number
  id?: string
  currency?: string
}

export interface IntervalResult {
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'irregular'
  typicalGapDays: number | null
}

export type Confidence = 'low' | 'medium' | 'high'

export interface DetectedSubscription {
  id: string
  name: string
  merchantHint: string | null
  amount: number
  currency: string
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'irregular'
  monthlyAmount: number
  yearlyAmount: number
  occurrences: number
  firstSeen: string | null
  lastPaymentDate: string | null
  estimatedNextPaymentDate: string | null
  confidence: Confidence
  status: 'active' | 'review'
}

export interface SpendingInsights {
  totalSubscriptions: number
  activeSubscriptions: number
  reviewSubscriptions: number
  totalMonthlyAmount: number
  totalYearlyAmount: number
  topSpendingCategories: Array<{ name: string; monthlyAmount: number; count: number }>
  likelyForgotten: DetectedSubscription[]
}

export interface DetectionRunResult {
  subscriptions: DetectedSubscription[]
  totalMonthlyAmount: number
  totalYearlyAmount: number
}
