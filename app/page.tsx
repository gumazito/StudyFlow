'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { AuthScreen } from '@/components/auth/AuthScreen'
import { OnboardingWizard } from '@/components/auth/OnboardingWizard'
import { RolePicker } from '@/components/layout/RolePicker'

export default function Home() {
  const { user, loading } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)

  // Check if user needs onboarding
  useEffect(() => {
    if (user && !user.onboardingComplete && user.status !== 'pending' && user.status !== 'rejected') {
      setShowOnboarding(true)
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-t-[var(--primary)] border-[var(--border)] rounded-full mx-auto mb-4" style={{ animation: 'spin 1s linear infinite', borderWidth: 3 }} />
          <h3 className="text-lg font-bold">Loading StudyFlow...</h3>
        </div>
      </div>
    )
  }

  if (!user) return <AuthScreen />

  // Show onboarding for new users
  if (showOnboarding) {
    return <OnboardingWizard onComplete={() => setShowOnboarding(false)} />
  }

  // Pending approval
  if (user.status === 'pending' && !user.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center max-w-md px-6">
          <div className="text-5xl mb-4">\u23F3</div>
          <h2 className="text-xl font-extrabold mb-2">Account Pending Approval</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            Your account is waiting for admin approval. You will be able to log in once approved.
          </p>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Email: {user.email}</p>
          <button onClick={() => {}} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}>
            Log Out
          </button>
        </div>
      </div>
    )
  }

  if (user.status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center max-w-md px-6">
          <div className="text-5xl mb-4">\u274C</div>
          <h2 className="text-xl font-extrabold mb-2">Account Not Approved</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
            Please contact the administrator if you believe this is an error.
          </p>
        </div>
      </div>
    )
  }

  return <RolePicker />
}
