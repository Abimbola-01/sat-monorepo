'use client'

import { useState } from 'react'
import { useClerk, useUser } from '@clerk/nextjs'
import { LogOut, UserCog } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'

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
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut({ redirectUrl: '/' })
    } catch {
      toast.error('Could not sign you out. Please try again.')
      setIsSigningOut(false)
    }
  }

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Your account'
  const email = user?.primaryEmailAddress?.emailAddress
  const initial = (user?.firstName ?? email ?? '?').charAt(0).toUpperCase()

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Manage your account and session.</p>
      </div>

      {!isLoaded ? (
        <SettingsSkeleton />
      ) : (
        <>
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

              <Button variant="secondary" onClick={() => openUserProfile()}>
                <UserCog size={16} />
                Manage account
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Session</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4 flex-wrap">
              <p className="text-gray-400 text-sm">
                Sign out of SAT on this device.
              </p>
              <Button
                variant="destructive"
                onClick={handleSignOut}
                isLoading={isSigningOut}
              >
                {!isSigningOut && <LogOut size={16} />}
                Sign out
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
