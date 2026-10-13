 'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft, XCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function ReportDetailPage() {
  const params = useParams<{ reportId: string }>()
  const reportId = params?.reportId ?? null

  // This page is part of the legacy reporting UI. The Qorvi MVP does not yet
  // expose the /api/audits or /api/report endpoints it depends on, so this
  // page is intentionally non-functional until that backend work is done.
  if (!reportId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-gray-900 border border-white/5 rounded-2xl">
        <XCircle size={32} className="text-gray-500" />
        <p className="text-gray-400 text-sm">Report not found.</p>
        <Link href="/report" className="text-emerald-400 text-sm hover:text-emerald-300">
          Back to reports
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/report"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
      >
        <ArrowLeft size={16} />
        All reports
      </Link>

      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-gray-900 border border-white/5 rounded-2xl">
        <XCircle size={32} className="text-gray-500" />
        <p className="text-gray-400 text-sm">This report view is not yet available in the current MVP.</p>
        <Link href="/report" className="text-emerald-400 text-sm hover:text-emerald-300">
          Back to reports
        </Link>
      </div>
    </div>
  )
}

