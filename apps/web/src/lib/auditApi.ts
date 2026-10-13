import api from './api'

export const auditApi = {
  getReport: (token: string) =>
    api.get('/audit', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getSummary: (token: string) =>
    api.get('/audit/summary', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getCategories: (token: string) =>
    api.get('/audit/categories', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getMerchants: (token: string, categoryId?: string) =>
    api.get('/audit/merchants' + (categoryId ? `?category=${categoryId}` : ''), {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getMerchantAliases: (token: string, merchantId: string) =>
    api.get(`/audit/merchants/${merchantId}/aliases`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  createMerchant: (body: Record<string, unknown>, token: string) =>
    api.post('/audit/merchants', body, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }),

  addMerchantAlias: (merchantId: string, body: Record<string, unknown>, token: string) =>
    api.post(`/audit/merchants/${merchantId}/aliases`, body, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }),

  getTransactionMatch: (transactionId: string, token: string) =>
    api.get(`/audit/transactions/${transactionId}/match`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  correctTransaction: (transactionId: string, body: Record<string, unknown>, token: string) =>
    api.post(`/audit/transactions/${transactionId}/correct`, body, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    }),

  getReviewItems: (token: string) =>
    api.get('/audit/review-items', {
      headers: { Authorization: `Bearer ${token}` },
    }),
}
