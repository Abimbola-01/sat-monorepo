import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter'
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'SAT — Subscription Audit Tool',
  description: 'Find hidden subscriptions, stop wasting money. AI-powered bank statement analysis.',
  keywords: ['subscription audit', 'bank statement analysis', 'save money', 'Nigeria'],
  openGraph: {
    title: 'SAT — Subscription Audit Tool',
    description: 'Find hidden subscriptions, stop wasting money.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        data-scroll-behavior="smooth"
        className={`${inter.variable} ${spaceGrotesk.variable}`}
        suppressHydrationWarning
      >
        <body
          className="bg-gray-950 text-white antialiased"
          suppressHydrationWarning
        >
          {children}
          <Toaster position="top-right" theme="dark" richColors />
        </body>
      </html>
    </ClerkProvider>
  )
}

<html
  lang="en"
  data-scroll-behavior="smooth"
  className={`${inter.variable} ${spaceGrotesk.variable}`}
  suppressHydrationWarning
></html>