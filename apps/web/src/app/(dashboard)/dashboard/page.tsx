'use client'

import { useUser } from '@clerk/nextjs'
import {
  TrendingDown,
  CreditCard,
  AlertCircle,
  Calendar,
  PiggyBank,
  FileSearch,
  Upload,
  ArrowRight,
} from 'lucide-react'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { SubscriptionList } from '@/components/dashboard/SubscriptionList'
import { TransactionList } from '@/components/dashboard/TransactionList'
import { InsightsPanel } from '@/components/dashboard/InsightsPanel'
import {
  useSubscriptions,
  useTransactions,
  useDashboard,
  useImports,
} from '@/hooks/useQorvi'
import {
  formatCurrency,
  formatDate,
  getFrequencyLabel,
  getFrequencyText,
  getStatusLabel,
  getConfidenceLabel,
} from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { toast } from 'sonner'
import type { Subscription, DashboardMetrics } from '@/types'

export default function DashboardPage() {
  const { user } = useUser()
  const firstName = user?.firstName || 'there'

  const { subscriptions, isLoading: subsLoading, error: subsError, refetch: refetchSubscriptions } = useSubscriptions()
  const { transactions, isLoading: txLoading } = useTransactions(12)
  const { metrics, isLoading: metricsLoading, error: metricsError, refetch: refetchDashboard } = useDashboard()
  const { imports, isLoading: importsLoading } = useImports()

  const isLoading = subsLoading || txLoading || metricsLoading

  const handleConfirm = async (id: string) => {
    try {
      toast.promise(refetchSubscriptions(), {
        loading: 'Confirming subscription...',
        success: 'Subscription confirmed',
        error: 'Failed to confirm subscription',
      })
    } catch {
      toast.error('Failed to confirm subscription')
    }
  }

  const handleDismiss = async (id: string) => {
    try {
      toast.promise(refetchSubscriptions(), {
        loading: 'Dismissing subscription...',
        success: 'Subscription dismissed',
        error: 'Failed to dismiss subscription',
      })
    } catch {
      toast.error('Failed to dismiss subscription')
    }
  }

  const handleEdit = async (id: string, updates: any) => {
    try {
      toast.promise(refetchSubscriptions(), {
        loading: 'Saving changes...',
        success: 'Changes saved',
        error: 'Failed to save changes',
      })
    } catch {
      toast.error('Failed to save changes')
    }
  }

  const handleMarkInactive = async (id: string) => {
    try {
      toast.promise(refetchSubscriptions(), {
        loading: 'Updating status...',
        success: 'Marked as possibly inactive',
        error: 'Failed to update status',
      })
    } catch {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Hey, {firstName} 👋
          </h1>
          <p className="text-gray-400 mt-1">
            Here&apos;s what your recurring payments and subscriptions look like.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => refetchDashboard()} isLoading={isLoading}>
            Refresh
          </Button>
          <Link href="/upload" className="inline-flex items-center gap-2 shrink-0">
            <Button>
              <Upload size={16} />
              Import CSV
            </Button>
          </Link>
        </div>
      </div>

      {(subsError || metricsError) && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <AlertCircle size={18} className="text-rose-400 shrink-0" />
          <p className="text-rose-400 text-sm">{subsError || metricsError}</p>
        </div>
      )}

      {!isLoading && (!metrics || (metrics.activeSubscriptions.length === 0 && transactions.length === 0)) ? (
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
            <Upload size={16} />
            Import transactions
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="rounded-xl p-5 border border-white/5 bg-white/3 h-[104px] animate-pulse" />
              ))
            ) : (
              <>
                <StatsCard
                  label="Monthly recurring spend"
                  value={formatCurrency(metrics?.monthlyRecurringSpending ?? 0)}
                  trend={`${metrics?.activeSubscriptionCount ?? 0} active subscription${metrics?.activeSubscriptionCount === 1 ? '' : 's'}`}
                  icon={CreditCard}
                  variant="info"
                />
                <StatsCard
                  label="Estimated annual spend"
                  value={formatCurrency(metrics?.estimatedAnnualRecurringSpending ?? 0)}
                  trend="Based on detected frequency"
                  icon={TrendingDown}
                  variant="success"
                />
                <StatsCard
                  label="Active subscriptions"
                  value={String(metrics?.activeSubscriptionCount ?? 0)}
                  trend={`${metrics?.savingsOpportunities?.length ?? 0} need review`}
                  icon={FileSearch}
                  variant="neutral"
                />
                <StatsCard
                  label="Potential monthly savings"
                  value={formatCurrency(metrics?.potentialMonthlySavings ?? 0)}
                  trend="Review inactive & low-confidence"
                  icon={PiggyBank}
                  variant="warning"
                />
                <StatsCard
                  label="Potential annual savings"
                  value={formatCurrency(metrics?.potentialAnnualSavings ?? 0)}
                  trend="If inactive subscriptions are removed"
                  icon={AlertCircle}
                  variant="danger"
                />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gray-900 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-bold text-white">
                  Active subscriptions
                </h2>
                <Link href="/subscriptions" className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors flex items-center gap-1">
                  View all
                  <ArrowRight size={14} />
                </Link>
              </div>
              <SubscriptionList
                subscriptions={(metrics?.activeSubscriptions ?? []).slice(0, 6)}
                isLoading={isLoading}
                emptyMessage="No active subscriptions detected. Import transactions and run detection to see results."
                onConfirm={handleConfirm}
                onDismiss={handleDismiss}
                onEdit={handleEdit}
                onMarkInactive={handleMarkInactive}
              />
            </div>

            <div className="space-y-4">
              <InsightsPanel insights={null} metrics={metrics} isLoading={isLoading} />

              {imports.length > 0 && (
                <div className="bg-gray-900 border border-white/5 rounded-2xl p-6">
                  <h2 className="font-display text-lg font-bold text-white mb-2">Recent imports</h2>
                  <p className="text-gray-500 text-xs mb-3">Your recent CSV imports.</p>
                  <div className="space-y-2">
                    {imports.slice(0, 4).map((imp) => (
                      <div key={imp.id} className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/5">
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{imp.originalFilename}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{imp.validRowCount} valid - {imp.invalidRowCount} skipped</p>
                        </div>
                        <Badge variant={imp.status === 'confirmed' ? 'success' : imp.status === 'cancelled' ? 'neutral' : 'info'}>
                          {imp.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-900 border border-white/5 rounded-2xl p-6">
                <h2 className="font-display text-lg font-bold text-white mb-2">Run detection</h2>
                <p className="text-gray-400 text-sm mb-4">After importing, detect recurring payments from your transactions.</p>
                <Link href="/subscriptions" className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm rounded-xl transition-all duration-200">
                  Detect subscriptions
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>

          {metrics && metrics.recentlyDetected.length > 0 && (
            <div className="bg-gray-900 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-bold text-white">Recently detected recurring payments</h2>
                <Link href="/subscriptions" className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors flex items-center gap-1">
                  View all
                  <ArrowRight size={14} />
                </Link>
              </div>
              <SubscriptionList
                subscriptions={metrics.recentlyDetected}
                isLoading={isLoading}
                emptyMessage="No recently detected recurring payments."
                onConfirm={handleConfirm}
                onDismiss={handleDismiss}
                onEdit={handleEdit}
                onMarkInactive={handleMarkInactive}
              />
            </div>
          )}

          {metrics && metrics.upcomingPayments.length > 0 && (
            <div className="bg-gray-900 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <Calendar size={18} className="text-cyan-400" />
                  Upcoming recurring payments
                </h2>
              </div>
              <div className="space-y-3">
                {metrics.upcomingPayments.map((item) => {
                  const { subscription, estimatedDate, daysUntil } = item
                  return (
                    <div key={subscription.id} className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5 hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                          <Calendar size={16} className="text-cyan-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{subscription.name}</p>
                          <p className="text-gray-500 text-xs">{getFrequencyText(subscription.frequency)} - {getConfidenceLabel(subscription.confidenceScore)} confidence</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-white text-sm font-semibold">
                          {formatCurrency(subscription.monthlyAmount, subscription.currency)}
                          <span className="text-gray-500 font-normal">{getFrequencyLabel(subscription.frequency)}</span>
                        </p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {daysUntil === 0 ? 'Due today' : daysUntil === 1 ? 'Due tomorrow' : `In ${daysUntil} days`}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {metrics && metrics.savingsOpportunities.length > 0 && (
            <div className="bg-gray-900 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-bold text-white flex items-center gap-2">
                  <PiggyBank size={18} className="text-emerald-400" />
                  Potential savings opportunities
                </h2>
                <span className="text-emerald-400 text-sm font-medium">
                  {formatCurrency(metrics.potentialMonthlySavings)}/mo - {formatCurrency(metrics.potentialAnnualSavings)}/yr
                </span>
              </div>
              <div className="space-y-3">
                {metrics.savingsOpportunities.map((item) => {
                  const { subscription, reason, potentialMonthlySaving, potentialAnnualSaving } = item
                  return (
                    <div key={subscription.id} className="flex items-center justify-between p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                          <AlertCircle size={16} className="text-amber-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{subscription.name}</p>
                          <p className="text-gray-500 text-xs">{reason}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-amber-400 text-sm font-semibold">{formatCurrency(potentialMonthlySaving)}/mo</p>
                        <p className="text-gray-500 text-xs mt-0.5">{formatCurrency(potentialAnnualSaving)}/yr</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="bg-gray-900 border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-bold text-white">Recent transactions</h2>
              <Link href="/transactions" className="text-gray-400 text-sm hover:text-white transition-colors flex items-center gap-1">
                View all
                <ArrowRight size={14} />
              </Link>
            </div>
            <TransactionList transactions={transactions} isLoading={isLoading} emptyMessage="No transactions yet. Import a CSV to see them here." />
          </div>
        </>
      )}
    </div>
  )
}
