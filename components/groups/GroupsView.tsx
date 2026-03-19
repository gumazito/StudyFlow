'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useToast } from '@/lib/contexts/ThemeContext'
import * as DB from '@/lib/db'
import { GROUP_TYPES, genId } from '@/lib/constants'

interface GroupsViewProps {
  myGroups: any[]
  setMyGroups: (g: any[]) => void
  activeGroup: string | null
  setActiveGroup: (g: string) => void
  onBack: () => void
  onLogout: () => void
}

export function GroupsView({ myGroups, setMyGroups, activeGroup, setActiveGroup, onBack, onLogout }: GroupsViewProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [screen, setScreen] = useState<'list' | 'create' | 'manage' | 'browse'>('list')
  const [editingGroup, setEditingGroup] = useState<any>(null)
  const [allGroups, setAllGroups] = useState<any[]>([])
  const [schoolSearch, setSchoolSearch] = useState('')
  const [schoolResults, setSchoolResults] = useState<any[]>([])
  const [newGroup, setNewGroup] = useState({ type: 'school', name: '', description: '', official: false })
  const [inviteRoles, setInviteRoles] = useState(['learner'])
  const [joinRequests, setJoinRequests] = useState<any[]>([])

  const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }
  const inputStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }

  const loadBrowse = async () => {
    const all = await DB.getAllGroups()
    setAllGroups((all as any[]).filter(g => g.type !== 'personal'))
  }

  const searchSchools = async () => {
    if (!schoolSearch || schoolSearch.length < 3) return
    try {
      const resp = await fetch(`https://www.myschool.edu.au/api/search/school?SearchText=${encodeURIComponent(schoolSearch)}&PageSize=10`)
      if (!resp.ok) throw new Error('API error')
      const data = await resp.json()
      setSchoolResults((data.Results || data.results || []).map((s: any) => ({
        name: s.SchoolName || s.schoolName || s.Name,
        suburb: s.Suburb || s.suburb || '',
        state: s.State || s.state || '',
        postcode: s.Postcode || s.postcode || '',
        sector: s.SchoolSector || s.schoolSector || '',
      })))
    } catch { setSchoolResults([]) }
  }

  const createGroup = async () => {
    if (!newGroup.name.trim() || !user) { toast('Enter a group name', 'error'); return }
    const group = {
      id: genId(), ...newGroup, name: newGroup.name.trim(),
      createdBy: user.id, createdAt: Date.now(),
      members: [{ userId: user.id, email: user.email, name: user.name, roles: ['admin', 'publisher', 'learner', 'mentor'], joinedAt: Date.now() }],
      inviteCode: genId(),
    }
    await DB.createGroup(group)
    setMyGroups([...myGroups, group])
    setActiveGroup(group.id)
    toast(`Group "${group.name}" created!`, 'success')
    setScreen('list')
    setNewGroup({ type: 'school', name: '', description: '', official: false })
  }

  const generateInviteLink = () => {
    if (!editingGroup) return ''
    return `${window.location.origin}${window.location.pathname}?invite=${editingGroup.id}&roles=${inviteRoles.join(',')}`
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
        <button className="text-sm" style={{ color: 'var(--text-secondary)' }} onClick={screen === 'list' ? onBack : () => setScreen('list')}>← Back</button>
        <div className="text-lg font-extrabold" style={{ background: 'linear-gradient(135deg, #a29bfe, #00cec9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>StudyFlow</div>
        <button className="text-xs" style={{ color: 'var(--text-secondary)' }} onClick={onLogout}>Logout</button>
      </nav>

      <div className="max-w-xl mx-auto px-4 py-4">
        {/* LIST */}
        {screen === 'list' && (
          <div className="animate-fade-in">
            <div className="flex justify-between items-start flex-wrap gap-2 mb-4">
              <div>
                <h1 className="text-2xl font-extrabold">🏫 My Groups</h1>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Manage your study groups</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--primary)' }} onClick={() => setScreen('create')}>+ Create</button>
                <button className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} onClick={() => { setScreen('browse'); loadBrowse() }}>🔍 Browse</button>
              </div>
            </div>
            {myGroups.map(g => (
              <div key={g.id} className="p-3.5 mb-2 rounded-xl cursor-pointer transition-all" style={{ ...cardStyle, borderColor: activeGroup === g.id ? 'var(--primary)' : 'var(--border)' }}
                onClick={() => { setActiveGroup(g.id); toast(`Switched to ${g.name}`, 'success') }}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-bold text-base">{GROUP_TYPES.find(t => t.id === g.type)?.icon || '📂'} {g.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{g.type} · {(g.members || []).length} members{g.official ? ' · ✅ Official' : g.type !== 'personal' ? ' · 🌐 Community' : ''}</div>
                  </div>
                  <div className="flex gap-1.5">
                    {activeGroup === g.id && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(0,184,148,.15)', color: 'var(--success)' }}>Active</span>}
                    {(g.members || []).some((m: any) => m.userId === user?.id && m.roles?.includes('admin')) && (
                      <button className="text-xs px-2 py-1" style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)' }}
                        onClick={e => { e.stopPropagation(); setEditingGroup(g); setScreen('manage') }}>⚙️</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CREATE */}
        {screen === 'create' && (
          <div className="animate-fade-in">
            <h1 className="text-xl font-extrabold mb-4">Create New Group</h1>
            <div className="mb-3">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Group Type</label>
              <div className="flex gap-1.5 flex-wrap">
                {GROUP_TYPES.filter(t => t.id !== 'personal').map(t => (
                  <button key={t.id} className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                    style={{ background: newGroup.type === t.id ? 'var(--primary)' : 'var(--bg-card)', color: newGroup.type === t.id ? 'white' : 'var(--text-secondary)', border: `1px solid ${newGroup.type === t.id ? 'var(--primary)' : 'var(--border)'}` }}
                    onClick={() => setNewGroup({ ...newGroup, type: t.id })}>{t.icon} {t.name}</button>
                ))}
              </div>
            </div>
            {newGroup.type === 'school' && (
              <div className="mb-3">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Search Australian Schools</label>
                <div className="flex gap-2">
                  <input className="flex-1 px-3 py-2 rounded-md text-sm" style={inputStyle} value={schoolSearch} onChange={e => setSchoolSearch(e.target.value)} placeholder="Type school name..."
                    onKeyDown={e => { if (e.key === 'Enter') searchSchools() }} />
                  <button className="px-3 py-1.5 rounded-lg text-xs text-white" style={{ background: 'var(--primary)' }} onClick={searchSchools}>Search</button>
                </div>
                {schoolResults.map((s, i) => (
                  <div key={i} className="p-2 mt-1 rounded-lg cursor-pointer" style={cardStyle}
                    onClick={() => { setNewGroup({ ...newGroup, name: s.name }); setSchoolResults([]) }}>
                    <div className="font-semibold text-sm">{s.name}</div>
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{s.suburb}, {s.state} {s.postcode} · {s.sector}</div>
                  </div>
                ))}
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Can't find it? Type the name below.</p>
              </div>
            )}
            <div className="mb-3">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Group Name</label>
              <input className="w-full px-3 py-2.5 rounded-md text-sm" style={inputStyle} value={newGroup.name} onChange={e => setNewGroup({ ...newGroup, name: e.target.value })} placeholder="Enter group name..." />
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
              <textarea className="w-full px-3 py-2 rounded-md text-sm min-h-[60px]" style={inputStyle} value={newGroup.description} onChange={e => setNewGroup({ ...newGroup, description: e.target.value })} placeholder="What is this group for?" />
            </div>
            {(newGroup.type === 'school' || newGroup.type === 'company') && (
              <div className="mb-3 flex items-center gap-2.5 cursor-pointer" onClick={() => setNewGroup({ ...newGroup, official: !newGroup.official })}>
                <div className="w-11 h-6 rounded-full relative transition-colors" style={{ background: newGroup.official ? 'var(--primary)' : 'var(--border)' }}>
                  <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: newGroup.official ? 22 : 2 }} />
                </div>
                <div>
                  <div className="text-sm font-medium">Official {newGroup.type === 'school' ? 'School' : 'Organisation'}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{newGroup.official ? 'Managed by the institution (verification required)' : 'Community-managed group'}</div>
                </div>
              </div>
            )}
            <button className="w-full py-3 rounded-xl text-sm font-bold text-white mt-4" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }} onClick={createGroup}>Create Group</button>
          </div>
        )}

        {/* MANAGE */}
        {screen === 'manage' && editingGroup && (
          <div className="animate-fade-in">
            <h1 className="text-xl font-extrabold mb-1">{editingGroup.name}</h1>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{editingGroup.type}{editingGroup.official ? ' · Official' : ' · Community'} · {(editingGroup.members || []).length} members</p>

            {/* Invite link */}
            <div className="p-3.5 mb-3 rounded-xl" style={cardStyle}>
              <h3 className="text-sm font-bold mb-2">🔗 Invite Link</h3>
              <div className="mb-2">
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Roles for new members</label>
                <div className="flex gap-1 flex-wrap">
                  {['learner', 'publisher', 'mentor'].map(r => (
                    <button key={r} className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                      style={{ background: inviteRoles.includes(r) ? 'var(--primary)' : 'var(--bg)', color: inviteRoles.includes(r) ? 'white' : 'var(--text-muted)', border: `1px solid ${inviteRoles.includes(r) ? 'var(--primary)' : 'var(--border)'}` }}
                      onClick={() => setInviteRoles(p => p.includes(r) ? p.filter(x => x !== r) : [...p, r])}>
                      {r === 'learner' ? '🎓' : r === 'publisher' ? '✏️' : '🧭'} {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-1.5">
                <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--primary)' }}
                  onClick={() => { navigator.clipboard.writeText(generateInviteLink()).then(() => toast('Invite link copied!', 'success')) }}>📋 Copy Link</button>
                <span className="text-[11px] py-1.5 px-2" style={{ color: 'var(--text-muted)' }}>Code: <strong>{editingGroup.inviteCode}</strong></span>
              </div>
            </div>

            {/* Members */}
            <div className="p-3.5 mb-3 rounded-xl" style={cardStyle}>
              <h3 className="text-sm font-bold mb-2">👥 Members ({(editingGroup.members || []).length})</h3>
              {(editingGroup.members || []).map((m: any, i: number) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b text-xs" style={{ borderColor: 'var(--border)' }}>
                  <div>
                    <div className="font-semibold">{m.name || m.email}{m.userId === editingGroup.createdBy ? ' 👑' : ''}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{(m.roles || []).join(', ')}</div>
                  </div>
                  <div className="flex gap-0.5">
                    {['learner', 'publisher', 'mentor', 'admin'].map(role => (
                      <button key={role} className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                        style={{
                          background: (m.roles || []).includes(role) ? (role === 'admin' ? 'var(--danger)' : role === 'publisher' ? 'var(--primary)' : role === 'mentor' ? '#e17055' : 'var(--accent)') : 'transparent',
                          color: (m.roles || []).includes(role) ? 'white' : 'var(--text-muted)',
                          border: `1px solid ${(m.roles || []).includes(role) ? 'transparent' : 'var(--border)'}`,
                        }}
                        onClick={async () => {
                          const newRoles = (m.roles || []).includes(role) ? (m.roles || []).filter((r: string) => r !== role) : [...(m.roles || []), role]
                          if (newRoles.length === 0) return
                          await DB.updateGroupMemberRoles(editingGroup.id, m.userId, newRoles)
                          const updated = { ...editingGroup, members: editingGroup.members.map((x: any) => x.userId === m.userId ? { ...x, roles: newRoles } : x) }
                          setEditingGroup(updated)
                          setMyGroups(myGroups.map(g => g.id === updated.id ? updated : g))
                        }}>
                        {role.charAt(0).toUpperCase()}
                      </button>
                    ))}
                    {m.userId !== user?.id && m.userId !== editingGroup.createdBy && (
                      <button className="text-[9px] px-1" style={{ color: 'var(--danger)' }} onClick={async () => {
                        await DB.removeGroupMember(editingGroup.id, m.userId)
                        const updated = { ...editingGroup, members: editingGroup.members.filter((x: any) => x.userId !== m.userId) }
                        setEditingGroup(updated)
                        setMyGroups(myGroups.map(g => g.id === updated.id ? updated : g))
                      }}>✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add member */}
            <div className="p-3.5 rounded-xl" style={cardStyle}>
              <h3 className="text-sm font-bold mb-2">➕ Add Member</h3>
              <div className="flex gap-2">
                <input id="add-member-input" className="flex-1 px-3 py-2 rounded-md text-sm" style={inputStyle} placeholder="Search by name or email..." />
                <button className="px-3 py-1.5 rounded-lg text-xs text-white" style={{ background: 'var(--primary)' }} onClick={async () => {
                  const q = (document.getElementById('add-member-input') as HTMLInputElement)?.value
                  if (!q) return
                  const results = await DB.searchUsers(q)
                  const nonMembers = (results as any[]).filter(u => !(editingGroup.members || []).some((m: any) => m.userId === u.uid))
                  if (nonMembers.length === 0) { toast('No users found or all already members', 'info'); return }
                  for (const u of nonMembers) {
                    await DB.addGroupMember(editingGroup.id, { userId: u.uid, email: u.email, name: u.name, roles: ['learner'], joinedAt: Date.now() })
                  }
                  const updated = await DB.getGroup(editingGroup.id)
                  if (updated) { setEditingGroup(updated); setMyGroups(myGroups.map(g => g.id === (updated as any).id ? updated : g)) }
                  toast(`Added ${nonMembers.length} member(s)`, 'success')
                }}>Add</button>
              </div>
            </div>
          </div>
        )}

        {/* BROWSE */}
        {screen === 'browse' && (
          <div className="animate-fade-in">
            <h1 className="text-xl font-extrabold mb-4">🔍 Browse Groups</h1>
            <input className="w-full px-3 py-2.5 rounded-md text-sm mb-3" style={inputStyle} placeholder="Search groups..."
              onChange={e => {
                const q = e.target.value.toLowerCase()
                if (!q) loadBrowse()
                else setAllGroups(prev => prev.filter(g => (g.name || '').toLowerCase().includes(q)))
              }} />
            {allGroups.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">🔍</div>
                <h3 className="text-base font-bold">No groups found</h3>
              </div>
            ) : allGroups.map(g => {
              const isMember = myGroups.some(mg => mg.id === g.id)
              return (
                <div key={g.id} className="p-3.5 mb-2 rounded-xl" style={cardStyle}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-sm">{GROUP_TYPES.find(t => t.id === g.type)?.icon || '📂'} {g.name}{g.official ? ' ✅' : ''}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{g.type} · {(g.members || []).length} members</div>
                    </div>
                    {isMember ? (
                      <span className="text-xs" style={{ color: 'var(--success)' }}>✓ Joined</span>
                    ) : (
                      <button className="px-3 py-1 rounded-lg text-xs text-white" style={{ background: 'var(--primary)' }}
                        onClick={async () => {
                          if (!user) return
                          await DB.requestJoinGroup(g.id, user.id, user.name, ['learner'])
                          toast('Join request sent!', 'success')
                        }}>Request Join</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
