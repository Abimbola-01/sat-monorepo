import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { pool } from '../config/database'

const router = Router()

interface UserRow {
  id: string
  email: string
  name: string
  currency: string
  timezone: string
  created_at: string
}

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const userResult = await pool.query(
      'SELECT id, email, name, currency, timezone, created_at FROM users WHERE id = $1',
      [userId]
    )
    const userRows: UserRow[] = userResult.rows as unknown as UserRow[]

    const settingResult = await pool.query('SELECT preferences FROM user_settings WHERE user_id = $1', [userId])
    const preferences: Record<string, unknown> =
      typeof settingResult.rows[0]?.preferences === 'object' && settingResult.rows[0].preferences !== null
        ? (settingResult.rows[0].preferences as Record<string, unknown>)
        : {}

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    const user = userRows[0]
    res.json({
      userId: user.id,
      email: user.email,
      name: user.name,
      currency: user.currency,
      timezone: user.timezone,
      preferences,
      createdAt: user.created_at,
    })
  } catch (error) {
    console.error('Get settings failed:', error)
    res.status(500).json({ message: 'Failed to load settings' })
  }
})

router.patch('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const body = req.body as {
      name?: string
      currency?: string
      timezone?: string
      preferences?: Record<string, unknown>
    }

    if (body.name !== undefined) {
      await pool.query('UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2', [
        body.name,
        userId,
      ])
    }

    if (body.currency !== undefined) {
      const cc = String(body.currency).toUpperCase()
      if (!/^[A-Z]{3}$/.test(cc)) {
        return res.status(400).json({ message: 'Invalid currency code' })
      }
      await pool.query('UPDATE users SET currency = $1, updated_at = NOW() WHERE id = $2', [
        cc,
        userId,
      ])
    }

    if (body.timezone !== undefined) {
      await pool.query('UPDATE users SET timezone = $1, updated_at = NOW() WHERE id = $2', [
        String(body.timezone),
        userId,
      ])
    }

    if (body.preferences !== undefined) {
      await pool.query(
        `INSERT INTO user_settings (user_id, preferences, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET preferences = $2, updated_at = NOW()`,
        [userId, JSON.stringify(body.preferences)]
      )
    }

    const userResult = await pool.query(
      'SELECT id, email, name, currency, timezone, created_at FROM users WHERE id = $1',
      [userId]
    )
    const userRows: UserRow[] = userResult.rows as unknown as UserRow[]

    const settingResult = await pool.query('SELECT preferences FROM user_settings WHERE user_id = $1', [
      userId,
    ])
    const user = userRows[0]
    const preferences: Record<string, unknown> =
      typeof settingResult.rows[0]?.preferences === 'object' && settingResult.rows[0].preferences !== null
        ? (settingResult.rows[0].preferences as Record<string, unknown>)
        : {}

    res.json({
      userId: user.id,
      email: user.email,
      name: user.name,
      currency: user.currency,
      timezone: user.timezone,
      preferences,
      createdAt: user.created_at,
    })
  } catch (error) {
    console.error('Update settings failed:', error)
    res.status(500).json({ message: 'Failed to update settings' })
  }
})

router.delete('/data', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    await pool.query('DELETE FROM subscription_occurrences WHERE user_id = $1', [userId])
    await pool.query('DELETE FROM subscriptions WHERE user_id = $1', [userId])
    await pool.query('DELETE FROM transactions WHERE user_id = $1', [userId])
    await pool.query('DELETE FROM imports WHERE user_id = $1', [userId])

    res.json({ message: 'Financial data cleared' })
  } catch (error) {
    console.error('Clear user data failed:', error)
    res.status(500).json({ message: 'Failed to clear data' })
  }
})

export default router
