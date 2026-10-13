'use client'
import { ShieldCheck, Lock, Trash2, UserCheck } from 'lucide-react'

const items = [
  {
    icon: Lock,
    title: 'Your data is tied to your account',
    description:
      'Transactions and subscriptions belong to the signed-in user who uploaded them. Data is isolated per account and is not shared between users.',
  },
  {
    icon: ShieldCheck,
    title: 'No bank login required',
    description:
      'Qorvi does not connect to your bank. You upload your own transaction export, so you stay in control of the data you share.',
  },
  {
    icon: UserCheck,
    title: 'Server-side validation',
    description:
      'Imports are validated on the server before anything is saved. Malformed rows are reported back to you instead of being silently ignored.',
  },
  {
    icon: Trash2,
    title: 'You can delete your data',
    description:
      'You can remove uploaded transactions, detected subscriptions, and import history from your account settings.',
  },
]

export default function PrivacySection() {
  return (
    <section id="privacy" className="py-24 bg-gray-950">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-emerald-400 text-sm font-medium uppercase tracking-widest">
            Privacy & security
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-3">
            Financial data deserves care
          </h2>
          <p className="text-gray-400 mt-4 text-lg max-w-xl mx-auto">
            Qorvi is designed around the idea that your transaction data should stay yours.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((item) => (
            <div key={item.title} className="bg-white/3 border border-white/5 rounded-2xl p-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <item.icon size={18} className="text-emerald-400" />
              </div>
              <h3 className="font-display text-white font-semibold text-base mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 max-w-3xl mx-auto text-center">
          <p className="text-amber-300 text-sm leading-relaxed">
            Qorvi helps you understand your spending patterns. It does not provide
            financial advice, and detection results are estimates based on the transaction
            data you upload.
          </p>
        </div>
      </div>
    </section>
  )
}
