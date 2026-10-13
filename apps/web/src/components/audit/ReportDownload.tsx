import { FileText } from 'lucide-react'

interface ReportDownloadProps {
  reportId: string
  fileName?: string
}

export function ReportDownload({ reportId, fileName }: ReportDownloadProps) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/3 border border-white/5 text-gray-500 text-sm">
      <FileText size={18} />
      Report download is not yet available in the current MVP.
    </div>
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

