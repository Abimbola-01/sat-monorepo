import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { connectDB } from './config/database'
import auditRouter from './routes/audit'
import { pool } from './config/database'
import { requireAuth, AuthRequest } from './middleware/auth'


const app = express()
const PORT = process.env.PORT || 4000

// ── Security middleware ───────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ── Health check ──────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'SAT Backend is running',
    timestamp: new Date().toISOString(),
  })
})

app.get('/health/db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()')
    res.json({ status: 'ok', db_time: result.rows[0].now })
  } catch (err) {
    res.status(500).json({ status: 'error', message: (err as Error).message })
  }
})

// ── Routes ────────────────────────────────────────────────
app.use('/api/audit', auditRouter)

app.get('/api/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ userId: req.userId, clerkId: req.clerkId })
})

// ── 404 handler ───────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.path} not found` })
})

// ── Global error handler ──────────────────────────────────
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  })
})

// ── Start server ──────────────────────────────────────────
async function start() {
  await connectDB()
  app.listen(PORT, () => {
    console.log(`🚀 SAT Backend running on http://localhost:${PORT}`)
    console.log(`📋 Health check: http://localhost:${PORT}/health`)
  })
}

start()

// ... your existing app setup ...

