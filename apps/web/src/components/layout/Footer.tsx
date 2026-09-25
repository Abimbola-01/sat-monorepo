import Link from 'next/link'
import { BarChart2 } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-gray-950">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <BarChart2 className="text-emerald-400" size={20} />
              <span className="font-display font-bold text-white text-lg">SAT</span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              AI-powered subscription audit tool. Find every recurring charge
              on your bank statement in under 60 seconds.
            </p>
          </div>

          <div>
            <h4 className="text-white font-medium text-sm mb-4">Product</h4>
            <ul className="space-y-3">
              {[
                { label: 'How it works', href: '/#how-it-works' },
                { label: 'Pricing', href: '/pricing' },
                { label: 'Dashboard', href: '/dashboard' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-500 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium text-sm mb-4">Legal</h4>
            <ul className="space-y-3">
              {[
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms of Service', href: '/terms' },
                { label: 'Contact', href: 'mailto:hello@sat.ng' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-500 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-sm">
            © {new Date().getFullYear()} SAT. All rights reserved.
          </p>
          <p className="text-gray-600 text-sm">
            Built for Nigeria 🇳🇬 and beyond
          </p>
        </div>
      </div>
    </footer>
  )
}