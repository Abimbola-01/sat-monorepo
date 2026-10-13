import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { connectDB, pool } from './config/database'
import { runMigrations } from './db/runMigrations'
import importsRouter from './routes/imports'
import transactionsRouter from './routes/transactions'
import subscriptionsRouter from './routes/subscriptions'
import insightsRouter from './routes/insights'
import dashboardRouter from './routes/dashboard'
import settingsRouter from './routes/settings'
import auditRouter from './routes/audit'
import { requireAuth, AuthRequest } from './middleware/auth'

const app = express()
const PORT = process.env.PORT || 4000

// ── Security middleware ──────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
)
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Health check ─────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'Qorvi Backend is running',
    timestamp: new Date().toISOString(),
  })
})

app.get('/health/db', async (_req, res) => {
  try {
    const result = await pool.query('SELECT NOW()')
    res.json({ status: 'ok', db_time: result.rows[0].now })
  } catch (err) {
    res.status(500).json({ status: 'error', message: (err as Error).message })
  }
})

// ── Routes ───────────────────────────────────────────────────────────────
app.use('/api/imports', importsRouter)
app.use('/api/transactions', transactionsRouter)
app.use('/api/subscriptions', subscriptionsRouter)
app.use('/api/insights', insightsRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/audit', auditRouter)

app.get('/api/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ userId: req.userId, clerkId: req.clerkId })
})

// ── 404 handler ──────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.path} not found` })
})

// ── Global error handler ─────────────────────────────────────────────────
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    message: 'Internal server error',
  })
})

// ── Start server ─────────────────────────────────────────────────────────
async function start() {
  await connectDB()
  await runMigrations()
  app.listen(PORT, () => {
    console.log(`Qorvi Backend running on http://localhost:${PORT}`)
    console.log(`Health check: http://localhost:${PORT}/health`)
  })
}

start()
