'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useTheme, useToast } from '@/lib/contexts/ThemeContext'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { ProfileScreen } from '@/components/profile/ProfileScreen'
import { MentorDashboard } from '@/components/mentor/MentorDashboard'
import { GroupsView } from '@/components/groups/GroupsView'
import { PublisherDashboard } from '@/components/publisher/PublisherDashboard'
import { LearnerDashboard } from '@/components/learner/LearnerDashboard'
import * as DB from '@/lib/db'
import { genId } from '@/lib/constants'

function createPersonalGroup(userId: string, userName: string) {
  return {
    id: `personal_${userId}`, name: `${userName}'s Space`, type: 'personal',
    official: false, createdBy: userId, createdAt: Date.now(),
    members: [{ userId, email: '', name: userName, roles: ['admin', 'publisher', 'learner', 'mentor'], joinedAt: Date.now() }],
    inviteCode: genId(), description: 'Your personal study space',
  }
}

export function RolePicker() {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const { toast } = useToast()
  const [activeView, setActiveView] = useState<string | null>(null)
  const [myGroups, setMyGroups] = useState<any[]>([])
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [groupsLoaded, setGroupsLoaded] = useState(false)

  // Load user groups + personal group auto-creation + auto-join from URL
  useEffect(() => {
    if (!user || groupsLoaded) return
    const loadGroups = async () => {
      try {
        const groups = await DB.getGroupsForUser(user.id) as any[]
        if (groups.length === 0) {
          // Create personal group if none exist
          const pg = createPersonalGroup(user.id, user.name)
          await DB.createGroup(pg)
          setMyGroups([pg])
          setActiveGroup(pg.id)
        } else {
          setMyGroups(groups)
          setActiveGroup(groups[0].id)
        }

        // Handle invite link — auto-join group
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search)
          const inviteGroupId = params.get('invite')
          const inviteRoles = (params.get('roles') || 'learner').split(',')
          if (inviteGroupId) {
            const existing = groups.find(g => g.id === inviteGroupId)
            if (!existing) {
              await DB.addGroupMember(inviteGroupId, { userId: user.id, email: user.email, name: user.name, roles: inviteRoles, joinedAt: Date.now() })
              const joinedGroup = await DB.getGroup(inviteGroupId)
              if (joinedGroup) {
                setMyGroups(prev => [...prev, joinedGroup])
                setActiveGroup((joinedGroup as any).id)
                toast(`Joined group: ${(joinedGroup as any).name || 'group'}`, 'success')
              }
            }
            // Clean URL params
            window.history.replaceState({}, '', window.location.pathname)
          }
        }
      } catch (e) {
        console.error('Error loading groups:', e)
      }
      setGroupsLoaded(true)
    }
    loadGroups()
  }, [user, groupsLoaded])

  if (!user) return null

  const availableViews: string[] = []
  if (user.isAdmin) availableViews.push('admin')
  if (user.roles.includes('author') || user.isAdmin) availableViews.push('author')
  if (user.roles.includes('learner') || user.isAdmin) availableViews.push('learner')
  if (user.roles.includes('mentor')) availableViews.push('mentor')

  // Auto-select if only one view
  const currentView = activeView || (availableViews.length === 1 ? availableViews[0] : null)

  // TODO: Replace these with actual view components in later sprints
  if (currentView === 'admin') return <AdminDashboard onSwitchView={setActiveView} onLogout={logout} />
  if (currentView === 'author') return <PublisherDashboard onSwitchView={setActiveView} onLogout={logout} />
  if (currentView === 'learner') return <LearnerDashboard onSwitchView={setActiveView} onLogout={logout} />
  if (currentView === 'mentor') return <MentorDashboard onSwitchView={setActiveView} onLogout={logout} />
  if (currentView === 'profile') return <ProfileScreen onBack={() => setActiveView(null)} onLogout={logout} />
  if (currentView === 'groups') return <GroupsView myGroups={myGroups} setMyGroups={g => setMyGroups(g)} activeGroup={activeGroup} setActiveGroup={setActiveGroup} onBack={() => setActiveView(null)} onLogout={logout} />

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
              {"🛡️"} Administrator
            </button>
          )}
          {availableViews.includes('author') && (
            <button className="w-full py-3.5 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--primary)' }} onClick={() => setActiveView('author')}>
              {"✏️"} Publisher
            </button>
          )}
          {availableViews.includes('learner') && (
            <button className="w-full py-3.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--accent), var(--success))' }} onClick={() => setActiveView('learner')}>
              {"🎓"} Learner
            </button>
          )}
          {availableViews.includes('mentor') && (
            <button className="w-full py-3.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #e17055, #fdcb6e)' }} onClick={() => setActiveView('mentor')}>
              {"🧭"} Mentor
            </button>
          )}
        </div>

        {/* Active Group Indicator */}
        {myGroups.length > 0 && activeGroup && (
          <div className="mt-5 px-4 py-2.5 rounded-xl text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between">
              <span style={{ color: 'var(--text-muted)' }}>Active group:</span>
              <select
                className="text-xs font-semibold px-2 py-1 rounded"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                value={activeGroup}
                onChange={e => { setActiveGroup(e.target.value); toast(`Switched to ${myGroups.find(g => g.id === e.target.value)?.name || 'group'}`, 'success') }}
              >
                {myGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t flex gap-2 justify-center" style={{ borderColor: 'var(--border)' }}>
          <button className="px-4 py-2 rounded-lg text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} onClick={() => setActiveView('profile')}>
            {"⚙️"} Profile
          </button>
          <button className="px-4 py-2 rounded-lg text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} onClick={() => setActiveView('groups')}>
            {"🏫"} Groups
          </button>
          <button className="px-4 py-2 rounded-lg text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} onClick={toggle}>
            {dark ? '☀️ Light' : '🌙 Dark'}
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
        <button className="text-sm" style={{ color: 'var(--text-secondary)' }} onClick={onBack}>{"←"} Back</button>
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
