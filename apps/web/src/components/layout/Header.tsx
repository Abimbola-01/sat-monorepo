'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth, useUser, UserButton } from '@clerk/nextjs'
import { BarChart2, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
]

export default function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const { isSignedIn } = useAuth()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        <Link href="/" className="flex items-center gap-2">
          <BarChart2 className="text-emerald-400" size={22} />
          <span className="font-display font-bold text-white text-lg">SAT</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm transition-colors',
                pathname === link.href
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {!isSignedIn ? (
            <>
              <Link
                href="/sign-in"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-semibold text-sm rounded-lg transition-all duration-200"
              >
                Get started free
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-gray-400 hover:text-white transition-colors mr-2"
              >
                Dashboard
              </Link>
              <UserButton />
            </>
          )}
        </div>

        <button
          className="md:hidden text-gray-400 hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-white/5 bg-gray-950 px-6 py-4 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block text-gray-400 hover:text-white text-sm transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
            {!isSignedIn ? (
              <>
                <Link
                  href="/sign-in"
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2 bg-emerald-500 text-gray-950 font-semibold text-sm rounded-lg text-center"
                >
                  Get started free
                </Link>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="text-sm text-gray-400">
                  Dashboard
                </Link>
                <UserButton />
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}