'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useTheme } from '@/lib/contexts/ThemeContext'

export function RolePicker() {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const [activeView, setActiveView] = useState<string | null>(null)

  if (!user) return null

  const availableViews: string[] = []
  if (user.isAdmin) availableViews.push('admin')
  if (user.roles.includes('author') || user.isAdmin) availableViews.push('author')
  if (user.roles.includes('learner') || user.isAdmin) availableViews.push('learner')
  if (user.roles.includes('mentor')) availableViews.push('mentor')

  // Auto-select if only one view
  const currentView = activeView || (availableViews.length === 1 ? availableViews[0] : null)

  // TODO: Replace these with actual view components in later sprints
  if (currentView === 'admin') return <PlaceholderView name="Admin Dashboard" icon="\uD83D\uDEE1\uFE0F" onBack={() => setActiveView(null)} />
  if (currentView === 'author') return <PlaceholderView name="Publisher" icon="\u270F\uFE0F" onBack={() => setActiveView(null)} />
  if (currentView === 'learner') return <PlaceholderView name="Learner" icon="\uD83C\uDF93" onBack={() => setActiveView(null)} />
  if (currentView === 'mentor') return <PlaceholderView name="Mentor" icon="\uD83E\uDDED" onBack={() => setActiveView(null)} />
  if (currentView === 'profile') return <PlaceholderView name="Profile" icon="\u2699\uFE0F" onBack={() => setActiveView(null)} />
  if (currentView === 'groups') return <PlaceholderView name="Groups" icon="\uD83C\uDFEB" onBack={() => setActiveView(null)} />

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)', background: 'rgba(10,10,15,.92)' }}>
        <div />
        <h1 className="text-lg font-extrabold" style={{
          background: 'linear-gradient(135deg, #a29bfe, #00cec9)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>StudyFlow</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.name}</span>
          <button onClick={logout} className="text-xs px-2.5 py-1.5 rounded" style={{ color: 'var(--text-secondary)' }}>Logout</button>
        </div>
      </nav>

      {/* Role picker */}
      <div className="max-w-md mx-auto px-5 pt-10 text-center animate-fade-in">
        <h1 className="text-2xl font-extrabold mb-2">Welcome, {user.name}!</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Choose how you would like to use StudyFlow:</p>

        <div className="flex flex-col gap-3">
          {availableViews.includes('admin') && (
            <button className="w-full py-3.5 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--danger)' }} onClick={() => setActiveView('admin')}>
              \uD83D\uDEE1\uFE0F Administrator
            </button>
          )}
          {availableViews.includes('author') && (
            <button className="w-full py-3.5 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--primary)' }} onClick={() => setActiveView('author')}>
              \u270F\uFE0F Publisher
            </button>
          )}
          {availableViews.includes('learner') && (
            <button className="w-full py-3.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--accent), var(--success))' }} onClick={() => setActiveView('learner')}>
              \uD83C\uDF93 Learner
            </button>
          )}
          {availableViews.includes('mentor') && (
            <button className="w-full py-3.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #e17055, #fdcb6e)' }} onClick={() => setActiveView('mentor')}>
              \uD83E\uDDED Mentor
            </button>
          )}
        </div>

        <div className="mt-6 pt-4 border-t flex gap-2 justify-center" style={{ borderColor: 'var(--border)' }}>
          <button className="px-4 py-2 rounded-lg text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} onClick={() => setActiveView('profile')}>
            \u2699\uFE0F Profile
          </button>
          <button className="px-4 py-2 rounded-lg text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} onClick={() => setActiveView('groups')}>
            \uD83C\uDFEB Groups
          </button>
          <button className="px-4 py-2 rounded-lg text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} onClick={toggle}>
            {dark ? '\u2600\uFE0F Light' : '\uD83C\uDF19 Dark'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Placeholder for views not yet migrated
function PlaceholderView({ name, icon, onBack }: { name: string; icon: string; onBack: () => void }) {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
        <button className="text-sm" style={{ color: 'var(--text-secondary)' }} onClick={onBack}>\u2190 Back</button>
        <h1 className="text-lg font-extrabold" style={{
          background: 'linear-gradient(135deg, #a29bfe, #00cec9)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>StudyFlow</h1>
        <div />
      </nav>
      <div className="max-w-lg mx-auto px-5 pt-20 text-center">
        <div className="text-6xl mb-4">{icon}</div>
        <h2 className="text-2xl font-extrabold mb-2">{name}</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          This view is being migrated to the new architecture. Coming in the next sprint.
        </p>
        <div className="mt-6 px-4 py-2 rounded-lg inline-block text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          Sprint 2+ placeholder
        </div>
      </div>
    </div>
  )
}
