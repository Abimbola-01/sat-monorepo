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

export const auditApi = {
  uploadStatement: (formData: FormData, token: string) =>
    api.post('/audit/upload', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }),

  getAudit: (auditId: string, token: string) =>
    api.get(`/audit/${auditId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getUserAudits: (token: string) =>
    api.get('/audit', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  downloadReport: (reportId: string, token: string) =>
    api.get(`/report/${reportId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob',
    }),
}

export const paymentApi = {
  initializePaystack: (planId: string, token: string) =>
    api.post(
      '/payment/paystack/initialize',
      { planId },
      { headers: { Authorization: `Bearer ${token}` } }
    ),

  initializeStripe: (planId: string, token: string) =>
    api.post(
      '/payment/stripe/initialize',
      { planId },
      { headers: { Authorization: `Bearer ${token}` } }
    ),
}

export default api 