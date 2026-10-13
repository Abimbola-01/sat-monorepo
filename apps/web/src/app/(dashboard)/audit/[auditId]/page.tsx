 'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, AlertCircle, XCircle } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

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

  // This page is part of the legacy audit/report UI. The Qorvi MVP does not
  // yet expose the /api/audits endpoints it depends on, so this page is
  // intentionally non-functional until that backend work is done.
  if (!auditId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-gray-900 border border-white/5 rounded-2xl">
        <XCircle size={32} className="text-gray-500" />
        <p className="text-gray-400 text-sm">Audit not found.</p>
        <Link href="/dashboard" className="text-emerald-400 text-sm hover:text-emerald-300">
          Return to dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <button
        onClick={() => router.push('/dashboard')}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
      >
        <ArrowLeft size={16} />
        Back to dashboard
      </button>

      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center bg-gray-900 border border-white/5 rounded-2xl">
        <Loader2 size={32} className="text-emerald-400 animate-spin" />
        <p className="text-gray-400 text-sm">This audit view is not yet available in the current MVP.</p>
        <Link href="/dashboard" className="text-emerald-400 text-sm hover:text-emerald-300">
          Return to dashboard
        </Link>
      </div>
    </div>
  )
}

