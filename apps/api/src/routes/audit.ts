import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { pool } from '../config/database'
import {
  computeAudit,
  type AuditReport,
  type AuditSummary,
  type TopExpenseItem,
  type ReviewItem,
  type SavingsRecommendation,
  type SavingsOpportunityWithDedup,
} from '../services/auditService'
import {
  matchTransaction,
  recordMatchAudit,
  setUserOverride,
  removeUserOverride,
  getUserOverride,
  createMerchant,
  addMerchantAlias,
  listCategories,
  listMerchants,
  getAliasesForMerchant,
} from '../services/merchantRegistry'
import { normaliseDescription } from '../services/merchantRegistry'

const router = Router()

// All audit routes require authentication
router.use(requireAuth)

// GET /api/audit - Get the full subscription audit for the current user
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const audit = await computeAudit(userId)
    res.json(audit)
  } catch (error) {
    console.error('Audit computation failed:', error)
    res.status(500).json({ message: 'Failed to compute audit' })
  }
})

// GET /api/audit/summary - Summary metrics only (lighter endpoint)
router.get('/summary', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const audit = await computeAudit(userId)
    res.json(audit.summary)
  } catch (error) {
    console.error('Audit summary failed:', error)
    res.status(500).json({ message: 'Failed to compute audit summary' })
  }
})

// GET /api/audit/categories - List all merchant categories
router.get('/categories', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const categories = await listCategories()
    res.json(categories)
  } catch (error) {
    console.error('List categories failed:', error)
    res.status(500).json({ message: 'Failed to list categories' })
  }
})

// GET /api/audit/merchants - List merchants (optionally filtered by category)
router.get('/merchants', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const categoryId = (req.query.category as string) || undefined
    const merchants = await listMerchants(categoryId)
    res.json(merchants)
  } catch (error) {
    console.error('List merchants failed:', error)
    res.status(500).json({ message: 'Failed to list merchants' })
  }
})

// GET /api/audit/merchants/:id/aliases - Get aliases for a merchant
router.get('/merchants/:id/aliases', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const { id } = req.params
    if (!id) return res.status(400).json({ message: 'No merchant id' })

    const aliases = await getAliasesForMerchant(id)
    res.json(aliases)
  } catch (error) {
    console.error('Get merchant aliases failed:', error)
    res.status(500).json({ message: 'Failed to get merchant aliases' })
  }
})

// POST /api/audit/merchants - Create a new merchant (admin/global)
router.post('/merchants', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const body = req.body as {
      categoryId?: string
      canonicalName?: string
      website?: string
      country?: string
      notes?: string
    }

    if (!body.categoryId || !body.canonicalName) {
      return res.status(400).json({ message: 'categoryId and canonicalName are required' })
    }

    const result = await createMerchant(
      body.categoryId,
      body.canonicalName,
      body.website,
      body.country,
      body.notes
    )

    if (!result.success) {
      return res.status(400).json({ message: result.error })
    }

    res.json({ merchantId: result.merchantId, message: 'Merchant created' })
  } catch (error) {
    console.error('Create merchant failed:', error)
    res.status(500).json({ message: 'Failed to create merchant' })
  }
})

// POST /api/audit/merchants/:id/aliases - Add alias to a merchant
router.post('/merchants/:id/aliases', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const { id } = req.params
    if (!id) return res.status(400).json({ message: 'No merchant id' })

    const body = req.body as { alias?: string; matchType?: 'exact' | 'token' | 'fuzzy' }
    if (!body.alias) {
      return res.status(400).json({ message: 'alias is required' })
    }

    const result = await addMerchantAlias(id, body.alias, body.matchType || 'token')

    if (!result.success) {
      return res.status(400).json({ message: result.error })
    }

    res.json({ message: 'Alias added' })
  } catch (error) {
    console.error('Add merchant alias failed:', error)
    res.status(500).json({ message: 'Failed to add merchant alias' })
  }
})

// GET /api/audit/transactions/:id/match - Get current match for a transaction
router.get('/transactions/:id/match', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const { id } = req.params
    if (!id) return res.status(400).json({ message: 'No transaction id' })

    // Verify ownership
    const tx = await pool.query(
      'SELECT id, description FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    if (tx.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' })
    }

    const override = await getUserOverride(userId, id)
    if (override) {
      return res.json({
        transactionId: id,
        originalDescription: tx.rows[0].description,
        normalisedDescription: normaliseDescription(tx.rows[0].description),
        isManual: true,
        merchantName: override.merchantName,
        categoryId: override.categoryId,
        categoryName: override.categoryName,
        notes: override.notes,
        confidenceScore: 100,
        matchMethod: 'manual',
      })
    }

    const decision = await matchTransaction(userId, id, tx.rows[0].description)
    res.json(decision)
  } catch (error) {
    console.error('Get transaction match failed:', error)
    res.status(500).json({ message: 'Failed to get transaction match' })
  }
})

// POST /api/audit/transactions/:id/correct - Correct a transaction's merchant/category
router.post('/transactions/:id/correct', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const { id } = req.params
    if (!id) return res.status(400).json({ message: 'No transaction id' })

    // Verify ownership
    const tx = await pool.query(
      'SELECT id, description FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    )
    if (tx.rows.length === 0) {
      return res.status(404).json({ message: 'Transaction not found' })
    }

    const body = req.body as {
      merchantName?: string
      categoryId?: string
      notes?: string
      removeOverride?: boolean
    }

    if (body.removeOverride) {
      await removeUserOverride(userId, id)
      return res.json({ message: 'Override removed' })
    }

    if (!body.categoryId) {
      return res.status(400).json({ message: 'categoryId is required' })
    }

    const result = await setUserOverride(
      userId,
      id,
      body.merchantName || '',
      body.categoryId,
      body.notes
    )

    if (!result.success) {
      return res.status(400).json({ message: result.error })
    }

    // Re-match and record audit
    const decision = await matchTransaction(userId, id, tx.rows[0].description)
    await recordMatchAudit(userId, id, decision)

    res.json({ message: 'Transaction corrected' })
  } catch (error) {
    console.error('Correct transaction failed:', error)
    res.status(500).json({ message: 'Failed to correct transaction' })
  }
})

// GET /api/audit/review-items - Get all review items with actions
router.get('/review-items', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const audit = await computeAudit(userId)
    res.json({
      reviewItems: audit.reviewItems,
      recommendations: audit.recommendations,
    })
  } catch (error) {
    console.error('Get review items failed:', error)
    res.status(500).json({ message: 'Failed to get review items' })
  }
})

export default router
