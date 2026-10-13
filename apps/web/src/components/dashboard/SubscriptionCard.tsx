'use client'

import { useState } from 'react'
import { Pencil, Check, X, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { cn, formatCurrency, formatDate, formatDateShort, getFrequencyLabel, getFrequencyText, getStatusLabel, getConfidenceLabel } from '@/lib/utils'
import type { Subscription } from '@/types'

interface SubscriptionCardProps {
  subscription: Subscription
  className?: string
  showDetails?: boolean
  onConfirm?: (id: string) => Promise<void>
  onDismiss?: (id: string) => Promise<void>
  onEdit?: (id: string, updates: { name?: string; categories?: string[]; status?: string }) => Promise<void>
  onMarkInactive?: (id: string) => Promise<void>
}

const FREQUENCY_LABEL = {
  weekly: '/wk',
  biweekly: '/2wk',
  monthly: '/mo',
  quarterly: '/qtr',
  annual: '/yr',
  irregular: '/occ',
} as const

const STATUS_VARIANT = {
  active: 'success' as const,
  possiblyInactive: 'warning' as const,
  needsReview: 'neutral' as const,
}

export function SubscriptionCard({
  subscription,
  className,
  showDetails = false,
  onConfirm,
  onDismiss,
  onEdit,
  onMarkInactive,
}: SubscriptionCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(subscription.name)
  const [editedCategories, setEditedCategories] = useState<string[]>(subscription.categories)
  const [saving, setSaving] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const {
    name,
    monthlyAmount,
    currency,
    frequency,
    occurrences,
    lastPaymentDate,
    estimatedNextPaymentDate,
    confidenceScore,
    status,
    yearlyAmount,
    categories,
    reason,
  } = subscription

  const handleSave = async () => {
    setSaving(true)
    try {
      if (onEdit) {
        await onEdit(subscription.id, {
          name: editedName !== name ? editedName : undefined,
          categories: editedCategories.join(', ') !== categories.join(', ') ? editedCategories : undefined,
        })
      }
    } finally {
      setSaving(false)
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditedName(name)
    setEditedCategories(categories)
    setIsEditing(false)
  }

  return (
    <Card className={cn('p-0 overflow-hidden', className)}>
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between p-4 border-b',
        status === 'active' ? 'bg-white/5' : status === 'possiblyInactive' ? 'bg-amber-500/5' : 'bg-gray-900/30'
      )}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
            <span className="text-gray-400 text-sm font-semibold">
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="text-white text-sm font-medium bg-white/10 border border-white/20 rounded px-2 py-1 w-48 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            ) : (
              <p className="text-white text-sm font-medium truncate">{name}</p>
            )}
            {!isEditing && showDetails && (
              <p className="text-gray-500 text-xs mt-1">
                {occurrences} payment{occurrences === 1 ? '' : 's'} · {getFrequencyText(frequency)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_VARIANT[status]}>{getStatusLabel(status)}</Badge>
          <Badge variant="neutral">{getConfidenceLabel(confidenceScore)}</Badge>
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <Pencil size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Reason */}
        <p className="text-gray-500 text-xs leading-relaxed">{reason}</p>

        {/* Amount row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-semibold">
              {formatCurrency(monthlyAmount, currency)}
              <span className="text-gray-500 font-normal">{FREQUENCY_LABEL[frequency]}</span>
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              {formatCurrency(yearlyAmount, currency)} / yr
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs">
              {lastPaymentDate ? `Last ${formatDate(lastPaymentDate)}` : 'No payments yet'}
            </p>
            {estimatedNextPaymentDate && (
              <p className="text-cyan-400 text-xs mt-0.5">
                Next: {formatDateShort(estimatedNextPaymentDate)}
              </p>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((cat) => (
            <Badge key={cat} variant="neutral">{cat}</Badge>
          ))}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 p-3 border-t bg-white/5">
          {status !== 'active' && onConfirm && (
            <Button size="sm" variant="ghost" onClick={() => onConfirm(subscription.id)}>
              <CheckCircle2 size={14} />
              Confirm
            </Button>
          )}
          {status === 'active' && onMarkInactive && (
            <Button size="sm" variant="ghost" onClick={() => onMarkInactive(subscription.id)}>
              <AlertCircle size={14} />
              Mark inactive
            </Button>
          )}
          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={() => onDismiss(subscription.id)}>
              <Trash2 size={14} />
              Dismiss
            </Button>
          )}
        </div>
      )}

      {/* Edit mode */}
      {isEditing && (
        <div className="flex items-center gap-2 p-3 border-t bg-white/5">
          <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      )}
    </Card>
  )
}
