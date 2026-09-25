import { Router, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { extractTextFromFile } from '../services/pdfParser'
import { analyzeTransactions } from '../services/openai'
import { pool, supabase } from '../config/database'

const router = Router()

// Configure multer for file uploads
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

    // Create audit record immediately with "processing" status
    let auditId: string

    try {
      const result = await pool.query(
        `INSERT INTO audits (user_id, status, file_name)
         VALUES ($1, 'processing', $2)
         RETURNING id`,
        [req.userId, file.originalname]
      )
      auditId = result.rows[0].id

      // Return the audit ID immediately so frontend can start polling
      res.status(202).json({
        auditId,
        message: 'File uploaded. Analysis started.',
      })
    } catch (error) {
      fs.unlinkSync(file.path) // clean up file
      return res.status(500).json({ message: 'Failed to create audit record' })
    }

    // Process in background (don't await — response already sent)
    processAudit(auditId, file, req.userId!).catch(async (error) => {
      console.error('Audit processing failed:', error)
      await pool.query(
        "UPDATE audits SET status = 'failed' WHERE id = $1",
        [auditId]
      )
    })
  }
)

// Background processing function
async function processAudit(
  auditId: string,
  file: Express.Multer.File,
  userId: string
) {
  try {
    // Step 1 — Extract text from file
    console.log(`📄 Extracting text from ${file.originalname}...`)
    const text = await extractTextFromFile(file.path, file.mimetype)

    // Step 2 — Upload original file to Supabase Storage
    console.log(`☁️  Uploading file to storage...`)
    const fileBuffer = fs.readFileSync(file.path)
    const storageKey = `statements/${userId}/${auditId}/${file.originalname}`

    const { error: uploadError } = await supabase.storage
      .from('statements')
      .upload(storageKey, fileBuffer, {
        contentType: file.mimetype,
        upsert: true,
      })

    let fileUrl = null
    if (!uploadError) {
      const { data } = supabase.storage
        .from('statements')
        .getPublicUrl(storageKey)
      fileUrl = data.publicUrl
    }

    // Step 3 — Send to OpenAI for analysis
    console.log(`🤖 Analyzing transactions with AI...`)
    const subscriptions = await analyzeTransactions(text)
    console.log(`✅ Found ${subscriptions.length} subscriptions`)

    // Step 4 — Calculate totals
    const monthlyAmounts = subscriptions.map((s) => {
      if (s.frequency === 'monthly') return s.amount
      if (s.frequency === 'quarterly') return s.amount / 3
      if (s.frequency === 'annual') return s.amount / 12
      return s.amount
    })

    const totalMonthlySpend = monthlyAmounts.reduce((a, b) => a + b, 0)

    // Find duplicates (same name appearing multiple times)
    const nameCount: Record<string, number> = {}
    subscriptions.forEach((s) => {
      nameCount[s.name] = (nameCount[s.name] || 0) + 1
    })
    const duplicates = subscriptions.filter((s) => nameCount[s.name] > 1)
    const potentialSavings = duplicates.reduce((sum, s) => sum + s.amount, 0) / 2

    // Step 5 — Save subscriptions to database
    for (const sub of subscriptions) {
      await pool.query(
        `INSERT INTO subscriptions
           (audit_id, user_id, name, amount, currency, frequency, category, last_charged, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
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
    }

    // Step 6 — Update audit record to complete
    await pool.query(
      `UPDATE audits SET
         status = 'complete',
         file_url = $1,
         total_subscriptions = $2,
         total_monthly_spend = $3,
         potential_savings = $4,
         unused_count = $5,
         updated_at = NOW()
       WHERE id = $6`,
      [
        fileUrl,
        subscriptions.length,
        totalMonthlySpend,
        potentialSavings,
        duplicates.length,
        auditId,
      ]
    )

    console.log(`🎉 Audit ${auditId} complete!`)
  } finally {
    // Always clean up the local file
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

    const audit = auditResult.rows[0]

    // Get subscriptions for this audit
    const subsResult = await pool.query(
      'SELECT * FROM subscriptions WHERE audit_id = $1 ORDER BY amount DESC',
      [auditId]
    )

    return res.json({
      ...audit,
      subscriptions: subsResult.rows,
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

    return res.json(result.rows)
  } catch (error) {
    console.error('Get audits error:', error)
    return res.status(500).json({ message: 'Failed to fetch audits' })
  }
})

export default router




