import { Request, Response, NextFunction } from 'express'
import { verifyToken, createClerkClient } from '@clerk/backend'
import { pool } from '../config/database'

if (!process.env.CLERK_SECRET_KEY) {
  throw new Error('CLERK_SECRET_KEY is required')
}

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export interface AuthRequest extends Request {
  userId?: string
  clerkId?: string
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]

    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    })

    req.clerkId = payload.sub

    const existing = await pool.query(
      'SELECT id FROM users WHERE clerk_id = $1',
      [payload.sub]
    )

    if (existing.rows.length > 0) {
      req.userId = String(existing.rows[0].id)
      return next()
    }

    const clerkUser = await clerkClient.users.getUser(payload.sub as string)
    const email = clerkUser.emailAddresses[0]?.emailAddress || ''
    const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim()

    const created = await pool.query(
      `INSERT INTO users (clerk_id, email, name)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [payload.sub, email, name]
    )

    req.userId = String(created.rows[0].id)
    next()
  } catch (error) {
    console.error('Auth error:', error)
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}
