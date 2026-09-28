import { Router, Response } from 'express'
import { requireAuth, AuthRequest } from '../middleware/auth'
import { pool, supabase } from '../config/database'

const router = Router()

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ── GET /api/report/:reportId/download ────────────────────
// reportId is the audit's own id — there's no separate "report" entity.
// The PDF lives in the private "reports" bucket; ownership is checked
// against the audits table before anything is read from storage.
router.get('/:reportId/download', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { reportId } = req.params

    if (!UUID_PATTERN.test(reportId)) {
      return res.status(404).json({ message: 'Audit not found' })
    }

    const result = await pool.query(
      'SELECT report_path, file_name, status FROM audits WHERE id = $1 AND user_id = $2',
      [reportId, req.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Audit not found' })
    }

    const { report_path: reportPath, file_name: fileName, status } = result.rows[0]

    if (status !== 'complete') {
      return res.status(409).json({ message: 'Report is not ready yet' })
    }

    if (!reportPath) {
      return res.status(404).json({
        message: 'No report was generated for this audit',
      })
    }

    const { data, error } = await supabase.storage
      .from('reports')
      .download(reportPath)

    if (error || !data) {
      console.error('Report download from storage failed:', error)
      return res.status(502).json({ message: 'Failed to retrieve report file' })
    }

    const safeName = (fileName || 'statement').replace(/[^a-zA-Z0-9._-]/g, '_')

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="subscription-audit-report-${safeName}.pdf"`
    )

    const buffer = Buffer.from(await data.arrayBuffer())
    return res.send(buffer)
  } catch (error) {
    console.error('Report download error:', error)
    return res.status(500).json({ message: 'Failed to download report' })
  }
})

export default router
