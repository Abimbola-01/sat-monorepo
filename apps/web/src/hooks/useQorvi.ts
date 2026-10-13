'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import {
  transactionsApi,
  subscriptionsApi,
  importsApi,
  insightsApi,
  dashboardApi,
  settingsApi,
  auditApi,
} from '@/lib/api'
import { auditApi as auditApiClient } from '@/lib/auditApi'
import type {
  Transaction,
  Subscription,
  Import,
  Insights,
  DashboardMetrics,
  ImportPreview,
} from '@/types'

// ── Token helper ──────────────────────────────────────────────────────────
async function getTokenOrFail(getToken: () => Promise<string | null>, ERR: string) {
  const token = await getToken()
  if (!token) throw new Error(ERR)
  return token
}

// ── Imports ───────────────────────────────────────────────────────────────
export interface UseImportsState {
  imports: Import[]
  isLoading: boolean
  error: string | null
}

export function useImports() {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [state, setState] = useState<UseImportsState>({
    imports: [],
    isLoading: true,
    error: null,
  })

  const fetchImports = useCallback(async () => {
    try {
      const token = await getTokenOrFail(getToken, 'You must be signed in.')
      const res = await importsApi.list(token)
      setState({ imports: res.data as Import[], isLoading: false, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load imports.'
      setState((prev) => ({ ...prev, isLoading: false, error: message }))
    }
  }, [getToken])

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setState({ imports: [], isLoading: false, error: 'You must be signed in.' })
      return
    }
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    fetchImports()
  }, [isLoaded, isSignedIn, fetchImports])

  return { imports: state.imports, isLoading: state.isLoading, error: state.error, refetch: fetchImports }
}

export interface UseImportPreviewState {
  preview: ImportPreview | null
  isLoading: boolean
  error: string | null
}

export function useImportPreview() {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [state, setState] = useState<UseImportPreviewState>({
    preview: null,
    isLoading: false,
    error: null,
  })
  const inFlight = useRef<string | null>(null)

  const preview = useCallback(
    async (formData: FormData) => {
      if (!isLoaded || !isSignedIn) {
        setState((prev) => ({ ...prev, error: 'You must be signed in.' }))
        return
      }

      const token = await getTokenOrFail(getToken, 'You must be signed in.')
      setState((prev) => ({ ...prev, isLoading: true, error: null, preview: null }))
      inFlight.current = token

      try {
        const res = await importsApi.preview(formData, token)
        setState({ preview: res.data?.preview ?? null, isLoading: false, error: null })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to preview CSV.'
        setState({ preview: null, isLoading: false, error: message })
      } finally {
        if (inFlight.current === token) inFlight.current = null
      }
    },
    [getToken, isLoaded, isSignedIn]
  )

  return { ...state, preview }
}

export interface ConfirmImportResult {
  ok: boolean
  importId?: string
  error?: string
}

export function useConfirmImport() {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const inFlight = useRef<string | null>(null)

  const confirm = useCallback(
    async (
      args: {
        importId: string
        originalFilename: string
        suggestedMapping: Record<string, string>
        validRows: Array<{ transactionDate: string; description: string; amount: number; currency: string; type: string }>
        invalidRows: Array<{ rowIndex: number; reason: string }>
        chosenCurrency?: string
      },
      signal?: AbortSignal
    ): Promise<ConfirmImportResult> => {
      if (!isLoaded || !isSignedIn) return { ok: false, error: 'You must be signed in.' }

      if (signal?.aborted) return { ok: false, error: 'Cancelled' }

      const token = await getTokenOrFail(getToken, 'You must be signed in.')
      inFlight.current = token

      try {
        const res = await importsApi.confirm(
          {
            importId: args.importId,
            originalFilename: args.originalFilename,
            suggestedMapping: args.suggestedMapping,
            validRows: args.validRows,
            invalidRows: args.invalidRows,
            chosenCurrency: args.chosenCurrency || 'NGN',
          },
          token
        )
        return { ok: true, importId: res.data?.importId }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save import.'
        return { ok: false, error: message }
      } finally {
        if (inFlight.current === token) inFlight.current = null
      }
    },
    [getToken, isLoaded, isSignedIn]
  )

  return confirm
}

// ── Transactions ──────────────────────────────────────────────────────────
export interface UseTransactionsState {
  transactions: Transaction[]
  total: number
  isLoading: boolean
  error: string | null
}

export function useTransactions(limit = 200) {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [state, setState] = useState<UseTransactionsState>({
    transactions: [],
    total: 0,
    isLoading: true,
    error: null,
  })

  const fetchTransactions = useCallback(
    async (offset = 0) => {
      try {
        const token = await getTokenOrFail(getToken, 'You must be signed in.')
        const res = await transactionsApi.list(token, { limit, offset })
        setState({
          transactions: res.data.transactions as Transaction[],
          total: res.data.total as number,
          isLoading: false,
          error: null,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load transactions.'
        setState((prev) => ({ ...prev, isLoading: false, error: message }))
      }
    },
    [getToken, limit]
  )

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setState({ transactions: [], total: 0, isLoading: false, error: 'You must be signed in.' })
      return
    }
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    fetchTransactions()
  }, [isLoaded, isSignedIn, fetchTransactions])

  return { ...state, refetch: fetchTransactions }
}

// ── Subscriptions ─────────────────────────────────────────────────────────
export interface UseSubscriptionsState {
  subscriptions: Subscription[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useSubscriptions() {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [state, setState] = useState<UseSubscriptionsState>({
    subscriptions: [],
    isLoading: true,
    error: null,
    refetch: async () => {},
  })

  const fetchSubscriptions = useCallback(async () => {
    try {
      const token = await getTokenOrFail(getToken, 'You must be signed in.')
      const res = await subscriptionsApi.list(token)
      setState({
        subscriptions: res.data as Subscription[],
        isLoading: false,
        error: null,
        refetch: fetchSubscriptions,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load subscriptions.'
      setState((prev) => ({ ...prev, isLoading: false, error: message, refetch: fetchSubscriptions }))
    }
  }, [getToken])

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setState({ subscriptions: [], isLoading: false, error: 'You must be signed in.', refetch: fetchSubscriptions })
      return
    }
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    fetchSubscriptions()
  }, [isLoaded, isSignedIn, fetchSubscriptions])

  return state
}

// ── Insights ──────────────────────────────────────────────────────────────
export interface UseInsightsState {
  insights: Insights | null
  isLoading: boolean
  error: string | null
}

export function useInsights() {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [state, setState] = useState<UseInsightsState>({ insights: null, isLoading: true, error: null })

  const fetchInsights = useCallback(async () => {
    try {
      const token = await getTokenOrFail(getToken, 'You must be signed in.')
      const res = await insightsApi.get(token)
      setState({ insights: res.data as Insights, isLoading: false, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load insights.'
      setState((prev) => ({ ...prev, isLoading: false, error: message }))
    }
  }, [getToken])

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setState({ insights: null, isLoading: false, error: 'You must be signed in.' })
      return
    }
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    fetchInsights()
  }, [isLoaded, isSignedIn, fetchInsights])

  return { ...state, refetch: fetchInsights }
}

// ── Dashboard ─────────────────────────────────────────────────────────────
export interface UseDashboardState {
  metrics: DashboardMetrics | null
  isLoading: boolean
  error: string | null
}

export function useDashboard() {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [state, setState] = useState<UseDashboardState>({ metrics: null, isLoading: true, error: null })

  const fetchDashboard = useCallback(async () => {
    try {
      const token = await getTokenOrFail(getToken, 'You must be signed in.')
      const res = await dashboardApi.get(token)
      setState({ metrics: res.data as DashboardMetrics, isLoading: false, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load dashboard.'
      setState((prev) => ({ ...prev, isLoading: false, error: message }))
    }
  }, [getToken])

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setState({ metrics: null, isLoading: false, error: 'You must be signed in.' })
      return
    }
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    fetchDashboard()
  }, [isLoaded, isSignedIn, fetchDashboard])

  return { ...state, refetch: fetchDashboard }
}

// ── Settings ──────────────────────────────────────────────────────────────
export interface UseSettingsState {
  settings: {
    userId: string
    email: string
    name: string
    currency: string
    timezone: string
    preferences: Record<string, unknown>
    createdAt: string
  } | null
  isLoading: boolean
  error: string | null
}

export function useSettings() {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [state, setState] = useState<UseSettingsState>({ settings: null, isLoading: true, error: null })

  const fetchSettings = useCallback(async () => {
    try {
      const token = await getTokenOrFail(getToken, 'You must be signed in.')
      const res = await settingsApi.get(token)
      setState({ settings: res.data as any, isLoading: false, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load settings.'
      setState((prev) => ({ ...prev, isLoading: false, error: message }))
    }
  }, [getToken])

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setState({ settings: null, isLoading: false, error: 'You must be signed in.' })
      return
    }
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    fetchSettings()
  }, [isLoaded, isSignedIn, fetchSettings])

  return { ...state, refetch: fetchSettings }
}

// ── Audit ──────────────────────────────────────────────────────────────────
export interface UseAuditState {
  report: import('@/types').AuditReport | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAudit() {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [state, setState] = useState<UseAuditState>({
    report: null,
    isLoading: true,
    error: null,
    refetch: async () => {},
  })

  const fetchAudit = useCallback(async () => {
    try {
      const token = await getTokenOrFail(getToken, 'You must be signed in.')
      const res = await auditApiClient.getReport(token)
      setState({
        report: res.data as import('@/types').AuditReport,
        isLoading: false,
        error: null,
        refetch: fetchAudit,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load audit.'
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
        refetch: fetchAudit,
      }))
    }
  }, [getToken])

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setState({ report: null, isLoading: false, error: 'You must be signed in.', refetch: fetchAudit })
      return
    }
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    fetchAudit()
  }, [isLoaded, isSignedIn, fetchAudit])

  return state
}

// ── Merchant categories ────────────────────────────────────────────────────
export interface UseCategoriesState {
  categories: import('@/types').MerchantCategory[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCategories() {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [state, setState] = useState<UseCategoriesState>({
    categories: [],
    isLoading: true,
    error: null,
    refetch: async () => {},
  })

  const fetchCategories = useCallback(async () => {
    try {
      const token = await getTokenOrFail(getToken, 'You must be signed in.')
      const res = await auditApiClient.getCategories(token)
      setState({
        categories: res.data as import('@/types').MerchantCategory[],
        isLoading: false,
        error: null,
        refetch: fetchCategories,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load categories.'
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: message,
        refetch: fetchCategories,
      }))
    }
  }, [getToken])

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setState({ categories: [], isLoading: false, error: 'You must be signed in.', refetch: fetchCategories })
      return
    }
    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    fetchCategories()
  }, [isLoaded, isSignedIn, fetchCategories])

  return state
}
