'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { SUPER_USER_EMAILS } from '@/lib/firebase'
import * as DB from '@/lib/db'

interface OnboardingWizardProps {
  onComplete: () => void
}

/**
 * Guided onboarding wizard for new users.
 * Flow: Welcome → Personal Space → Interests → Groups → Notifications → Ready
 * Admins/super users skip directly to the app.
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
  const [startChoice, setStartChoice] = useState<'personal' | 'groups' | null>(null)
  const [joinRoles, setJoinRoles] = useState<string[]>(['learner'])

  // Super users / admins skip onboarding entirely
  const isSuperUser = SUPER_USER_EMAILS.includes(user?.email?.toLowerCase() || '')
  const isAdmin = user?.isAdmin || isSuperUser

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

  const toggleJoinRole = (r: string) => {
    setJoinRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])
  }

  const finish = async () => {
    if (user?.id) {
      await DB.updateUser(user.id, {
        interests,
        studyGoal,
        notificationPrefs: notifPref,
        onboardingComplete: true,
        startPreference: startChoice || 'personal',
      })
    }
    onComplete()
  }

  // Build steps dynamically based on user choices
  const allSteps: JSX.Element[] = []

  // Step 0: Welcome + Personal Space explanation
  allSteps.push(
    <div key="welcome" className="text-center">
      <div className="text-6xl mb-4">🎓</div>
      <h2 className="text-2xl font-extrabold mb-2" style={{ background: 'linear-gradient(135deg, #a29bfe, #00cec9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Welcome to StudyFlow!
      </h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Hey {user?.name?.split(' ')[0] || 'there'}! Let's get you set up in under a minute.
      </p>

      <div className="text-left max-w-sm mx-auto space-y-3">
        <div className="p-4 rounded-xl" style={{ background: 'rgba(108,92,231,.08)', border: '1px solid rgba(108,92,231,.2)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🏠</span>
            <span className="text-sm font-bold">Your Personal Space</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Your own place to create, publish, and consume content for your personal learning goals. You have full access to all features here — learn, publish, and mentor.
          </p>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(0,206,201,.08)', border: '1px solid rgba(0,206,201,.2)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">👥</span>
            <span className="text-sm font-bold">Groups & Spaces</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Join schools, study groups, or organisations. Each group has its own courses, leaderboards, and roles — you choose what role you want in each group.
          </p>
        </div>
      </div>
    </div>
  )

  // Step 1: Choose starting point — Personal Space or Groups
  allSteps.push(
    <div key="start-choice" className="text-center">
      <div className="text-4xl mb-3">🧭</div>
      <h2 className="text-xl font-extrabold mb-1">Where would you like to start?</h2>
      <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>You can always switch between these later</p>

      <div className="space-y-3 max-w-sm mx-auto">
        <button
          onClick={() => setStartChoice('personal')}
          className="w-full p-4 rounded-xl text-left transition-all"
          style={{
            background: startChoice === 'personal' ? 'rgba(108,92,231,.12)' : 'var(--bg-card)',
            border: `2px solid ${startChoice === 'personal' ? 'var(--primary)' : 'var(--border)'}`,
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏠</span>
            <div>
              <div className="text-sm font-bold" style={{ color: startChoice === 'personal' ? 'var(--primary)' : 'var(--text)' }}>
                Start with My Personal Space
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Set up your own learning area first, then join groups later
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => setStartChoice('groups')}
          className="w-full p-4 rounded-xl text-left transition-all"
          style={{
            background: startChoice === 'groups' ? 'rgba(0,206,201,.12)' : 'var(--bg-card)',
            border: `2px solid ${startChoice === 'groups' ? 'var(--accent)' : 'var(--border)'}`,
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">👥</span>
            <div>
              <div className="text-sm font-bold" style={{ color: startChoice === 'groups' ? 'var(--accent)' : 'var(--text)' }}>
                Find or Join a Group First
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Join a school, class, or study group — great if you have an invite code
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  )

  // Step 2: Interests / Subjects (personalise your space)
  allSteps.push(
    <div key="interests" className="text-center">
      <div className="text-4xl mb-3">📚</div>
      <h2 className="text-xl font-extrabold mb-1">What are you interested in?</h2>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Pick your subjects so we can recommend content for your personal space</p>
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
    </div>
  )

  // Step 3: Goal
  allSteps.push(
    <div key="goal" className="text-center">
      <div className="text-4xl mb-3">🎯</div>
      <h2 className="text-xl font-extrabold mb-1">What's your main goal?</h2>
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
    </div>
  )

  // Step 4: Join a Group (with role selection)
  allSteps.push(
    <div key="groups" className="text-center">
      <div className="text-4xl mb-3">🔗</div>
      <h2 className="text-xl font-extrabold mb-1">Join a Group</h2>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
        {startChoice === 'groups'
          ? 'Enter an invite code from your teacher, school, or study group'
          : 'Got an invite code? Enter it to join a group — or skip this for now'}
      </p>
      <div className="max-w-sm mx-auto">
        {/* Role selection for group */}
        <div className="mb-4">
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>What role do you want in this group?</p>
          <div className="flex gap-2 justify-center">
            {[
              { id: 'learner', label: 'Learner', emoji: '🎓', desc: 'Take courses' },
              { id: 'author', label: 'Publisher', emoji: '✏️', desc: 'Create content' },
              { id: 'mentor', label: 'Mentor', emoji: '🧭', desc: 'Guide others' },
            ].map(role => (
              <button
                key={role.id}
                onClick={() => toggleJoinRole(role.id)}
                className="flex-1 p-2.5 rounded-xl text-center transition-all"
                style={{
                  border: `2px solid ${joinRoles.includes(role.id) ? 'var(--primary)' : 'var(--border)'}`,
                  background: joinRoles.includes(role.id) ? 'rgba(108,92,231,.08)' : 'var(--bg-card)',
                }}
              >
                <div className="text-xl">{role.emoji}</div>
                <div className="text-[10px] font-bold mt-0.5">{role.label}</div>
                <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{role.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Invite code input */}
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
            disabled={inviteCode.length < 4 || inviteLoading || joinRoles.length === 0}
            onClick={async () => {
              if (!user?.id || inviteCode.length < 4) return
              setInviteLoading(true)
              try {
                // Join with selected roles
                const group: any = await DB.getGroupByInviteCode(inviteCode)
                if (!group) throw new Error('Invalid invite code')
                const members = group.members || []
                if (members.some((m: any) => m.userId === user.id)) throw new Error('Already a member of this group')
                members.push({ userId: user.id, email: user.email, name: user.name, roles: joinRoles, joinedAt: Date.now() })
                await DB.updateGroup(group.id, { members })
                setInviteResult({ success: true, groupName: group.name })
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
            Joined "{inviteResult.groupName}" as {joinRoles.join(', ')}!
          </div>
        )}
        {inviteResult && !inviteResult.success && (
          <div className="px-3 py-2 rounded-lg text-xs" style={{ background: 'rgba(225,112,85,.1)', color: 'var(--danger)', border: '1px solid rgba(225,112,85,.3)' }}>
            {inviteResult.error}
          </div>
        )}
        <p className="text-[10px] mt-3" style={{ color: 'var(--text-muted)' }}>
          No code? No worries — you can browse and join public groups anytime from the Groups section.
        </p>
      </div>
    </div>
  )

  // Step 5: Notifications
  allSteps.push(
    <div key="notifs" className="text-center">
      <div className="text-4xl mb-3">🔔</div>
      <h2 className="text-xl font-extrabold mb-1">Stay on track</h2>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>Choose how you want to be reminded</p>
      <div className="space-y-3 max-w-xs mx-auto">
        {[
          { key: 'email', label: 'Email notifications', desc: 'Weekly summaries, new courses, group updates', emoji: '📧' },
          { key: 'push', label: 'Push notifications', desc: 'Study reminders, streak alerts, group invites', emoji: '📱' },
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
    </div>
  )

  // Step 6: Ready
  allSteps.push(
    <div key="ready" className="text-center">
      <div className="text-6xl mb-4">🚀</div>
      <h2 className="text-2xl font-extrabold mb-2">You're all set!</h2>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        {startChoice === 'groups'
          ? 'Head to your groups to start learning with your team.'
          : 'Your personal space is ready. Explore, create, and learn at your own pace.'}
      </p>
      <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto text-left">
        <div className="p-3 rounded-xl" style={{ background: 'rgba(108,92,231,.08)', border: '1px solid rgba(108,92,231,.2)' }}>
          <div className="text-lg mb-1">🏠</div>
          <div className="text-[11px] font-semibold">Personal Space</div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>All roles unlocked — learn, create, and mentor freely</div>
        </div>
        <div className="p-3 rounded-xl" style={{ background: 'rgba(0,206,201,.08)', border: '1px solid rgba(0,206,201,.2)' }}>
          <div className="text-lg mb-1">👥</div>
          <div className="text-[11px] font-semibold">Groups</div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Join schools and study groups anytime</div>
        </div>
        <div className="p-3 rounded-xl" style={{ background: 'rgba(253,203,110,.08)', border: '1px solid rgba(253,203,110,.2)' }}>
          <div className="text-lg mb-1">🔥</div>
          <div className="text-[11px] font-semibold">Streaks</div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Study daily to build your streak</div>
        </div>
        <div className="p-3 rounded-xl" style={{ background: 'rgba(225,112,85,.08)', border: '1px solid rgba(225,112,85,.2)' }}>
          <div className="text-lg mb-1">🏆</div>
          <div className="text-[11px] font-semibold">Leaderboard</div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Compete with friends for the top spot</div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      {/* Progress dots */}
      <div className="flex gap-1.5 mb-6">
        {allSteps.map((_, i) => (
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
        {allSteps[step]}
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
            if (step < allSteps.length - 1) {
              // Validate step 1 — must pick a start choice
              if (step === 1 && !startChoice) return
              setStep(s => s + 1)
            }
            else finish()
          }}
          className="px-8 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{
            background: (step === 1 && !startChoice)
              ? 'var(--text-muted)'
              : 'linear-gradient(135deg, var(--primary), var(--accent))',
          }}
        >
          {step === allSteps.length - 1 ? "Let's Go! 🎉" : 'Next →'}
        </button>
      </div>
    </div>
  )
}
