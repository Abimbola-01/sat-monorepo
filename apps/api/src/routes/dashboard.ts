import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { computeDashboardMetrics } from '../services/recurringDetection'

const router = Router()

// GET /api/dashboard - Get all dashboard metrics for the current user
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const metrics = await computeDashboardMetrics(userId)

    res.json(metrics)
  } catch (error) {
    console.error('Dashboard metrics failed:', error)
    res.status(500).json({ message: 'Failed to compute dashboard metrics' })
  }
})

export default router
