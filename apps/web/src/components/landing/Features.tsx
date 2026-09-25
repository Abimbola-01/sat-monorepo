'use client'
import { motion } from 'framer-motion'
import { ScanSearch, Copy, TrendingDown, FileText, Bell, ShieldCheck } from 'lucide-react'

const features = [
  {
    icon: ScanSearch,
    title: 'Deep transaction scanning',
    description: 'Reads every line of your statement and identifies subscription patterns other tools miss.',
  },
  {
    icon: Copy,
    title: 'Duplicate detection',
    description: "Flags when you're paying for the same service twice — a surprisingly common problem.",
  },
  {
    icon: TrendingDown,
    title: 'Savings calculator',
    description: 'Shows your exact monthly and annual spend, and how much you could save by cancelling unused plans.',
  },
  {
    icon: FileText,
    title: 'PDF report',
    description: 'Download a clean, shareable PDF breakdown of every subscription found in your statement.',
  },
  {
    icon: Bell,
    title: 'Price increase alerts',
    description: 'Compares your charges over time and flags when a subscription quietly raised its price.',
  },
  {
    icon: ShieldCheck,
    title: 'Bank-level security',
    description: 'Your statement is encrypted in transit and at rest. Deleted from our servers after analysis.',
  },
]

export default function Features() {
  return (
    <section className="py-24 bg-gray-900/50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-emerald-400 text-sm font-medium uppercase tracking-widest">
            Features
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-3">
            Everything you need to stop overpaying
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="glass rounded-xl p-6 hover:bg-white/8 transition-colors duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <feature.icon size={18} className="text-emerald-400" />
              </div>
              <h3 className="font-display font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}