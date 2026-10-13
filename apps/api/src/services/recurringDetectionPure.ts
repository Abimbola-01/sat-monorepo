// Pure functions for recurring detection - no DB dependencies
// These are extracted for easier unit testing

export type DetectedFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual' | 'irregular'

// ── Constants ─────────────────────────────────────────────────────────────
const AMOUNT_TOLERANCE = 0.15
const NOISE_WORDS = new Set([
  'debit', 'credit', 'transfer', 'payment', 'transaction', 'chq', 'cheque',
  'card', 'pos', 'online', 'inst', 'w/d', 'wd', 'deposit', 'withdrawal',
  'fee', 'charge', 'reversed', 'refund', 'adjustment', 'purchase', 'buy',
  'order', 'payment Ref', 'ref', 'pos transaction', 'subscription', 'to',
])

// ── Merchant similarity ───────────────────────────────────────────────────
export function merchantKey(raw: string): string {
  const s = String(raw).trim().toLowerCase()
  let cleaned = s
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const words = cleaned.split(' ')
  const kept = words.filter((w) => !NOISE_WORDS.has(w) && w.length > 0)
  cleaned = kept.join(' ').trim()
  return cleaned.slice(0, 80) || s.slice(0, 80)
}

export function merchantsMatch(a: string, b: string): boolean {
  return merchantKey(a) === merchantKey(b)
}

// ── Date helpers ──────────────────────────────────────────────────────────
export function daysBetween(a: Date, b: Date): number {
  const ms = Math.abs(b.getTime() - a.getTime())
  return ms / (1000 * 60 * 60 * 24)
}

export function nextPaymentDate(last: Date, frequency: DetectedFrequency): Date {
  const ms = last.getTime()
  switch (frequency) {
    case 'weekly': return new Date(ms + 7 * 24 * 60 * 60 * 1000)
    case 'biweekly': return new Date(ms + 14 * 24 * 60 * 60 * 1000)
    case 'monthly': return new Date(ms + 30 * 24 * 60 * 60 * 1000)
    case 'quarterly': return new Date(ms + 91 * 24 * 60 * 60 * 1000)
    case 'annual': return new Date(ms + 365 * 24 * 60 * 60 * 1000)
    default: return new Date(ms + 30 * 24 * 60 * 60 * 1000)
  }
}

export function monthlyEquivalent(amount: number, frequency: DetectedFrequency): number {
  switch (frequency) {
    case 'weekly': return amount * 4.33
    case 'biweekly': return amount * 2.165
    case 'monthly': return amount
    case 'quarterly': return amount / 3
    case 'annual': return amount / 12
    default: return amount
  }
}

// ── Amount variation ──────────────────────────────────────────────────────
export function amountVariationPercent(values: number[]): number {
  if (values.length < 2) return 0
  const mean = values.reduce((s, v) => s + v, 0) / values.length
  if (mean <= 0) return 100
  const maxDev = Math.max(...values.map((v) => Math.abs(v - mean) / mean))
  return maxDev * 100
}

export function describeAmountVariation(pct: number): string {
  if (pct <= 5) return 'very consistent amounts'
  if (pct <= 15) return 'mostly consistent amounts within about ' + pct.toFixed(0) + '% variance'
  if (pct <= 30) return 'variable amounts within about ' + pct.toFixed(0) + '% variance'
  return 'wide amount variation of about ' + pct.toFixed(0) + '%'
}

// ── Interval estimation ───────────────────────────────────────────────────
const FREQUENCY_CANDIDATES: Array<{ frequency: DetectedFrequency; expectedDays: number }> = [
  { frequency: 'weekly', expectedDays: 7 },
  { frequency: 'biweekly', expectedDays: 14 },
  { frequency: 'monthly', expectedDays: 30 },
  { frequency: 'quarterly', expectedDays: 91 },
  { frequency: 'annual', expectedDays: 365 },
]

export function estimateInterval(dates: Date[]): { detected: DetectedFrequency; typicalGapDays: number | null; gapMatches: { expected: number; actual: number }[]; gapDeviation: number; intervalConfidence: number } {
  if (dates.length < 2) {
    return { detected: 'irregular', typicalGapDays: null, gapMatches: [], gapDeviation: 0, intervalConfidence: 0 }
  }

  const sorted = dates.slice().sort((a, b) => a.getTime() - b.getTime())
  const gaps: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    const gap = daysBetween(sorted[i - 1], sorted[i])
    if (gap > 0) gaps.push(gap)
  }

  if (gaps.length === 0) {
    return { detected: 'irregular', typicalGapDays: null, gapMatches: [], gapDeviation: 0, intervalConfidence: 0 }
  }

  const avg = gaps.reduce((s, v) => s + v, 0) / gaps.length

  let best: { frequency: DetectedFrequency; expected: number; matched: number; score: number } | null = null

  for (const c of FREQUENCY_CANDIDATES) {
    const within = gaps.filter((g) => Math.abs(g - c.expectedDays) / c.expectedDays <= 0.22)
    if (within.length === 0) continue
    const score = within.length / gaps.length
    if (!best || score > best.score || (score === best.score && within.length > best.matched)) {
      best = { frequency: c.frequency, expected: c.expectedDays, matched: within.length, score }
    }
  }

  if (!best) {
    const uniqueGaps = new Set(gaps.map((g) => Math.round(g)))
    if (uniqueGaps.size <= 2 && gaps.length >= 3) {
      if (avg >= 20 && avg <= 45) {
        return { detected: 'monthly', typicalGapDays: 30, gapMatches: [], gapDeviation: 0, intervalConfidence: 0.4 }
      }
      if (avg >= 5 && avg <= 14) {
        return { detected: 'weekly', typicalGapDays: 7, gapMatches: [], gapDeviation: 0, intervalConfidence: 0.4 }
      }
    }
    return { detected: 'irregular', typicalGapDays: null, gapMatches: [], gapDeviation: 0, intervalConfidence: 0 }
  }

  const gapMatches = gaps.map((g) => ({ expected: best.expected, actual: Math.round(g * 10) / 10 }))
  const squaredDeviations = gapMatches.reduce((s, m) => s + Math.pow(m.actual - m.expected, 2), 0)
  const gapDeviation = Math.sqrt(squaredDeviations / Math.max(1, gapMatches.length))
  const intervalConfidence = Math.min(1, best.matched / Math.max(1, gaps.length) * 1.2)

  return { detected: best.frequency, typicalGapDays: best.expected, gapMatches, gapDeviation, intervalConfidence }
}

// ── Category inference ────────────────────────────────────────────────────
const CATEGORY_HINTS: Array<{ pattern: RegExp; category: string }> = [
  { pattern: /\b(netflix|hulu|disney\+|showmax|spotify|apple\s*music|youtube\s*premium|music|audible|deezer)\b/i, category: 'Streaming' },
  { pattern: /\b(aws|azure|google\s*cloud|digitalocean|vultr|hosting|domain|ssl|server|cdn|heroku|linode)\b/i, category: 'Software' },
  { pattern: /\b(microsoft\s*365|office\s*365|adobe|figma|notion|slack|zoom|github|jetbrains|linear|dropbox|google\s*workspace)\b/i, category: 'Software' },
  { pattern: /\b(paystack|stripe|flutterwave|monnify|paypal|wise|world\s*bank|credit\s*card|loan|interest|insurance|mutual\s*fund|bank\s*fe)\b/i, category: 'Finance' },
  { pattern: /\b(electricity|power|grid|ikeja|ebu|dsire|water|paulson|waterboard|internet|fiber|broadband|mobile\s*airtime|data|mtn|airtel|gl|9mobile|gas|cooking\s*gas)\b/i, category: 'Utilities' },
  { pattern: /\b(gym|fitness|health\s*club|medical|pharmacy|hospital|clinic|dental)\b/i, category: 'Health' },
  { pattern: /\b(news|newspaper|magazine|journal|subscription\s*box)\b/i, category: 'Other' },
]

export function inferCategory(name: string, merchantHint: string): string {
  const text = (name + ' ' + merchantHint).toLowerCase()
  for (const { pattern, category } of CATEGORY_HINTS) {
    if (pattern.test(text)) return category
  }
  return 'Other'
}

// ── Confidence scoring ────────────────────────────────────────────────────
export function confidenceBand(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high'
  if (score >= 45) return 'medium'
  return 'low'
}

export function computeConfidenceScore(occurrences: Array<{ date: Date; amount: number; debit: boolean; credit: boolean }>): {
  occurrences: number
  frequency: DetectedFrequency
  typicalGapDays: number | null
  gapDeviation: number
  amountVariationPercent: number
  amountConsistent: boolean
  directionConsistent: boolean
  lastPaymentDaysAgo: number
  confidenceScore: number
  band: 'low' | 'medium' | 'high'
  reason: string
  directionLabel: 'debit' | 'credit' | 'unknown'
} {
  if (occurrences.length < 2) {
    return {
      occurrences: 0, frequency: 'irregular', typicalGapDays: null, gapDeviation: 0,
      amountVariationPercent: 0, amountConsistent: false, directionConsistent: false,
      lastPaymentDaysAgo: 0, confidenceScore: 0, band: 'low',
      reason: 'Not enough transactions to detect a pattern.',
      directionLabel: 'unknown',
    }
  }

  const sorted = occurrences.slice().sort((a, b) => a.date.getTime() - b.date.getTime())
  const dates = sorted.map((o) => o.date)
  const amounts = sorted.map((o) => o.amount)
  const lastSeen = sorted[sorted.length - 1].date

  const frequencyEvidence = estimateInterval(dates)
  const gapDeviation = frequencyEvidence.gapDeviation
  const amountVariation = amountVariationPercent(amounts)
  const amountConsistent = frequencyEvidence.detected !== 'irregular' && amountVariation <= AMOUNT_TOLERANCE * 100
  const directionConsistent = sorted.every((o) => o.debit === sorted[0].debit)
  const debitCount = sorted.filter((o) => o.debit).length
  const creditCount = sorted.filter((o) => o.credit).length
  const directionLabel = debitCount >= creditCount ? 'debit' : 'credit'
  const likelyDirection = directionConsistent ? directionLabel : 'unknown'

  const now = new Date()
  const lastPaymentDaysAgo = Math.floor(daysBetween(lastSeen, now))

  const frequency = frequencyEvidence.detected
  let score = 0
  const reasons: string[] = []
  const occCount = occurrences.length

  // Frequency base score
  switch (frequency) {
    case 'weekly': score += 18; break
    case 'biweekly': score += 20; break
    case 'monthly': score += 22; break
    case 'quarterly': score += 22; break
    case 'annual': score += 24; break
    default: reasons.push('No clear repeat interval was detected'); break
  }

  // Occurrence count - heavily reward more occurrences
  if (frequency === 'annual') {
    if (occCount >= 3) score += 20
    else if (occCount >= 2) score += 12
  } else if (frequency === 'quarterly') {
    if (occCount >= 5) score += 20
    else if (occCount >= 4) score += 16
    else if (occCount >= 3) score += 10
    else if (occCount >= 2) score += 6
  } else if (frequency === 'monthly') {
    if (occCount >= 10) score += 20
    else if (occCount >= 8) score += 18
    else if (occCount >= 6) score += 16
    else if (occCount >= 4) score += 12
    else if (occCount >= 3) score += 8
    else if (occCount >= 2) score += 4
  } else if (frequency === 'biweekly') {
    if (occCount >= 8) score += 20
    else if (occCount >= 6) score += 16
    else if (occCount >= 4) score += 12
    else if (occCount >= 3) score += 8
    else if (occCount >= 2) score += 4
  } else if (frequency === 'weekly') {
    if (occCount >= 10) score += 20
    else if (occCount >= 8) score += 18
    else if (occCount >= 6) score += 16
    else if (occCount >= 4) score += 12
    else if (occCount >= 3) score += 8
    else if (occCount >= 2) score += 4
  }

  // Amount consistency
  if (amountConsistent) score += 15
  else if (amountVariation <= 30) score += 8
  else if (amountVariation <= 50) score += 3

  // Gap consistency
  if (frequency !== 'irregular') {
    if (gapDeviation <= 3) score += 10
    else if (gapDeviation <= 7) score += 6
    else if (gapDeviation <= 14) score += 3
  }

  // Direction consistency
  if (directionConsistent && likelyDirection === 'debit') score += 5
  else if (directionConsistent) score += 2

  // Recency
  if (lastPaymentDaysAgo <= 30) score += 5
  else if (lastPaymentDaysAgo <= 60) score += 4
  else if (lastPaymentDaysAgo <= 90) score += 2
  else if (lastPaymentDaysAgo > 180 && occurrences.length >= 4) score -= 8

  // Negative adjustments
  if (!directionConsistent) {
    score = Math.min(score, 45)
    reasons.push('transaction directions were mixed (some debits, some credits)')
  }

  if (frequency === 'irregular' && occurrences.length >= 3) {
    score = Math.min(score, 30)
  }

  if (occurrences.length < 3 && frequency !== 'irregular' && frequency !== 'annual' && frequency !== 'quarterly') {
    score = Math.min(score, 40)
  }

  score = Math.max(0, Math.min(100, Math.round(score)))
  const band = confidenceBand(score)

  if (frequency === 'irregular' || score < 35) {
    reasons.unshift('Not clearly recurring')
  } else {
    const freqText: Record<DetectedFrequency, string> = {
      weekly: 'weekly', biweekly: 'every two weeks', monthly: 'monthly',
      quarterly: 'every three months', annual: 'yearly', irregular: 'irregular',
    }
    const occText = occurrences.length === 1 ? 'appeared once' : 'appeared ' + occurrences.length + ' times'
    reasons.unshift(
      `Detected as recurring because this merchant ${occText} with ${describeAmountVariation(amountVariation)} ` +
      `at approximately ${freqText[frequency]} intervals (${Math.round(frequencyEvidence.typicalGapDays ?? 0)}-day spacing).`
    )
  }

  if (frequency !== 'irregular' && score >= 35) {
    const directionNote = likelyDirection === 'debit' ? 'Money flowing out.' : likelyDirection === 'credit' ? 'Money flowing in.' : 'Mixed directions.'
    reasons.push(directionNote)
  }

  const reason = reasons.join(' ') + '.'

  return {
    occurrences: sorted.length, frequency, typicalGapDays: frequencyEvidence.typicalGapDays,
    gapDeviation, amountVariationPercent: Math.round(amountVariation * 10) / 10,
    amountConsistent, directionConsistent, lastPaymentDaysAgo, confidenceScore: score,
    band, reason, directionLabel: likelyDirection,
  }
}
