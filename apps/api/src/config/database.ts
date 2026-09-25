// src/config/database.ts
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { Pool } from 'pg'

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export const pool = new Pool({
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT) || 6543,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  ssl: { rejectUnauthorized: false },
  max: 10,
})

export async function connectDB() {
  try {
    const client = await pool.connect()
    const res = await client.query('SELECT NOW()')
    console.log('PostgreSQL connected at:', res.rows[0].now)
    client.release()
  } catch (error) {
    console.error('Database connection failed:', error)
    process.exit(1)
  }
}
//console.log('DB_HOST:', process.env.DB_HOST)
//console.log('DB_USER:', process.env.DB_USER)
//console.log('DB_PASSWORD length:', process.env.DB_PASSWORD?.length)