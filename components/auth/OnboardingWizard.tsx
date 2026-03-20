'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import * as DB from '@/lib/db'

interface OnboardingWizardProps {
  onComplete: () => void
}

/**
 * Guided onboarding wizard for new users.
 * Steps: Welcome → Profile → Preferences → First Steps
 */
export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user, updateProfile } = useAuth()
  const [step, setStep] = useState(0)
  const [interests, setInterests] = useState<string[]>([])
  const [studyGoal, setStudyGoal] = useState('')
  const [notifPref, setNotifPref] = useState({ email: true, push: true })
  const [inviteCode, setInviteCode] = useState('')
  const [inviteResult, setInviteResult] = useState<{ success: boolean; groupName?: string; error?: string } | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)

  const subjects = [
    { id: 'mathematics', label: 'Maths', emoji: '🔢' },
    { id: 'english', label: 'English', emoji: '📖' },
    { id: 'science', label: 'Science', emoji: '🔬' },
    { id: 'history', label: 'History', emoji: '📜' },
    { id: 'geography', label: 'Geography', emoji: '🌏' },
    { id: 'biology', label: 'Biology', emoji: '🧬' },
    { id: 'chemistry', label: 'Chemistry', emoji: '⚗️' },
    { id: 'physics', label: 'Physics', emoji: '⚡' },
    { id: 'computing', label: 'Computing', emoji: '💻' },
    { id: 'business', label: 'Business', emoji: '📊' },
    { id: 'art', label: 'Art & Design', emoji: '🎨' },
    { id: 'music', label: 'Music', emoji: '🎵' },
    { id: 'pe', label: 'PE / Health', emoji: '🏃' },
  ]

  const goals = [
    { id: 'improve', label: 'Improve my grades', emoji: '📈' },
    { id: 'exam', label: 'Prepare for exams', emoji: '📝' },
    { id: 'learn', label: 'Learn new things', emoji: '🧠' },
    { id: 'fun', label: 'Make studying fun', emoji: '🎮' },
    { id: 'teach', label: 'Create courses for others', emoji: '✏️' },
    { id: 'mentor', label: 'Help students succeed', emoji: '🧭' },
  ]

  const finish = async () => {
    if (user?.id) {
      await DB.updateUser(user.id, {
        interests,
        studyGoal,
        notificationPrefs: notifPref,
        onboardingComplete: true,
      })
    }
    onComplete()
  }

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="text-center">
      <div className="text-6xl mb-4">🎓</div>
      <h2 className="text-2xl font-extrabold mb-2" style={{ background: 'linear-gradient(135deg, #a29bfe, #00cec9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Welcome to StudyFlow!
      </h2>
      <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
        Hey {user?.name?.split(' ')[0] || 'there'}! Let's get you set up in under a minute.
      </p>
      <div className="my-6 space-y-3 text-left max-w-xs mx-auto">
        {(user?.roles || []).includes('learner') && (
          <div className="flex items-center gap-3 text-sm"><span className="text-xl">📚</span> Browse & learn from courses</div>
        )}
        {(user?.roles || []).includes('author') && (
          <div className="flex items-center gap-3 text-sm"><span className="text-xl">✏️</span> Create AI-powered courses</div>
        )}
        {(user?.roles || []).includes('mentor') && (
          <div className="flex items-center gap-3 text-sm"><span className="text-xl">🧭</span> Track & guide your students</div>
        )}
        <div className="flex items-center gap-3 text-sm"><span className="text-xl">🏆</span> Earn XP, badges & climb the leaderboard</div>
        <div className="flex items-center gap-3 text-sm"><span className="text-xl">👥</span> Study together with friends</div>
      </div>
    </div>,

    // Step 1: Interests
    <div key="interests" className="text-center">
      <div className="text-4xl mb-3">📚</div>
      <h2 className="text-xl font-extrabold mb-1">What do you study?</h2>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Pick your subjects so we can recommend courses</p>
      <div className="flex flex-wrap gap-2 justify-center max-w-sm mx-auto">
        {subjects.map(s => {
          const selected = interests.includes(s.id)
          return (
            <button
              key={s.id}
              onClick={() => setInterests(prev => selected ? prev.filter(x => x !== s.id) : [...prev, s.id])}
              className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: selected ? 'var(--primary)' : 'var(--bg-card)',
                color: selected ? 'white' : 'var(--text-secondary)',
                border: `1px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                transform: selected ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {s.emoji} {s.label}
            </button>
          )
        })}
      </div>
    </div>,

    // Step 2: Goal
    <div key="goal" className="text-center">
      <div className="text-4xl mb-3">🎯</div>
      <h2 className="text-xl font-extrabold mb-1">What's your goal?</h2>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>This helps us personalise your experience</p>
      <div className="space-y-2 max-w-xs mx-auto">
        {goals.map(g => (
          <button
            key={g.id}
            onClick={() => setStudyGoal(g.id)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-left"
            style={{
              background: studyGoal === g.id ? 'rgba(108,92,231,.12)' : 'var(--bg-card)',
              border: `1px solid ${studyGoal === g.id ? 'var(--primary)' : 'var(--border)'}`,
              color: studyGoal === g.id ? 'var(--primary)' : 'var(--text)',
            }}
          >
            <span className="text-xl">{g.emoji}</span> {g.label}
          </button>
        ))}
      </div>
    </div>,

    // Step 3: Notifications
    <div key="notifs" className="text-center">
      <div className="text-4xl mb-3">🔔</div>
      <h2 className="text-xl font-extrabold mb-1">Stay on track</h2>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Choose how you want to be reminded to study</p>
      <div className="space-y-3 max-w-xs mx-auto">
        {[
          { key: 'email', label: 'Email notifications', desc: 'Weekly summaries, new courses', emoji: '📧' },
          { key: 'push', label: 'Push notifications', desc: 'Study reminders, streak alerts', emoji: '📱' },
        ].map(n => (
          <div key={n.key} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <span className="text-xl">{n.emoji}</span>
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold">{n.label}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{n.desc}</div>
            </div>
            <button
              onClick={() => setNotifPref(prev => ({ ...prev, [n.key]: !prev[n.key as keyof typeof prev] }))}
              className="w-10 h-5 rounded-full relative transition-colors"
              style={{ background: notifPref[n.key as keyof typeof notifPref] ? 'var(--primary)' : 'var(--border)' }}
            >
              <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: notifPref[n.key as keyof typeof notifPref] ? 21 : 2 }} />
            </button>
          </div>
        ))}
      </div>
    </div>,

    // Step 4: Invite Code
    <div key="invite" className="text-center">
      <div className="text-4xl mb-3">🔗</div>
      <h2 className="text-xl font-extrabold mb-1">Got an invite code?</h2>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>If a teacher or group gave you a code, enter it to join their group</p>
      <div className="max-w-xs mx-auto">
        <div className="flex gap-2 mb-3">
          <input
            className="flex-1 px-3.5 py-2.5 rounded-xl text-sm text-center tracking-widest uppercase font-bold"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)', letterSpacing: '0.15em' }}
            value={inviteCode}
            onChange={e => { setInviteCode(e.target.value.toUpperCase()); setInviteResult(null) }}
            placeholder="e.g. ABC123"
            maxLength={10}
          />
          <button
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white"
            style={{ background: inviteCode.length >= 4 ? 'var(--primary)' : 'var(--text-muted)' }}
            disabled={inviteCode.length < 4 || inviteLoading}
            onClick={async () => {
              if (!user?.id || inviteCode.length < 4) return
              setInviteLoading(true)
              try {
                const group = await DB.joinGroupByInviteCode(inviteCode, user.id, user.name)
                setInviteResult({ success: true, groupName: (group as any).name })
              } catch (e: any) {
                setInviteResult({ success: false, error: e.message })
              }
              setInviteLoading(false)
            }}
          >
            {inviteLoading ? '...' : 'Join'}
          </button>
        </div>
        {inviteResult?.success && (
          <div className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: 'rgba(0,184,148,.1)', color: 'var(--success)', border: '1px solid rgba(0,184,148,.3)' }}>
            Joined "{inviteResult.groupName}" successfully!
          </div>
        )}
        {inviteResult && !inviteResult.success && (
          <div className="px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(225,112,85,.1)', color: 'var(--danger)', border: '1px solid rgba(225,112,85,.3)' }}>
            {inviteResult.error}
          </div>
        )}
        <p className="text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>
          No code? No worries — you can join groups later from the Groups section.
        </p>
      </div>
    </div>,

    // Step 5: Ready
    <div key="ready" className="text-center">
      <div className="text-6xl mb-4">🚀</div>
      <h2 className="text-2xl font-extrabold mb-2">You're all set!</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        {(user?.roles || []).includes('learner')
          ? 'Start by browsing courses or joining a group.'
          : (user?.roles || []).includes('author')
            ? 'Start by creating your first course.'
            : 'Start by searching for students to mentor.'}
      </p>
      <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto text-left">
        <div className="p-3 rounded-xl" style={{ background: 'rgba(108,92,231,.08)', border: '1px solid rgba(108,92,231,.2)' }}>
          <div className="text-lg mb-1">💡</div>
          <div className="text-[11px] font-semibold">Tip</div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Tap any course to see details and start learning</div>
        </div>
        <div className="p-3 rounded-xl" style={{ background: 'rgba(0,206,201,.08)', border: '1px solid rgba(0,206,201,.2)' }}>
          <div className="text-lg mb-1">🔥</div>
          <div className="text-[11px] font-semibold">Streaks</div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Study daily to build your streak and earn freezes</div>
        </div>
      </div>
    </div>,
  ]

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      {/* Progress dots */}
      <div className="flex gap-1.5 mb-6">
        {steps.map((_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full transition-all"
            style={{
              width: i === step ? 24 : 8,
              background: i <= step ? 'var(--primary)' : 'var(--border)',
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="w-full max-w-md animate-fade-in">
        {steps[step]}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            className="px-6 py-2.5 rounded-xl text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Back
          </button>
        )}
        {step === 0 && (
          <button
            onClick={() => { finish() }}
            className="px-4 py-2 rounded-xl text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            Skip setup
          </button>
        )}
        <button
          onClick={() => {
            if (step < steps.length - 1) setStep(s => s + 1)
            else finish()
          }}
          className="px-8 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
        >
          {step === steps.length - 1 ? "Let's Go! 🎉" : 'Next →'}
        </button>
      </div>
    </div>
  )
}
