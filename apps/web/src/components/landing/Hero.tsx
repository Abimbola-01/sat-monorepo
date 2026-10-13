'use client'
import Link from 'next/link'
import { Receipt, ShieldCheck, ArrowRight } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-950">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vh] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center pt-24 pb-20">
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-8">
          <Receipt size={14} />
          Subscription & recurring payment auditor
        </span>

        <h1 className="font-display text-5xl md:text-6xl font-bold text-white leading-tight mb-6 tracking-tight">
          See More. Spend Less.
        </h1>

        <p className="text-gray-300 text-xl md:text-2xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Find the subscriptions, recurring payments and forgotten expenses quietly
          draining your money.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold rounded-xl transition-all duration-200"
          >
            Start Auditing
            <ArrowRight size={18} />
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all duration-200 border border-white/10"
          >
            <ShieldCheck size={18} className="text-emerald-400" />
            See How It Works
          </Link>
        </div>

        <p className="mt-8 text-gray-500 text-sm">
          No credit card required to start. Your statements stay on your account.
        </p>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          {[
            {
              title: 'Upload your own data',
              description:
                'Export a transaction CSV from your bank and upload it. We never ask for bank logins.',
            },
            {
              title: 'We find recurring charges',
              description:
                'Qorvi looks for payments that repeat with similar amounts and intervals, then groups them for you.',
            },
            {
              title: 'You decide what to do',
              description:
                'Review detected subscriptions, see monthly and yearly costs, and spot ones you may have forgotten.',
            },
          ].map((item) => (
            <div key={item.title} className="bg-white/3 border border-white/5 rounded-2xl p-6">
              <h3 className="font-display text-white font-semibold text-base mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
