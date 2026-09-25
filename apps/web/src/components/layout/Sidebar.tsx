'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { BarChart2, LayoutDashboard, Upload, FileText, Settings, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/upload', icon: Upload, label: 'New Audit' },
  { href: '/report', icon: FileText, label: 'Reports' },
  { href: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-white/5 flex flex-col z-40">
      <div className="p-6 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <BarChart2 className="text-emerald-400" size={20} />
          <span className="font-display font-bold text-white text-lg">SAT</span>
        </Link>
        <p className="text-gray-600 text-xs mt-1">Subscription Audit Tool</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          return (
            <Link key={href} href={href} className={cn('flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group', isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5')}>
              <Icon size={18} className={cn('transition-colors', isActive ? 'text-emerald-400' : 'text-gray-500 group-hover:text-white')} />
              <span className="flex-1">{label}</span>
              {isActive && <ChevronRight size={14} className="text-emerald-400" />}
            </Link>
          )
        })}
      </nav>
      <div className="mx-4 mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <p className="text-emerald-400 text-xs font-semibold mb-1">Free Plan</p>
        <p className="text-gray-400 text-xs mb-3">1 audit remaining this month</p>
        <Link href="/pricing" className="block text-center py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-semibold rounded-lg transition-all">
          Upgrade to Basic
        </Link>
      </div>
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 px-2 py-2">
          <UserButton />
          <div>
            <p className="text-white text-sm font-medium">My Account</p>
            <p className="text-gray-500 text-xs">Free plan</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
