import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  currency: 'NGN' | 'USD' | 'GBP' = 'NGN'
) {
  const symbols: Record<string, string> = {
    NGN: '₦',
    USD: '$',
    GBP: '£',
  }
  return `${symbols[currency]}${amount.toLocaleString()}`
}

export function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString))
}

export function getFrequencyLabel(freq: string) {
  const labels: Record<string, string> = {
    monthly: '/mo',
    quarterly: '/qtr',
    annual: '/yr',
  }
  return labels[freq] || ''
}