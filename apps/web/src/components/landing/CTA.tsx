'use client'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function CTA() {
  return (
    <section className="py-24 bg-gray-950">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <div className="bg-white/3 border border-white/5 rounded-2xl p-10">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
            Ready to see where your
            <br />
            money is going?
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            Start with a free account and upload a transaction CSV. Qorvi will help you
            find recurring payments and subscriptions you may want to review.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold rounded-xl transition-all duration-200"
          >
            Start Auditing
            <ArrowRight size={18} />
          </Link>
          <p className="mt-6 text-gray-500 text-sm">
            Free account available. No bank login required.
          </p>
        </div>
      </div>
    </section>
  )
}
