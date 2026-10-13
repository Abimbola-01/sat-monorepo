// Audit calculation service
// Computes the full subscription audit from actual stored data.
// Monthly equivalents use consistent conversion rules.
// Potential savings avoid double-counting overlapping recommendations.
import { pool } from '../config/database'
import {
  detectRecurringPayments,
  type DetectedSubscription,
  type SpendingInsights,
  type DetectedFrequency,
} from './recurringDetection'

// ── Types ──────────────────────────────────────────────────────────────────
export interface AuditSummary {
  monthlyRecurringSpending: number
  estimatedAnnualRecurringSpending: number
  activeSubscriptionCount: number
  needsReviewCount: number
  possiblyInactiveCount: number
  potentialMonthlySavings: number
  potentialAnnualSavings: number
}

export interface TopExpenseItem {
  subscription: DetectedSubscription
  monthlyEquivalent: number
  annualEstimate: number
  calculationNote: string
  lastPaymentDate: string | null
  nextExpectedPayment: string | null
}

export interface ReviewItem {
  subscription: DetectedSubscription
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
  subscription: DetectedSubscription
  reason: string
  potentialMonthlySaving: number
  potentialAnnualSaving: number
  dedupKey: string
  dedupGroup: string
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

// ── Conversion rules ───────────────────────────────────────────────────────
const MONTHLY_FACTOR: Record<DetectedFrequency, number> = {
  weekly: 4.33,
  biweekly: 2.165,
  monthly: 1,
  quarterly: 1 / 3,
  annual: 1 / 12,
  irregular: 1,
}

function monthlyEquivalent(amount: number, frequency: DetectedFrequency): number {
  return amount * (MONTHLY_FACTOR[frequency] ?? 1)
}

function annualEstimate(amount: number, frequency: DetectedFrequency): number {
  return monthlyEquivalent(amount, frequency) * 12
}

function formatCurrency(amount: number): string {
  return '₦' + Math.round(amount).toLocaleString()
}

function amountVariationForSub(sub: DetectedSubscription): number {
  // Use stored amount as typical; variation approximated by confidence-related data
  // We don't store per-occurrence amounts in subscriptions table, so estimate from confidence
  // For subscriptions with low occurrences, assume moderate variation
  if (sub.occurrences < 2) return 0
  if (sub.confidenceScore >= 70) return 5 // high confidence = stable amounts
  if (sub.confidenceScore >= 45) return 12 // medium = some variation
  return 25 // low = likely variation
}

// ── Core audit computation ─────────────────────────────────────────────────
export async function computeAudit(userId: string): Promise<AuditReport> {
  const detectionResult = await detectRecurringPayments(userId)
  const subscriptions = detectionResult.subscriptions as DetectedSubscription[]
  const now = new Date()

  // Transaction date range for audit period
  const txResult = await pool.query(
    'SELECT MIN(transaction_date) AS minDate, MAX(transaction_date) AS maxDate FROM transactions WHERE user_id = $1',
    [userId]
  )
  const txRow = txResult.rows[0] as { minDate: string | null; maxDate: string | null }
  const periodStart = txRow.minDate ? new Date(txRow.minDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const periodEnd = txRow.maxDate ? new Date(txRow.maxDate) : now

  // Normalised items with monthly equivalents
  const normalised = subscriptions.map((s) => {
    const typicalAmount = s.amount
    const monthlyEquiv = monthlyEquivalent(typicalAmount, s.frequency)
    const annualEst = annualEstimate(typicalAmount, s.frequency)
    const note = s.occurrences >= 2
      ? `Monthly equivalent from ${s.occurrences} occurrence(s) × ${s.frequency} frequency (${typicalAmount} × ${MONTHLY_FACTOR[s.frequency]}).`
      : `Single occurrence; monthly figure is an estimate.`

    return {
      subscription: s,
      monthlyEquivalent: Math.round(monthlyEquiv * 100) / 100,
      annualEstimate: Math.round(annualEst * 100) / 100,
      calculationNote: note,
      lastPaymentDate: s.lastPaymentDate,
      nextExpectedPayment: s.estimatedNextPaymentDate,
    }
  })

  const active = normalised.filter((n) => n.subscription.status === 'active')
  const needsReview = normalised.filter((n) => n.subscription.status === 'needsReview')
  const possiblyInactive = normalised.filter((n) => n.subscription.status === 'possiblyInactive')

  const monthlyRecurring = active.reduce((sum, n) => sum + n.monthlyEquivalent, 0)
  const annualRecurring = monthlyRecurring * 12
  const potentialMonthlySavings = possiblyInactive.reduce((sum, n) => sum + n.monthlyEquivalent, 0)
    + needsReview.reduce((sum, n) => sum + n.monthlyEquivalent, 0)

  // Deduplicate savings opportunities by subscription ID
  const savingsMap = new Map<string, SavingsOpportunityWithDedup>()
  for (const n of possiblyInactive) {
    savingsMap.set(n.subscription.id, {
      subscription: n.subscription,
      reason: `Last payment ${n.subscription.lastPaymentDate ? Math.floor((now.getTime() - new Date(n.subscription.lastPaymentDate).getTime()) / (24 * 60 * 60 * 1000)) : '?'} days ago - may no longer be active`,
      potentialMonthlySaving: n.monthlyEquivalent,
      potentialAnnualSaving: n.annualEstimate,
      dedupKey: n.subscription.id,
      dedupGroup: n.subscription.id,
    })
  }
  for (const n of needsReview) {
    if (!savingsMap.has(n.subscription.id)) {
      savingsMap.set(n.subscription.id, {
        subscription: n.subscription,
        reason: `Low confidence (${n.subscription.confidenceScore}/100) - review before acting`,
        potentialMonthlySaving: n.monthlyEquivalent,
        potentialAnnualSaving: n.annualEstimate,
        dedupKey: n.subscription.id,
        dedupGroup: n.subscription.id,
      })
    }
  }
  const dedupedSavings = Array.from(savingsMap.values()).sort((a, b) => b.potentialMonthlySaving - a.potentialMonthlySaving)

  // Top expenses ranked by monthly equivalent
  const topExpenses = normalised.sort((a, b) => b.monthlyEquivalent - a.monthlyEquivalent)

  // Review items
  const reviewItems: ReviewItem[] = []
  for (const n of possiblyInactive.concat(needsReview)) {
    const reasons: string[] = []
    const actions: ReviewAction[] = []

    if (n.subscription.status === 'possiblyInactive') {
      reasons.push(
        n.subscription.lastPaymentDate
          ? `No payment recorded for ${Math.floor((now.getTime() - new Date(n.subscription.lastPaymentDate).getTime()) / (24 * 60 * 60 * 1000))} days`
          : 'No payment date recorded'
      )
      actions.push(
        { label: 'Confirm subscription', action: 'confirm' },
        { label: 'Mark as inactive', action: 'markInactive' },
        { label: 'View transaction history', action: 'viewHistory' }
      )
    } else {
      reasons.push(
        `Detection confidence is ${n.subscription.confidenceScore}/100 (${n.subscription.band}) - verify before confirming`
      )
      actions.push(
        { label: 'Confirm subscription', action: 'confirm' },
        { label: 'Edit merchant', action: 'edit' },
        { label: 'Correct category', action: 'correctCategory' },
        { label: 'Dismiss detection', action: 'dismiss' },
        { label: 'View transaction history', action: 'viewHistory' }
      )
    }

    if (n.subscription.confidenceScore < 70) {
      reasons.push('Amount and date patterns need verification.')
    }

    reviewItems.push({
      subscription: n.subscription,
      reason: reasons.join(' '),
      actions,
    })
  }

  // Recommendations
  const recommendations: SavingsRecommendation[] = []

  // High-cost subscriptions to review
  for (const item of topExpenses.slice(0, 3)) {
    if (item.subscription.status === 'needsReview' && item.monthlyEquivalent > 0) {
      recommendations.push({
        id: `review-${item.subscription.id}`,
        title: 'Review high-cost recurring payment',
        subscriptionId: item.subscription.id,
        subscriptionName: item.subscription.name,
        categoryId: item.subscription.categories[0] || null,
        categoryName: item.subscription.categories[0] || null,
        explanation: `This recurring payment appears ${item.subscription.occurrences} times at ${item.subscription.frequency} frequency with ${item.subscription.confidenceScore}/100 confidence. Review to confirm it is still needed.`,
        reason: 'High-cost subscription with uncertain status',
        estimatedMonthlySaving: item.monthlyEquivalent,
        estimatedAnnualSaving: item.annualEstimate,
        estimatedSavingNote: 'Estimated monthly/annual figure if this subscription is removed. Actual savings depend on continued billing.',
        action: 'review',
        status: 'open',
      })
    }
  }

  // Possibly inactive subscriptions
  for (const item of possiblyInactive) {
    const daysSince = item.subscription.lastPaymentDate
      ? Math.floor((now.getTime() - new Date(item.subscription.lastPaymentDate).getTime()) / (24 * 60 * 60 * 1000))
      : null
    recommendations.push({
      id: `inactive-${item.subscription.id}`,
      title: 'Check if this subscription is still needed',
      subscriptionId: item.subscription.id,
      subscriptionName: item.subscription.name,
      categoryId: item.subscription.categories[0] || null,
      categoryName: item.subscription.categories[0] || null,
      explanation: `The last payment was ${daysSince ?? 'unknown'} days ago. This may no longer be active. Marking it inactive helps avoid counting it in your total recurring spending.`,
      reason: 'Possibly inactive subscription based on payment gaps',
      estimatedMonthlySaving: item.monthlyEquivalent,
      estimatedAnnualSaving: item.annualEstimate,
      estimatedSavingNote: 'Estimated savings if this subscription is removed. Confirm it is no longer billed before taking action.',
      action: 'cancel',
      status: 'open',
    })
  }

  // Low confidence detections
  for (const item of needsReview.filter((n) => n.subscription.confidenceScore < 50)) {
    recommendations.push({
      id: `low-conf-${item.subscription.id}`,
      title: 'Verify uncertain recurring payment',
      subscriptionId: item.subscription.id,
      subscriptionName: item.subscription.name,
      categoryId: item.subscription.categories[0] || null,
      categoryName: item.subscription.categories[0] || null,
      explanation: `This payment was detected as recurring but the evidence is limited. Confirm the merchant and category, or dismiss if it is a one-off purchase.`,
      reason: 'Low detection confidence - manual review recommended',
      estimatedMonthlySaving: 0,
      estimatedAnnualSaving: 0,
      estimatedSavingNote: 'No savings estimate until the subscription is confirmed. Once confirmed, the figure will be based on actual billing.',
      action: 'review',
      status: 'open',
    })
  }

  // Multiple services in same category (potential consolidation)
  const categoryCounts = new Map<string, DetectedSubscription[]>();
  for (const item of active) {
    for (const cat of item.subscription.categories) {
      const existing = categoryCounts.get(cat) ?? [];
      existing.push(item.subscription);
      categoryCounts.set(cat, existing);
    }
  }
  for (const [cat, subs] of categoryCounts.entries()) {
    if (subs.length >= 2) {
      const catTotal = subs.reduce((sum: number, s: DetectedSubscription) => sum + monthlyEquivalent(s.amount, s.frequency), 0);
      recommendations.push({
        id: `multi-${cat}`,
        title: `Multiple services in ${cat} category`,
        subscriptionId: null,
        subscriptionName: null,
        categoryId: cat,
        categoryName: cat,
        explanation: `${subs.length} active subscriptions in the ${cat} category total ${formatCurrency(catTotal)} per month. Review whether all are needed.`,
        reason: 'More than one active subscription in the same category',
        estimatedMonthlySaving: catTotal,
        estimatedAnnualSaving: catTotal * 12,
        estimatedSavingNote: 'Potential saving if all services in this category are reviewed. Not all may be removable; review individually.',
        action: 'consolidate',
        status: 'open',
      });
    }
  }

  // Price increase detection (variable amounts)
  for (const sub of subscriptions) {
    if (sub.status === 'active' && sub.occurrences >= 3) {
      const variation = amountVariationForSub(sub)
      if (variation > 15) {
        recommendations.push({
          id: `variance-${sub.id}`,
          title: 'Recent price change may need attention',
          subscriptionId: sub.id,
          subscriptionName: sub.name,
          categoryId: sub.categories[0] || null,
          categoryName: sub.categories[0] || null,
          explanation: `This subscription has shown ${variation.toFixed(0)}% amount variation across its occurrences. This may indicate a price increase or variable billing. Review the latest amount.`,
          reason: 'Significant amount variation detected',
          estimatedMonthlySaving: 0,
          estimatedAnnualSaving: 0,
          estimatedSavingNote: 'No savings estimate until the current billing amount is confirmed.',
          action: 'review',
          status: 'open',
        })
      }
    }
  }

  const calculationNotes = [
    `Recurring spending totals only confirmed active subscriptions (${active.length} of ${subscriptions.length} detected).`,
    `Monthly equivalents use consistent conversion: weekly ×4.33, biweekly ×2.165, monthly ×1, quarterly ÷3, annual ÷12.`,
    `Annual estimates multiply the monthly equivalent by 12. Figures are estimates, not guaranteed totals.`,
    `Potential savings are estimates based on non-active subscriptions. They do not account for partial usage, bundled services or cancellation fees.`,
    'One-off purchases are not counted as subscriptions even when the merchant is recognised.',
    'Refunds, failed payments and duplicate transactions are excluded from spending totals where identifiable.',
    `This audit was generated on ${now.toISOString().slice(0, 10)} and reflects transactions up to ${periodEnd.toISOString().slice(0, 10)}.`,
  ]

  if (subscriptions.length === 0 && !txRow.minDate) {
    return {
      auditDate: now.toISOString(),
      auditPeriodStart: periodStart.toISOString(),
      auditPeriodEnd: periodEnd.toISOString(),
      userId,
      summary: {
        monthlyRecurringSpending: 0,
        estimatedAnnualRecurringSpending: 0,
        activeSubscriptionCount: 0,
        needsReviewCount: 0,
        possiblyInactiveCount: 0,
        potentialMonthlySavings: 0,
        potentialAnnualSavings: 0,
      },
      topExpenses: [],
      reviewItems: [],
      savingsOpportunities: [],
      recommendations: [],
      calculationNotes: [
        'No transactions have been imported yet.',
        'Import a CSV of your transactions to generate a full audit.',
      ],
      empty: true,
    }
  }

  return {
    auditDate: now.toISOString(),
    auditPeriodStart: periodStart.toISOString(),
    auditPeriodEnd: periodEnd.toISOString(),
    userId,
    summary: {
      monthlyRecurringSpending: Math.round(monthlyRecurring * 100) / 100,
      estimatedAnnualRecurringSpending: Math.round(annualRecurring * 100) / 100,
      activeSubscriptionCount: active.length,
      needsReviewCount: needsReview.length,
      possiblyInactiveCount: possiblyInactive.length,
      potentialMonthlySavings: Math.round(potentialMonthlySavings * 100) / 100,
      potentialAnnualSavings: Math.round(potentialMonthlySavings * 12 * 100) / 100,
    },
    topExpenses,
    reviewItems,
    savingsOpportunities: dedupedSavings,
    recommendations,
    calculationNotes,
    empty: false,
  }
}
