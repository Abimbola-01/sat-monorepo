import Link from 'next/link'
import { FileSearch, Clock, Loader2, AlertCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { AuditResult } from '@/types'

interface RecentAuditsProps {
  audits: AuditResult[]
  limit?: number
}

const statusConfig = {
  complete: { icon: FileSearch, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  processing: { icon: Loader2, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  failed: { icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
} as const

export function RecentAudits({ audits, limit = 5 }: RecentAuditsProps) {
  const visibleAudits = audits.slice(0, limit)

  if (visibleAudits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <FileSearch size={20} className="text-gray-500" />
        </div>
        <p className="text-gray-500 text-sm">
          No audits yet. Upload a bank statement to run your first one.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {visibleAudits.map((audit) => {
        const config = statusConfig[audit.status]
        const Icon = config.icon

        return (
          <Link
            key={audit.id}
            href={`/audit/${audit.id}`}
            className="flex items-center justify-between p-4 rounded-xl bg-white/3 hover:bg-white/5 transition-colors border border-white/5"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-lg ${config.bg} border ${config.border} flex items-center justify-center shrink-0`}
              >
                <Icon
                  size={16}
                  className={`${config.color} ${audit.status === 'processing' ? 'animate-spin' : ''}`}
                />
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {audit.status === 'processing'
                    ? 'Processing...'
                    : audit.status === 'failed'
                      ? 'Audit failed'
                      : `${audit.totalSubscriptions} subscriptions found`}
                </p>
                <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                  <Clock size={10} />
                  {formatDate(audit.createdAt)}
                </p>
              </div>
            </div>

            {audit.status === 'complete' && (
              <div className="text-right shrink-0">
                <p className="text-emerald-400 text-sm font-semibold">
                  {formatCurrency(audit.potentialSavings)} saved
                </p>
                <p className="text-gray-500 text-xs">
                  {audit.totalSubscriptions} subs found
                </p>
              </div>
            )}
          </Link>
        )
      })}
    </div>
  )
}
