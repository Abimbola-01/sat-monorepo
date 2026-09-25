'use client'

import { FileSearch } from 'lucide-react'
import { SubscriptionCard } from '@/components/audit/SubscriptionCard'
import { cn } from '@/lib/utils'
import type { Subscription } from '@/types'

type CategoryFilter = Subscription['category'] | 'all'

interface SubscriptionListProps {
  subscriptions: Subscription[]
  duplicateIds?: Set<string>
  isLoading?: boolean
  categoryFilter?: CategoryFilter
  onCategoryFilterChange?: (category: CategoryFilter) => void
  showActiveOnly?: boolean
  onShowActiveOnlyChange?: (value: boolean) => void
  emptyMessage?: string
}

const categories: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'streaming', label: 'Streaming' },
  { value: 'software', label: 'Software' },
  { value: 'finance', label: 'Finance' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other' },
]

function SubscriptionCardSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/5" />
        <div className="space-y-2">
          <div className="h-3.5 w-32 rounded bg-white/5" />
          <div className="h-3 w-20 rounded bg-white/5" />
        </div>
      </div>
      <div className="space-y-2 text-right">
        <div className="h-3.5 w-16 rounded bg-white/5 ml-auto" />
        <div className="h-3 w-20 rounded bg-white/5 ml-auto" />
      </div>
    </div>
  )
}

export function SubscriptionList({
  subscriptions,
  duplicateIds = new Set(),
  isLoading = false,
  categoryFilter,
  onCategoryFilterChange,
  showActiveOnly,
  onShowActiveOnlyChange,
  emptyMessage = 'No subscriptions found yet. Upload a statement to get started.',
}: SubscriptionListProps) {
  const showFilters = onCategoryFilterChange !== undefined

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => onCategoryFilterChange?.(cat.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
                  categoryFilter === cat.value
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-white/3 text-gray-400 border-white/5 hover:bg-white/5 hover:text-white'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {onShowActiveOnlyChange && (
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => onShowActiveOnlyChange(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-white/5 accent-emerald-500"
              />
              Active only
            </label>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SubscriptionCardSkeleton key={i} />
          ))}
        </div>
      ) : subscriptions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <FileSearch size={20} className="text-gray-500" />
          </div>
          <p className="text-gray-500 text-sm max-w-xs">{emptyMessage}</p>
        </div>
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
    </div>
  )
}
