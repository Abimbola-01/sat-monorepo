import { Router, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { pool } from '../config/database'
import { parseImportFile } from '../services/csvImporter'

const router = Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/'
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true)
    } else {
      cb(new Error('Only CSV files are accepted'))
    }
  },
})

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function pickSample(raw: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  const keys = Object.keys(raw).slice(0, 8)
  for (const k of keys) out[k] = String(raw[k]).slice(0, 80)
  return out
}

router.post(
  '/upload',
  requireAuth,
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    const file = req.file
    if (!file) return res.status(400).json({ message: 'No file uploaded' })

    try {
      const preview = parseImportFile(file.path)

      if (preview.headers.length === 0) {
        fs.unlinkSync(file.path)
        return res.status(400).json({ message: 'Could not read any columns from the CSV' })
      }

      if (
        !preview.columnProfile.date &&
        !preview.columnProfile.amount &&
        !preview.columnProfile.debit &&
        !preview.columnProfile.currency
      ) {
        fs.unlinkSync(file.path)
        return res.status(400).json({
          message:
            'CSV needs at least a date column and an amount source (amount, debit, or credit).',
          preview: null,
        })
      }

      const validRows: Array<{
        transactionDate: string
        description: string
        amount: number
        currency: string
        type: string
        merchantHint: string | null
      }> = preview.validRows.slice(0, 500).map((r) => ({
        transactionDate: toDateStr(r.transactionDate),
        description: r.description,
        amount: r.amount,
        currency: r.currency,
        type: r.type,
        merchantHint: r.merchantHint,
      }))

      const invalidRows: Array<{
        rowIndex: number
        reason: string
        sample: Record<string, string>
      }> = preview.invalidRows.slice(0, 200).map((r) => ({
        rowIndex: r.rowIndex,
        reason: r.reason,
        sample: pickSample(r.raw),
      }))

      res.json({
        importId: null,
        message: 'Preview ready',
        preview: {
          headers: preview.headers,
          columnProfile: preview.columnProfile,
          suggestedMapping: preview.suggestedMapping,
          totalRows: preview.totalRows,
          validRowCount: validRows.length,
          invalidRowCount: invalidRows.length,
          invalidRows,
          validRows,
        },
      })
    } catch (error) {
      console.error('Import preview failed:', error)
      res.status(500).json({ message: 'Failed to preview CSV' })
    }
  }
)

router.post('/confirm', requireAuth, async (req: AuthRequest, res: Response) => {
  const body = req.body as {
    importId?: string
    originalFilename?: string
    suggestedMapping?: Record<string, string>
    validRows?: Array<{
      transactionDate: string
      description: string
      amount: number
      currency: string
      type: string
    }>
    invalidRows?: Array<{ rowIndex: number; reason: string }>
    chosenCurrency?: string
  }

  if (!body.importId) return res.status(400).json({ message: 'No import id' })

  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const mapping = body.suggestedMapping || {}
    const chosenCurrency = body.chosenCurrency || 'NGN'
    const validRows = body.validRows || []
    const invalidRows = (body.invalidRows || []).map((r) => ({
      rowIndex: r.rowIndex,
      reason: r.reason,
    }))

    const importResult = await pool.query(
      'INSERT INTO imports (user_id, original_filename, status, column_mapping, row_count, valid_row_count, invalid_row_count, invalid_rows, chosen_currency, completed_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING id',
      [
        userId,
        body.originalFilename || 'transactions.csv',
        'confirmed',
        JSON.stringify(mapping),
        validRows.length + invalidRows.length,
        validRows.length,
        invalidRows.length,
        JSON.stringify(invalidRows),
        chosenCurrency,
      ]
    )

    const importId = (importResult.rows[0] as { id: string }).id

    if (validRows.length > 0) {
      const BATCH = 500
      for (let i = 0; i < validRows.length; i += BATCH) {
        const batch = validRows.slice(i, i + BATCH)
        const params: string[] = []
        const values: unknown[] = []

        for (let idx = 0; idx < batch.length; idx++) {
          const p = 1 + idx * 7
          params.push(
            `(${p}, ${p + 1}, ${p + 2}, ${p + 3}, ${p + 4}, ${p + 5}, ${p + 6})`
          )
          values.push(
            userId,
            importId,
            batch[idx].transactionDate,
            batch[idx].description,
            batch[idx].amount,
            batch[idx].currency,
            batch[idx].type
          )
        }

        await pool.query(
          `INSERT INTO transactions (user_id, import_id, transaction_date, description, amount, currency, type) VALUES ${params.join(',')}`,
          values
        )
      }
    }

    res.json({
      importId,
      message: 'Import confirmed',
      savedTransactions: validRows.length,
      invalidRows: invalidRows.length,
    })
  } catch (error) {
    console.error('Import confirm failed:', error)
    res.status(500).json({ message: 'Failed to save import' })
  }
})

router.post('/:importId/cancel', requireAuth, async (req: AuthRequest, res: Response) => {
  const { importId } = req.params
  if (!importId) return res.status(400).json({ message: 'No import id' })

  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const result = await pool.query(
      "UPDATE imports SET status = 'cancelled', updated_at = NOW() WHERE id = $1 AND user_id = $2 AND status = 'pending' RETURNING id",
      [importId, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Import not found or already processed' })
    }

    res.json({ message: 'Import cancelled' })
  } catch (error) {
    console.error('Import cancel failed:', error)
    res.status(500).json({ message: 'Failed to cancel import' })
  }
})

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const result = await pool.query(
      'SELECT id, original_filename, status, row_count, valid_row_count, invalid_row_count, chosen_currency, created_at, completed_at FROM imports WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [userId]
    )

    type ImportRow = {
      id: string
      original_filename: string
      status: string
      row_count: number
      valid_row_count: number
      invalid_row_count: number
      chosen_currency: string
      created_at: string
      completed_at: string | null
    }

    res.json(
      result.rows.map((r: ImportRow) => ({
        id: r.id,
        originalFilename: r.original_filename,
        status: r.status as 'pending' | 'confirmed' | 'cancelled',
        rowCount: r.row_count,
        validRowCount: r.valid_row_count,
        invalidRowCount: r.invalid_row_count,
        chosenCurrency: r.chosen_currency,
        createdAt: r.created_at,
        completedAt: r.completed_at,
      }))
    )
  } catch (error) {
    console.error('List imports failed:', error)
    res.status(500).json({ message: 'Failed to list imports' })
  }
})

export default router
