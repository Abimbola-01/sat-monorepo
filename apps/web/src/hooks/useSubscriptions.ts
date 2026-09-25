'use client'

import { useMemo, useState } from 'react'
import type { AuditResult, Subscription } from '@/types'
import { useAudits } from './useAudit'

export interface SubscriptionStats {
  totalMonthlySpend: number
  potentialSavings: number
  activeCount: number
  duplicateCount: number
  unusedCount: number
}

type CategoryFilter = Subscription['category'] | 'all'

/**
 * Derives the current subscription list and aggregate stats from the
 * user's most recent *completed* audit. There is no dedicated
 * subscriptions endpoint on the backend — this is intentional, since
 * subscriptions only exist in the context of an audit result.
 */
export function useSubscriptions() {
  const { audits, isLoading, error, refetch } = useAudits()
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [showActiveOnly, setShowActiveOnly] = useState(false)

  const latestCompletedAudit = useMemo<AuditResult | null>(() => {
    return audits.find((audit) => audit.status === 'complete') ?? null
  }, [audits])

  const stats: SubscriptionStats = useMemo(() => {
    if (!latestCompletedAudit) {
      return {
        totalMonthlySpend: 0,
        potentialSavings: 0,
        activeCount: 0,
        duplicateCount: 0,
        unusedCount: 0,
      }
    }

    return {
      totalMonthlySpend: latestCompletedAudit.totalMonthlySpend,
      potentialSavings: latestCompletedAudit.potentialSavings,
      activeCount: latestCompletedAudit.subscriptions.filter((s) => s.active).length,
      duplicateCount: latestCompletedAudit.duplicates.length,
      unusedCount: latestCompletedAudit.unusedCount,
    }
  }, [latestCompletedAudit])

  const subscriptions = useMemo<Subscription[]>(() => {
    if (!latestCompletedAudit) return []

    return latestCompletedAudit.subscriptions.filter((sub) => {
      if (showActiveOnly && !sub.active) return false
      if (categoryFilter !== 'all' && sub.category !== categoryFilter) return false
      return true
    })
  }, [latestCompletedAudit, categoryFilter, showActiveOnly])

  return {
    subscriptions,
    duplicates: latestCompletedAudit?.duplicates ?? [],
    stats,
    isLoading,
    error,
    refetch,
    categoryFilter,
    setCategoryFilter,
    showActiveOnly,
    setShowActiveOnly,
    hasAudit: latestCompletedAudit !== null,
  }
}
