'use client'

import { useState } from 'react'
import { RefreshCw, Trash2, AlertTriangle, CheckCircle2, Pencil, Eye } from 'lucide-react'
import { useSubscriptions, useDashboard } from '@/hooks/useQorvi'
import { SubscriptionList } from '@/components/dashboard/SubscriptionList'
import { SubscriptionCard } from '@/components/dashboard/SubscriptionCard'
import { InsightsPanel } from '@/components/dashboard/InsightsPanel'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, getConfidenceLabel } from '@/lib/utils'
import { toast } from 'sonner'
import type { Subscription } from '@/types'

const CONFIDENCE_ORDER = ['high', 'medium', 'low']
const FREQUENCY_LABEL = {
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
  irregular: 'Irregular',
}

export default function SubscriptionsPage() {
  const { subscriptions, isLoading, error, refetch } = useSubscriptions()
  const { metrics, isLoading: metricsLoading } = useDashboard()
  const [filter, setFilter] = useState('all')
  const [confidenceFilter, setConfidenceFilter] = useState('all')

  const filtered = subscriptions.filter((s) => {
    if (filter === 'active' && s.status !== 'active') return false
    if (filter === 'possiblyInactive' && s.status !== 'possiblyInactive') return false
    if (filter === 'needsReview' && s.status !== 'needsReview') return false
    if (confidenceFilter === 'high' && s.confidenceScore < 70) return false
    if (confidenceFilter === 'medium' && (s.confidenceScore < 45 || s.confidenceScore >= 70)) return false
    if (confidenceFilter === 'low' && s.confidenceScore >= 45) return false
    return true
  })

  const handleConfirm = async (id: string) => {
    try {
      await refetch()
      toast.success('Subscription confirmed')
    } catch {
      toast.error('Failed to confirm subscription')
    }
  }

  const handleDismiss = async (id: string) => {
    try {
      await refetch()
      toast.success('Subscription dismissed')
    } catch {
      toast.error('Failed to dismiss subscription')
    }
  }

  const handleEdit = async (id: string, updates: any) => {
    try {
      await refetch()
      toast.success('Subscription updated')
    } catch {
      toast.error('Failed to update subscription')
    }
  }

  const handleMarkInactive = async (id: string) => {
    try {
      await refetch()
      toast.success('Marked as possibly inactive')
    } catch {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Subscriptions</h1>
          <p className="text-gray-400 mt-1">
            Detected recurring payments and subscriptions from your transactions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => refetch()} isLoading={isLoading}>
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Re-detect
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <AlertTriangle size={18} className="text-rose-400 shrink-0" />
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Monthly recurring spend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-bold text-white">
              {formatCurrency(metrics?.monthlyRecurringSpending ?? 0)}
            </p>
            <p className="text-gray-500 text-xs mt-1">Across detected subscriptions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estimated yearly spend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-bold text-emerald-400">
              {formatCurrency(metrics?.estimatedAnnualRecurringSpending ?? 0)}
            </p>
            <p className="text-gray-500 text-xs mt-1">Based on detected frequency</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-bold text-cyan-400">
              {metrics?.activeSubscriptionCount ?? 0}
            </p>
            <p className="text-gray-500 text-xs mt-1">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Potential savings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl font-bold text-amber-400">
              {formatCurrency(metrics?.potentialMonthlySavings ?? 0)}/mo
            </p>
            <p className="text-gray-500 text-xs mt-1">
              {formatCurrency(metrics?.potentialAnnualSavings ?? 0)}/yr potential
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'possiblyInactive', label: 'Possibly inactive' },
              { value: 'needsReview', label: 'Needs review' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  filter === opt.value
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-white/3 text-gray-400 border-white/5 hover:bg-white/5 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { value: 'all', label: 'All confidence' },
              { value: 'high', label: 'High (70+)' },
              { value: 'medium', label: 'Medium (45-69)' },
              { value: 'low', label: 'Low (<45)' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setConfidenceFilter(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  confidenceFilter === opt.value
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                    : 'bg-white/3 text-gray-400 border-white/5 hover:bg-white/5 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subscription list */}
      <Card>
        <CardHeader>
          <CardTitle>Detected subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && filtered.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw size={20} className="animate-spin text-gray-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <CheckCircle2 size={20} className="text-gray-500" />
              </div>
              <p className="text-gray-500 text-sm max-w-xs">
                No subscriptions match the current filters.
              </p>
            </div>
          ) : (
            <SubscriptionList
              subscriptions={filtered}
              isLoading={false}
              onConfirm={handleConfirm}
              onDismiss={handleDismiss}
              onEdit={handleEdit}
              onMarkInactive={handleMarkInactive}
            />
          )}

          {metrics && (
            <div className="mt-6 pt-4 border-t border-white/5">
              <InsightsPanel insights={null} metrics={metrics} isLoading={metricsLoading} showForgotten={false} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
