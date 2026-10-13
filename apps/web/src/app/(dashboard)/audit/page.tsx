'use client'

import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import {
  TrendingDown,
  PiggyBank,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  FileSearch,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  X,
} from 'lucide-react'
import { useAudit, useSubscriptions, useCategories } from '@/hooks/useQorvi'
import { formatCurrency, formatDate, getFrequencyLabel, getFrequencyText, getStatusLabel, getConfidenceLabel } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { AuditReport, TopExpenseItem, ReviewItem, SavingsRecommendation, ReviewAction } from '@/types'

export default function AuditPage() {
  const { user } = useUser()
  const firstName = user?.firstName || 'there'

  const { report, isLoading, error, refetch: refetchAudit } = useAudit()
  const { subscriptions, refetch: refetchSubscriptions } = useSubscriptions()
  const { categories } = useCategories()

  const handleAction = async (action: ReviewAction, subscriptionId: string, event?: React.MouseEvent) => {
    event?.preventDefault()
    // Actions are handled via the existing subscriptions API for confirm/dismiss/inactive
    // The audit page shows the recommendations; detailed actions go through the subscriptions page
  }

  const getCategoryName = (categoryId: string | null, fallback: string = 'Other'): string => {
    if (!categoryId) return fallback
    const cat = categories.find(c => c.id === categoryId)
    return cat?.name || fallback
  }

  const sortOptions = [
    { key: 'monthly' as const, label: 'Monthly cost' },
    { key: 'annual' as const, label: 'Annual cost' },
    { key: 'merchant' as const, label: 'Merchant name' },
    { key: 'category' as const, label: 'Category' },
  ] as const

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Your Subscription Audit
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            {isLoading
              ? 'Loading your audit...'
              : `A clear picture of your recurring spending and opportunities to save.`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => refetchAudit()} isLoading={isLoading}>
            Refresh
          </Button>
          <Link href="/subscriptions" className="inline-flex items-center gap-2 shrink-0">
            <Button variant="secondary">
              View all subs
              <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <AlertTriangle size={18} className="text-rose-400 shrink-0" />
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && report?.empty && (
        <div className="flex flex-col items-center justify-center py-20 gap-6 text-center bg-gray-900 border border-white/5 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <FileSearch size={28} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-white mb-2">
              No transactions yet
            </h2>
            <p className="text-gray-400 text-sm max-w-sm">
              Import your first transaction file to start your audit. Qorvi will analyze your spending patterns and detect recurring payments.
            </p>
          </div>
          <Link href="/upload" className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm rounded-xl transition-all duration-200">
            Import transactions
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Audit report */}
      {!isLoading && report && !report.empty && (
        <>
          {/* Audit overview bar */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-gray-800/50 border border-white/5 rounded-xl">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Calendar size={14} />
              <span>Report generated: {formatDate(report.auditDate.slice(0, 10))}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <span className="text-gray-600">|</span>
              <span>Audit period: {formatDate(report.auditPeriodStart.slice(0, 10))} - {formatDate(report.auditPeriodEnd.slice(0, 10))}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <span className="text-gray-600">|</span>
              <span>{report.summary.activeSubscriptionCount} active + {report.summary.needsReviewCount} needing review</span>
            </div>
          </div>

          {/* Summary metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="rounded-xl p-5 border border-emerald-500/20 bg-emerald-500/5">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Total monthly recurring</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(report.summary.monthlyRecurringSpending)}</p>
              <p className="text-gray-500 text-xs mt-1">Confirmed active subscriptions only</p>
            </div>
            <div className="rounded-xl p-5 border border-blue-500/20 bg-blue-500/5">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Estimated annual recurring</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(report.summary.estimatedAnnualRecurringSpending)}</p>
              <p className="text-gray-500 text-xs mt-1">Monthly × 12 (estimate)</p>
            </div>
            <div className="rounded-xl p-5 border border-amber-500/20 bg-amber-500/5">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Potential monthly savings</p>
              <p className="text-2xl font-bold text-amber-400">{formatCurrency(report.summary.potentialMonthlySavings)}</p>
              <p className="text-gray-500 text-xs mt-1">From {report.summary.needsReviewCount + report.summary.possiblyInactiveCount} subscriptions needing review</p>
            </div>
            <div className="rounded-xl p-5 border border-rose-500/20 bg-rose-500/5">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">Potential annual savings</p>
              <p className="text-2xl font-bold text-rose-400">{formatCurrency(report.summary.potentialAnnualSavings)}</p>
              <p className="text-gray-500 text-xs mt-1">If review items are resolved</p>
            </div>
          </div>

          {/* Two-column layout for main content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left column: Top expenses */}
            <div className="xl:col-span-2 space-y-6">
              {/* Top recurring expenses */}
              <div className="bg-gray-900 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-lg font-bold text-white">Top recurring expenses</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">Sort by:</span>
                    {sortOptions.map(opt => (
                      <Button
                        key={opt.key}
                        variant="ghost"
                        size="sm"
                        onClick={() => {/* TODO: implement sorting */}}
                        className={cn(
                          'text-xs',
                          opt.key === 'monthly' ? 'text-emerald-400' : 'text-gray-500 hover:text-white'
                        )}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {report.topExpenses.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4">No recurring payments detected yet.</p>
                ) : (
                  <div className="space-y-3">
                    {report.topExpenses.map((item: TopExpenseItem) => (
                      <div key={item.subscription.id} className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn(
                            'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                            item.subscription.status === 'active' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                            item.subscription.status === 'possiblyInactive' ? 'bg-amber-500/10 border border-amber-500/20' :
                            'bg-rose-500/10 border border-rose-500/20'
                          )}>
                            <FileSearch size={16} className={cn(
                              item.subscription.status === 'active' ? 'text-emerald-400' :
                              item.subscription.status === 'possiblyInactive' ? 'text-amber-400' :
                              'text-rose-400'
                            )} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">{item.subscription.name}</p>
                            <p className="text-gray-500 text-xs">
                              {getCategoryName(item.subscription.categories[0])} • {getFrequencyText(item.subscription.frequency)}
                              {' '}• {getConfidenceLabel(item.subscription.confidenceScore)} confidence
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-white text-sm font-semibold">
                            {formatCurrency(item.monthlyEquivalent)}
                            <span className="text-gray-500 font-normal">/mo</span>
                          </p>
                          <p className="text-gray-500 text-xs mt-0.5">
                            {formatCurrency(item.annualEstimate)}/yr
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Savings opportunities */}
              {report.savingsOpportunities.length > 0 && (
                <div className="bg-gray-900 border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                      <PiggyBank size={18} className="text-emerald-400" />
                      Potential savings
                    </h2>
                    <span className="text-emerald-400 text-sm font-medium">
                      {formatCurrency(report.summary.potentialMonthlySavings)}/mo • {formatCurrency(report.summary.potentialAnnualSavings)}/yr
                    </span>
                  </div>
                  <div className="space-y-3">
                    {report.savingsOpportunities.map((item: import("@/types").SavingsOpportunityWithDedup) => (
                      <div key={item.subscription.id} className="flex items-center justify-between p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <AlertTriangle size={16} className="text-amber-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">{item.subscription.name}</p>
                            <p className="text-gray-500 text-xs">{item.reason}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-amber-400 text-sm font-semibold">{formatCurrency(item.potentialMonthlySaving)}/mo</p>
                          <p className="text-gray-500 text-xs mt-0.5">{formatCurrency(item.potentialAnnualSaving)}/yr</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-gray-500 text-xs mt-4">
                    Potential savings are estimates based on non-active subscriptions. Actual savings depend on your decisions.
                  </p>
                </div>
              )}

              {/* Calculation methodology */}
              <details className="bg-gray-900 border border-white/5 rounded-2xl p-6 group">
                <summary className="flex items-center gap-2 cursor-pointer text-gray-400 text-sm hover:text-white transition-colors list-none">
                  <ChevronDown size={14} className="group-open:rotate-180 transition-transform" />
                  <span>Calculation methodology</span>
                </summary>
                <div className="mt-3 space-y-2 text-gray-500 text-xs">
                  {report.calculationNotes.map((note, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-gray-600 shrink-0">•</span>
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </details>
            </div>

            {/* Right column: Review items + recommendations */}
            <div className="space-y-6">
              {/* Subscriptions needing review */}
              <div className="bg-gray-900 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                    <AlertTriangle size={18} className="text-rose-400" />
                    Subscriptions needing review
                  </h2>
                  <Badge variant="danger">{report.reviewItems.length}</Badge>
                </div>

                {report.reviewItems.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4">No subscriptions need your attention.</p>
                ) : (
                  <div className="space-y-3">
                    {report.reviewItems.map((item: ReviewItem) => (
                      <div key={item.subscription.id} className="p-4 rounded-xl bg-white/3 border border-white/5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0">
                            <p className="text-white text-sm font-medium truncate">{item.subscription.name}</p>
                            <p className="text-gray-500 text-xs mt-0.5">
                              {getCategoryName(item.subscription.categories[0])} • {getFrequencyText(item.subscription.frequency)}
                            </p>
                          </div>
                          <Badge variant={item.subscription.status === 'possiblyInactive' ? 'warning' : 'danger'}>
                            {getStatusLabel(item.subscription.status)}
                          </Badge>
                        </div>
                        <p className="text-gray-500 text-xs mb-3">{item.reason}</p>
                        <div className="flex flex-wrap gap-2">
                          {item.actions.map((action: ReviewAction) => (
                            <Button
                              key={action.action}
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleAction(action, item.subscription.id, e)}
                              className="text-xs text-gray-400 hover:text-white"
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Suggested actions */}
              {report.recommendations.length > 0 && (
                <div className="bg-gray-900 border border-white/5 rounded-2xl p-6">
                  <h2 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <CheckCircle size={18} className="text-emerald-400" />
                    Suggested actions
                  </h2>
                  <div className="space-y-3">
                    {report.recommendations.map((rec: SavingsRecommendation) => (
                      <div key={rec.id} className="p-4 rounded-xl bg-white/3 border border-white/5">
                        <p className="text-white text-sm font-medium mb-1">{rec.title}</p>
                        <p className="text-gray-500 text-xs mb-3">{rec.explanation}</p>
                        <div className="flex items-center justify-between">
                          <div className="text-right">
                            {rec.estimatedMonthlySaving > 0 && (
                              <p className="text-emerald-400 text-sm font-semibold">
                                {formatCurrency(rec.estimatedMonthlySaving)}/mo potential
                              </p>
                            )}
                            <p className="text-gray-500 text-xs">{rec.estimatedSavingNote}</p>
                          </div>
                          <Badge variant={rec.action === 'cancel' ? 'warning' : rec.action === 'consolidate' ? 'info' : 'neutral'}>
                            {rec.action}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl p-5 border border-white/5 bg-white/3 h-[104px] animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-gray-900 border border-white/5 rounded-2xl p-6 h-[300px] animate-pulse" />
              <div className="bg-gray-900 border border-white/5 rounded-2xl p-6 h-[200px] animate-pulse" />
            </div>
            <div className="space-y-6">
              <div className="bg-gray-900 border border-white/5 rounded-2xl p-6 h-[300px] animate-pulse" />
              <div className="bg-gray-900 border border-white/5 rounded-2xl p-6 h-[200px] animate-pulse" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
