 'use client'

import Link from 'next/link'
import { FileText, Upload } from 'lucide-react'
import { formatDate } from '@/lib/utils'

function ReportRowSkeleton() {
  return (
    <div className="h-20 rounded-xl bg-white/3 border border-white/5 animate-pulse" />
  )
}

export default function ReportsPage() {
  // This page is part of the legacy reporting UI. The Qorvi MVP does not yet
  // expose the /api/audits endpoint it depends on, so this page is
  // intentionally non-functional until that backend work is done.
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

      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <ReportRowSkeleton key={i} />
        ))}
      </div>

      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center bg-gray-900 border border-white/5 rounded-2xl">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <FileText size={24} className="text-gray-500" />
        </div>
        <p className="text-gray-400 text-sm max-w-xs">
          Reports are coming soon. For now, import a CSV and use the dashboard to
          see your detected subscriptions.
        </p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm rounded-xl transition-all duration-200"
        >
          <Upload size={16} />
          Import transactions
        </Link>
      </div>
    </div>
  )
}

