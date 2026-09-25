'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { auditApi } from '@/lib/api'
import type { AuditResult } from '@/types'

const POLL_INTERVAL_MS = 3000

interface UseAuditState {
  audit: AuditResult | null
  isLoading: boolean
  error: string | null
}

/**
 * Fetches a single audit by ID. If the audit is still `processing`,
 * polls until it reaches `complete` or `failed`.
 */
export function useAudit(auditId: string | null) {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [state, setState] = useState<UseAuditState>({
    audit: null,
    isLoading: true,
    error: null,
  })
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchAudit = useCallback(async () => {
    if (!auditId) {
      setState({ audit: null, isLoading: false, error: null })
      return
    }

    try {
      const token = await getToken()
      if (!token) {
        setState({ audit: null, isLoading: false, error: 'You must be signed in.' })
        return
      }

      const res = await auditApi.getAudit(auditId, token)
      const audit = res.data as AuditResult

      setState({ audit, isLoading: false, error: null })

      if (audit.status === 'processing') {
        if (!pollRef.current) {
          pollRef.current = setInterval(fetchAudit, POLL_INTERVAL_MS)
        }
      } else if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load audit.'
      setState({ audit: null, isLoading: false, error: message })
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [auditId, getToken])

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setState({ audit: null, isLoading: false, error: 'You must be signed in.' })
      return
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    fetchAudit()

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [isLoaded, isSignedIn, fetchAudit])

  return {
    audit: state.audit,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchAudit,
  }
}

interface UseAuditsState {
  audits: AuditResult[]
  isLoading: boolean
  error: string | null
}

/**
 * Fetches the signed-in user's full audit history, most recent first.
 */
export function useAudits() {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [state, setState] = useState<UseAuditsState>({
    audits: [],
    isLoading: true,
    error: null,
  })

  const fetchAudits = useCallback(async () => {
    try {
      const token = await getToken()
      if (!token) {
        setState({ audits: [], isLoading: false, error: 'You must be signed in.' })
        return
      }

      const res = await auditApi.getUserAudits(token)
      const audits = (res.data as AuditResult[]).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      setState({ audits, isLoading: false, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load audits.'
      setState({ audits: [], isLoading: false, error: message })
    }
  }, [getToken])

  useEffect(() => {
    if (!isLoaded) return
    if (!isSignedIn) {
      setState({ audits: [], isLoading: false, error: 'You must be signed in.' })
      return
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }))
    fetchAudits()
  }, [isLoaded, isSignedIn, fetchAudits])

  return {
    audits: state.audits,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchAudits,
  }
}
