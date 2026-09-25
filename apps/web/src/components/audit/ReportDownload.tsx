'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Download, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { auditApi } from '@/lib/api'

interface ReportDownloadProps {
  reportId: string
  fileName?: string
}

export function ReportDownload({ reportId, fileName }: ReportDownloadProps) {
  const { getToken } = useAuth()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)

    try {
      const token = await getToken()
      if (!token) {
        toast.error('You must be signed in to download this report.')
        return
      }

      const res = await auditApi.downloadReport(reportId, token)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = fileName ?? `subscription-audit-report-${reportId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.URL.revokeObjectURL(url)
      toast.success('Report downloaded.')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to download report.'
      toast.error(message)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      onClick={handleDownload}
      isLoading={isDownloading}
      variant="secondary"
      className="gap-2"
    >
      {!isDownloading && <Download size={16} />}
      {isDownloading ? 'Preparing report...' : 'Download report'}
    </Button>
  )
}

export function ReportDownloadPlaceholder() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/3 border border-white/5 text-gray-500 text-sm">
      <FileText size={18} />
      Report not yet available for this audit.
    </div>
  )
}
