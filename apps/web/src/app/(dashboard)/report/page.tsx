'use client'

import Link from 'next/link'
import { AlertCircle, FileText, Upload } from 'lucide-react'
import { useAudits } from '@/hooks/useAudit'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'

function ReportRowSkeleton() {
  return (
    <div className="h-20 rounded-xl bg-white/3 border border-white/5 animate-pulse" />
  )
}

export default function ReportsPage() {
  const { audits, isLoading, error } = useAudits()

  const completedAudits = audits.filter((audit) => audit.status === 'complete')

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Reports</h1>
          <p className="text-gray-400 mt-1">
            Every completed audit, with its downloadable savings report.
          </p>
        </div>
        <Link
          href="/upload"
          className="hidden md:inline-flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm rounded-xl transition-all duration-200"
        >
          <Upload size={16} />
          New audit
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <AlertCircle size={18} className="text-rose-400 shrink-0" />
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ReportRowSkeleton key={i} />
          ))}
        </div>
      ) : completedAudits.length === 0 && !error ? (
        <Card className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <FileText size={24} className="text-gray-500" />
          </div>
          <p className="text-gray-400 text-sm max-w-xs">
            No reports yet. Upload a bank statement and your first report will appear here.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm rounded-xl transition-all duration-200"
          >
            <Upload size={16} />
            Upload statement
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {completedAudits.map((audit) => (
            <Link
              key={audit.id}
              href={`/report/${audit.id}`}
              className="flex items-center justify-between p-4 rounded-xl bg-gray-900 border border-white/5 hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <FileText size={16} className="text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium">
                    {formatDate(audit.createdAt)}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {audit.totalSubscriptions} subscription
                    {audit.totalSubscriptions === 1 ? '' : 's'} found
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 ml-4">
                <div className="text-right">
                  <p className="text-emerald-400 text-sm font-semibold">
                    {formatCurrency(audit.potentialSavings)}
                  </p>
                  <p className="text-gray-500 text-xs">potential savings</p>
                </div>
                {audit.reportUrl ? (
                  <Badge variant="success">PDF ready</Badge>
                ) : (
                  <Badge variant="neutral">No PDF</Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
