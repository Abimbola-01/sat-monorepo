'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  XCircle,
  TrendingDown,
  Wallet,
} from 'lucide-react'
import { useAudit } from '@/hooks/useAudit'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  ReportDownload,
  ReportDownloadPlaceholder,
} from '@/components/audit/ReportDownload'
import { formatCurrency, formatDate, getFrequencyLabel } from '@/lib/utils'

const TOP_SUBSCRIPTIONS_COUNT = 5

function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-64 rounded-xl bg-white/3 border border-white/5 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-white/3 border border-white/5 animate-pulse" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-white/3 border border-white/5 animate-pulse" />
    </div>
  )
}

export default function ReportDetailPage() {
  const params = useParams<{ reportId: string }>()
  const reportId = params?.reportId ?? null

  const { audit, isLoading, error } = useAudit(reportId)

  const topSubscriptions = (audit?.subscriptions ?? []).slice(0, TOP_SUBSCRIPTIONS_COUNT)

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/report"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
      >
        <ArrowLeft size={16} />
        All reports
      </Link>

      {isLoading && !audit && <ReportSkeleton />}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <AlertCircle size={18} className="text-rose-400 shrink-0" />
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      )}

      {!isLoading && !error && !audit && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-gray-900 border border-white/5 rounded-2xl">
          <XCircle size={32} className="text-gray-500" />
          <p className="text-gray-400 text-sm">Report not found.</p>
          <Link href="/report" className="text-emerald-400 text-sm hover:text-emerald-300">
            Back to reports
          </Link>
        </div>
      )}

      {audit?.status === 'processing' && (
        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center bg-gray-900 border border-white/5 rounded-2xl">
          <Loader2 size={32} className="text-emerald-400 animate-spin" />
          <div>
            <h2 className="font-display text-xl font-bold text-white mb-2">
              Your report is being prepared...
            </h2>
            <p className="text-gray-400 text-sm max-w-sm">
              This page updates automatically when the analysis finishes.
            </p>
          </div>
        </div>
      )}

      {audit?.status === 'failed' && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-rose-500/5 border border-rose-500/20 rounded-2xl">
          <XCircle size={32} className="text-rose-400" />
          <div>
            <h2 className="font-display text-lg font-bold text-white mb-1">
              This audit failed, so there is no report
            </h2>
            <p className="text-gray-400 text-sm max-w-sm">
              Try uploading your statement again.
            </p>
          </div>
          <Link
            href="/upload"
            className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors"
          >
            Upload again
          </Link>
        </div>
      )}

      {audit?.status === 'complete' && (
        <>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">
                Savings report
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                {formatDate(audit.createdAt)}
              </p>
            </div>
            {audit.reportUrl ? (
              <ReportDownload reportId={audit.id} />
            ) : (
              <ReportDownloadPlaceholder />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card variant="glass">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-sm">Monthly spend</span>
                <Wallet size={16} className="text-gray-500" />
              </div>
              <p className="font-display text-2xl font-bold text-white">
                {formatCurrency(audit.totalMonthlySpend)}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                {audit.totalSubscriptions} subscription
                {audit.totalSubscriptions === 1 ? '' : 's'} found
              </p>
            </Card>

            <Card variant="success">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-sm">Potential savings</span>
                <TrendingDown size={16} className="text-emerald-400" />
              </div>
              <p className="font-display text-2xl font-bold text-emerald-400">
                {formatCurrency(audit.potentialSavings)}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                {audit.duplicates.length} duplicate group
                {audit.duplicates.length === 1 ? '' : 's'}, {audit.unusedCount} inactive
              </p>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Biggest subscriptions</CardTitle>
              <Link
                href={`/audit/${audit.id}`}
                className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors flex items-center gap-1"
              >
                Full audit
                <ArrowRight size={14} />
              </Link>
            </CardHeader>
            <CardContent>
              {topSubscriptions.length === 0 ? (
                <p className="text-gray-500 text-sm py-6 text-center">
                  No subscriptions were found in this statement.
                </p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {topSubscriptions.map((sub) => (
                    <li
                      key={sub.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{sub.name}</p>
                        {!sub.active && <Badge variant="neutral">Inactive</Badge>}
                      </div>
                      <p className="text-white text-sm font-semibold shrink-0 ml-4">
                        {formatCurrency(sub.amount, sub.currency)}
                        <span className="text-gray-500 font-normal">
                          {getFrequencyLabel(sub.frequency)}
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
