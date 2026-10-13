// Pool is imported dynamically to allow test injection
import { testPool as testDb } from '../db/sqlitePool'
import { 
  DEFAULT_CATEGORY_RULES,
  inferCategories,
  getPrimaryCategory,
  categoryToName,
} from './categoryConfig'

interface QueryablePool {
  query(sql: string, params?: unknown[]): Promise<{ rows: unknown[]; rowCount?: number }>
}

let cachedPool: any = null
const getPool = (): any => {
  if (cachedPool) return cachedPool
  try {
    cachedPool = require('../config/database').pool
    return cachedPool
  } catch {
    return null
  }
}


// ── Public types ──────────────────────────────────────────────────────────
export type DetectedFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual' | 'irregular'
export type ConfidenceBand = 'low' | 'medium' | 'high'
export type SubscriptionStatus = 'active' | 'possiblyInactive' | 'needsReview'

export interface DetectedSubscription {
  band: "low" | "medium" | "high"
  id: string
  name: string
  merchantHint: string | null
  amount: number
  currency: string
  frequency: DetectedFrequency
  monthlyAmount: number
  yearlyAmount: number
  occurrences: number
  firstSeen: string | null
  lastPaymentDate: string | null
  estimatedNextPaymentDate: string | null
  confidenceScore: number
  reason: string
  status: SubscriptionStatus
  likelyDirection: 'debit' | 'credit' | 'unknown'
  categories: string[]
}

export interface DetectionEvidence {
  occurrences: number
  frequency: DetectedFrequency
  typicalGapDays: number | null
  gapDeviation: number
  amountVariationPercent: number
  amountConsistent: boolean
  directionConsistent: boolean
  lastPaymentDaysAgo: number
  confidenceScore: number
  band: ConfidenceBand
  reason: string
  directionLabel: 'debit' | 'credit' | 'unknown'
  frequencyEvidence: FrequencyEvidence
}

export interface FrequencyEvidence {
  detected: DetectedFrequency
  typicalGapDays: number | null
  gapMatches: { expected: number; actual: number }[]
  gapDeviation: number
  intervalConfidence: number
}

export interface SpendingInsights {
  totalSubscriptions: number
  activeSubscriptions: number
  possiblyInactiveSubscriptions: number
  needsReviewSubscriptions: number
  totalMonthlyAmount: number
  totalYearlyAmount: number
  topSpendingCategories: Array<{ name: string; monthlyAmount: number; count: number }>
  likelyForgotten: DetectedSubscription[]
  potentialMonthlySavings: number
  potentialAnnualSavings: number
}

export interface DashboardMetrics {
  monthlyRecurringSpending: number
  estimatedAnnualRecurringSpending: number
  activeSubscriptionCount: number
  potentialMonthlySavings: number
  potentialAnnualSavings: number
  activeSubscriptions: DetectedSubscription[]
  recentlyDetected: DetectedSubscription[]
  spendingByCategory: Array<{ category: string; monthlyAmount: number; count: number; subscriptions: DetectedSubscription[] }>
  upcomingPayments: Array<{ subscription: DetectedSubscription; estimatedDate: string; daysUntil: number }>
  savingsOpportunities: SavingsOpportunity[]
}

export interface SavingsOpportunity {
  subscription: DetectedSubscription
  reason: string
  potentialMonthlySaving: number
  potentialAnnualSaving: number
}

// ── Constants ─────────────────────────────────────────────────────────────
const AMOUNT_TOLERANCE = 0.15
const NOISE_WORDS = new Set([
  'debit', 'credit', 'transfer', 'payment', 'transaction', 'chq', 'cheque',
  'card', 'pos', 'online', 'inst', 'w/d', 'wd', 'deposit', 'withdrawal',
  'fee', 'charge', 'reversed', 'refund', 'adjustment', 'purchase', 'buy',
  'order', 'payment Ref', 'ref', 'pos transaction', 'subscription',
])

// ── Merchant similarity ───────────────────────────────────────────────────
function merchantKey(raw: string): string {
  const s = String(raw).trim().toLowerCase()
  let cleaned = s
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const words = cleaned.split(' ')
  const kept = words.filter((w) => !NOISE_WORDS.has(w) && w.length > 0)
  cleaned = kept.join(' ').trim()
  return cleaned.slice(0, 80) || s.slice(0, 80)
}

export function merchantsMatch(a: string, b: string): boolean {
  return merchantKey(a) === merchantKey(b)
}

// ── Date helpers ──────────────────────────────────────────────────────────
function daysBetween(a: Date, b: Date): number {
  const ms = Math.abs(b.getTime() - a.getTime())
  return ms / (1000 * 60 * 60 * 24)
}

function nextPaymentDate(last: Date, frequency: DetectedFrequency): Date {
  const ms = last.getTime()
  switch (frequency) {
    case 'weekly': return new Date(ms + 7 * 24 * 60 * 60 * 1000)
    case 'biweekly': return new Date(ms + 14 * 24 * 60 * 60 * 1000)
    case 'monthly': return new Date(ms + 30 * 24 * 60 * 60 * 1000)
    case 'quarterly': return new Date(ms + 91 * 24 * 60 * 60 * 1000)
    case 'annual': return new Date(ms + 365 * 24 * 60 * 60 * 1000)
    default: return new Date(ms + 30 * 24 * 60 * 60 * 1000)
  }
}

function monthlyEquivalent(amount: number, frequency: DetectedFrequency): number {
  switch (frequency) {
    case 'weekly': return amount * 4.33
    case 'biweekly': return amount * 2.165
    case 'monthly': return amount
    case 'quarterly': return amount / 3
    case 'annual': return amount / 12
    default: return amount
  }
}

function yearlyEquivalent(amount: number, frequency: DetectedFrequency): number {
  return monthlyEquivalent(amount, frequency) * 12
}

// ── Amount variation ──────────────────────────────────────────────────────
function amountVariationPercent(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  if (mean <= 0) return 100
  const maxDev = Math.max(...values.map((v) => Math.abs(v - mean) / mean))
  return maxDev * 100
}

function describeAmountVariation(pct: number): string {
  if (pct <= 5) return 'very consistent amounts'
  if (pct <= 15) return 'mostly consistent amounts within about ' + pct.toFixed(0) + '% variance'
  if (pct <= 30) return 'variable amounts within about ' + pct.toFixed(0) + '% variance'
  return 'wide amount variation of about ' + pct.toFixed(0) + '%'
}

// ── Interval estimation ───────────────────────────────────────────────────
const FREQUENCY_CANDIDATES: Array<{ frequency: DetectedFrequency; expectedDays: number }> = [
  { frequency: 'weekly', expectedDays: 7 },
  { frequency: 'biweekly', expectedDays: 14 },
  { frequency: 'monthly', expectedDays: 30 },
  { frequency: 'quarterly', expectedDays: 91 },
  { frequency: 'annual', expectedDays: 365 },
]

function estimateInterval(dates: Date[]): FrequencyEvidence {
  if (dates.length < 2) {
    return { detected: 'irregular', typicalGapDays: null, gapMatches: [], gapDeviation: 0, intervalConfidence: 0 }
  }

  const sorted = dates.slice().sort((a, b) => a.getTime() - b.getTime())
  const gaps: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    const gap = daysBetween(sorted[i - 1], sorted[i])
    if (gap > 0) gaps.push(gap)
  }

  if (gaps.length === 0) {
    return { detected: 'irregular', typicalGapDays: null, gapMatches: [], gapDeviation: 0, intervalConfidence: 0 }
  }

  const avg = gaps.reduce((s, v) => s + v, 0) / gaps.length

  let best: { frequency: DetectedFrequency; expected: number; matched: number; score: number } | null = null

  for (const c of FREQUENCY_CANDIDATES) {
    const within = gaps.filter((g) => Math.abs(g - c.expectedDays) / c.expectedDays <= 0.22)
    if (within.length === 0) continue
    const score = within.length / gaps.length
    if (!best || score > best.score || (score === best.score && within.length > best.matched)) {
      best = { frequency: c.frequency, expected: c.expectedDays, matched: within.length, score }
    }
  }

  if (!best) {
    const uniqueGaps = new Set(gaps.map((g) => Math.round(g)))
    if (uniqueGaps.size <= 2 && gaps.length >= 3) {
      if (avg >= 20 && avg <= 45) {
        return { detected: 'monthly', typicalGapDays: 30, gapMatches: [], gapDeviation: 0, intervalConfidence: 0.4 }
      }
      if (avg >= 5 && avg <= 14) {
        return { detected: 'weekly', typicalGapDays: 7, gapMatches: [], gapDeviation: 0, intervalConfidence: 0.4 }
      }
    }
    return { detected: 'irregular', typicalGapDays: null, gapMatches: [], gapDeviation: 0, intervalConfidence: 0 }
  }

  const gapMatches = gaps.map((g) => ({ expected: best.expected, actual: Math.round(g * 10) / 10 }))
  const squaredDeviations = gapMatches.reduce((s, m) => s + Math.pow(m.actual - m.expected, 2), 0)
  const gapDeviation = Math.sqrt(squaredDeviations / Math.max(1, gapMatches.length))
  const intervalConfidence = Math.min(1, best.matched / Math.max(1, gaps.length) * 1.2)

  return { detected: best.frequency, typicalGapDays: best.expected, gapMatches, gapDeviation, intervalConfidence }
}

// ── Category inference ────────────────────────────────────────────────────
// Use extensible category configuration
export function inferCategory(name: string, merchantHint: string): string {
  const matched = inferCategories(name, merchantHint, DEFAULT_CATEGORY_RULES)
  return matched.length > 0 ? matched[0].name : 'Other'
}

// ── Confidence scoring ────────────────────────────────────────────────────
function confidenceBand(score: number): ConfidenceBand {
  if (score >= 70) return 'high'
  if (score >= 45) return 'medium'
  return 'low'
}

export function computeConfidenceScore(occurrences: Array<{ date: Date; amount: number; debit: boolean; credit: boolean }>): DetectionEvidence {
  if (occurrences.length < 2) {
    return {
      occurrences: 0, frequency: 'irregular', typicalGapDays: null, gapDeviation: 0,
      amountVariationPercent: 0, amountConsistent: false, directionConsistent: false,
      lastPaymentDaysAgo: 0, confidenceScore: 0, band: 'low',
      reason: 'Not enough transactions to detect a pattern.',
      directionLabel: 'unknown',
      frequencyEvidence: { detected: 'irregular', typicalGapDays: null, gapMatches: [], gapDeviation: 0, intervalConfidence: 0 },
    }
  }

  const sorted = occurrences.slice().sort((a, b) => a.date.getTime() - b.date.getTime())
  const dates = sorted.map((o) => o.date)
  const amounts = sorted.map((o) => o.amount)
  const lastSeen = sorted[sorted.length - 1].date

  const frequencyEvidence = estimateInterval(dates)
  const gapDeviation = frequencyEvidence.gapDeviation
  const amountVariation = amountVariationPercent(amounts)
  const amountConsistent = frequencyEvidence.detected !== 'irregular' && amountVariation <= AMOUNT_TOLERANCE * 100
  const directionConsistent = sorted.every((o) => o.debit === sorted[0].debit)
  const debitCount = sorted.filter((o) => o.debit).length
  const creditCount = sorted.filter((o) => o.credit).length
  const directionLabel = debitCount >= creditCount ? 'debit' : 'credit'
  const likelyDirection = directionConsistent ? directionLabel : 'unknown'

  const now = new Date()
  const lastPaymentDaysAgo = Math.floor(daysBetween(lastSeen, now))

  const frequency = frequencyEvidence.detected
  let score = 0
  const reasons: string[] = []
  const occCount = occurrences.length

  switch (frequency) {
    case 'weekly': score += 18; break
    case 'biweekly': score += 20; break
    case 'monthly': score += 22; break
    case 'quarterly': score += 22; break
    case 'annual': score += 24; break
    default: reasons.push('No clear repeat interval was detected'); break
  }

  if (frequency === 'annual') {
    if (occCount >= 3) score += 20
    else if (occCount >= 2) score += 12
  } else if (frequency === 'quarterly') {
    if (occCount >= 5) score += 20
    else if (occCount >= 4) score += 16
    else if (occCount >= 3) score += 10
    else if (occCount >= 2) score += 6
  } else if (frequency === 'monthly') {
    if (occCount >= 10) score += 20
    else if (occCount >= 8) score += 18
    else if (occCount >= 6) score += 16
    else if (occCount >= 4) score += 12
    else if (occCount >= 3) score += 8
    else if (occCount >= 2) score += 4
  } else if (frequency === 'biweekly') {
    if (occCount >= 8) score += 20
    else if (occCount >= 6) score += 16
    else if (occCount >= 4) score += 12
    else if (occCount >= 3) score += 8
    else if (occCount >= 2) score += 4
  } else if (frequency === 'weekly') {
    if (occCount >= 10) score += 20
    else if (occCount >= 8) score += 18
    else if (occCount >= 6) score += 16
    else if (occCount >= 4) score += 12
    else if (occCount >= 3) score += 8
    else if (occCount >= 2) score += 4
  }

  if (amountConsistent) score += 15
  else if (amountVariation <= 30) score += 8
  else if (amountVariation <= 50) score += 3

  if (frequency !== 'irregular') {
    if (gapDeviation <= 3) score += 10
    else if (gapDeviation <= 7) score += 6
    else if (gapDeviation <= 14) score += 3
  }

  if (directionConsistent && likelyDirection === 'debit') score += 5
  else if (directionConsistent) score += 2

  if (lastPaymentDaysAgo <= 30) score += 5
  else if (lastPaymentDaysAgo <= 60) score += 4
  else if (lastPaymentDaysAgo <= 90) score += 2
  else if (lastPaymentDaysAgo > 180 && occurrences.length >= 4) score -= 8

  if (!directionConsistent) {
    score = Math.min(score, 45)
    reasons.push('transaction directions were mixed (some debits, some credits)')
  }

  if (frequency === 'irregular' && occurrences.length >= 3) {
    score = Math.min(score, 30)
  }

  if (occurrences.length < 3 && frequency !== 'irregular' && frequency !== 'annual' && frequency !== 'quarterly') {
    score = Math.min(score, 40)
  }

  score = Math.max(0, Math.min(100, Math.round(score)))
  const band = confidenceBand(score)

  if (frequency === 'irregular' || score < 35) {
    reasons.unshift('Not clearly recurring')
  } else {
    const freqText: Record<DetectedFrequency, string> = {
      weekly: 'weekly', biweekly: 'every two weeks', monthly: 'monthly',
      quarterly: 'every three months', annual: 'yearly', irregular: 'irregular',
    }
    const occText = occurrences.length === 1 ? 'appeared once' : 'appeared ' + occurrences.length + ' times'
    reasons.unshift(
      `Detected as recurring because this merchant ${occText} with ${describeAmountVariation(amountVariation)} ` +
      `at approximately ${freqText[frequency]} intervals (${Math.round(frequencyEvidence.typicalGapDays ?? 0)}-day spacing).`
    )
  }

  if (frequency !== 'irregular' && score >= 35) {
    const directionNote = likelyDirection === 'debit' ? 'Money flowing out.' : likelyDirection === 'credit' ? 'Money flowing in.' : 'Mixed directions.'
    reasons.push(directionNote)
  }

  const reason = reasons.join(' ') + '.'

  return {
    occurrences: sorted.length, frequency, typicalGapDays: frequencyEvidence.typicalGapDays,
    gapDeviation, amountVariationPercent: Math.round(amountVariation * 10) / 10,
    amountConsistent, directionConsistent, lastPaymentDaysAgo, confidenceScore: score,
    band, reason, directionLabel: likelyDirection,
    frequencyEvidence,
  }
}

// ── Helper functions ──────────────────────────────────────────────────────
function bestDisplayName(occurrences: Array<{ description: string }>, key: string): string {
  const candidate = key.trim()
  if (candidate.length >= 2) {
    const cleaned = candidate.replace(/^unknown/i, '').trim()
    return cleaned || 'Recurring payment'
  }
  return 'Recurring payment'
}

function determineStatus(evidence: DetectionEvidence): SubscriptionStatus {
  if (evidence.band === 'high' && evidence.lastPaymentDaysAgo <= 45) return 'active'
  if (evidence.band === 'high') return 'active'
  if (evidence.band === 'medium' && evidence.lastPaymentDaysAgo <= 75) return 'active'
  if (evidence.occurrences >= 3 && evidence.lastPaymentDaysAgo > 180) return 'possiblyInactive'
  if (evidence.band === 'low') return 'needsReview'
  if (evidence.lastPaymentDaysAgo > 120) return 'possiblyInactive'
  return 'needsReview'
}

// ── Types for DB operations ──────────────────────────────────────────────
interface OccurrenceInput {
  date: Date
  amount: number
  id?: string
  currency?: string
  description: string
  debit: boolean
  credit: boolean
}

interface CandidateSub {
  name: string
  merchantHint: string | null
  amount: number
  currency: string
  frequency: DetectedFrequency
  monthlyAmount: number
  yearlyAmount: number
  occurrences: number
  firstSeen: string | null
  lastPaymentDate: string | null
  estimatedNextPaymentDate: string | null
  confidenceScore: number
  reason: string
  status: SubscriptionStatus
  likelyDirection: 'debit' | 'credit' | 'unknown'
  categories: string[]
  evidence: DetectionEvidence
  occurrenceData: OccurrenceInput[]
}

export interface DetectionRunResult {
  subscriptions: DetectedSubscription[]
  totalMonthlyAmount: number
  totalYearlyAmount: number
  newSubscriptions: DetectedSubscription[]
  existingIds: string[]
}

export async function detectRecurringPayments(userId: string, usePool: QueryablePool = getPool() || testDb): Promise<DetectionRunResult> {
  const rowsRaw = await usePool.query(
    'SELECT id, description, amount, currency, transaction_date, type FROM transactions WHERE user_id = $1 ORDER BY transaction_date ASC, id ASC',
    [userId]
  )
  
  type Row = { id: string; description: string; amount: string | number; currency: string; transaction_date: string; type: string }
  const rows: Row[] = (rowsRaw.rows as unknown) as Row[]

  const payments = rows
    .filter((r) => {
      const amount = typeof r.amount === 'string' ? parseFloat(r.amount) : r.amount
      return Number.isFinite(amount) && amount > 0
    })
    .map((r) => {
      const amount = typeof r.amount === 'string' ? parseFloat(r.amount) : r.amount
      const t = String(r.type || '').toLowerCase()
      const debit = t.includes('debit') || (amount < 0)
      const credit = t.includes('credit') || amount > 0
      return { id: r.id, description: r.description, amount, currency: (r.currency || 'NGN').toUpperCase(), date: new Date(r.transaction_date), debit, credit }
    })

  if (payments.length === 0) {
    return { subscriptions: [], totalMonthlyAmount: 0, totalYearlyAmount: 0, newSubscriptions: [], existingIds: [] }
  }

  const groups = new Map<string, OccurrenceInput[]>()
  for (const p of payments) {
    const key = merchantKey(p.description)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push({ date: p.date, amount: p.amount, id: p.id, currency: p.currency, description: p.description, debit: p.debit, credit: p.credit })
  }

  const candidates = Array.from(groups.entries())
    .filter(([, occ]) => occ.length >= 2)
    .map(([key, occ]) => {
      const evidence = computeConfidenceScore(occ)
      if (!evidence || evidence.confidenceScore < 20) return null

      const typicalAmount = occ.reduce((s, o) => s + o.amount, 0) / occ.length
      const monthlyAmount = monthlyEquivalent(typicalAmount, evidence.frequency)
      const yearlyAmount = yearlyEquivalent(typicalAmount, evidence.frequency)
      const status = determineStatus(evidence)
      const name = bestDisplayName(occ, key)
      const category = inferCategory(name, key)

      return {
        name, merchantHint: key, amount: typicalAmount, currency: occ[0].currency || 'NGN',
        frequency: evidence.frequency, monthlyAmount, yearlyAmount,
        occurrences: evidence.occurrences, firstSeen: occ[0].date.toISOString().slice(0, 10),
        lastPaymentDate: occ[occ.length - 1].date.toISOString().slice(0, 10),
        estimatedNextPaymentDate: nextPaymentDate(occ[occ.length - 1].date, evidence.frequency).toISOString().slice(0, 10),
        confidenceScore: evidence.confidenceScore, reason: evidence.reason, status,
        likelyDirection: evidence.directionConsistent ? evidence.directionLabel : 'unknown',
        categories: [category], evidence, occurrenceData: occ,
      }
    })
    .filter(Boolean) as CandidateSub[]

  const sorted = candidates.sort((a, b) => {
    const statusOrder: Record<SubscriptionStatus, number> = { active: 0, possiblyInactive: 1, needsReview: 2 }
    if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status]
    if (a.confidenceScore !== b.confidenceScore) return b.confidenceScore - a.confidenceScore
    if (a.occurrences !== b.occurrences) return b.occurrences - a.occurrences
    return b.monthlyAmount - a.monthlyAmount
  })

  const savedSubscriptions: DetectedSubscription[] = []

  for (const c of sorted) {
    const result = await usePool.query(
      `INSERT INTO subscriptions (user_id, name, merchant_hint, amount, currency, frequency, monthly_amount, yearly_amount, last_payment_date, estimated_next_payment_date, confidence_score, reason, status, categories, detected_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, datetime('now')) RETURNING id`,
      [userId, c.name, c.merchantHint, c.amount, c.currency, c.frequency, c.monthlyAmount, c.yearlyAmount, c.lastPaymentDate || null, c.estimatedNextPaymentDate || null, c.confidenceScore, c.reason, c.status, JSON.stringify(c.categories)]
    )

    const subId = (result.rows[0] as { id: string }).id

    for (const p of c.occurrenceData) {
      await usePool.query(
        `INSERT INTO subscription_occurrences (user_id, subscription_id, transaction_id, occurred_at, amount, currency)
         VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
        [userId, subId, p.id || null, p.date.toISOString().slice(0, 10), p.amount, p.currency || 'NGN']
      )
    }

    savedSubscriptions.push({
      id: subId, name: c.name, merchantHint: c.merchantHint, amount: c.amount, currency: c.currency,
      frequency: c.frequency, monthlyAmount: c.monthlyAmount, yearlyAmount: c.yearlyAmount,
      occurrences: c.occurrences, firstSeen: c.firstSeen, lastPaymentDate: c.lastPaymentDate,
      estimatedNextPaymentDate: c.estimatedNextPaymentDate, confidenceScore: c.confidenceScore,
      reason: c.reason, status: c.status, likelyDirection: c.likelyDirection, categories: c.categories, band: c.evidence.band,
    })
  }

  const totalMonthlyAmount = savedSubscriptions.reduce((s, x) => s + x.monthlyAmount, 0)
  const totalYearlyAmount = savedSubscriptions.reduce((s, x) => s + x.yearlyAmount, 0)

  return { subscriptions: savedSubscriptions, totalMonthlyAmount, totalYearlyAmount, newSubscriptions: savedSubscriptions, existingIds: [] }
}

// ── Spending insights ─────────────────────────────────────────────────────
export async function computeSpendingInsights(userId: string, usePool: QueryablePool = getPool() || testDb): Promise<SpendingInsights> {
  const result = await detectRecurringPayments(userId, usePool)

  const active = result.subscriptions.filter((s) => s.status === 'active').length
  const possiblyInactive = result.subscriptions.filter((s) => s.status === 'possiblyInactive').length
  const needsReview = result.subscriptions.filter((s) => s.status === 'needsReview').length

  const likelyForgotten = result.subscriptions
    .filter((s) => s.status !== 'active' && s.lastPaymentDate)
    .sort((a, b) => {
      const aDays = daysBetween(new Date(a.lastPaymentDate!), new Date())
      const bDays = daysBetween(new Date(b.lastPaymentDate!), new Date())
      return bDays - aDays
    })
    .slice(0, 5)

  const categoryMap = new Map<string, { monthlyAmount: number; count: number }>()
  for (const s of result.subscriptions) {
    for (const cat of s.categories) {
      const existing = categoryMap.get(cat) ?? { monthlyAmount: 0, count: 0 }
      categoryMap.set(cat, { monthlyAmount: existing.monthlyAmount + s.monthlyAmount, count: existing.count + 1 })
    }
  }

  const topSpendingCategories = Array.from(categoryMap.entries())
    .map(([name, vals]) => ({ name, monthlyAmount: vals.monthlyAmount, count: vals.count }))
    .sort((a, b) => b.monthlyAmount - a.monthlyAmount)
    .slice(0, 6)

  const potentialMonthlySavings = result.subscriptions
    .filter((s) => s.status === 'possiblyInactive' || s.status === 'needsReview')
    .reduce((s, sub) => s + sub.monthlyAmount, 0)

  return {
    totalSubscriptions: result.subscriptions.length, activeSubscriptions: active,
    possiblyInactiveSubscriptions: possiblyInactive, needsReviewSubscriptions: needsReview,
    totalMonthlyAmount: result.totalMonthlyAmount, totalYearlyAmount: result.totalYearlyAmount,
    topSpendingCategories, likelyForgotten, potentialMonthlySavings, potentialAnnualSavings: potentialMonthlySavings * 12,
  }
}

// ── Dashboard metrics ─────────────────────────────────────────────────────
export async function computeDashboardMetrics(userId: string, usePool: QueryablePool = getPool() || testDb): Promise<DashboardMetrics> {
  const result = await detectRecurringPayments(userId, usePool)

  const activeSubscriptions = result.subscriptions.filter((s) => s.status === 'active')
  const recentlyDetected = result.subscriptions
    .filter((s) => s.status !== 'active')
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, 5)

  const categoryMap = new Map<string, { monthlyAmount: number; count: number; subscriptions: DetectedSubscription[] }>()
  for (const s of result.subscriptions) {
    for (const cat of s.categories) {
      const existing = categoryMap.get(cat) ?? { monthlyAmount: 0, count: 0, subscriptions: [] }
      categoryMap.set(cat, { monthlyAmount: existing.monthlyAmount + s.monthlyAmount, count: existing.count + 1, subscriptions: [...existing.subscriptions, s] })
    }
  }

  const spendingByCategory = Array.from(categoryMap.entries())
    .map(([category, vals]) => ({ category, ...vals }))
    .sort((a, b) => b.monthlyAmount - a.monthlyAmount)

  const now = new Date()
  const upcomingPayments = result.subscriptions
    .filter((s) => s.estimatedNextPaymentDate)
    .map((s) => ({ subscription: s, estimatedDate: s.estimatedNextPaymentDate!, daysUntil: Math.ceil(daysBetween(now, new Date(s.estimatedNextPaymentDate!))) }))
    .filter((u) => u.daysUntil >= 0 && u.daysUntil <= 30)
    .sort((a, b) => a.daysUntil - b.daysUntil)

  const savingsOpportunities: SavingsOpportunity[] = result.subscriptions
    .filter((s) => s.status === 'possiblyInactive' || s.status === 'needsReview')
    .map((s) => ({
      subscription: s,
      reason: s.status === 'possiblyInactive'
        ? `Last payment was ${s.lastPaymentDate ? Math.floor(daysBetween(new Date(s.lastPaymentDate), new Date())) : 0} days ago - may no longer be active`
        : `Low confidence (${s.confidenceScore}/100) - review before acting`,
      potentialMonthlySaving: s.monthlyAmount, potentialAnnualSaving: s.yearlyAmount,
    }))
    .sort((a, b) => b.potentialMonthlySaving - a.potentialMonthlySaving)

  const potentialMonthlySavings = savingsOpportunities.reduce((s, o) => s + o.potentialMonthlySaving, 0)

  return {
    monthlyRecurringSpending: result.totalMonthlyAmount,
    estimatedAnnualRecurringSpending: result.totalYearlyAmount,
    activeSubscriptionCount: activeSubscriptions.length,
    potentialMonthlySavings, potentialAnnualSavings: potentialMonthlySavings * 12,
    activeSubscriptions, recentlyDetected, spendingByCategory, upcomingPayments, savingsOpportunities,
  }
}

// ── Subscription management ───────────────────────────────────────────────
export async function confirmSubscription(userId: string, usePool: any = getPool() || testDb, subscriptionId: string): Promise<{ success: boolean; error?: string }> {
  const result = await usePool.query(
    `UPDATE subscriptions SET status = 'active', updated_at = datetime('now') WHERE id = $1 AND user_id = $2 RETURNING id`,
    [subscriptionId, userId]
  )
  if (result.rows.length === 0) return { success: false, error: 'Subscription not found or not owned by you' }
  return { success: true }
}

export async function dismissSubscription(userId: string, usePool: any = getPool() || testDb, subscriptionId: string): Promise<{ success: boolean; error?: string }> {
  const result = await usePool.query(
    `DELETE FROM subscriptions WHERE id = $1 AND user_id = $2 RETURNING id`,
    [subscriptionId, userId]
  )
  if (result.rows.length === 0) return { success: false, error: 'Subscription not found or not owned by you' }
  return { success: true }
}

export async function editSubscription(
  userId: string,
  usePool: any = getPool() || testDb,
  subscriptionId: string,
  updates: { name?: string; categories?: string[]; status?: SubscriptionStatus }
): Promise<{ success: boolean; error?: string }> {
  const fields: string[] = []
  const values: unknown[] = []
  let paramIndex = 1

  if (updates.name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(updates.name) }
  if (updates.categories !== undefined) { fields.push(`categories = $${paramIndex++}`); values.push(JSON.stringify(updates.categories)) }
  if (updates.status !== undefined) { fields.push(`status = $${paramIndex++}`); values.push(updates.status) }

  if (fields.length === 0) return { success: false, error: 'No updates provided' }

  fields.push(`updated_at = datetime('now')`)
  values.push(userId)
  values.push(subscriptionId)

  const result = await usePool.query(
    `UPDATE subscriptions SET ${fields.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex} RETURNING id`,
    values
  )

  if (result.rows.length === 0) return { success: false, error: 'Subscription not found or not owned by you' }
  return { success: true }
}

export async function markSubscriptionInactive(userId: string, usePool: any = getPool() || testDb, subscriptionId: string): Promise<{ success: boolean; error?: string }> {
  const result = await usePool.query(
    `UPDATE subscriptions SET status = 'possiblyInactive', updated_at = datetime('now') WHERE id = $1 AND user_id = $2 RETURNING id`,
    [subscriptionId, userId]
  )
  if (result.rows.length === 0) return { success: false, error: 'Subscription not found or not owned by you' }
  return { success: true }
}
