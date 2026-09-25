export interface User {
  id: string
  email: string
  name: string
  plan: 'free' | 'basic' | 'pro'
  createdAt: string
}

export interface Subscription {
  id: string
  name: string
  amount: number
  currency: 'NGN' | 'USD' | 'GBP'
  frequency: 'monthly' | 'quarterly' | 'annual'
  category: 'streaming' | 'software' | 'finance' | 'utilities' | 'other'
  lastCharged: string
  nextCharge?: string
  active: boolean
  logoUrl?: string
}

export interface AuditResult {
  id: string
  userId: string
  createdAt: string
  totalSubscriptions: number
  totalMonthlySpend: number
  potentialSavings: number
  subscriptions: Subscription[]
  duplicates: Subscription[][]
  unusedCount: number
  reportUrl?: string
  status: 'processing' | 'complete' | 'failed'
}

export interface PricingPlan {
  id: string
  name: string
  price: { ngn: number; usd: number }
  interval: 'month' | 'year'
  features: string[]
  highlighted?: boolean
  auditsPerMonth: number
}

export interface UploadStatus {
  stage: 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error'
  progress: number
  message: string
}