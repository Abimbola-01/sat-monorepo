import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { pool } from '../config/database'

const router = Router()

// ── GET /api/report/:reportId/download ────────────────────
// reportId is the audit's own id — there's no separate "report" entity,
// the PDF is generated once per audit and its storage URL lives on the
// audits.report_url column.
router.get('/:reportId/download', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { reportId } = req.params

    const result = await pool.query(
      'SELECT report_url, file_name, status FROM audits WHERE id = $1 AND user_id = $2',
      [reportId, req.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Audit not found' })
    }

    const { report_url: reportUrl, file_name: fileName, status } = result.rows[0]

    if (status !== 'complete') {
      return res.status(409).json({ message: 'Report is not ready yet' })
    }

    if (!reportUrl) {
      return res.status(404).json({
        message: 'No report was generated for this audit',
      })
    }

    // Fetch the stored PDF server-side and stream it back, rather than
    // redirecting — keeps the download authenticated through our own API
    // and gives us control over the response headers (filename, type).
    const fileResponse = await fetch(reportUrl)

    if (!fileResponse.ok || !fileResponse.body) {
      return res.status(502).json({ message: 'Failed to retrieve report file' })
    }

    const safeName = (fileName || 'statement').replace(/[^a-zA-Z0-9._-]/g, '_')

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="subscription-audit-report-${safeName}.pdf"`
    )

    const buffer = Buffer.from(await fileResponse.arrayBuffer())
    return res.send(buffer)
  } catch (error) {
    console.error('Report download error:', error)
    return res.status(500).json({ message: 'Failed to download report' })
  }
})

export default router
