import { pool } from './pool'

export interface DbUser {
  id: string
  clerk_id: string
  email: string
  name: string
  currency: string
  timezone: string
  created_at: string
}

export async function getOrCreateUser(clerkId: string, email: string, name: string): Promise<string> {
  const existing = await pool.query('SELECT id FROM users WHERE clerk_id = $1', [clerkId])
  const existingRow = (existing.rows[0] as { id: string } | undefined)
  if (existingRow) return existingRow.id

  const created = await pool.query(
    `INSERT INTO users (clerk_id, email, name) VALUES ($1, $2, $3) RETURNING id`,
    [clerkId, email, name]
  )
  return (created.rows[0] as { id: string }).id
}

export async function getUserById(userId: string): Promise<DbUser | null> {
  const result = await pool.query(
    'SELECT id, clerk_id, email, name, currency, timezone, created_at FROM users WHERE id = $1',
    [userId]
  )
  const row = result.rows[0] as DbUser | undefined
  return row ?? null
}
