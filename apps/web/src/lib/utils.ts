import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  currency: 'NGN' | 'USD' | 'GBP' | string = 'NGN'
) {
  const symbols: Record<string, string> = {
    NGN: '₦',
    USD: '$',
    GBP: '£',
  }
  const symbol = symbols[currency] || currency
  return `${symbol}${amount.toLocaleString()}`
}

export function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString))
}

export function formatDateShort(dateString: string) {
  return new Intl.DateTimeFormat('en-NG', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString))
}

export function getFrequencyLabel(freq: string) {
  const labels: Record<string, string> = {
    weekly: '/wk',
    biweekly: '/2wk',
    monthly: '/mo',
    quarterly: '/qtr',
    annual: '/yr',
    irregular: '/occ',
  }
  return labels[freq] || ''
}

export function getFrequencyText(freq: string) {
  const labels: Record<string, string> = {
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    annual: 'Annual',
    irregular: 'Irregular',
  }
  return labels[freq] || 'Unknown'
}

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    active: 'Active',
    possiblyInactive: 'Possibly inactive',
    needsReview: 'Needs review',
  }
  return labels[status] || status
}

export function getConfidenceLabel(score: number) {
  if (score >= 70) return 'High'
  if (score >= 45) return 'Medium'
  return 'Low'
}
