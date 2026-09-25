import Link from 'next/link'
import { auth, currentUser } from '@clerk/nextjs/server'
import {
  TrendingDown,
  CreditCard,
  AlertCircle,
  FileSearch,
  Upload,
  ArrowRight,
  Clock,
} from 'lucide-react'

const stats = [
  {
    label: 'Monthly spend found',
    value: '₦47,200',
    icon: CreditCard,
    trend: 'Across 14 subscriptions',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  {
    label: 'Potential savings',
    value: '₦12,800',
    icon: TrendingDown,
    trend: 'Cancel 3 unused plans',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
  },
  {
    label: 'Active subscriptions',
    value: '14',
    icon: FileSearch,
    trend: '2 duplicates detected',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    label: 'Alerts',
    value: '3',
    icon: AlertCircle,
    trend: 'Price increases found',
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
  },
]

const recentAudits = [
  {
    id: '1',
    bank: 'GTBank Statement',
    date: 'Jun 20, 2026',
    subscriptions: 14,
    savings: '₦12,800',
    status: 'complete',
  },
  {
    id: '2',
    bank: 'Access Bank Statement',
    date: 'May 15, 2026',
    subscriptions: 11,
    savings: '₦8,400',
    status: 'complete',
  },
  {
    id: '3',
    bank: 'Zenith Bank Statement',
    date: 'Apr 3, 2026',
    subscriptions: 9,
    savings: '₦5,200',
    status: 'complete',
  },
]

export default async function DashboardPage() {
  const user = await currentUser()
  const firstName = user?.firstName || 'there'

  return (
    <div className="space-y-8 max-w-6xl">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">
            Hey, {firstName} 👋
          </h1>
          <p className="text-gray-400 mt-1">
            Here's what your subscriptions look like this month.
          </p>
        </div>
        <Link
          href="/upload"
          className="hidden md:inline-flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm rounded-xl transition-all duration-200"
        >
          <Upload size={16} />
          New audit
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-xl p-5 border ${stat.bg} ${stat.border}`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm">{stat.label}</span>
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon size={16} className={stat.color} />
              </div>
            </div>
            <p className={`font-display text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </p>
            <p className="text-gray-500 text-xs mt-1">{stat.trend}</p>
          </div>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent audits — takes 2 columns */}
        <div className="lg:col-span-2 bg-gray-900 border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg font-bold text-white">
              Recent Audits
            </h2>
            <Link
              href="/report"
              className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors flex items-center gap-1"
            >
              View all
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            {recentAudits.map((audit) => (
              <div
                key={audit.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/3 hover:bg-white/5 transition-colors border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <FileSearch size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {audit.bank}
                    </p>
                    <p className="text-gray-500 text-xs flex items-center gap-1 mt-0.5">
                      <Clock size={10} />
                      {audit.date}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 text-sm font-semibold">
                    {audit.savings} saved
                  </p>
                  <p className="text-gray-500 text-xs">
                    {audit.subscriptions} subs found
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions — takes 1 column */}
        <div className="space-y-4">

          {/* Run new audit card */}
          <div className="bg-gray-900 border border-white/5 rounded-2xl p-6">
            <h2 className="font-display text-lg font-bold text-white mb-2">
              Run a new audit
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Upload a fresh bank statement to find new subscriptions.
            </p>
            <Link
              href="/upload"
              className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm rounded-xl transition-all duration-200"
            >
              <Upload size={16} />
              Upload statement
            </Link>
          </div>

          {/* Savings tip card */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-amber-400" />
              <h3 className="font-display font-semibold text-white text-sm">
                Savings tip
              </h3>
            </div>
            <p className="text-gray-400 text-sm">
              You have 2 duplicate streaming subscriptions. Cancelling one
              could save you <span className="text-amber-400 font-semibold">₦4,200/month</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}