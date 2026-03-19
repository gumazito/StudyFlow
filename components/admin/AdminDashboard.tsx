'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useToast } from '@/lib/contexts/ThemeContext'
import * as DB from '@/lib/db'
import { SYSTEM_ADMIN_EMAIL } from '@/lib/firebase'

interface AdminDashboardProps {
  onSwitchView: (view: string | null) => void
  onLogout: () => void
}

export function AdminDashboard({ onSwitchView, onLogout }: AdminDashboardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'users' | 'notifications' | 'verifications'>('users')
  const [verificationGroups, setVerificationGroups] = useState<any[]>([])

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    const [allUsers, notifs, allGroups] = await Promise.all([
      DB.getAllUsers(), DB.getNotifications(), DB.getAllGroups()
    ])
    setUsers(allUsers as any[])
    setNotifications(notifs as any[])
    setVerificationGroups((allGroups as any[]).filter(g => g.verificationStatus === 'pending'))
    setLoading(false)
  }

  const approveUser = async (uid: string) => {
    await DB.updateUser(uid, { status: 'approved' })
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, status: 'approved' } : u))
    toast('User approved', 'success')
  }

  const rejectUser = async (uid: string) => {
    await DB.updateUser(uid, { status: 'rejected' })
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, status: 'rejected' } : u))
    toast('User rejected', 'info')
  }

  const toggleUserRole = async (uid: string, role: string) => {
    const u = users.find(x => x.uid === uid)
    if (!u) return
    const currentRoles = u.roles || []
    const newRoles = currentRoles.includes(role) ? currentRoles.filter((r: string) => r !== role) : [...currentRoles, role]
    if (newRoles.length === 0) { toast('User must have at least one role', 'error'); return }
    await DB.updateUser(uid, { roles: newRoles })
    setUsers(prev => prev.map(x => x.uid === uid ? { ...x, roles: newRoles } : x))
  }

  const handleVerification = async (group: any, approved: boolean, reason?: string) => {
    const update = approved
      ? { verificationStatus: 'approved', official: true, verifiedAt: Date.now() }
      : { verificationStatus: 'rejected', official: false, rejectionReason: reason || 'Not approved' }
    await DB.updateGroup(group.id, update)
    setVerificationGroups(prev => prev.filter(g => g.id !== group.id))
    toast(approved ? `${group.name} verified as official` : `${group.name} rejected`, approved ? 'success' : 'info')
  }

  const pendingUsers = users.filter(u => u.status === 'pending')
  const approvedUsers = users.filter(u => u.status === 'approved' || !u.status)
  const rejectedUsers = users.filter(u => u.status === 'rejected')
  const unreadNotifs = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="text-lg font-extrabold" style={{ background: 'linear-gradient(135deg, #a29bfe, #00cec9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>StudyFlow</div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(225,112,85,.15)', color: 'var(--danger)' }}>Admin</span>
          {onSwitchView && <button className="text-xs px-2 py-1" style={{ color: 'var(--text-secondary)' }} onClick={() => onSwitchView(null)}>Switch</button>}
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{user?.name}</span>
          <button className="text-xs px-2 py-1" style={{ color: 'var(--text-secondary)' }} onClick={onLogout}>Logout</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-4">
        <h1 className="text-2xl font-extrabold mb-1">🛡️ Admin Dashboard</h1>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>Manage users, approvals, and system settings</p>

        {/* Tabs */}
        <div className="flex border-b mb-4" style={{ borderColor: 'var(--border)' }}>
          <button className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${tab === 'users' ? '' : ''}`}
            style={{ borderColor: tab === 'users' ? 'var(--primary)' : 'transparent', color: tab === 'users' ? 'var(--text)' : 'var(--text-muted)' }}
            onClick={() => setTab('users')}>
            👥 Users ({users.length})
            {pendingUsers.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] text-white" style={{ background: 'var(--danger)' }}>{pendingUsers.length}</span>}
          </button>
          <button className="px-4 py-2.5 text-sm font-semibold border-b-2"
            style={{ borderColor: tab === 'notifications' ? 'var(--primary)' : 'transparent', color: tab === 'notifications' ? 'var(--text)' : 'var(--text-muted)' }}
            onClick={() => setTab('notifications')}>
            🔔 Notifications
            {unreadNotifs > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] text-white" style={{ background: 'var(--danger)' }}>{unreadNotifs}</span>}
          </button>
          <button className="px-4 py-2.5 text-sm font-semibold border-b-2"
            style={{ borderColor: tab === 'verifications' ? 'var(--primary)' : 'transparent', color: tab === 'verifications' ? 'var(--text)' : 'var(--text-muted)' }}
            onClick={() => setTab('verifications')}>
            📋 Verifications
            {verificationGroups.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] text-white" style={{ background: 'var(--warning)' }}>{verificationGroups.length}</span>}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 border-3 rounded-full mx-auto mb-4" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', borderWidth: 3, animation: 'spin 1s linear infinite' }} />
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {/* USERS TAB */}
            {tab === 'users' && (
              <div className="animate-fade-in">
                {/* Pending */}
                {pendingUsers.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-bold mb-2.5" style={{ color: 'var(--warning)' }}>⏳ Pending Approval ({pendingUsers.length})</h3>
                    {pendingUsers.map(u => (
                      <div key={u.uid} className="rounded-xl p-3.5 mb-2 border" style={{ background: 'var(--bg-card)', borderColor: 'rgba(253,203,110,.3)' }}>
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <div>
                            <div className="font-bold text-sm">{u.name || 'Unknown'}</div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</div>
                            <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                              Requested: {(u.roles || []).join(', ')} · {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''}
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--success)' }} onClick={() => approveUser(u.uid)}>✓ Approve</button>
                            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ color: 'var(--danger)', border: '1px solid var(--danger)', background: 'transparent' }} onClick={() => rejectUser(u.uid)}>✗ Reject</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Approved */}
                <h3 className="text-sm font-bold mb-2.5">✅ Active Users ({approvedUsers.length})</h3>
                {approvedUsers.map(u => (
                  <div key={u.uid} className="rounded-xl p-3 mb-1.5 border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm flex items-center gap-1.5">
                          {u.name || 'Unknown'}
                          {u.email === SYSTEM_ADMIN_EMAIL && <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(225,112,85,.15)', color: 'var(--danger)' }}>System Admin</span>}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {['learner', 'author', 'mentor', 'admin'].map(role => (
                          <button key={role} className="text-[10px] px-2.5 py-1 rounded-lg font-semibold transition-colors"
                            style={{
                              background: (u.roles || []).includes(role)
                                ? role === 'admin' ? 'var(--danger)' : role === 'author' ? 'var(--primary)' : role === 'mentor' ? '#e17055' : 'var(--accent)'
                                : 'var(--bg)',
                              color: (u.roles || []).includes(role) ? 'white' : 'var(--text-muted)',
                              border: `1px solid ${(u.roles || []).includes(role) ? 'transparent' : 'var(--border)'}`,
                            }}
                            onClick={() => toggleUserRole(u.uid, role)}>
                            {role === 'learner' ? '🎓' : role === 'author' ? '✏️' : role === 'mentor' ? '🧭' : '🛡️'} {role}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Rejected */}
                {rejectedUsers.length > 0 && (
                  <div className="mt-5">
                    <h3 className="text-sm font-bold mb-2.5" style={{ color: 'var(--text-muted)' }}>❌ Rejected ({rejectedUsers.length})</h3>
                    {rejectedUsers.map(u => (
                      <div key={u.uid} className="rounded-xl p-3 mb-1.5 border opacity-60" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-semibold">{u.name} — {u.email}</div>
                          <button className="px-3 py-1 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--success)' }} onClick={() => approveUser(u.uid)}>Reinstate</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {tab === 'notifications' && (
              <div className="animate-fade-in">
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-3">🔔</div>
                    <h3 className="text-base font-bold">No notifications</h3>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Signup requests and events will appear here</p>
                  </div>
                ) : notifications.map(n => (
                  <div key={n.id} className="rounded-xl p-3 mb-1.5 border" style={{
                    background: 'var(--bg-card)',
                    borderColor: !n.read ? 'rgba(108,92,231,.3)' : 'var(--border)',
                    opacity: n.read ? 0.7 : 1,
                  }}>
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className={`text-sm ${n.read ? 'font-normal' : 'font-semibold'}`}>{n.message}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</div>
                      </div>
                      {!n.read && (
                        <button className="text-xs px-2.5 py-1 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                          onClick={async () => { await DB.markNotificationRead(n.id); setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x)) }}>
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* VERIFICATIONS TAB */}
            {tab === 'verifications' && (
              <div className="animate-fade-in">
                {verificationGroups.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-3">📋</div>
                    <h3 className="text-base font-bold">No pending verifications</h3>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Official group requests will appear here</p>
                  </div>
                ) : verificationGroups.map(g => {
                  const v = g.verificationData || {}
                  return (
                    <div key={g.id} className="rounded-xl p-4 mb-3 border" style={{ background: 'var(--bg-card)', borderColor: 'rgba(253,203,110,.3)' }}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-extrabold text-base">{g.name}</div>
                          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{g.type}</div>
                        </div>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(253,203,110,.15)', color: 'var(--warning)' }}>Pending Review</span>
                      </div>
                      <div className="rounded-lg p-3 mb-3" style={{ background: 'var(--bg)' }}>
                        <h4 className="text-sm font-bold mb-2">📋 Submitted Details</h4>
                        <div className="text-xs leading-7">
                          <div><strong>Contact:</strong> {v.contactName || 'N/A'}</div>
                          <div><strong>Office:</strong> {v.officePhone || 'N/A'}</div>
                          <div><strong>Mobile:</strong> {v.mobile || 'N/A'}</div>
                          <div><strong>Email:</strong> {v.officialEmail || 'N/A'}</div>
                          {v.abn && <div><strong>ABN:</strong> {v.abn}</div>}
                          {v.notes && <div><strong>Notes:</strong> {v.notes}</div>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--success)' }} onClick={() => handleVerification(g, true)}>✅ Approve</button>
                        <button className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ color: 'var(--danger)', border: '1px solid var(--danger)' }}
                          onClick={() => { const r = window.prompt('Rejection reason:'); handleVerification(g, false, r || '') }}>❌ Reject</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
