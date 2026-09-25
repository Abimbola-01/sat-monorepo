import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cn, formatCurrency, getFrequencyLabel } from '@/lib/utils'
import type { Subscription } from '@/types'

interface SubscriptionCardProps {
  subscription: Subscription
  isDuplicate?: boolean
  className?: string
}

const categoryVariant: Record<Subscription['category'], 'info' | 'success' | 'warning' | 'neutral'> = {
  streaming: 'info',
  software: 'success',
  finance: 'warning',
  utilities: 'neutral',
  other: 'neutral',
}

const categoryLabel: Record<Subscription['category'], string> = {
  streaming: 'Streaming',
  software: 'Software',
  finance: 'Finance',
  utilities: 'Utilities',
  other: 'Other',
}

export function SubscriptionCard({ subscription, isDuplicate = false, className }: SubscriptionCardProps) {
  const {
    name,
    amount,
    currency,
    frequency,
    category,
    lastCharged,
    active,
    logoUrl,
  } = subscription

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-xl border transition-colors',
        isDuplicate
          ? 'bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10'
          : 'bg-white/3 border-white/5 hover:bg-white/5',
        !active && 'opacity-60',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 text-sm font-semibold">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-white text-sm font-medium truncate">{name}</p>
            {isDuplicate && (
              <AlertTriangle size={14} className="text-rose-400 shrink-0" aria-label="Possible duplicate" />
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={categoryVariant[category]}>{categoryLabel[category]}</Badge>
            {!active && <Badge variant="neutral">Inactive</Badge>}
          </div>
        </div>
      </div>

      <div className="text-right shrink-0 ml-4">
        <p className="text-white text-sm font-semibold">
          {formatCurrency(amount, currency)}
          <span className="text-gray-500 font-normal">{getFrequencyLabel(frequency)}</span>
        </p>
        <p className="text-gray-500 text-xs mt-0.5">
          Last charged {new Date(lastCharged).toLocaleDateString('en-NG', {
            month: 'short',
            day: 'numeric',
          })}
        </p>
      </div>
    </div>
  )
}
