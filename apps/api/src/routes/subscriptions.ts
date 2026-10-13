import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { pool } from '../config/database'
import {
  detectRecurringPayments,
  confirmSubscription,
  dismissSubscription,
  editSubscription,
  markSubscriptionInactive,
} from '../services/recurringDetection'

const router = Router()

// POST /api/subscriptions/detect - Run detection
router.post('/detect', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const result = await detectRecurringPayments(userId)

    res.json({
      subscriptions: result.subscriptions.map((s) => ({
        id: s.id, name: s.name, amount: s.amount, currency: s.currency,
        frequency: s.frequency, monthlyAmount: s.monthlyAmount, yearlyAmount: s.yearlyAmount,
        occurrences: s.occurrences, lastPaymentDate: s.lastPaymentDate,
        estimatedNextPaymentDate: s.estimatedNextPaymentDate, confidenceScore: s.confidenceScore,
        reason: s.reason, status: s.status, likelyDirection: s.likelyDirection,
        categories: s.categories, merchantHint: s.merchantHint,
      })),
      totalMonthlyAmount: result.totalMonthlyAmount,
      totalYearlyAmount: result.totalYearlyAmount,
    })
  } catch (error) {
    console.error('Subscription detection failed:', error)
    res.status(500).json({ message: 'Failed to detect subscriptions' })
  }
})

// GET /api/subscriptions - List all subscriptions for user
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const result = await pool.query(
      `SELECT id, name, merchant_hint, amount, currency, frequency, monthly_amount, yearly_amount,
              last_payment_date, estimated_next_payment_date, confidence_score, reason, status,
              categories, detected_at, created_at
       FROM subscriptions
       WHERE user_id = $1
       ORDER BY
         CASE status
           WHEN 'active' THEN 1
           WHEN 'possiblyInactive' THEN 2
           ELSE 3
         END,
         confidence_score DESC,
         monthly_amount DESC,
         detected_at DESC`,
      [userId]
    )

    type SubscriptionRow = {
      id: string; name: string; merchant_hint: string | null; amount: string | number;
      currency: string; frequency: string; monthly_amount: string | number; yearly_amount: string | number;
      last_payment_date: string | null; estimated_next_payment_date: string | null;
      confidence_score: string | number; reason: string | null; status: string;
      categories: string | null; detected_at: string; created_at: string;
    }

    const rows: SubscriptionRow[] = (result.rows as unknown) as SubscriptionRow[]

    res.json(
      rows.map((r) => ({
        id: r.id, name: r.name, amount: typeof r.amount === 'string' ? parseFloat(r.amount) : r.amount,
        currency: r.currency, frequency: r.frequency,
        monthlyAmount: typeof r.monthly_amount === 'string' ? parseFloat(r.monthly_amount) : r.monthly_amount,
        yearlyAmount: typeof r.yearly_amount === 'string' ? parseFloat(r.yearly_amount) : r.yearly_amount,
        lastPaymentDate: r.last_payment_date, estimatedNextPaymentDate: r.estimated_next_payment_date,
        confidenceScore: typeof r.confidence_score === 'string' ? parseInt(r.confidence_score, 10) : r.confidence_score,
        reason: r.reason || '', status: r.status as 'active' | 'possiblyInactive' | 'needsReview',
        merchantHint: r.merchant_hint, categories: r.categories ? JSON.parse(r.categories) : ['Other'],
        detectedAt: r.detected_at, createdAt: r.created_at,
      }))
    )
  } catch (error) {
    console.error('List subscriptions failed:', error)
    res.status(500).json({ message: 'Failed to list subscriptions' })
  }
})

// POST /api/subscriptions/:id/confirm - Confirm a subscription
router.post('/:id/confirm', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const { id } = req.params
    if (!id) return res.status(400).json({ message: 'No subscription id' })

    const result = await confirmSubscription(userId, pool, id)
    if (!result.success) {
      return res.status(404).json({ message: result.error })
    }

    res.json({ message: 'Subscription confirmed' })
  } catch (error) {
    console.error('Confirm subscription failed:', error)
    res.status(500).json({ message: 'Failed to confirm subscription' })
  }
})

// POST /api/subscriptions/:id/dismiss - Dismiss (delete) a subscription
router.post('/:id/dismiss', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const { id } = req.params
    if (!id) return res.status(400).json({ message: 'No subscription id' })

    const result = await dismissSubscription(userId, pool, id)
    if (!result.success) {
      return res.status(404).json({ message: result.error })
    }

    res.json({ message: 'Subscription dismissed' })
  } catch (error) {
    console.error('Dismiss subscription failed:', error)
    res.status(500).json({ message: 'Failed to dismiss subscription' })
  }
})

// PATCH /api/subscriptions/:id - Edit subscription details
router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const { id } = req.params
    if (!id) return res.status(400).json({ message: 'No subscription id' })

    const body = req.body as { name?: string; categories?: string[]; status?: string }
    const updates: { name?: string; categories?: string[]; status?: 'active' | 'possiblyInactive' | 'needsReview' } = {}

    if (body.name !== undefined) updates.name = body.name
    if (body.categories !== undefined) updates.categories = body.categories
    if (body.status !== undefined) {
      if (['active', 'possiblyInactive', 'needsReview'].includes(body.status)) {
        updates.status = body.status as 'active' | 'possiblyInactive' | 'needsReview'
      }
    }

    const result = await editSubscription(userId, pool, id, updates)
    if (!result.success) {
      return res.status(404).json({ message: result.error })
    }

    res.json({ message: 'Subscription updated' })
  } catch (error) {
    console.error('Update subscription failed:', error)
    res.status(500).json({ message: 'Failed to update subscription' })
  }
})

// POST /api/subscriptions/:id/inactive - Mark as possibly inactive
router.post('/:id/inactive', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const { id } = req.params
    if (!id) return res.status(400).json({ message: 'No subscription id' })

    const result = await markSubscriptionInactive(userId, pool, id)
    if (!result.success) {
      return res.status(404).json({ message: result.error })
    }

    res.json({ message: 'Subscription marked as possibly inactive' })
  } catch (error) {
    console.error('Mark inactive failed:', error)
    res.status(500).json({ message: 'Failed to mark subscription inactive' })
  }
})

// DELETE /api/subscriptions/:id - Delete a subscription
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const { id } = req.params
    if (!id) return res.status(400).json({ message: 'No subscription id' })

    const result = await pool.query(
      'DELETE FROM subscriptions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Subscription not found' })
    } else {
      res.json({ message: 'Subscription deleted' })
    }
  } catch (error) {
    console.error('Delete subscription failed:', error)
    res.status(500).json({ message: 'Failed to delete subscription' })
  }
})

export default router
