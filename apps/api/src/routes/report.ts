import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/:reportId/download', requireAuth, async (_req: AuthRequest, res: Response) => {
  res.status(501).json({ message: 'Report downloads are not implemented in this MVP.' })
})

export default router
