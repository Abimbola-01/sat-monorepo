import { pool } from '../db/pool'

export { pool }

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
