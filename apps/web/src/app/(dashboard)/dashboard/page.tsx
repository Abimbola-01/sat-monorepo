'use client'

import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import {
  TrendingDown,
  CreditCard,
  AlertCircle,
  FileSearch,
  Upload,
  ArrowRight,
} from 'lucide-react'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { RecentAudits } from '@/components/dashboard/RecentAudits'
import { SavingsChart } from '@/components/dashboard/SavingsChart'
import { useAudits } from '@/hooks/useAudit'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { formatCurrency } from '@/lib/utils'

export default function DashboardPage() {
  const { user } = useUser()
  const firstName = user?.firstName || 'there'

  const { audits, isLoading: auditsLoading, error: auditsError } = useAudits()
  const { stats, hasAudit, isLoading: statsLoading } = useSubscriptions()

  const isLoading = auditsLoading || statsLoading

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Hey, {firstName} 👋
          </h1>
          <p className="text-gray-400 mt-1">
            Here&apos;s what your subscriptions look like this month.
          </p>
        </div>
        <Link
          href="/upload"
          className="hidden md:inline-flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm rounded-xl transition-all duration-200"
        >
          <Upload size={16} />
          New audit
        </Link>
      </div>

      {auditsError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <AlertCircle size={18} className="text-rose-400 shrink-0" />
          <p className="text-rose-400 text-sm">{auditsError}</p>
        </div>
      )}

      {!isLoading && !hasAudit ? (
        // No completed audits yet — don't show a wall of zeros, prompt the real next action
        <div className="flex flex-col items-center justify-center py-20 gap-6 text-center bg-gray-900 border border-white/5 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <FileSearch size={28} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-white mb-2">
              Run your first audit
            </h2>
            <p className="text-gray-400 text-sm max-w-sm">
              Upload a bank statement to find recurring charges, duplicates,
              and forgotten subscriptions.
            </p>
          </div>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm rounded-xl transition-all duration-200"
          >
            <Upload size={16} />
            Upload statement
          </Link>
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl p-5 border border-white/5 bg-white/3 h-[104px] animate-pulse"
                />
              ))
            ) : (
              <>
                <StatsCard
                  label="Monthly spend found"
                  value={formatCurrency(stats.totalMonthlySpend)}
                  trend={`Across ${stats.activeCount} subscriptions`}
                  icon={CreditCard}
                  variant="success"
                />
                <StatsCard
                  label="Potential savings"
                  value={formatCurrency(stats.potentialSavings)}
                  trend={
                    stats.duplicateCount + stats.unusedCount > 0
                      ? `Review ${stats.duplicateCount + stats.unusedCount} flagged items`
                      : 'No savings flagged'
                  }
                  icon={TrendingDown}
                  variant="info"
                />
                <StatsCard
                  label="Active subscriptions"
                  value={String(stats.activeCount)}
                  trend={`${stats.duplicateCount} duplicate${stats.duplicateCount === 1 ? '' : 's'} detected`}
                  icon={FileSearch}
                  variant="warning"
                />
                <StatsCard
                  label="Alerts"
                  value={String(stats.duplicateCount + stats.unusedCount)}
                  trend={`${stats.unusedCount} unused subscription${stats.unusedCount === 1 ? '' : 's'}`}
                  icon={AlertCircle}
                  variant="danger"
                />
              </>
            )}
          </div>

          {/* Trend chart */}
          <div className="bg-gray-900 border border-white/5 rounded-2xl p-6">
            <h2 className="font-display text-lg font-bold text-white mb-4">
              Spending trend
            </h2>
            <SavingsChart audits={audits} />
          </div>

          {/* Two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent audits — takes 2 columns */}
            <div className="lg:col-span-2 bg-gray-900 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-lg font-bold text-white">
                  Recent Audits
                </h2>
                <Link
                  href="/report"
                  className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors flex items-center gap-1"
                >
                  View all
                  <ArrowRight size={14} />
                </Link>
              </div>
              <RecentAudits audits={audits} />
            </div>

            {/* Quick actions — takes 1 column */}
            <div className="space-y-4">
              <div className="bg-gray-900 border border-white/5 rounded-2xl p-6">
                <h2 className="font-display text-lg font-bold text-white mb-2">
                  Run a new audit
                </h2>
                <p className="text-gray-400 text-sm mb-4">
                  Upload a fresh bank statement to find new subscriptions.
                </p>
                <Link
                  href="/upload"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm rounded-xl transition-all duration-200"
                >
                  <Upload size={16} />
                  Upload statement
                </Link>
              </div>

              {stats.duplicateCount > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle size={16} className="text-amber-400" />
                    <h3 className="font-display font-semibold text-white text-sm">
                      Savings tip
                    </h3>
                  </div>
                  <p className="text-gray-400 text-sm">
                    You have {stats.duplicateCount} duplicate subscription
                    {stats.duplicateCount === 1 ? '' : 's'}. Cancelling{' '}
                    {stats.duplicateCount === 1 ? 'it' : 'one'} could save you{' '}
                    <span className="text-amber-400 font-semibold">
                      {formatCurrency(stats.potentialSavings)}/month
                    </span>
                    .
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
