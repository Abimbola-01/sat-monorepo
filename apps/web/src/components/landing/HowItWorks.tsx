'use client'
import { motion } from 'framer-motion'
import { Upload, Cpu, FileDown } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: Upload,
    title: 'Upload your statement',
    description:
      'Export your bank statement as PDF or CSV from your banking app. Upload it securely to SAT — takes under 30 seconds.',
  },
  {
    number: '02',
    icon: Cpu,
    title: 'AI scans every transaction',
    description:
      'Our AI reads every line, identifies recurring charges, groups duplicates, and flags subscriptions you may have forgotten.',
  },
  {
    number: '03',
    icon: FileDown,
    title: 'Get your full report',
    description:
      'See every subscription, what it costs per month, and your total annual spend. Download your report as a PDF.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-gray-950">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-emerald-400 text-sm font-medium uppercase tracking-widest">
            How it works
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-3">
            Three steps to full clarity
          </h2>
          <p className="text-gray-400 mt-4 text-lg max-w-xl mx-auto">
            No manual entry. No connecting your bank account. Just upload and go.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="glass rounded-2xl p-8 relative"
            >
              <span className="font-display text-6xl font-bold text-white/5 absolute top-6 right-6">
                {step.number}
              </span>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                <step.icon size={22} className="text-emerald-400" />
              </div>
              <h3 className="font-display text-xl font-bold text-white mb-3">
                {step.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}