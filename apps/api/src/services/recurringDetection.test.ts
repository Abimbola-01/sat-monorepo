import { describe, it, expect } from 'vitest'
import {
  merchantKey,
  merchantsMatch,
  monthlyEquivalent,
  amountVariationPercent,
  describeAmountVariation,
  inferCategory,
  estimateInterval,
  daysBetween,
  nextPaymentDate,
  confidenceBand,
  computeConfidenceScore,
  DetectedFrequency,
} from './recurringDetectionPure'

function occ(date: string, amount: number, debit = true): { date: Date; amount: number; debit: boolean; credit: boolean } {
  return { date: new Date(date), amount, debit, credit: !debit }
}

describe('Merchant similarity', () => {
  it('normalizes merchant names correctly', () => {
    expect(merchantKey('Netflix')).toBe('netflix')
    expect(merchantKey('Netflix Premium')).toBe('netflix premium')
    expect(merchantKey('NETFLIX')).toBe('netflix')
  })

  it('removes common noise words', () => {
    expect(merchantKey('Payment to Netflix')).toBe('netflix')
    expect(merchantKey('Netflix Card Payment')).toBe('netflix')
  })

  it('merchantsMatch returns true for similar merchants', () => {
    expect(merchantsMatch('Netflix', 'Netflix')).toBe(true)
    expect(merchantsMatch('Netflix', 'NETFLIX')).toBe(true)
    expect(merchantsMatch('Netflix Premium', 'netflix premium')).toBe(true)
    expect(merchantsMatch('Netflix', 'Hulu')).toBe(false)
  })
})

describe('Amount calculations', () => {
  it('monthlyEquivalent for weekly', () => {
    expect(monthlyEquivalent(100, 'weekly')).toBeCloseTo(433, 0)
  })

  it('monthlyEquivalent for biweekly', () => {
    expect(monthlyEquivalent(100, 'biweekly')).toBeCloseTo(216.5, 0)
  })

  it('monthlyEquivalent for monthly', () => {
    expect(monthlyEquivalent(100, 'monthly')).toBe(100)
  })

  it('monthlyEquivalent for quarterly', () => {
    expect(monthlyEquivalent(300, 'quarterly')).toBe(100)
  })

  it('monthlyEquivalent for annual', () => {
    expect(monthlyEquivalent(1200, 'annual')).toBe(100)
  })
})

describe('Amount variation', () => {
  it('detects consistent amounts', () => {
    const values = [1500, 1500, 1500, 1500]
    expect(amountVariationPercent(values)).toBe(0)
  })

  it('detects small variation', () => {
    const values = [1400, 1500, 1600, 1500]
    expect(amountVariationPercent(values)).toBeLessThan(15)
  })

  it('detects large variation', () => {
    const values = [1000, 1500, 2000, 500]
    expect(amountVariationPercent(values)).toBeGreaterThan(50)
  })

  it('describeAmountVariation returns correct descriptions', () => {
    expect(describeAmountVariation(3)).toContain('very consistent')
    expect(describeAmountVariation(10)).toContain('mostly consistent')
    expect(describeAmountVariation(25)).toContain('variable amounts')
    expect(describeAmountVariation(60)).toContain('wide amount variation')
  })
})

describe('Category inference', () => {
  it('identifies streaming services by name', () => {
    expect(inferCategory('Netflix', 'netflix')).toBe('Streaming')
    expect(inferCategory('Spotify', 'spotify premium')).toBe('Streaming')
  })

  it('identifies software services', () => {
    expect(inferCategory('GitHub', 'github subscription')).toBe('Software')
    expect(inferCategory('Adobe', 'adobe creative cloud')).toBe('Software')
    expect(inferCategory('AWS', 'aws cloud')).toBe('Software')
  })

  it('identifies utilities', () => {
    expect(inferCategory('Electricity', 'electricity bill')).toBe('Utilities')
    expect(inferCategory('Internet', 'internet fiber')).toBe('Utilities')
    expect(inferCategory('MTN', 'mobile airtime')).toBe('Utilities')
  })

  it('identifies finance services by keyword', () => {
    expect(inferCategory('PayPal', 'paypal fee')).toBe('Finance')
  })

  it('identifies health services', () => {
    expect(inferCategory('Gym', 'fitness club')).toBe('Health')
    expect(inferCategory('Pharmacy', 'drugs')).toBe('Health')
  })

  it('returns Other for unknown', () => {
    expect(inferCategory('Unknown Store', 'random purchase')).toBe('Other')
  })
})

describe('Interval estimation', () => {
  it('detects monthly intervals', () => {
    const dates = [new Date('2024-01-01'), new Date('2024-02-01'), new Date('2024-03-01'), new Date('2024-04-01')]
    const result = estimateInterval(dates)
    expect(result.detected).toBe('monthly')
    expect(result.typicalGapDays).toBe(30)
  })

  it('detects weekly intervals', () => {
    const dates = [new Date('2024-01-01'), new Date('2024-01-08'), new Date('2024-01-15'), new Date('2024-01-22')]
    const result = estimateInterval(dates)
    expect(result.detected).toBe('weekly')
    expect(result.typicalGapDays).toBe(7)
  })

  it('detects biweekly intervals', () => {
    const dates = [new Date('2024-01-01'), new Date('2024-01-15'), new Date('2024-01-29'), new Date('2024-02-12')]
    const result = estimateInterval(dates)
    expect(result.detected).toBe('biweekly')
    expect(result.typicalGapDays).toBe(14)
  })

  it('detects quarterly intervals', () => {
    const dates = [new Date('2024-01-01'), new Date('2024-04-01'), new Date('2024-07-01'), new Date('2024-10-01')]
    const result = estimateInterval(dates)
    expect(result.detected).toBe('quarterly')
    expect(result.typicalGapDays).toBe(91)
  })

  it('detects annual intervals', () => {
    const dates = [new Date('2023-01-01'), new Date('2024-01-01'), new Date('2025-01-01')]
    const result = estimateInterval(dates)
    expect(result.detected).toBe('annual')
    expect(result.typicalGapDays).toBe(365)
  })

  it('returns irregular when gaps are inconsistent', () => {
    const dates = [new Date('2024-01-01'), new Date('2024-01-05'), new Date('2024-02-20'), new Date('2024-07-01')]
    const result = estimateInterval(dates)
    expect(result.detected).toBe('irregular')
  })

  it('returns irregular for single date', () => {
    const dates = [new Date('2024-01-01')]
    const result = estimateInterval(dates)
    expect(result.detected).toBe('irregular')
  })
})

describe('Confidence scoring', () => {
  it('obvious monthly subscription with 10+ occurrences - good confidence', () => {
    const occurrences = [
      occ('2024-01-01', 1500), occ('2024-02-01', 1500), occ('2024-03-01', 1500),
      occ('2024-04-01', 1500), occ('2024-05-01', 1500), occ('2024-06-01', 1500),
      occ('2024-07-01', 1500), occ('2024-08-01', 1500), occ('2024-09-01', 1500), occ('2024-10-01', 1500),
    ]
    const evidence = computeConfidenceScore(occurrences)
    expect(evidence.frequency).toBe('monthly')
    expect(evidence.confidenceScore).toBeGreaterThanOrEqual(60)
    expect(evidence.amountConsistent).toBe(true)
  })

  it('variable monthly amounts - still detected with medium confidence', () => {
    const occurrences = [
      occ('2024-01-01', 1400), occ('2024-02-01', 1500), occ('2024-03-01', 1600),
      occ('2024-04-01', 1500), occ('2024-05-01', 1450),
    ]
    const evidence = computeConfidenceScore(occurrences)
    expect(evidence.frequency).toBe('monthly')
    expect(evidence.confidenceScore).toBeGreaterThanOrEqual(45)
    expect(evidence.band).toBe('medium')
  })

  it('weekly subscription with 10+ occurrences - high confidence', () => {
    const occurrences = Array.from({ length: 10 }, (_, i) =>
      occ(new Date(2024, 0, 1 + i * 7).toISOString().slice(0, 10), 500)
    )
    const evidence = computeConfidenceScore(occurrences)
    expect(evidence.frequency).toBe('weekly')
    expect(evidence.confidenceScore).toBeGreaterThanOrEqual(60)
  })

  it('biweekly subscription with 8+ occurrences - high confidence', () => {
    const occurrences = Array.from({ length: 8 }, (_, i) =>
      occ(new Date(2024, 0, 1 + i * 14).toISOString().slice(0, 10), 2000)
    )
    const evidence = computeConfidenceScore(occurrences)
    expect(evidence.frequency).toBe('biweekly')
    expect(evidence.confidenceScore).toBeGreaterThanOrEqual(60)
  })

  it('very irregular transactions - low confidence', () => {
    const occurrences = [
      occ('2024-01-15', 1000), occ('2024-02-20', 800), occ('2024-05-15', 1200), occ('2024-09-20', 900),
    ]
    const evidence = computeConfidenceScore(occurrences)
    expect(evidence.frequency).toBe('monthly')
    expect(evidence.confidenceScore).toBeLessThan(45)
  })

  it('one-time purchase - not detected as recurring', () => {
    const occurrences = [occ('2024-01-15', 5000)]
    const evidence = computeConfidenceScore(occurrences)
    expect(evidence.occurrences).toBe(0)
    expect(evidence.confidenceScore).toBe(0)
  })

  it('refunds - mixed directions lower confidence', () => {
    const occurrences = [
      occ('2024-01-01', 1500, true), occ('2024-02-01', 1500, true), occ('2024-03-01', -1500, false),
    ]
    const evidence = computeConfidenceScore(occurrences)
    expect(evidence.directionConsistent).toBe(false)
    expect(evidence.confidenceScore).toBeLessThan(45)
  })

  it('missing dates - gap deviation reflects irregularity', () => {
    const occurrences = [
      occ('2024-01-01', 1000), occ('2024-01-15', 1000), occ('2024-02-20', 1000), occ('2024-03-01', 1000),
    ]
    const evidence = computeConfidenceScore(occurrences)
    expect(evidence.gapDeviation).toBeGreaterThan(0)
  })

  it('duplicate transactions - still detected', () => {
    const occurrences = [
      occ('2024-01-01', 1500), occ('2024-01-01', 1500), occ('2024-02-01', 1500), occ('2024-03-01', 1500),
    ]
    const evidence = computeConfidenceScore(occurrences)
    expect(evidence.frequency).toBe('monthly')
    expect(evidence.confidenceScore).toBeGreaterThan(30)
  })

  it('quarterly subscription with 5 occurrences - good confidence', () => {
    const occurrences = [
      occ('2024-01-01', 5000), occ('2024-04-01', 5000), occ('2024-07-01', 5000),
      occ('2024-10-01', 5000), occ('2025-01-01', 5000),
    ]
    const evidence = computeConfidenceScore(occurrences)
    expect(evidence.frequency).toBe('quarterly')
    expect(evidence.confidenceScore).toBeGreaterThanOrEqual(60)
  })

  it('annual subscription with 3 occurrences - good confidence', () => {
    const occurrences = [
      occ('2023-01-01', 12000), occ('2024-01-01', 12000), occ('2025-01-01', 12000),
    ]
    const evidence = computeConfidenceScore(occurrences)
    expect(evidence.frequency).toBe('annual')
    expect(evidence.confidenceScore).toBeGreaterThanOrEqual(60)
  })

  it('credit transactions - detected with credit direction', () => {
    const occurrences = [
      occ('2024-01-01', 1000, false), occ('2024-02-01', 1000, false), occ('2024-03-01', 1000, false),
    ]
    const evidence = computeConfidenceScore(occurrences)
    expect(evidence.frequency).toBe('monthly')
    expect(evidence.directionLabel).toBe('credit')
  })

  it('confidence band thresholds', () => {
    expect(confidenceBand(30)).toBe('low')
    expect(confidenceBand(45)).toBe('medium')
    expect(confidenceBand(70)).toBe('high')
    expect(confidenceBand(100)).toBe('high')
  })

  it('score is always between 0 and 100', () => {
    const occurrences = [occ('2024-01-01', 1500), occ('2024-02-01', 1500), occ('2024-03-01', 1500)]
    const evidence = computeConfidenceScore(occurrences)
    expect(evidence.confidenceScore).toBeGreaterThanOrEqual(0)
    expect(evidence.confidenceScore).toBeLessThanOrEqual(100)
  })
})
