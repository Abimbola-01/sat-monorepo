import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type StatVariant = 'success' | 'info' | 'warning' | 'danger'

interface StatsCardProps {
  label: string
  value: string
  trend?: string
  icon: LucideIcon
  variant?: StatVariant
}

const variantStyles: Record<StatVariant, { text: string; bg: string; border: string }> = {
  success: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  info: { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  warning: { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  danger: { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
}

export function StatsCard({ label, value, trend, icon: Icon, variant = 'info' }: StatsCardProps) {
  const styles = variantStyles[variant]

  return (
    <div className={cn('rounded-xl p-5 border', styles.bg, styles.border)}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-400 text-sm">{label}</span>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', styles.bg)}>
          <Icon size={16} className={styles.text} />
        </div>
      </div>
      <p className={cn('font-display text-2xl font-bold', styles.text)}>{value}</p>
      {trend && <p className="text-gray-500 text-xs mt-1">{trend}</p>}
    </div>
  )
}
