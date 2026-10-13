// Merchant registry and matching service
// - Canonical merchants are global recognition candidates, not proof of subscription
// - User overrides are per-user and never leak across accounts
// - Matching is deterministic and explainable
import { pool } from '../config/database'

// ── Types ──────────────────────────────────────────────────────────────────
export type MatchType = 'exact' | 'alias' | 'token' | 'fuzzy' | 'none'
export type MatchMethod = 'alias_exact' | 'alias_token' | 'merchant_exact' | 'manual' | 'none'

export interface MatchedMerchant {
  merchantId: string | null
  merchantName: string | null
  categoryId: string
  categoryName: string
  matchMethod: MatchMethod
  confidenceScore: number
  matchedAlias: string | null
  originalDescription: string
  normalisedDescription: string
  isManual: boolean
}

export interface MerchantAliasRow {
  alias: string
  matchType: 'exact' | 'token' | 'fuzzy'
}

export interface MerchantRow {
  id: string
  category_id: string
  canonical_name: string
  website: string | null
  country: string | null
  status: string
  notes: string | null
}

export interface MerchantRowCorsor {
  id: string
  categoryId: string
  canonicalName: string
  website: string | null
  country: string | null
  status: string
  notes: string | null
}

// ── Normalisation ──────────────────────────────────────────────────────────
const NORMALISE_PUNCTUATION = /[^a-z0-9 ]/g
const NORMALISE_MULTISPACE = /\s+/g

export function normaliseDescription(description: string): string {
  const s = String(description || '').trim().toLowerCase()
  let cleaned = s
    .replace(NORMALISE_PUNCTUATION, ' ')
    .replace(NORMALISE_MULTISPACE, ' ')
    .trim()
  return cleaned.slice(0, 120) || s.slice(0, 120)
}

function tokenSet(text: string): string[] {
  return text
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
}

// ── Category helpers ───────────────────────────────────────────────────────
export async function getCategoryById(id: string): Promise<{ id: string; name: string; description: string; icon: string | null } | null> {
  const result = await pool.query(
    'SELECT id, name, description, icon FROM merchant_categories WHERE id = $1',
    [id]
  )
  const row = result.rows[0] as { id: string; name: string; description: string; icon: string | null } | undefined
  return row ?? null
}

export async function listCategories(): Promise<{ id: string; name: string; description: string; icon: string | null; sortOrder: number }[]> {
  const result = await pool.query(
    'SELECT id, name, description, icon, sort_order FROM merchant_categories ORDER BY sort_order, name'
  )
  const rows = result.rows as Array<{ id: string; name: string; description: string; icon: string | null; sort_order: number }>
  return rows.map((r) => ({ id: r.id, name: r.name, description: r.description, icon: r.icon, sortOrder: r.sort_order }))
}

// ── Merchant rows ──────────────────────────────────────────────────────────
export async function listMerchants(categoryId?: string): Promise<MerchantRow[]> {
  const sql = categoryId
    ? 'SELECT id, category_id, canonical_name, website, country, status, notes FROM merchants WHERE category_id = $1 AND status = $2 ORDER BY canonical_name'
    : 'SELECT id, category_id, canonical_name, website, country, status, notes FROM merchants WHERE status = $1 ORDER BY canonical_name'
  const result = await pool.query(sql, categoryId ? [categoryId, 'active'] : ['active'])
  const rows = result.rows as Array<MerchantRow>
  return rows.map((r) => ({
    id: r.id,
    category_id: r.category_id,
    canonical_name: r.canonical_name,
    website: r.website,
    country: r.country,
    status: r.status,
    notes: r.notes,
  }))
}

// ── Alias rows ─────────────────────────────────────────────────────────────
export async function getAliasesForMerchant(merchantId: string): Promise<MerchantAliasRow[]> {
  const result = await pool.query(
    'SELECT alias, match_type FROM merchant_aliases WHERE merchant_id = $1 AND LOWER(alias) != LOWER((SELECT canonical_name FROM merchants WHERE id = $2)) ORDER BY alias',
    [merchantId, merchantId]
  )
  const rows = result.rows as Array<{ alias: string; match_type: string }>
  return rows.map((r) => ({ alias: r.alias, matchType: r.match_type as 'exact' | 'token' | 'fuzzy' }))
}

// ── Matching ───────────────────────────────────────────────────────────────
const STRICT_TOKENS: Record<string, boolean> = {}

function isStrictToken(token: string): boolean {
  if (STRICT_TOKENS[token] === undefined) {
    STRICT_TOKENS[token] = token.length < 3 || ['pay', 'card', 'bank', 'trans', 'fee', 'charge', 'via', 'the', 'and', 'for'].includes(token)
  }
  return STRICT_TOKENS[token]
}

export async function matchTransaction(
  userId: string,
  transactionId: string,
  originalDescription: string
): Promise<MatchedMerchant> {
  const norm = normaliseDescription(originalDescription)
  const txTokens = tokenSet(norm)

  // 1. Manual user override takes precedence and is scoped to the user
  const manual = await pool.query(
    `SELECT mo.merchant_name AS merchantName, mo.category_id AS categoryId,
            mc.name AS categoryName
     FROM user_merchant_overrides mo
     JOIN merchant_categories mc ON mc.id = mo.category_id
     WHERE mo.user_id = $1 AND mo.transaction_id = $2
     LIMIT 1`,
    [userId, transactionId]
  )

  if (manual.rows.length > 0) {
    const r = manual.rows[0] as { merchantName: string; categoryId: string; categoryName: string }
    return {
      merchantId: null,
      merchantName: r.merchantName || null,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      matchMethod: 'manual',
      confidenceScore: 100,
      matchedAlias: null,
      originalDescription,
      normalisedDescription: norm,
      isManual: true,
    }
  }

  // 2. Exact alias match (case-insensitive)
  const exactAlias = await pool.query(
    `SELECT m.id AS merchantId, m.canonical_name AS merchantName, m.category_id AS categoryId,
            mc.name AS categoryName, ma.alias AS matchedAlias
     FROM merchant_aliases ma
     JOIN merchants m ON m.id = ma.merchant_id
     JOIN merchant_categories mc ON mc.id = m.category_id
     WHERE ma.match_type = 'exact' AND LOWER(ma.alias) = $1 AND m.status = 'active'
     LIMIT 1`,
    [norm]
  )

  if (exactAlias.rows.length > 0) {
    const r = exactAlias.rows[0] as { merchantId: string; merchantName: string; categoryId: string; categoryName: string; matchedAlias: string }
    return {
      merchantId: r.merchantId,
      merchantName: r.merchantName,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      matchMethod: 'alias_exact',
      confidenceScore: 95,
      matchedAlias: r.matchedAlias,
      originalDescription,
      normalisedDescription: norm,
      isManual: false,
    }
  }

  // 3. Token-level alias match (alias is a single token present in the description)
  if (txTokens.length > 0) {
    const tokenWhere = txTokens.map((_t, i) => `LOWER(ma.alias) = $${i + 1}`).join(' OR ')
    const tokenAlias = await pool.query(
      `SELECT DISTINCT ON (m.id) m.id AS merchantId, m.canonical_name AS merchantName, m.category_id AS categoryId,
              mc.name AS categoryName, ma.alias AS matchedAlias
       FROM merchant_aliases ma
       JOIN merchants m ON m.id = ma.merchant_id
       JOIN merchant_categories mc ON mc.id = m.category_id
       WHERE ma.match_type = 'token' AND (${tokenWhere}) AND m.status = 'active'
       ORDER BY m.id, LENGTH(ma.alias) DESC
       LIMIT 1`,
      txTokens as unknown[]
    )

    if (tokenAlias.rows.length > 0) {
      const r = tokenAlias.rows[0] as { merchantId: string; merchantName: string; categoryId: string; categoryName: string; matchedAlias: string }
      return {
        merchantId: r.merchantId,
        merchantName: r.merchantName,
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        matchMethod: 'alias_token',
        confidenceScore: 80,
        matchedAlias: r.matchedAlias,
        originalDescription,
        normalisedDescription: norm,
        isManual: false,
      }
    }
  }

  // 4. Merchant canonical name exact match
  const canonicalExact = await pool.query(
    `SELECT m.id AS merchantId, m.canonical_name AS merchantName, m.category_id AS categoryId,
            mc.name AS categoryName
     FROM merchants m
     JOIN merchant_categories mc ON mc.id = m.category_id
     WHERE LOWER(m.canonical_name) = $1 AND m.status = 'active'
     LIMIT 1`,
    [norm]
  )

  if (canonicalExact.rows.length > 0) {
    const r = canonicalExact.rows[0] as { merchantId: string; merchantName: string; categoryId: string; categoryName: string }
    return {
      merchantId: r.merchantId,
      merchantName: r.merchantName,
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      matchMethod: 'merchant_exact',
      confidenceScore: 90,
      matchedAlias: null,
      originalDescription,
      normalisedDescription: norm,
      isManual: false,
    }
  }

  // 5. Ambiguous / no match
  return {
    merchantId: null,
    merchantName: null,
    categoryId: 'other',
    categoryName: 'Other',
    matchMethod: 'none',
    confidenceScore: 0,
    matchedAlias: null,
    originalDescription,
    normalisedDescription: norm,
    isManual: false,
  }
}

// ── Persist categorisation decision ───────────────────────────────────────
export async function recordMatchAudit(
  userId: string,
  transactionId: string,
  decision: MatchedMerchant
): Promise<void> {
  await pool.query(
    `INSERT INTO merchant_match_audit
       (user_id, transaction_id, original_description, normalised_description,
        matched_merchant_id, matched_merchant_name, matched_alias, matching_method,
        category_id, category_name, confidence_score, is_manual)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ON CONFLICT (user_id, transaction_id) DO UPDATE SET
       original_description = EXCLUDED.original_description,
       normalised_description = EXCLUDED.normalised_description,
       matched_merchant_id = EXCLUDED.matched_merchant_id,
       matched_merchant_name = EXCLUDED.matched_merchant_name,
       matched_alias = EXCLUDED.matched_alias,
       matching_method = EXCLUDED.matching_method,
       category_id = EXCLUDED.category_id,
       category_name = EXCLUDED.category_name,
       confidence_score = EXCLUDED.confidence_score,
       is_manual = EXCLUDED.is_manual,
       created_at = NOW()`,
    [
      userId,
      transactionId,
      decision.originalDescription,
      decision.normalisedDescription,
      decision.merchantId,
      decision.merchantName,
      decision.matchedAlias,
      decision.matchMethod,
      decision.categoryId,
      decision.categoryName,
      decision.confidenceScore,
      decision.isManual ? true : false,
    ]
  )
}

// ── User corrections ───────────────────────────────────────────────────────
export async function setUserOverride(
  userId: string,
  transactionId: string,
  merchantName: string,
  categoryId: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  if (!categoryId) return { success: false, error: 'categoryId is required' }
  const cat = await getCategoryById(categoryId)
  if (!cat) return { success: false, error: 'Unknown category' }

  const result = await pool.query(
    `INSERT INTO user_merchant_overrides (user_id, transaction_id, merchant_name, category_id, notes)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, transaction_id) DO UPDATE SET
       merchant_name = EXCLUDED.merchant_name,
       category_id = EXCLUDED.category_id,
       notes = EXCLUDED.notes,
       created_at = NOW()
     RETURNING id`,
    [userId, transactionId, merchantName || '', categoryId, notes || null]
  )
  return { success: true }
}

export async function removeUserOverride(userId: string, transactionId: string): Promise<void> {
  await pool.query(
    'DELETE FROM user_merchant_overrides WHERE user_id = $1 AND transaction_id = $2',
    [userId, transactionId]
  )
}

export async function getUserOverride(userId: string, transactionId: string): Promise<{ merchantName: string; categoryId: string; categoryName: string; notes: string | null } | null> {
  const result = await pool.query(
    `SELECT mo.merchant_name AS merchantName, mo.category_id AS categoryId,
            mc.name AS categoryName, mo.notes AS notes
     FROM user_merchant_overrides mo
     JOIN merchant_categories mc ON mc.id = mo.category_id
     WHERE mo.user_id = $1 AND mo.transaction_id = $2
     LIMIT 1`,
    [userId, transactionId]
  )
  const row = result.rows[0] as { merchantName: string; categoryId: string; categoryName: string; notes: string | null } | undefined
  return row ?? null
}

// ── Create custom merchant + alias (per merchant, not per user) ───────────
export async function createMerchant(
  categoryId: string,
  canonicalName: string,
  website?: string,
  country?: string,
  notes?: string
): Promise<{ success: boolean; merchantId?: string; error?: string }> {
  if (!categoryId) return { success: false, error: 'categoryId is required' }
  const cat = await getCategoryById(categoryId)
  if (!cat) return { success: false, error: 'Unknown category' }

  const trimmed = canonicalName.trim()
  if (!trimmed) return { success: false, error: 'canonicalName is required' }

  try {
    const result = await pool.query(
      `INSERT INTO merchants (category_id, canonical_name, website, country, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [categoryId, trimmed, website || null, country || null, notes || null]
    )
    const merchantId = (result.rows[0] as { id: string }).id

    // Auto-create an exact alias from the canonical name so future imports recognise it
    await pool.query(
      `INSERT INTO merchant_aliases (merchant_id, alias, match_type)
       VALUES ($1, $2, 'exact')
       ON CONFLICT DO NOTHING`,
      [merchantId, trimmed]
    )

    return { success: true, merchantId }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    if (msg.includes('unique') || msg.includes('UNIQUE')) {
      return { success: false, error: 'A merchant with this name already exists in this category' }
    }
    throw error
  }
}

export async function addMerchantAlias(
  merchantId: string,
  alias: string,
  matchType: 'exact' | 'token' | 'fuzzy' = 'token'
): Promise<{ success: boolean; error?: string }> {
  if (!merchantId || !alias) return { success: false, error: 'merchantId and alias are required' }
  const trimmed = alias.trim()
  if (!trimmed) return { success: false, error: 'alias is required' }

  const existing = await pool.query('SELECT id FROM merchants WHERE id = $1', [merchantId])
  if (existing.rows.length === 0) return { success: false, error: 'Merchant not found' }

  try {
    await pool.query(
      `INSERT INTO merchant_aliases (merchant_id, alias, match_type)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [merchantId, trimmed, matchType]
    )
    return { success: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    if (msg.includes('unique') || msg.includes('UNIQUE')) {
      return { success: false, error: 'This alias already exists for this merchant' }
    }
    throw error
  }
}
