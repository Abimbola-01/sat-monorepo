'use client'
import { ArrowRight, ChevronDown } from 'lucide-react'
import { useState } from 'react'

const faqs = [
  {
    question: 'What kind of file do I upload?',
    answer:
      'Upload a transaction CSV export from your bank or payment app. Qorvi validates the columns and shows you a preview before saving anything.',
  },
  {
    question: 'Do I need to connect my bank account?',
    answer:
      'No. Qorvi does not connect to your bank account in this version. You upload your own transaction file and Qorvi analyses it.',
  },
  {
    question: 'How does Qorvi detect subscriptions?',
    answer:
      'Qorvi uses rule-based detection. It looks for repeated charges with similar merchant names and amounts, and estimates how often they occur. Results are estimates, not guaranteed findings.',
  },
  {
    question: 'Are the savings numbers guaranteed?',
    answer:
      'No. Potential savings are estimates based on detected recurring patterns. You decide which subscriptions to keep, cancel, or review.',
  },
  {
    question: 'Is my data shared with other users?',
    answer:
      'No. Your transactions and subscriptions are tied to your account and isolated from other users.',
  },
  {
    question: 'Can I delete my data?',
    answer:
      'Yes. You can remove transactions, subscriptions, and import history from your account settings.',
  },
  {
    question: 'Does Qorvi work outside Nigeria?',
    answer:
      'The first version is designed with Nigerian users in mind, but the architecture is built to support other regions and bank formats later.',
  },
]

export default function FaqSection() {
  return (
    <section id="faq" className="py-24 bg-gray-900/30">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-emerald-400 text-sm font-medium uppercase tracking-widest">
            FAQ
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mt-3">
            Common questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq) => {
            const [open, setOpen] = useState(false)
            return (
              <details
                key={faq.question}
                open={open}
                className="group bg-white/3 border border-white/5 rounded-2xl overflow-hidden"
              >
                <summary
                  className="flex items-center justify-between gap-4 p-6 cursor-pointer list-none select-none text-white font-semibold"
                  onClick={() => setOpen(!open)}
                >
                  <span className="text-left">{faq.question}</span>
                  <ChevronDown
                    size={18}
                    className={`text-gray-500 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
                  />
                </summary>
                <div className="border-t border-white/5 px-6 pb-6">
                  <p className="text-gray-400 text-sm leading-relaxed pt-4">{faq.answer}</p>
                </div>
              </details>
            )
          })}
        </div>
      </div>
    </section>
  )
}
