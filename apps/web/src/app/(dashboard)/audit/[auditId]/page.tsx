'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, AlertCircle, XCircle } from 'lucide-react'
import { useAudit } from '@/hooks/useAudit'
import { AuditResults } from '@/components/audit/AuditResults'
import { ReportDownload } from '@/components/audit/ReportDownload'

function AuditResultsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-white/3 border border-white/5 animate-pulse" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-white/3 border border-white/5 animate-pulse" />
    </div>
  )
}

export default function AuditDetailPage() {
  const params = useParams<{ auditId: string }>()
  const router = useRouter()
  const auditId = params?.auditId ?? null

  const { audit, isLoading, error } = useAudit(auditId)

  return (
    <div className="space-y-6 max-w-5xl">
      <button
        onClick={() => router.push('/dashboard')}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
      >
        <ArrowLeft size={16} />
        Back to dashboard
      </button>

      {isLoading && !audit && <AuditResultsSkeleton />}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <AlertCircle size={18} className="text-rose-400 shrink-0" />
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      )}

      {!isLoading && !error && !audit && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-gray-900 border border-white/5 rounded-2xl">
          <XCircle size={32} className="text-gray-500" />
          <p className="text-gray-400 text-sm">Audit not found.</p>
          <Link href="/dashboard" className="text-emerald-400 text-sm hover:text-emerald-300">
            Return to dashboard
          </Link>
        </div>
      )}

      {audit?.status === 'processing' && (
        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center bg-gray-900 border border-white/5 rounded-2xl">
          <Loader2 size={32} className="text-emerald-400 animate-spin" />
          <div>
            <h2 className="font-display text-xl font-bold text-white mb-2">
              Analyzing your statement...
            </h2>
            <p className="text-gray-400 text-sm max-w-sm">
              This updates automatically — no need to refresh. It usually takes under a minute.
            </p>
          </div>
        </div>
      )}

      {audit?.status === 'failed' && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-rose-500/5 border border-rose-500/20 rounded-2xl">
          <XCircle size={32} className="text-rose-400" />
          <div>
            <h2 className="font-display text-lg font-bold text-white mb-1">
              This audit failed
            </h2>
            <p className="text-gray-400 text-sm max-w-sm">
              Something went wrong while analyzing your statement. Try uploading it again.
            </p>
          </div>
          <Link
            href="/upload"
            className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors"
          >
            Try again
          </Link>
        </div>
      )}

      {audit?.status === 'complete' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-white">Audit results</h1>
              <p className="text-gray-400 text-sm mt-1">
                {new Date(audit.createdAt).toLocaleDateString('en-NG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            {/*
              Backend note: audit.reportUrl currently mirrors the raw
              uploaded statement's storage URL (file_url), not a generated
              report. ReportDownload calls GET /api/report/:reportId/download,
              which does not exist on the backend yet — this button is wired
              but will 404 until that route is built.
            */}
            {audit.reportUrl && <ReportDownload reportId={audit.id} />}
          </div>

          <AuditResults audit={audit} />
        </>
      )}
    </div>
  )
}
