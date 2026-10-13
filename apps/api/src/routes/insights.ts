import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { computeSpendingInsights } from '../services/recurringDetection'

const router = Router()

// ── GET /api/insights ────────────────────────────────────────────────────
// Deterministic subscription + spending insights for the current user.
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const insights = await computeSpendingInsights(userId)

    res.json(insights)
  } catch (error) {
    console.error('Insights failed:', error)
    res.status(500).json({ message: 'Failed to compute insights' })
  }
})

export default router
