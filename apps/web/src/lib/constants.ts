export const APP_NAME = 'SAT'
export const APP_DESCRIPTION = 'Subscription Audit Tool'

export const PLANS = {
  FREE: 'free',
  BASIC: 'basic',
  PRO: 'pro',
} as const

export const SUPPORTED_FILE_TYPES = [
  'application/pdf',
  'text/csv',
]

export const MAX_FILE_SIZE_MB = 10