import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'Qorvi — Subscription & recurring payment auditor',
  description:
    'Upload your bank statement and Qorvi helps you spot recurring payments, subscriptions, and forgotten expenses so you can decide what to keep.',
  keywords: ['subscription audit', 'recurring payments', 'bank statement', 'personal finance'],
  openGraph: {
    title: 'Qorvi — See More. Spend Less.',
    description:
      'Upload a bank statement and find the recurring charges quietly draining your money.',
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
