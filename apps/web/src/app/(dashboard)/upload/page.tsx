'use client'

import { useState, useCallback, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Table,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useImportPreview, useConfirmImport, useImports } from '@/hooks/useQorvi'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ImportPreview } from '@/types'

const ACCEPTED_TYPES = { 'text/csv': ['.csv'] }
const MAX_SIZE = 10 * 1024 * 1024

type Stage = 'idle' | 'preview' | 'confirming' | 'complete' | 'error'

export default function UploadPage() {
  const router = useRouter()
  const { getToken } = useAuth()
  const preview = useImportPreview()
  const confirmImport = useConfirmImport()
  const { imports, refetch: refetchImports } = useImports()

  const [stage, setStage] = useState<Stage>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [localPreview, setLocalPreview] = useState<ImportPreview | null>(null)

  const onDrop = useCallback((accepted: File[], rejected: any[]) => {
    setError(null)
    if (rejected.length) {
      const r = rejected[0]
      if (r.errors[0]?.code === 'file-too-large') setError('File is too large. Maximum 10MB.')
      else if (r.errors[0]?.code === 'file-invalid-type') setError('Only CSV files are accepted.')
      else setError('Could not accept this file.')
      return
    }
    if (accepted.length) setFile(accepted[0])
  }, [])

  const dropzone = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: MAX_SIZE,
  })
  const { getRootProps, getInputProps, isDragActive } = dropzone
  const {} = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: MAX_SIZE,
  })

  const removeFile = () => {
    setFile(null)
    setError(null)
    setLocalPreview(null)
    setStage('idle')
  }

  const handlePreview = async () => {
    if (!file) return
    setStage('preview')
    setError(null)
    const formData = new FormData()
    formData.append('file', file)
    await preview.preview(formData)
    if (preview.preview) {
      setLocalPreview(preview.preview)
      toast.success(`Preview ready — ${preview.preview.validRowCount} valid rows, ${preview.preview.invalidRowCount} skipped.`)
    }
  }

  const handleConfirm = async () => {
    if (!localPreview || !file) return
    setStage('confirming')
    setError(null)
    const controller = new AbortController()
    setAbortController(controller)

    const result = await confirmImport(
      {
        importId: 'pending',
        originalFilename: file.name,
        suggestedMapping: localPreview.suggestedMapping,
        validRows: localPreview.validRows,
        invalidRows: localPreview.invalidRows.map((r) => ({ rowIndex: r.rowIndex, reason: r.reason })),
        chosenCurrency: 'NGN',
      },
      controller.signal
    )

    if (result.ok) {
      setStage('complete')
      toast.success('Import saved. You can now detect subscriptions.')
      setTimeout(() => {
        setFile(null)
        setLocalPreview(null)
        setStage('idle')
        refetchImports()
        router.push('/subscriptions')
      }, 1400)
    } else {
      setError(result.error ?? 'Could not save import.')
      toast.error(result.error ?? 'Could not save import.')
      setStage('preview')
    }
  }

  const handleCancel = async () => {
    if (!localPreview) return
    setStage('idle')
    setLocalPreview(null)
    setFile(null)
    setError(null)
    toast.success('Import cancelled. Nothing was saved.')
  }

  const cancelUpload = () => {
    setFile(null)
    setError(null)
    setLocalPreview(null)
    setStage('idle')
  }

  // Complete state
  if (stage === 'complete') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 size={40} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold text-white mb-2">Import saved</h2>
            <p className="text-gray-400">Taking you to your subscriptions…</p>
          </div>
          <Loader2 size={20} className="animate-spin text-emerald-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Import transactions</h1>
        <p className="text-gray-400 mt-1">
          Upload a CSV export from your bank. We validate it, show you a preview, and let you cancel before saving anything.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { step: '1', text: 'Upload a CSV file' },
          { step: '2', text: 'Preview columns & rows' },
          { step: '3', text: 'Confirm or cancel' },
        ].map((item) => (
          <div key={item.step} className="bg-gray-900 border border-white/5 rounded-xl p-4 text-center">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
              {item.step}
            </span>
            <p className="text-gray-400 text-xs">{item.text}</p>
          </div>
        ))}
      </div>

      {file && localPreview ? (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={18} className="text-emerald-400" />
              Preview ready
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-gray-500 text-sm mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB · {localPreview.totalRows} rows
                </p>
              </div>
              <Badge variant="success">{localPreview.validRowCount} valid</Badge>
              <Badge variant="warning">{localPreview.invalidRowCount} skipped</Badge>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-gray-500 text-xs">Detected columns:</span>
              {localPreview.headers.slice(0, 8).map((h) => (
                <span key={h} className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-gray-300">
                  {h}
                </span>
              ))}
              {localPreview.headers.length > 8 && (
                <span className="text-gray-500 text-xs">+{localPreview.headers.length - 8} more</span>
              )}
            </div>

            {localPreview.invalidRows.length > 0 && (
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
                <p className="text-rose-400 text-xs font-medium uppercase tracking-wide mb-2">
                  Skipped rows
                </p>
                <ul className="space-y-1">
                  {localPreview.invalidRows.slice(0, 10).map((r) => (
                    <li key={r.rowIndex} className="text-gray-400 text-xs flex items-center gap-2">
                      <span className="text-rose-500 font-medium">Row {r.rowIndex}:</span>
                      {r.reason}
                    </li>
                  ))}
                </ul>
                {localPreview.invalidRows.length > 10 && (
                  <p className="text-gray-500 text-xs mt-1">+{localPreview.invalidRows.length - 10} more skipped.</p>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <Button onClick={handleConfirm} className="flex-1">
                <CheckCircle2 size={16} />
                Save import
              </Button>
              <Button variant="ghost" onClick={handleCancel}>
                <X size={16} />
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={cancelUpload}>
                <Trash2 size={14} />
                Remove file
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : file && stage === 'preview' && !localPreview && preview.isLoading ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 py-6">
            <Loader2 size={22} className="animate-spin text-emerald-400" />
            <span className="text-gray-300 font-medium">Parsing CSV…</span>
          </div>
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <AlertCircle size={18} className="text-rose-400 shrink-0" />
              <p className="text-rose-400 text-sm">{error}</p>
            </div>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'relative border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-200',
            isDragActive
              ? 'border-emerald-500 bg-emerald-500/10 scale-[1.02]'
              : file
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : error
                  ? 'border-rose-500/50 bg-rose-500/5'
                  : 'border-white/10 bg-white/2 hover:border-white/20 hover:bg-white/5'
          )}
        >
          <input {...getInputProps()} />
          {file ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <FileText size={32} className="text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-white text-lg">{file.name}</p>
                <p className="text-gray-500 text-sm mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB · CSV
                </p>
              </div>
              <Button variant="ghost" onClick={(e) => { e.stopPropagation(); cancelUpload() }}>
                <X size={14} />
                Remove file
              </Button>
            </div>
          ) : isDragActive ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <Upload size={32} className="text-emerald-400 animate-bounce" />
              </div>
              <p className="text-emerald-400 font-medium text-lg">Drop it here!</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Upload size={32} className="text-gray-500" />
              </div>
              <div>
                <p className="text-white font-medium text-lg">Drop your statement here</p>
                <p className="text-gray-500 text-sm mt-1">or click to browse your files</p>
              </div>
              <div className="flex items-center gap-3 text-gray-600 text-xs">
                <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10">CSV</span>
                <span>Max 10MB</span>
              </div>
            </div>
          )}
        </div>
      )}

      {file && !localPreview && stage !== 'preview' && stage !== 'complete' && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-white/3 border border-white/5">
          <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-white text-sm font-medium">Preview before saving</p>
            <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
              Qorvi will show you the columns it detected and a preview of the rows. You can cancel at any point before saving.
            </p>
          </div>
        </div>
      )}

      {file && !localPreview && stage !== 'preview' && stage !== 'complete' && (
        <Button onClick={handlePreview} className="w-full" disabled={preview.isLoading}>
          <Table size={16} />
          Preview import
        </Button>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <AlertCircle size={18} className="text-rose-400 shrink-0" />
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}
