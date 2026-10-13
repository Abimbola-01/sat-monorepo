import fs from 'fs'
import path from 'path'
import { pool } from '../config/database'

const MIGRATION_FILE = path.join(__dirname, 'schema.sql')

export async function runMigrations() {
  const sql = fs.readFileSync(MIGRATION_FILE, 'utf-8')

  // Split on semicolons but keep it simple and safe for the current schema.
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  for (const statement of statements) {
    // Skip comments and empty statements
    const clean = statement.replace(/^\s*--.*/gm, '').trim()
    if (clean.length === 0) continue

    try {
      await pool.query(clean)
    } catch (error) {
      console.error('Migration statement failed:', statement.slice(0, 120))
      console.error(error)
      throw error
    }
  }

  console.log('Qorvi DB migrations applied')
}
