'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useRouter } from 'next/navigation'
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Stage = 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error'

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'text/csv': ['.csv'],
}

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export default function UploadPage() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null)

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError('File is too large. Maximum size is 10MB.')
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Only PDF and CSV files are accepted.')
      } else {
        setError('File could not be uploaded. Please try again.')
      }
      return
    }

    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    maxSize: MAX_SIZE,
  })

  const removeFile = () => {
    setFile(null)
    setError(null)
    setStage('idle')
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      // Stage 1 — uploading
      setStage('uploading')
      await new Promise((r) => setTimeout(r, 1500)) // simulated

      // Stage 2 — analyzing
      setStage('analyzing')
      await new Promise((r) => setTimeout(r, 3000)) // simulated

      // Stage 3 — complete
      setStage('complete')
      toast.success('Audit complete! Redirecting to your results...')

      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (err) {
      setStage('error')
      setError('Something went wrong. Please try again.')
      toast.error('Upload failed. Please try again.')
    }
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
            <h2 className="font-display text-3xl font-bold text-white mb-2">
              Audit complete!
            </h2>
            <p className="text-gray-400">
              Taking you to your results...
            </p>
          </div>
          <Loader2 size={20} className="animate-spin text-emerald-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-white">
          New Audit
        </h1>
        <p className="text-gray-400 mt-1">
          Upload your bank statement and we'll find every subscription in under 60 seconds.
        </p>
      </div>

      {/* How it works — mini steps */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { step: '1', text: 'Upload PDF or CSV' },
          { step: '2', text: 'AI scans transactions' },
          { step: '3', text: 'Get your report' },
        ].map((item) => (
          <div
            key={item.step}
            className="bg-gray-900 border border-white/5 rounded-xl p-4 text-center"
          >
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold mb-2">
              {item.step}
            </span>
            <p className="text-gray-400 text-xs">{item.text}</p>
          </div>
        ))}
      </div>

      {/* Drop zone */}
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
          // File selected state
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <FileText size={32} className="text-emerald-400" />
            </div>
            <div>
              <p className="font-medium text-white text-lg">{file.name}</p>
              <p className="text-gray-500 text-sm mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB ·{' '}
                {file.type === 'application/pdf' ? 'PDF' : 'CSV'}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                removeFile()
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm transition-all"
            >
              <X size={14} />
              Remove file
            </button>
          </div>
        ) : isDragActive ? (
          // Drag active state
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
              <Upload size={32} className="text-emerald-400 animate-bounce" />
            </div>
            <p className="text-emerald-400 font-medium text-lg">
              Drop it here!
            </p>
          </div>
        ) : (
          // Default empty state
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Upload size={32} className="text-gray-500" />
            </div>
            <div>
              <p className="text-white font-medium text-lg">
                Drop your statement here
              </p>
              <p className="text-gray-500 text-sm mt-1">
                or click to browse your files
              </p>
            </div>
            <div className="flex items-center gap-3 text-gray-600 text-xs">
              <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10">
                PDF
              </span>
              <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10">
                CSV
              </span>
              <span>Max 10MB</span>
            </div>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <AlertCircle size={18} className="text-rose-400 shrink-0" />
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      )}

      {/* Upload button */}
      {file && stage === 'idle' && (
        <button
          onClick={handleUpload}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold rounded-xl transition-all duration-200 hover:scale-[1.01] text-lg"
        >
          Analyze my statement
        </button>
      )}

      {/* Progress states */}
      {(stage === 'uploading' || stage === 'analyzing') && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 py-4">
            <Loader2
              size={22}
              className="animate-spin text-emerald-400"
            />
            <span className="text-gray-300 font-medium">
              {stage === 'uploading'
                ? 'Uploading securely...'
                : 'AI analyzing your transactions...'}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div
              className={cn(
                'h-full bg-emerald-500 rounded-full transition-all duration-1000',
                stage === 'uploading' ? 'w-1/3' : 'w-2/3'
              )}
            />
          </div>

          <p className="text-center text-gray-600 text-xs">
            {stage === 'uploading'
              ? 'Encrypting and uploading your file...'
              : 'Reading transactions and identifying subscriptions...'}
          </p>
        </div>
      )}

      {/* Security note */}
      {stage === 'idle' && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-white/3 border border-white/5">
          <ShieldCheck
            size={18}
            className="text-emerald-400 shrink-0 mt-0.5"
          />
          <div>
            <p className="text-white text-sm font-medium">
              Your data is safe
            </p>
            <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
              Your statement is encrypted during upload and automatically
              deleted from our servers after analysis. We never store your
              raw bank data.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}