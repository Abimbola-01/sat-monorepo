'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function CTA() {
  return (
    <section className="py-24 bg-gray-950">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass rounded-3xl p-12 border border-emerald-500/20"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            Ready to see where your
            <br />
            <span className="gradient-text">money is going?</span>
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
            Run your first audit free. No credit card. No connecting your bank.
            Just upload and find out.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold rounded-xl transition-all duration-200 hover:scale-105 glow-emerald"
          >
            Run your free audit now
            <ArrowRight size={18} />
          </Link>
          <p className="mt-6 text-gray-600 text-sm">
            Takes 60 seconds · Free forever plan available
          </p>
        </motion.div>
      </div>
    </section>
  )
}