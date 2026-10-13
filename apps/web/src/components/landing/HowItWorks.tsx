'use client'
import Link from 'next/link'
import { Upload, Search, Table, TrendingDown, ShieldCheck, FileQuestion } from 'lucide-react'

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-gray-950">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-emerald-400 text-sm font-medium uppercase tracking-widest">
            How Qorvi works
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-3">
            Four steps from statement to clarity
          </h2>
          <p className="text-gray-400 mt-4 text-lg max-w-xl mx-auto">
            You upload your own transaction data. Qorvi parses it, finds recurring
            patterns, and presents what it found for you to review.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {[
            {
              step: '01',
              icon: Upload,
              title: 'Export a transaction CSV',
              description:
                'Download a transaction export from your bank or payment app. Qorvi accepts standard CSV files and can be extended to support more bank formats over time.',
            },
            {
              step: '02',
              icon: Search,
              title: 'Upload and preview',
              description:
                'Upload the file and Qorvi will show you a preview of the columns it found. You can confirm the mapping before anything is saved.',
            },
            {
              step: '03',
              icon: Table,
              title: 'Review your transactions',
              description:
                'Qorvi parses and validates the rows, then shows your transactions in a list. Problematic rows are reported so you can fix them.',
            },
            {
              step: '04',
              icon: TrendingDown,
              title: 'See detected subscriptions',
              description:
                'Qorvi looks for recurring payment patterns and shows likely subscriptions with estimated monthly and yearly costs. You stay in control of what is kept.',
            },
          ].map((item) => (
            <div key={item.step} className="bg-white/3 border border-white/5 rounded-2xl p-6">
              <span className="font-display text-5xl font-bold text-white/5">{item.step}</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <item.icon size={20} className="text-emerald-400" />
              </div>
              <h3 className="font-display text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/3 border border-white/5 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <FileQuestion size={20} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display text-white font-semibold text-base mb-1">
                  What Qorvi does not do
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  In this first version, Qorvi does not connect to your bank account and
                  does not move money. It only analyses the transaction file you choose to
                  upload. Detection is rule-based, not AI-made financial decisions.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/3 border border-white/5 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck size={20} className="text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display text-white font-semibold text-base mb-1">
                  Your data stays with you
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Your transactions are tied to your account and isolated from other users.
                  Uploaded files are processed securely and are not shared. You can delete
                  your data from settings at any time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
