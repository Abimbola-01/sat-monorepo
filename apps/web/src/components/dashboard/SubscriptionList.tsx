'use client'

import { FileSearch, AlertTriangle } from 'lucide-react'
import { SubscriptionCard } from '@/components/dashboard/SubscriptionCard'
import { cn } from '@/lib/utils'
import type { Subscription } from '@/types'

interface SubscriptionListProps {
  subscriptions: Subscription[]
  isLoading?: boolean
  emptyMessage?: string
  onConfirm?: (id: string) => Promise<void>
  onDismiss?: (id: string) => Promise<void>
  onEdit?: (id: string, updates: { name?: string; categories?: string[]; status?: string }) => Promise<void>
  onMarkInactive?: (id: string) => Promise<void>
}

export function SubscriptionList({
  subscriptions,
  isLoading = false,
  emptyMessage = 'No subscriptions found yet.',
  onConfirm,
  onDismiss,
  onEdit,
  onMarkInactive,
}: SubscriptionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/5" />
              <div className="space-y-2">
                <div className="h-3.5 w-40 rounded bg-white/5" />
                <div className="h-3 w-24 rounded bg-white/5" />
              </div>
            </div>
            <div className="h-5 w-20 rounded bg-white/5 ml-4" />
          </div>
        ))}
      </div>
    )
  }

  if (subscriptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <FileSearch size={20} className="text-gray-500" />
        </div>
        <p className="text-gray-500 text-sm max-w-xs">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {subscriptions.map((sub) => (
        <SubscriptionCard
          key={sub.id}
          subscription={sub}
          showDetails
          onConfirm={onConfirm}
          onDismiss={onDismiss}
          onEdit={onEdit}
          onMarkInactive={onMarkInactive}
        />
      ))}
    </div>
  )
}
