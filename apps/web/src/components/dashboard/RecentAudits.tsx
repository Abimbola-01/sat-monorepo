import type { AuditResult } from "@/types"

interface RecentAuditsProps {
  audits: AuditResult[]
  limit?: number
}

export function RecentAudits({ audits, limit = 5 }: RecentAuditsProps) {
  const visibleAudits = audits.slice(0, limit)

  if (visibleAudits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
          <span className="text-gray-500 text-sm">No audits yet.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {visibleAudits.map((audit) => (
        <div
          key={audit.id}
          className="flex items-center justify-between p-4 rounded-xl bg-white/3 hover:bg-white/5 transition-colors border border-white/5"
        >
          <div>
            <p className="text-white text-sm font-medium">
              {audit.status === "processing"
                ? "Processing..."
                : audit.status === "failed"
                  ? "Audit failed"
                  : audit.totalSubscriptions + " subscriptions found"}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              {new Date(audit.createdAt).toLocaleDateString("en-NG", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
