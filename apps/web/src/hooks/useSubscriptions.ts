'use client'

import { useMemo } from 'react'
import type { Subscription } from '@/types'
import { useTransactions, useSubscriptions as useQorviSubscriptions, useInsights } from './useQorvi'

export interface SubscriptionStats {
  totalMonthlySpend: number
  potentialSavings: number
  activeCount: number
  reviewCount: number
}

export function useSubscriptions() {
  const { transactions, isLoading: txLoading } = useTransactions(200)
  const { subscriptions, isLoading: subsLoading, error: subsError, refetch: refetchSubs } = useQorviSubscriptions()
  const { insights, isLoading: insightsLoading } = useInsights()

  const isLoading = txLoading || subsLoading || insightsLoading

  const stats: SubscriptionStats = useMemo(() => {
    const activeCount = subscriptions.filter((s) => s.status === 'active').length
    const reviewCount = subscriptions.filter((s) => s.status === 'needsReview').length
    return {
      totalMonthlySpend: insights?.totalMonthlyAmount ?? subscriptions.reduce((s, x) => s + x.monthlyAmount, 0),
      potentialSavings: insights?.potentialMonthlySavings ?? subscriptions.reduce((s, x) => s + x.monthlyAmount, 0),
      activeCount,
      reviewCount,
    }
  }, [subscriptions, insights])

  const subscriptionsFiltered = useMemo(() => {
    return subscriptions.slice().sort((a, b) => {
      const rank: Record<string, number> = { high: 3, medium: 2, low: 1 }
      const aRank = rank[getConfidenceLabel(a.confidenceScore)] || 0
      const bRank = rank[getConfidenceLabel(b.confidenceScore)] || 0
      return (bRank - aRank) || b.monthlyAmount - a.monthlyAmount
    })
  }, [subscriptions])

  return {
    subscriptions: subscriptionsFiltered,
    duplicates: [],
    stats,
    isLoading,
    error: subsError,
    refetch: refetchSubs,
    hasData: subscriptions.length > 0 || transactions.length > 0,
  }
}

function getConfidenceLabel(score: number): string {
  if (score >= 70) return 'high'
  if (score >= 45) return 'medium'
  return 'low'
}
