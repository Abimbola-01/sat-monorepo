'use client'

import { useState } from 'react'
import { useClerk, useUser } from '@clerk/nextjs'
import { LogOut, UserCog, Trash2, Globe, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { formatDate } from '@/lib/utils'
import { settingsApi } from '@/lib/api'
import { useAuth } from '@clerk/nextjs'
import type { UseSettingsState } from '@/hooks/useQorvi'

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-48 rounded-2xl bg-white/3 border border-white/5 animate-pulse" />
      <div className="h-32 rounded-2xl bg-white/3 border border-white/5 animate-pulse" />
    </div>
  )
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser()
  const { signOut, openUserProfile } = useClerk()
  const { getToken } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [name, setName] = useState('')
  const [currency, setCurrency] = useState('NGN')
  const [Saving, setSaving] = useState(false)
  const [clearing, setClearing] = useState(false)

  if (!isLoaded) return <SettingsSkeleton />

  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Your account'
  const email = user?.primaryEmailAddress?.emailAddress
  const initial = (user?.firstName ?? email ?? '?').charAt(0).toUpperCase()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your account and data.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.imageUrl}
                alt=""
                className="w-14 h-14 rounded-full border border-white/10 object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-semibold text-lg">
                {initial}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white font-medium truncate">{fullName}</p>
              {email && <p className="text-gray-400 text-sm truncate">{email}</p>}
              {user?.createdAt && (
                <p className="text-gray-500 text-xs mt-1">
                  Member since {formatDate(user.createdAt.toISOString())}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Display name" value={name} onChange={(e) => setName(e.target.value)} />
            <div className="flex items-center gap-3">
              <Globe size={16} className="text-gray-500" />
              <select
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="NGN">NGN</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <Button
            onClick={async () => {
              setSaving(true)
              try {
                const token = await getToken()
                if (!token) throw new Error('Sign in again')
                await settingsApi.patch({ name, currency: currency.toUpperCase() }, token)
                toast.success('Settings saved')
              } catch {
                toast.error('Could not save settings')
              } finally {
                setSaving(false)
              }
            }}
            isLoading={Saving}
          >
            <UserCog size={16} />
            Save changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-white text-sm font-medium">Clear financial data</p>
              <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                Remove your imported transactions, detected subscriptions, and import history.
                Your account is kept.
              </p>
            </div>
          </div>

          <Button
            variant="destructive"
            onClick={async () => {
              if (!confirm('Delete all financial data for this account? This cannot be undone.')) return
              setClearing(true)
              try {
                const token = await getToken()
                if (!token) throw new Error('Sign in again')
                await settingsApi.clearData(token)
                toast.success('Financial data cleared')
              } catch {
                toast.error('Could not clear data')
              } finally {
                setClearing(false)
              }
            }}
            isLoading={clearing}
          >
            <Trash2 size={16} />
            Clear financial data
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Session</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-gray-400 text-sm">Sign out of Qorvi on this device.</p>
          <Button variant="destructive" onClick={() => { setIsSigningOut(true); signOut({ redirectUrl: '/' }) }} isLoading={isSigningOut}>
            {!isSigningOut && <LogOut size={16} />}
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
