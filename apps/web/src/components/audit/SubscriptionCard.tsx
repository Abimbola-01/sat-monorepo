import { Badge } from '@/components/ui/Badge'
import { cn, formatCurrency } from '@/lib/utils'
import type { Subscription } from '@/types'

interface SubscriptionCardProps {
  subscription: Subscription
  isDuplicate?: boolean
  className?: string
}

export function SubscriptionCard({ subscription, isDuplicate = false, className }: SubscriptionCardProps) {
  const {
    name,
    monthlyAmount,
    currency,
    frequency,
    lastPaymentDate,
  } = subscription

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-xl border transition-colors',
        isDuplicate
          ? 'bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10'
          : 'bg-white/3 border-white/5 hover:bg-white/5',
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
          <span className="text-gray-400 text-sm font-semibold">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{name}</p>
          {lastPaymentDate && (
            <p className="text-gray-500 text-xs mt-0.5">
              Last {new Date(lastPaymentDate).toLocaleDateString('en-NG', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>
      <div className="text-right shrink-0 ml-4">
        <p className="text-white text-sm font-semibold">
          {formatCurrency(monthlyAmount, currency as 'NGN' | 'USD' | 'GBP')}
          <span className="text-gray-500 font-normal">
            {frequency === 'weekly' ? '/wk' : frequency === 'monthly' ? '/mo' : frequency === 'quarterly' ? '/qtr' : frequency === 'annual' ? '/yr' : '/occ'}
          </span>
        </p>
      </div>
    </div>
  )
}

