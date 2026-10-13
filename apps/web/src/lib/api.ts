import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
  timeout: 30000,
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong'
    return Promise.reject(new Error(message))
  }
)

// ── Imports ─────────────────────────────────────────────────────────────────
export const importsApi = {
  preview: (formData: FormData, token: string) =>
    api.post('/imports/upload', formData, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  confirm: (body: Record<string, unknown>, token: string) =>
    api.post('/imports/confirm', body, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }),

  cancel: (importId: string, token: string) =>
    api.post(`/imports/${importId}/cancel`, undefined, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  list: (token: string) =>
    api.get('/imports', {
      headers: { Authorization: `Bearer ${token}` },
    }),
}

// ── Transactions ────────────────────────────────────────────────────────────
export const transactionsApi = {
  list: (token: string, params?: { limit?: number; offset?: number }) =>
    api.get('/transactions', {
      headers: { Authorization: `Bearer ${token}` },
      params,
    }),

  clear: (token: string) =>
    api.delete('/transactions', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  delete: (id: string, token: string) =>
    api.delete(`/transactions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
}

// ── Subscriptions ───────────────────────────────────────────────────────────
export const subscriptionsApi = {
  list: (token: string) =>
    api.get('/subscriptions', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  detect: (token: string) =>
    api.post('/subscriptions/detect', undefined, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  confirm: (id: string, token: string) =>
    api.post(`/subscriptions/${id}/confirm`, undefined, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  dismiss: (id: string, token: string) =>
    api.post(`/subscriptions/${id}/dismiss`, undefined, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  update: (id: string, body: Record<string, unknown>, token: string) =>
    api.patch(`/subscriptions/${id}`, body, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }),

  markInactive: (id: string, token: string) =>
    api.post(`/subscriptions/${id}/inactive`, undefined, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  delete: (id: string, token: string) =>
    api.delete(`/subscriptions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
}

// ── Insights ────────────────────────────────────────────────────────────────
export const insightsApi = {
  get: (token: string) =>
    api.get('/insights', {
      headers: { Authorization: `Bearer ${token}` },
    }),
}

// ── Dashboard ──────────────────────────────────────────────────────────────
export const dashboardApi = {
  get: (token: string) =>
    api.get('/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    }),
}

// ── Settings ────────────────────────────────────────────────────────────────
export const settingsApi = {
  get: (token: string) =>
    api.get('/settings', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  patch: (body: Record<string, unknown>, token: string) =>
    api.patch('/settings', body, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }),

  clearData: (token: string) =>
    api.delete('/settings/data', {
      headers: { Authorization: `Bearer ${token}` },
    }),
}

// ── Audit (legacy reporting pages) ─────────────────────────────────────────
export const auditApi = {
  getAudit: (id: string, token: string) =>
    api.get('/audits/' + id, {
      headers: { Authorization: 'Bearer ' + token },
    }),
  getUserAudits: (token: string) =>
    api.get('/audits', {
      headers: { Authorization: 'Bearer ' + token },
    }),
  downloadReport: (id: string, token: string) =>
    api.get('/report/' + id + '/download', {
      responseType: 'blob',
      headers: { Authorization: 'Bearer ' + token },
    }),
}

export default api
