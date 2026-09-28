import { Router, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { extractTextFromFile } from '../services/pdfParser'
import { analyzeTransactions } from '../services/openai'
import { generateAuditReportPdf } from '../services/reportGenerator'
import { pool, supabase } from '../config/database'
import {
  mapAuditRow,
  mapSubscriptionRow,
  type AuditRow,
  type SubscriptionRow,
  type MappedSubscription,
} from '../utils/mappers'

const router = Router()

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/'
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir)
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'text/csv']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF and CSV files are allowed'))
    }
  },
})

// ── POST /api/audit/upload ────────────────────────────────
router.post(
  '/upload',
  requireAuth,
  upload.single('statement'),
  async (req: AuthRequest, res: Response) => {
    const file = req.file

    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    let auditId: string

    try {
      const result = await pool.query(
        `INSERT INTO audits (user_id, status, file_name)
         VALUES ($1, 'processing', $2)
         RETURNING id`,
        [req.userId, file.originalname]
      )
      auditId = result.rows[0].id

      res.status(202).json({
        auditId,
        message: 'File uploaded. Analysis started.',
      })
    } catch (error) {
      fs.unlinkSync(file.path)
      return res.status(500).json({ message: 'Failed to create audit record' })
    }

    processAudit(auditId, file, req.userId!).catch(async (error) => {
      console.error('Audit processing failed:', error)
      await pool.query(
        "UPDATE audits SET status = 'failed' WHERE id = $1",
        [auditId]
      )
    })
  }
)

async function processAudit(
  auditId: string,
  file: Express.Multer.File,
  userId: string
) {
  try {
    console.log(`Extracting text from ${file.originalname}...`)
    const text = await extractTextFromFile(file.path, file.mimetype)

    // The original statement is deliberately never persisted: the only copy
    // is the temp file on disk, removed in the finally block below. Only the
    // extracted subscriptions and the generated report are kept.

    console.log(`Analyzing transactions with AI...`)
    const subscriptions = await analyzeTransactions(text)
    console.log(`Found ${subscriptions.length} subscriptions`)

    const monthlyAmounts = subscriptions.map((s) => {
      if (s.frequency === 'monthly') return s.amount
      if (s.frequency === 'quarterly') return s.amount / 3
      if (s.frequency === 'annual') return s.amount / 12
      return s.amount
    })

    const totalMonthlySpend = monthlyAmounts.reduce((a, b) => a + b, 0)

    const savedSubscriptions: MappedSubscription[] = []

    for (const sub of subscriptions) {
      const insertResult = await pool.query(
        `INSERT INTO subscriptions
           (audit_id, user_id, name, amount, currency, frequency, category, last_charged, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, name, amount, currency, frequency, category, last_charged, active`,
        [
          auditId,
          userId,
          sub.name,
          sub.amount,
          sub.currency || 'NGN',
          sub.frequency,
          sub.category,
          sub.lastCharged || null,
          sub.active,
        ]
      )

      savedSubscriptions.push(mapSubscriptionRow(insertResult.rows[0] as SubscriptionRow))
    }

    const nameGroups = new Map<string, MappedSubscription[]>()
    for (const sub of savedSubscriptions) {
      const group = nameGroups.get(sub.name) ?? []
      group.push(sub)
      nameGroups.set(sub.name, group)
    }

    const duplicateGroups = Array.from(nameGroups.values()).filter(
      (group) => group.length > 1
    )

    const potentialSavings = duplicateGroups.reduce((sum, group) => {
      const wasteCount = group.length - 1
      return sum + group[0].amount * wasteCount
    }, 0)

    const unusedCount = savedSubscriptions.filter((s) => !s.active).length

    // Generate the PDF once and store it in the PRIVATE "reports" bucket.
    // Only the storage path is saved; downloads go through the API.
    let reportPath: string | null = null
    try {
      const pdfBuffer = await generateAuditReportPdf(
        {
          id: auditId,
          userId,
          createdAt: new Date().toISOString(),
          totalSubscriptions: subscriptions.length,
          totalMonthlySpend,
          potentialSavings,
          duplicates: duplicateGroups,
          unusedCount,
          status: 'complete',
        },
        savedSubscriptions
      )

      const reportStorageKey = `${userId}/${auditId}.pdf`
      const { error: reportUploadError } = await supabase.storage
        .from('reports')
        .upload(reportStorageKey, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        })

      if (reportUploadError) {
        console.error('Report upload failed:', reportUploadError)
      } else {
        reportPath = reportStorageKey
      }
    } catch (reportError) {
      // A report failure should not fail the whole audit — the subscription
      // data is still valid and useful without a PDF.
      console.error('Report generation failed:', reportError)
    }

    await pool.query(
      `UPDATE audits SET
         status = 'complete',
         report_path = $1,
         total_subscriptions = $2,
         total_monthly_spend = $3,
         potential_savings = $4,
         unused_count = $5,
         duplicates = $6,
         updated_at = NOW()
       WHERE id = $7`,
      [
        reportPath,
        subscriptions.length,
        totalMonthlySpend,
        potentialSavings,
        unusedCount,
        JSON.stringify(duplicateGroups),
        auditId,
      ]
    )

    console.log(
      `Audit ${auditId} complete. ${duplicateGroups.length} duplicate group(s) found. Report: ${reportPath ? 'generated' : 'failed'}.`
    )
  } finally {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path)
    }
  }
}

// ── GET /api/audit/:auditId ───────────────────────────────
router.get('/:auditId', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { auditId } = req.params

    const auditResult = await pool.query(
      'SELECT * FROM audits WHERE id = $1 AND user_id = $2',
      [auditId, req.userId]
    )

    if (auditResult.rows.length === 0) {
      return res.status(404).json({ message: 'Audit not found' })
    }

    const subsResult = await pool.query(
      'SELECT * FROM subscriptions WHERE audit_id = $1 ORDER BY amount DESC',
      [auditId]
    )

    const mapped = mapAuditRow(
      auditResult.rows[0] as AuditRow,
      subsResult.rows as SubscriptionRow[]
    )

    return res.json({
      ...mapped,
      subscriptions: (subsResult.rows as SubscriptionRow[]).map(mapSubscriptionRow),
    })
  } catch (error) {
    console.error('Get audit error:', error)
    return res.status(500).json({ message: 'Failed to fetch audit' })
  }
})

// ── GET /api/audit ────────────────────────────────────────
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT * FROM audits
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [req.userId]
    )

    const mapped = (result.rows as AuditRow[]).map((row) => mapAuditRow(row, []))

    return res.json(mapped)
  } catch (error) {
    console.error('Get audits error:', error)
    return res.status(500).json({ message: 'Failed to fetch audits' })
  }
})

export default router
