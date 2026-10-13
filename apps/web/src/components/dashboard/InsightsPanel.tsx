import { Lightbulb, TrendingDown, AlertCircle, Calendar, PiggyBank } from 'lucide-react'
import { formatCurrency, formatDate, getFrequencyLabel } from '@/lib/utils'
import type { Insights, DashboardMetrics } from '@/types'

interface InsightsPanelProps {
  insights?: Insights | null
  metrics?: DashboardMetrics | null
  isLoading?: boolean
  showForgotten?: boolean
}

export function InsightsPanel({ insights, metrics, isLoading = false, showForgotten = true }: InsightsPanelProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-6 space-y-4">
        <div className="h-4 w-24 rounded bg-white/5 animate-pulse" />
        <div className="h-3 w-40 rounded bg-white/5 animate-pulse" />
        <div className="h-4 w-24 rounded bg-white/5 animate-pulse" />
        <div className="h-3 w-32 rounded bg-white/5 animate-pulse" />
      </div>
    )
  }

  const hasData = insights || metrics
  if (!hasData) {
    return (
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-6 text-center">
        <p className="text-gray-500 text-sm">No insights yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Spending summary */}
      <div className="bg-gray-900 border border-white/5 rounded-2xl p-6">
        <h2 className="font-display text-base font-bold text-white mb-4 flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-400" />
          Spending summary
        </h2>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-start">
            <span className="text-gray-400">Total detected subscriptions</span>
            <span className="text-white font-medium">{metrics?.activeSubscriptionCount ?? insights?.totalSubscriptions ?? 0}</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-gray-400">Active</span>
            <span className="text-emerald-400 font-medium">{metrics?.activeSubscriptionCount ?? insights?.activeSubscriptions ?? 0}</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-gray-400">Needs review</span>
            <span className="text-amber-400 font-medium">{metrics?.savingsOpportunities?.length ?? insights?.needsReviewSubscriptions ?? 0}</span>
          </div>
          <div className="pt-3 border-t border-white/5">
            <div className="flex justify-between items-start">
              <span className="text-gray-400">Monthly recurring spend</span>
              <span className="text-white font-medium">{formatCurrency(metrics?.monthlyRecurringSpending ?? insights?.totalMonthlyAmount ?? 0)}</span>
            </div>
            <div className="flex justify-between items-start mt-2">
              <span className="text-gray-400">Estimated yearly spend</span>
              <span className="text-white font-medium">{formatCurrency(metrics?.estimatedAnnualRecurringSpending ?? insights?.totalYearlyAmount ?? 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories - using metrics only */}
      {metrics && metrics.spendingByCategory.length > 0 && (
        <div className="bg-gray-900 border border-white/5 rounded-2xl p-6">
          <h2 className="font-display text-base font-bold text-white mb-4 flex items-center gap-2">
            <TrendingDown size={16} className="text-cyan-400" />
            Spending by category
          </h2>
          <ul className="space-y-2">
            {metrics.spendingByCategory.slice(0, 6).map((cat) => (
              <li key={cat.category} className="flex items-center justify-between text-sm">
                <span className="text-gray-300 capitalize">{cat.category}</span>
                <span className="text-white font-medium">{formatCurrency(cat.monthlyAmount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Forgotten subscriptions */}
      {showForgotten && ((metrics?.savingsOpportunities?.length ?? insights?.likelyForgotten?.length ?? 0) > 0) && (
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-6">
          <h2 className="font-display text-base font-bold text-white mb-3 flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-400" />
            Possibly forgotten
          </h2>
          <p className="text-gray-400 text-xs mb-3">
            Lower-confidence subscriptions or ones that may no longer be active. Review before acting.
          </p>
          <ul className="space-y-2">
            {(metrics?.savingsOpportunities ?? insights?.likelyForgotten ?? []).slice(0, 5).map((item) => {
              const sub = 'subscription' in item ? item.subscription : item
              const reason = 'reason' in item ? item.reason : (sub.lastPaymentDate ? `Last ${formatDate(sub.lastPaymentDate)}` : 'No last payment')
              return (
                <li
                  key={sub.id}
                  className="flex items-center justify-between text-sm border-t border-rose-500/10 pt-2 first:pt-0"
                >
                  <div className="min-w-0">
                    <p className="text-white truncate">{sub.name}</p>
                    <p className="text-gray-500 text-xs">{reason}</p>
                  </div>
                  <span className="text-rose-400 font-medium shrink-0 ml-3">
                    {formatCurrency(sub.monthlyAmount)}/mo
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Potential savings */}
      {(metrics?.potentialMonthlySavings ?? insights?.potentialMonthlySavings ?? 0) > 0 && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
          <h2 className="font-display text-base font-bold text-white mb-3 flex items-center gap-2">
            <PiggyBank size={16} className="text-emerald-400" />
            Potential savings
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-start">
              <span className="text-gray-400">Monthly savings potential</span>
              <span className="text-emerald-400 font-medium">{formatCurrency(metrics?.potentialMonthlySavings ?? insights?.potentialMonthlySavings ?? 0)}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-gray-400">Annual savings potential</span>
              <span className="text-emerald-400 font-medium">{formatCurrency(metrics?.potentialAnnualSavings ?? insights?.potentialAnnualSavings ?? 0)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-white/3 border border-white/5 rounded-2xl p-6">
        <p className="text-gray-500 text-xs leading-relaxed">
          Amounts marked <span className="text-amber-400 font-medium">estimate</span> are derived from the
          transaction data you uploaded. Recurrence, next-payment dates, and savings
          opportunities are estimates, not guarantees.
        </p>
      </div>
    </div>
  )
}
