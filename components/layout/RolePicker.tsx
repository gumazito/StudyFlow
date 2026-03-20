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
          const pg = createPersonalGroup(user.id, user.name)
          await DB.createGroup(pg)
          setMyGroups([pg])
          setActiveGroup(pg.id)
        } else {
          setMyGroups(groups)
          // Default to personal group if exists, otherwise first group
          const personal = groups.find(g => g.type === 'personal')
          setActiveGroup(personal?.id || groups[0].id)
        }

        // Handle invite link — auto-join group with specified roles
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

  const isAdmin = user.isAdmin

  // Active group info
  const currentGroup = myGroups.find(g => g.id === activeGroup) as any
  const isPersonalSpace = currentGroup?.type === 'personal'

  // In personal space: all roles available. In groups: use the roles assigned
  const groupRoles: string[] = isPersonalSpace
    ? ['learner', 'author', 'mentor']
    : (currentGroup?.members?.find((m: any) => m.userId === user.id)?.roles || [])

  // Build available views based on context
  const availableViews: string[] = []
  if (isAdmin) availableViews.push('admin')
  if (groupRoles.includes('author') || groupRoles.includes('publisher') || isAdmin) availableViews.push('author')
  if (groupRoles.includes('learner') || isAdmin) availableViews.push('learner')
  if (groupRoles.includes('mentor') || isAdmin) availableViews.push('mentor')

  // Auto-select if only one view
  const currentView = activeView || (availableViews.length === 1 ? availableViews[0] : null)

  // Route to view components
  if (currentView === 'admin') return <AdminDashboard onSwitchView={setActiveView} onLogout={logout} />
  if (currentView === 'author') return <PublisherDashboard onSwitchView={setActiveView} onLogout={logout} />
  if (currentView === 'learner') return <LearnerDashboard onSwitchView={setActiveView} onLogout={logout} />
  if (currentView === 'mentor') return <MentorDashboard onSwitchView={setActiveView} onLogout={logout} />
  if (currentView === 'profile') return <ProfileScreen onBack={() => setActiveView(null)} onLogout={logout} />
  if (currentView === 'groups') return <GroupsView myGroups={myGroups} setMyGroups={g => setMyGroups(g)} activeGroup={activeGroup || ''} setActiveGroup={setActiveGroup} onBack={() => setActiveView(null)} onLogout={logout} />

  const otherGroups = myGroups.filter(g => g.type !== 'personal')

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Nav — Profile, logo, theme toggle, logout */}
      <nav className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)', background: 'rgba(10,10,15,.92)' }}>
        <button onClick={() => setActiveView('profile')} className="text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
          ⚙️ Profile
        </button>
        <h1 className="text-lg font-extrabold" style={{
          background: 'linear-gradient(135deg, #a29bfe, #00cec9)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>StudyFlow</h1>
        <div className="flex items-center gap-2">
          <button onClick={toggle} className="text-xs px-2 py-1.5 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
            {dark ? '☀️' : '🌙'}
          </button>
          <button onClick={logout} className="text-xs px-2.5 py-1.5 rounded-lg" style={{ color: 'var(--text-secondary)' }}>Logout</button>
        </div>
      </nav>

      <div className="max-w-md mx-auto px-5 pt-8 pb-8 animate-fade-in">
        <h1 className="text-2xl font-extrabold mb-1 text-center">Welcome, {user.name}!</h1>
        <p className="text-sm mb-6 text-center" style={{ color: 'var(--text-secondary)' }}>Choose a space to get started</p>

        {/* Personal Space Card */}
        <div className="mb-4 p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🏠</span>
            <div>
              <div className="text-sm font-bold">My Personal Space</div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Your own area — all roles, full freedom</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              className="py-2.5 rounded-lg text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--success))' }}
              onClick={() => { setActiveGroup(myGroups.find(g => g.type === 'personal')?.id || activeGroup); setActiveView('learner') }}
            >
              🎓 Learn
            </button>
            <button
              className="py-2.5 rounded-lg text-xs font-bold text-white"
              style={{ background: 'var(--primary)' }}
              onClick={() => { setActiveGroup(myGroups.find(g => g.type === 'personal')?.id || activeGroup); setActiveView('author') }}
            >
              ✏️ Publish
            </button>
            <button
              className="py-2.5 rounded-lg text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #e17055, #fdcb6e)' }}
              onClick={() => { setActiveGroup(myGroups.find(g => g.type === 'personal')?.id || activeGroup); setActiveView('mentor') }}
            >
              🧭 Mentor
            </button>
          </div>
        </div>

        {/* Admin Card (only for admins) */}
        {isAdmin && (
          <button
            className="w-full mb-4 p-4 rounded-xl text-left flex items-center gap-3"
            style={{ background: 'rgba(225,112,85,.08)', border: '1px solid rgba(225,112,85,.3)' }}
            onClick={() => setActiveView('admin')}
          >
            <span className="text-2xl">🛡️</span>
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--danger)' }}>Admin Dashboard</div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Manage users, approvals, and platform settings</div>
            </div>
            <span className="ml-auto text-sm" style={{ color: 'var(--text-muted)' }}>→</span>
          </button>
        )}

        {/* Groups Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold">👥 My Groups</h2>
            <div className="flex gap-1.5">
              <button
                className="text-[10px] font-semibold px-2.5 py-1 rounded-lg"
                style={{ background: 'var(--primary)', color: 'white' }}
                onClick={() => setActiveView('groups')}
              >
                + Create Group
              </button>
              <button
                className="text-[10px] font-semibold px-2.5 py-1 rounded-lg"
                style={{ background: 'var(--accent)', color: 'white' }}
                onClick={() => setActiveView('groups')}
              >
                🔍 Find Groups
              </button>
            </div>
          </div>

          {otherGroups.length === 0 ? (
            <div className="p-4 rounded-xl text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <div className="text-2xl mb-2">👥</div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                No groups yet. Create a new group or find one to join.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {otherGroups.map((group: any) => {
                const myMember = (group.members || []).find((m: any) => m.userId === user.id)
                const myRoles: string[] = myMember?.roles || ['learner']
                return (
                  <div key={group.id} className="p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-xs font-bold">{group.name}</div>
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {(group.members || []).length} members · {group.type === 'school' ? '🏫 School' : group.type === 'organisation' ? '🏢 Org' : '📖 Study Group'}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {myRoles.includes('learner') && (
                        <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: 'var(--accent)' }}
                          onClick={() => { setActiveGroup(group.id); setActiveView('learner') }}>
                          🎓 Learn
                        </button>
                      )}
                      {(myRoles.includes('author') || myRoles.includes('publisher')) && (
                        <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: 'var(--primary)' }}
                          onClick={() => { setActiveGroup(group.id); setActiveView('author') }}>
                          ✏️ Publish
                        </button>
                      )}
                      {myRoles.includes('mentor') && (
                        <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: '#e17055' }}
                          onClick={() => { setActiveGroup(group.id); setActiveView('mentor') }}>
                          🧭 Mentor
                        </button>
                      )}
                      {(myRoles.includes('admin') || group.createdBy === user.id) && (
                        <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold" style={{ background: 'rgba(225,112,85,.1)', color: 'var(--danger)', border: '1px solid rgba(225,112,85,.3)' }}
                          onClick={() => setActiveView('groups')}>
                          ⚙️ Manage
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
