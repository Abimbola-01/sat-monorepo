import { AlertTriangle, TrendingDown, Wallet, FileSearch } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { SubscriptionCard } from '@/components/audit/SubscriptionCard'
import { formatCurrency } from '@/lib/utils'
import type { AuditResult } from '@/types'

interface AuditResultsProps {
  audit: AuditResult
}

export function AuditResults({ audit }: AuditResultsProps) {
  const {
    totalSubscriptions,
    totalMonthlySpend,
    potentialSavings,
    subscriptions,
    duplicates,
    unusedCount,
  } = audit

  const duplicateIds = new Set(duplicates.flat().map((sub) => sub.id))

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card variant="glass">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Monthly spend</span>
            <Wallet size={16} className="text-gray-500" />
          </div>
          <p className="font-display text-2xl font-bold text-white">
            {formatCurrency(totalMonthlySpend)}
          </p>
          <p className="text-gray-500 text-xs mt-1">{totalSubscriptions} subscriptions found</p>
        </Card>

        <Card variant="success">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Potential savings</span>
            <TrendingDown size={16} className="text-emerald-400" />
          </div>
          <p className="font-display text-2xl font-bold text-emerald-400">
            {formatCurrency(potentialSavings)}
          </p>
          <p className="text-gray-500 text-xs mt-1">per month if optimized</p>
        </Card>

        <Card variant={duplicates.length > 0 ? 'danger' : 'glass'}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm">Duplicates &amp; unused</span>
            <AlertTriangle
              size={16}
              className={duplicates.length > 0 ? 'text-rose-400' : 'text-gray-500'}
            />
          </div>
          <p
            className={`font-display text-2xl font-bold ${
              duplicates.length > 0 ? 'text-rose-400' : 'text-white'
            }`}
          >
            {duplicates.length + unusedCount}
          </p>
          <p className="text-gray-500 text-xs mt-1">
            {duplicates.length} duplicate{duplicates.length === 1 ? '' : 's'}, {unusedCount} unused
          </p>
        </Card>
      </div>

      {/* Duplicates — called out inline since they're a core finding, not buried in a tab */}
      {duplicates.length > 0 && (
        <Card variant="danger">
          <CardHeader>
            <CardTitle>
              <span className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-400" />
                Duplicate subscriptions found
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {duplicates.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-2">
                <p className="text-rose-400 text-xs font-medium uppercase tracking-wide">
                  Group {groupIndex + 1} — {group.length} overlapping charges
                </p>
                <div className="space-y-2">
                  {group.map((sub) => (
                    <SubscriptionCard key={sub.id} subscription={sub} isDuplicate />
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Full subscription list */}
      <Card>
        <CardHeader>
          <CardTitle>
            <span className="flex items-center gap-2">
              <FileSearch size={18} className="text-emerald-400" />
              All subscriptions
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">
              No subscriptions found in this statement.
            </p>
          ) : (
            <div className="space-y-2">
              {subscriptions.map((sub) => (
                <SubscriptionCard
                  key={sub.id}
                  subscription={sub}
                  isDuplicate={duplicateIds.has(sub.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
