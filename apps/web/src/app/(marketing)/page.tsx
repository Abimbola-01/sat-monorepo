import Hero from '@/components/landing/Hero'
import HowItWorks from '@/components/landing/HowItWorks'
import Features from '@/components/landing/Features'
import PrivacySection from '@/components/landing/PrivacySection'
import FaqSection from '@/components/landing/FaqSection'
import CTA from '@/components/landing/CTA'

export default function LandingPage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Features />
      <PrivacySection />
      <FaqSection />
      <CTA />
    </>
  )
}
