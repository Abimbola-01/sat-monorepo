'use client'
import { Table2, RefreshCw, Calendar, Receipt, Lightbulb, ShieldCheck } from 'lucide-react'

const features = [
  {
    icon: Table2,
    title: 'Transaction import',
    description:
      'Upload a CSV export from your bank. Qorvi validates columns, checks rows, and reports anything it cannot parse before saving.',
  },
  {
    icon: RefreshCw,
    title: 'Recurring payment detection',
    description:
      'Rule-based detection looks for repeated charges with similar merchants and amounts, then estimates how often they occur.',
  },
  {
    icon: Calendar,
    title: 'Monthly and yearly cost view',
    description:
      'See what each detected subscription costs per month and per year, based on the frequency Qorvi detected.',
  },
  {
    icon: Receipt,
    title: 'Subscription dashboard',
      description:
      'Review detected subscriptions in one place, with the last payment date and an estimated next payment date.',
  },
  {
    icon: Lightbulb,
    title: 'Savings opportunities',
    description:
      'Spot subscriptions you may have forgotten or no longer use, and see where review could reduce repeat spending.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy-first design',
    description:
      'Your financial data is tied to your account, isolated from other users, and never used to connect to your bank.',
  },
]

export default function Features() {
  return (
    <section className="py-24 bg-gray-900/30">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-emerald-400 text-sm font-medium uppercase tracking-widest">
            What Qorvi helps you see
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-3">
            From raw transactions to clear subscriptions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="bg-white/3 border border-white/5 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <feature.icon size={18} className="text-emerald-400" />
              </div>
              <h3 className="font-display font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
