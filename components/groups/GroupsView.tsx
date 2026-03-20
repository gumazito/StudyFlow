'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useToast } from '@/lib/contexts/ThemeContext'
import * as DB from '@/lib/db'
import { GROUP_TYPES, genId } from '@/lib/constants'
import { useModal } from '@/lib/contexts/ThemeContext'
import { VerificationForm } from './VerificationForm'
import { JoinRequestsPanel } from './JoinRequestsPanel'
import { searchSchools, type AustralianSchool } from '@/lib/australian-schools'
import { GlobalSpotifyBar } from '@/components/layout/GlobalSpotifyBar'
import { RoleAiBuddy } from '@/components/shared/RoleAiBuddy'

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
  const { showConfirm } = useModal()
  const [showAiBuddy, setShowAiBuddy] = useState(false)
  const [screen, setScreen] = useState<'list' | 'create' | 'manage' | 'browse'>('list')
  const [editingGroup, setEditingGroup] = useState<any>(null)
  const [allGroups, setAllGroups] = useState<any[]>([])
  const [browseSearch, setBrowseSearch] = useState('')
  const [schoolSearch, setSchoolSearch] = useState('')
  const [schoolResults, setSchoolResults] = useState<any[]>([])
  const [newGroup, setNewGroup] = useState({ type: 'school', name: '', description: '', official: false })
  const [inviteRoles, setInviteRoles] = useState(['learner'])
  const [joinRequests, setJoinRequests] = useState<any[]>([])
  const [memberSearch, setMemberSearch] = useState('')
  const [memberSearchResults, setMemberSearchResults] = useState<any[]>([])
  const memberSearchTimer = { current: null as any }

  const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }
  const inputStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }

  const loadBrowse = async () => {
    const all = await DB.getAllGroups()
    setAllGroups((all as any[]).filter(g => g.type !== 'personal'))
  }

  // Live search — filters as you type, no API calls needed
  const handleSchoolSearch = (query: string) => {
    setSchoolSearch(query)
    if (query.length >= 2) {
      setSchoolResults(searchSchools(query, 8) as any[])
    } else {
      setSchoolResults([])
    }
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
        <div className="flex items-center gap-2">
          <GlobalSpotifyBar />
          <button className="text-xs" style={{ color: 'var(--text-secondary)' }} onClick={onLogout}>Logout</button>
        </div>
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
                <input className="w-full px-3 py-2 rounded-md text-sm" style={inputStyle} value={schoolSearch} onChange={e => handleSchoolSearch(e.target.value)} placeholder="Start typing to search..." />
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

            {/* Join Requests */}
            <JoinRequestsPanel
              groupId={editingGroup.id}
              onApprove={async (r: any) => {
                await DB.respondGroupRequest(r.id, 'approved')
                await DB.addGroupMember(editingGroup.id, { userId: r.userId, email: '', name: r.userName, roles: r.requestedRoles || ['learner'], joinedAt: Date.now() })
                const updated = await DB.getGroup(editingGroup.id)
                if (updated) { setEditingGroup(updated); setMyGroups(myGroups.map(g => g.id === (updated as any).id ? updated : g)) }
                toast(`${r.userName} approved!`, 'success')
              }}
              onReject={async (r: any) => {
                await DB.respondGroupRequest(r.id, 'rejected')
                toast(`Request from ${r.userName} rejected`, 'info')
              }}
            />

            {/* Verification Section */}
            {editingGroup.official !== true && (editingGroup.type === 'school' || editingGroup.type === 'company') && (
              <div className="p-3.5 mb-3 rounded-xl" style={cardStyle}>
                <h3 className="text-sm font-bold mb-2">🏛 Official Verification</h3>
                {editingGroup.verificationStatus === 'approved' ? (
                  <div className="text-sm" style={{ color: 'var(--success)' }}>✅ This group has been verified as an official {editingGroup.type} group.</div>
                ) : editingGroup.verificationStatus === 'pending' ? (
                  <div className="text-sm" style={{ color: 'var(--warning)' }}>⏳ Verification request is being reviewed by the super admin.</div>
                ) : editingGroup.verificationStatus === 'rejected' ? (
                  <div>
                    <div className="text-sm mb-2" style={{ color: 'var(--danger)' }}>❌ Verification was not approved. You may resubmit with updated details.</div>
                    <button className="px-3 py-1 rounded-lg text-xs text-white" style={{ background: 'var(--primary)' }}
                      onClick={() => { const g = { ...editingGroup }; g.verificationStatus = null; setEditingGroup(g) }}>Resubmit</button>
                  </div>
                ) : (
                  <VerificationForm group={editingGroup} onSubmit={async (verData: any) => {
                    const updated = { ...editingGroup, verificationStatus: 'pending', verificationData: verData, official: false }
                    await DB.updateGroup(editingGroup.id, { verificationStatus: 'pending', verificationData: verData })
                    await DB.notifyAdmin({ type: 'verification_request', groupId: editingGroup.id, groupName: editingGroup.name, message: `Official verification requested for ${editingGroup.type} group: ${editingGroup.name}` })
                    setEditingGroup(updated)
                    setMyGroups(myGroups.map(g => g.id === updated.id ? updated : g))
                    toast('Verification request submitted!', 'success')
                  }} />
                )}
              </div>
            )}

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

            {/* Add member — live search */}
            <div className="p-3.5 rounded-xl" style={cardStyle}>
              <h3 className="text-sm font-bold mb-2">➕ Add Member</h3>
              <input className="w-full px-3 py-2 rounded-md text-sm" style={inputStyle} placeholder="Start typing name or email..."
                value={memberSearch}
                onChange={e => {
                  const q = e.target.value
                  setMemberSearch(q)
                  if (memberSearchTimer.current) clearTimeout(memberSearchTimer.current)
                  if (q.trim().length < 2) { setMemberSearchResults([]); return }
                  memberSearchTimer.current = setTimeout(async () => {
                    const results = await DB.searchUsers(q.trim())
                    setMemberSearchResults((results as any[]).filter(u => !(editingGroup.members || []).some((m: any) => m.userId === u.uid)))
                  }, 300)
                }}
              />
              {memberSearchResults.length > 0 && (
                <div className="mt-2 space-y-1">
                  {memberSearchResults.map((u: any) => (
                    <div key={u.uid} className="flex justify-between items-center p-2 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                      <div>
                        <div className="text-xs font-semibold">{u.name}</div>
                        <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                      <button className="px-2.5 py-1 rounded-lg text-[10px] font-semibold text-white" style={{ background: 'var(--primary)' }}
                        onClick={async () => {
                          await DB.addGroupMember(editingGroup.id, { userId: u.uid, email: u.email, name: u.name, roles: ['learner'], joinedAt: Date.now() })
                          const updated = await DB.getGroup(editingGroup.id)
                          if (updated) { setEditingGroup(updated); setMyGroups(myGroups.map(g => g.id === (updated as any).id ? updated : g)) }
                          setMemberSearchResults(prev => prev.filter(x => x.uid !== u.uid))
                          toast(`Added ${u.name}`, 'success')
                        }}>+ Add</button>
                    </div>
                  ))}
                </div>
              )}
              {memberSearch.trim().length >= 2 && memberSearchResults.length === 0 && (
                <p className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>No matching users found</p>
              )}
            </div>
          </div>
        )}

        {/* BROWSE */}
        {screen === 'browse' && (
          <div className="animate-fade-in">
            <h1 className="text-xl font-extrabold mb-4">🔍 Browse Groups</h1>
            <input className="w-full px-3 py-2.5 rounded-md text-sm mb-3" style={inputStyle} placeholder="Start typing to filter groups..."
              value={browseSearch} onChange={e => setBrowseSearch(e.target.value)} />
            {(() => {
              const q = browseSearch.toLowerCase()
              const filtered = q ? allGroups.filter(g => (g.name || '').toLowerCase().includes(q) || (g.type || '').toLowerCase().includes(q)) : allGroups
              return filtered.length === 0 ? (
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
            })
            })()}
          </div>
        )}
      </div>

      {/* AI Buddy for Group Owners — floating button */}
      {!showAiBuddy && (
        <button
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg z-50 transition-transform hover:scale-110"
          style={{ background: 'linear-gradient(135deg, #00cec9, #0984e3)', color: 'white', boxShadow: '0 4px 20px rgba(0,206,201,.4)' }}
          onClick={() => setShowAiBuddy(true)}
          title="AI Group Assistant"
        >
          👥
        </button>
      )}

      {showAiBuddy && (() => {
        const currentGroup = myGroups.find(g => g.id === activeGroup) as any
        return (
          <RoleAiBuddy
            role="group-owner"
            groupMembers={currentGroup?.members || []}
            groupName={currentGroup?.name}
            onClose={() => setShowAiBuddy(false)}
          />
        )
      })()}
    </div>
  )
}
