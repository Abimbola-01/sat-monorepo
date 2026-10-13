import { parse } from 'csv-parse/sync'
import fs from 'fs'

export interface ColumnProfile {
  date: string | null
  description: string | null
  amount: string | null
  debit: string | null
  credit: string | null
  currency: string | null
}

const DATE_ALIASES = ['date', 'transaction date', 'txn date', 'value date', 'posting date', 'posted date', 'transactiondate']
const DESCRIPTION_ALIASES = ['description', 'narration', 'details', 'remarks', 'transaction description', 'memo', 'particulars', 'reference', 'beneficiary', 'description/narration']
const AMOUNT_ALIASES = ['amount', 'transaction amount', 'total', 'debit/credit', 'value', 'txn amount']
const DEBIT_ALIASES = ['debit', 'withdrawal', 'dr', 'debit amount']
const CREDIT_ALIASES = ['credit', 'deposit', 'cr', 'credit amount']
const CURRENCY_ALIASES = ['currency', 'ccy', 'curr']

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[\s_]+/g, ' ')
}

function bestMatch(headers: string[], aliases: string[]): string | null {
  const lowered = headers.map((h) => h.trim())
  for (const alias of aliases) {
    const idx = lowered.findIndex((h) => normalizeHeader(h) === normalizeHeader(alias))
    if (idx !== -1) return headers[idx]
  }
  for (const alias of aliases) {
    const word = alias.split(' ')[0]
    const idx = lowered.findIndex((h) => h.includes(word))
    if (idx !== -1) return headers[idx]
  }
  return null
}

export function detectColumnProfile(headers: string[]): ColumnProfile {
  return {
    date: bestMatch(headers, DATE_ALIASES),
    description: bestMatch(headers, DESCRIPTION_ALIASES),
    amount: bestMatch(headers, AMOUNT_ALIASES),
    debit: bestMatch(headers, DEBIT_ALIASES),
    credit: bestMatch(headers, CREDIT_ALIASES),
    currency: bestMatch(headers, CURRENCY_ALIASES),
  }
}

export function hasAmountSource(profile: ColumnProfile): boolean {
  return !!(profile.amount || profile.debit || profile.credit)
}

export interface ValidatedTransaction {
  transactionDate: Date
  description: string
  amount: number
  currency: string
  type: 'debit' | 'credit' | 'unknown'
  merchantHint: string | null
}

export interface ImportPreview {
  columnProfile: ColumnProfile
  headers: string[]
  suggestedMapping: Record<string, string>
  totalRows: number
  validRows: ValidatedTransaction[]
  invalidRows: { rowIndex: number; reason: string; raw: Record<string, string> }[]
}

const MIN_DATE = new Date('2000-01-01')
const MAX_DATE = new Date('2099-12-31')

function parseDate(raw: unknown): Date | null {
  const cleaned = String(raw ?? '').trim()
  if (!cleaned) return null

  const parsed = Date.parse(cleaned)
  if (Number.isNaN(parsed)) return null

  const date = new Date(parsed)
  if (date < MIN_DATE || date > MAX_DATE) return null
  return date
}

function parseAmount(raw: unknown): number | null {
  if (raw == null) return null
  const cleaned = String(raw).replace(/[,\s]/g, '').trim()
  if (!cleaned) return null
  const parsed = Number(cleaned)
  if (!Number.isFinite(parsed)) return null
  return parsed
}

function normaliseDescription(raw: unknown): string {
  return String(raw).trim().slice(0, 1000) || 'Unknown'
}

function validateRow(row: Record<string, unknown>, profile: ColumnProfile, headers: string[]): ValidatedTransaction | null {
  if (!profile.date || !hasAmountSource(profile)) {
    return null
  }

  const dateRaw = row[profile.date]
  const date = parseDate(dateRaw)
  if (!date) {
    return null
  }

  let amount: number | null = null
  let type: 'debit' | 'credit' | 'unknown' = 'unknown'

  if (profile.amount) {
    amount = parseAmount(row[profile.amount])
    if (amount == null) {
      return null
    }
    type = amount < 0 ? 'debit' : 'credit'
    amount = Math.abs(amount)
  } else {
    const debitRaw = profile.debit ? parseAmount(row[profile.debit]) : null
    const creditRaw = profile.credit ? parseAmount(row[profile.credit]) : null

    if (debitRaw == null && creditRaw == null) {
      return null
    }

    if (debitRaw != null && creditRaw != null) {
      const absDebit = Math.abs(debitRaw)
      const absCredit = Math.abs(creditRaw)
      amount = absDebit > absCredit ? absDebit : absCredit
      type = absDebit > absCredit ? 'debit' : 'credit'
    } else if (debitRaw != null) {
      amount = Math.abs(debitRaw)
      type = 'debit'
    } else if (creditRaw != null) {
      amount = Math.abs(creditRaw)
      type = 'credit'
    } else {
      return null
    }
  }

  if (!amount || amount <= 0) {
    return null
  }

  const description = normaliseDescription(profile.description ? row[profile.description] : '')

  let currency = 'NGN'
  if (profile.currency && row[profile.currency]) {
    const cc = String(row[profile.currency]).trim().toUpperCase()
    if (cc && /^[A-Z]{3}$/.test(cc)) currency = cc
  }

  const merchantHint = description

  return {
    transactionDate: date,
    description,
    amount,
    currency,
    type,
    merchantHint,
  }
}

function safeSample(raw: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  const keys = Object.keys(raw).slice(0, 12)
  for (const k of keys) {
    out[k] = String(raw[k] ?? '').slice(0, 80)
  }
  return out
}

export function parseImportFile(filePath: string): ImportPreview {
  let content: string
  try {
    content = fs.readFileSync(filePath, 'utf-8')
  } catch (error) {
    throw new Error('Failed to read uploaded file')
  }

  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    cast: false,
  })

  if (!Array.isArray(records)) {
    throw new Error('Failed to parse CSV')
  }

  if (records.length === 0) {
    return {
      columnProfile: { date: null, description: null, amount: null, debit: null, credit: null, currency: null },
      headers: [],
      suggestedMapping: {},
      totalRows: 0,
      validRows: [],
      invalidRows: [],
    }
  }

  const headers = Object.keys(records[0])
  const profile = detectColumnProfile(headers)

  const suggestedMapping: Record<string, string> = {}
  if (profile.date) suggestedMapping.date = profile.date
  if (profile.description) suggestedMapping.description = profile.description
  if (profile.amount) suggestedMapping.amount = profile.amount
  else if (profile.debit || profile.credit) suggestedMapping.type = 'debit_credit'
  if (profile.currency) suggestedMapping.currency = profile.currency

  const validRows: ValidatedTransaction[] = []
  const invalidRows: { rowIndex: number; reason: string; raw: Record<string, string> }[] = []

  for (let i = 0; i < records.length; i++) {
    const row = records[i]
    if (typeof row !== 'object' || row === null) {
      invalidRows.push({ rowIndex: i + 1, reason: 'Malformed row', raw: {} })
      continue
    }
    const validated = validateRow(row as Record<string, unknown>, profile, headers)
    if (validated) {
      validRows.push(validated)
    } else {
      invalidRows.push({
        rowIndex: i + 1,
        reason: 'Could not parse date or amount',
        raw: safeSample(row as Record<string, unknown>),
      })
    }
  }

  return {
    columnProfile: profile,
    headers,
    suggestedMapping,
    totalRows: records.length,
    validRows,
    invalidRows,
  }
}
