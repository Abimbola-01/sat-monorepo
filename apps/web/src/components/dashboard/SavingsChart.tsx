import { formatCurrency } from '@/lib/utils'
import type { AuditResult } from '@/types'

interface SavingsChartProps {
  audits: AuditResult[]
}

export function SavingsChart({ audits }: SavingsChartProps) {
  const complete = audits.filter((a) => a.status === 'complete')

  if (complete.length < 2) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm text-center px-8">
        Run at least two audits to see your spending trend over time.
      </div>
    )
  }

  const rows = complete
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((a) => ({
      date: new Date(a.createdAt).toLocaleDateString('en-NG', { month: 'short', year: '2-digit' }),
      spend: a.totalMonthlySpend,
      savings: a.potentialSavings,
    }))

  return (
    <div className="h-64">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-white/5">
              <td className="py-2 text-gray-400">{r.date}</td>
              <td className="py-2 text-white">{formatCurrency(r.spend)}</td>
              <td className="py-2 text-emerald-400">{formatCurrency(r.savings)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

