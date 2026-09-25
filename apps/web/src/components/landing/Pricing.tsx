'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

const plans = [
  {
    name: 'Free',
    priceNGN: 0,
    priceUSD: 0,
    description: 'Try it once, see what you find.',
    features: ['1 audit per month', 'Up to 3 months of statements', 'Basic subscription list', 'Email support'],
    cta: 'Start for free',
    href: '/sign-up',
    highlighted: false,
  },
  {
    name: 'Basic',
    priceNGN: 2500,
    priceUSD: 3,
    description: 'For individuals serious about their spending.',
    features: ['5 audits per month', 'Up to 12 months of statements', 'Full PDF report', 'Duplicate detection', 'Savings calculator', 'Priority support'],
    cta: 'Get Basic',
    href: '/sign-up?plan=basic',
    highlighted: true,
  },
  {
    name: 'Pro',
    priceNGN: 6000,
    priceUSD: 7,
    description: 'For power users and small businesses.',
    features: ['Unlimited audits', 'All statement history', 'Price increase alerts', 'Cheaper alternative suggestions', 'API access', 'Dedicated support'],
    cta: 'Get Pro',
    href: '/sign-up?plan=pro',
    highlighted: false,
  },
]

export default function Pricing() {
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN')

  return (
    <section id="pricing" className="py-24 bg-gray-950">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-emerald-400 text-sm font-medium uppercase tracking-widest">
            Pricing
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-3">
            Simple, honest pricing
          </h2>
          <p className="text-gray-400 mt-4 text-lg">Pay once a month. Cancel anytime.</p>

          <div className="inline-flex items-center gap-1 mt-6 p-1 glass rounded-lg">
            {(['NGN', 'USD'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-all',
                  currency === c ? 'bg-emerald-500 text-gray-950' : 'text-gray-400 hover:text-white'
                )}
              >
                {c === 'NGN' ? '🇳🇬 NGN' : '🌍 USD'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={cn(
                'rounded-2xl p-8 flex flex-col',
                plan.highlighted
                  ? 'bg-emerald-500/10 border-2 border-emerald-500/50 relative'
                  : 'glass'
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 text-gray-950 text-xs font-bold rounded-full">
                  MOST POPULAR
                </span>
              )}
              <div className="mb-6">
                <h3 className="font-display text-xl font-bold text-white">{plan.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{plan.description}</p>
              </div>
              <div className="mb-8">
                <span className="font-display text-4xl font-bold text-white">
                  {plan.priceNGN === 0
                    ? 'Free'
                    : currency === 'NGN'
                      ? `₦${plan.priceNGN.toLocaleString()}`
                      : `$${plan.priceUSD}`}
                </span>
                {plan.priceNGN > 0 && (
                  <span className="text-gray-500 text-sm ml-1">/month</span>
                )}
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                    <span className="text-gray-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={plan.href}
                className={cn(
                  'w-full py-3 rounded-xl font-semibold text-sm text-center transition-all duration-200',
                  plan.highlighted
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-gray-950'
                    : 'glass hover:bg-white/10 text-white'
                )}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
