import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { pool } from '../config/database'

const router = Router()

interface TransactionRow {
  id: string
  transaction_date: string
  description: string
  amount: string | number
  currency: string
  type: string
  merchant_hint: string | null
  category: string | null
  import_id: string | null
  created_at: string
}

interface CountRow {
  count: string | number
}

router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const limit = Math.min(parseInt(String(req.query.limit || '200'), 10) || 200, 1000)
    const offset = Math.max(parseInt(String(req.query.offset || '0'), 10) || 0, 0)

    const result = await pool.query(
      'SELECT id, transaction_date, description, amount, currency, type, merchant_hint, category, import_id, created_at FROM transactions WHERE user_id = $1 ORDER BY transaction_date DESC, created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    )
    const rows: TransactionRow[] = result.rows as unknown as TransactionRow[]

    const countResult = await pool.query(
      'SELECT COUNT(*) AS count FROM transactions WHERE user_id = $1',
      [userId]
    )
    const countRows: CountRow[] = countResult.rows as unknown as CountRow[]

    res.json({
      transactions: rows.map((r) => ({
        id: r.id,
        transactionDate: r.transaction_date,
        description: r.description,
        amount: typeof r.amount === 'string' ? parseFloat(r.amount) : r.amount,
        currency: r.currency,
        type: r.type,
        merchantHint: r.merchant_hint,
        category: r.category,
        importId: r.import_id,
        createdAt: r.created_at,
      })),
      total: typeof countResult.rows[0].count === 'string'
        ? parseFloat(countResult.rows[0].count)
        : countResult.rows[0].count,
    })
  } catch (error) {
    console.error('List transactions failed:', error)
    res.status(500).json({ message: 'Failed to list transactions' })
  }
})

router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const { id } = req.params
    if (!id) return res.status(400).json({ message: 'No transaction id' })

    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    )

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Transaction not found' })
    } else {
      res.json({ message: 'Transaction deleted' })
    }
  } catch (error) {
    console.error('Delete transaction failed:', error)
    res.status(500).json({ message: 'Failed to delete transaction' })
  }
})

router.delete('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId
    if (!userId) return res.status(401).json({ message: 'Unauthenticated' })

    const result = await pool.query(
      'DELETE FROM transactions WHERE user_id = $1 RETURNING id',
      [userId]
    )

    res.json({ deleted: result.rowCount || 0 })
  } catch (error) {
    console.error('Clear transactions failed:', error)
    res.status(500).json({ message: 'Failed to clear transactions' })
  }
})

export default router
