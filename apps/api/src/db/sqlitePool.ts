import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

// Create a temporary SQLite database for testing
const tmpDir = fs.mkdtempSync('/tmp/qorvi-test-')
const testDbPath = path.join(tmpDir, 'test.db')

export const testPool = {
  db: new Database(testDbPath),
  
  async query(sql: string, params?: unknown[]): Promise<{ rows: unknown[]; rowCount: number }> {
    try {
      // Convert PostgreSQL-style $1, $2 placeholders to SQLite ? placeholders
      let convertedSql = sql
      const convertedParams: unknown[] = []
      
      if (params) {
        convertedSql = sql.replace(/\$(\d+)/g, (_, num) => {
          const idx = parseInt(num, 10) - 1
          if (idx >= params.length) {
            throw new Error(`Parameter $${num} not found in params`)
          }
          convertedParams.push(params[idx])
          return '?'
        })
      }
      
      const stmt = this.db.prepare(convertedSql)
      
      // Check if it's a statement that returns data
      const sqlTrimmed = convertedSql.trim().toUpperCase()
      const isSelect = sqlTrimmed.startsWith('SELECT')
      const hasReturning = sqlTrimmed.includes('RETURNING')
      
      if (isSelect || hasReturning) {
        const rows = convertedParams.length > 0 ? stmt.all(...convertedParams) : stmt.all()
        return { rows: rows as unknown[], rowCount: rows.length }
      } else {
        // For INSERT/UPDATE/DELETE without RETURNING, use run()
        const result = convertedParams.length > 0 
          ? stmt.run(...convertedParams) 
          : stmt.run()
        return { rows: [], rowCount: result.changes }
      }
    } catch (error) {
      console.error('SQLite query error:', error)
      throw error
    }
  },
  
  async connect(): Promise<void> {
    // SQLite doesn't need explicit connection
  },
  
  async end(): Promise<void> {
    this.db.close()
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    } catch {}
  }
}

// Initialize the schema
export function initTestDatabase(): void {
  const db = testPool.db
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      clerk_id TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL,
      name TEXT NOT NULL DEFAULT '',
      currency TEXT NOT NULL DEFAULT 'NGN',
      timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS imports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      original_filename TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      column_mapping TEXT NOT NULL DEFAULT '{}',
      row_count INTEGER NOT NULL DEFAULT 0,
      valid_row_count INTEGER NOT NULL DEFAULT 0,
      invalid_row_count INTEGER NOT NULL DEFAULT 0,
      invalid_rows TEXT NOT NULL DEFAULT '[]',
      chosen_currency TEXT NOT NULL DEFAULT 'NGN',
      started_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      import_id TEXT REFERENCES imports (id) ON DELETE SET NULL,
      transaction_date TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'NGN',
      type TEXT NOT NULL DEFAULT 'unknown',
      merchant_hint TEXT,
      category TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscription_occurrences (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      subscription_id TEXT REFERENCES subscriptions (id) ON DELETE CASCADE,
      transaction_id TEXT REFERENCES transactions (id) ON DELETE SET NULL,
      occurred_at TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'NGN',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      import_id TEXT REFERENCES imports (id) ON DELETE SET NULL,
      name TEXT NOT NULL DEFAULT '',
      merchant_hint TEXT,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'NGN',
      frequency TEXT NOT NULL DEFAULT 'monthly',
      monthly_amount REAL NOT NULL,
      yearly_amount REAL NOT NULL,
      last_payment_date TEXT,
      estimated_next_payment_date TEXT,
      confidence_score INTEGER NOT NULL DEFAULT 0,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'needsReview',
      categories TEXT NOT NULL DEFAULT '["Other"]',
      detected_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
      preferences TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
  
  // New merchant tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS merchant_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      icon TEXT,
      sort_order INTEGER NOT NULL DEFAULT 99,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS merchants (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES merchant_categories (id) ON DELETE RESTRICT,
      canonical_name TEXT NOT NULL,
      website TEXT,
      country TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS merchant_aliases (
      id TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL REFERENCES merchants (id) ON DELETE CASCADE,
      alias TEXT NOT NULL,
      match_type TEXT NOT NULL DEFAULT 'token',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_merchant_overrides (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      transaction_id TEXT REFERENCES transactions (id) ON DELETE CASCADE,
      merchant_name TEXT NOT NULL DEFAULT '',
      category_id TEXT NOT NULL REFERENCES merchant_categories (id) ON DELETE RESTRICT,
      source TEXT NOT NULL DEFAULT 'manual',
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS merchant_match_audit (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      transaction_id TEXT REFERENCES transactions (id) ON DELETE CASCADE,
      original_description TEXT NOT NULL,
      normalised_description TEXT NOT NULL,
      matched_merchant_id TEXT REFERENCES merchants (id) ON DELETE SET NULL,
      matched_merchant_name TEXT,
      matched_alias TEXT,
      matching_method TEXT NOT NULL DEFAULT 'none',
      category_id TEXT NOT NULL REFERENCES merchant_categories (id) ON DELETE RESTRICT,
      category_name TEXT NOT NULL,
      confidence_score REAL NOT NULL DEFAULT 0,
      is_manual INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
  
  console.log('Test database initialized at:', testDbPath)
}
