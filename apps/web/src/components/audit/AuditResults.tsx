import type { AuditResult } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface AuditResultsProps {
  audit: AuditResult
}

export function AuditResults({ audit }: AuditResultsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl p-5 border border-white/5 bg-white/3">
          <p className="text-gray-400 text-sm">Monthly spend</p>
          <p className="font-display text-2xl font-bold text-white mt-1">
            {formatCurrency(audit.totalMonthlySpend)}
          </p>
          <p className="text-gray-500 text-xs mt-1">{audit.totalSubscriptions} subscriptions</p>
        </div>
        <div className="rounded-xl p-5 border border-white/5 bg-white/3">
          <p className="text-gray-400 text-sm">Yearly spend</p>
          <p className="font-display text-2xl font-bold text-white mt-1">
            {formatCurrency(audit.totalMonthlySpend * 12)}
          </p>
          <p className="text-gray-500 text-xs mt-1">estimate</p>
        </div>
        <div className="rounded-xl p-5 border border-white/5 bg-white/3">
          <p className="text-gray-400 text-sm">Subscriptions</p>
          <p className="font-display text-2xl font-bold text-white mt-1">
            {audit.totalSubscriptions}
          </p>
          <p className="text-gray-500 text-xs mt-1">detected</p>
        </div>
      </div>
    </div>
  )
}

