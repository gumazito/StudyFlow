'use client'
import { useState } from 'react'
import { useAuth, dobToYearLevel } from '@/lib/contexts/AuthContext'
import { useToast } from '@/lib/contexts/ThemeContext'
import * as DB from '@/lib/db'

interface ProfileScreenProps {
  onBack: () => void
  onLogout: () => void
}

export function ProfileScreen({ onBack, onLogout }: ProfileScreenProps) {
  const { user, updateProfile, changeEmail, changePassword, deleteAccount } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState(user?.name || '')
  const [dob, setDob] = useState(user?.dob || '')
  const [newEmail, setNewEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [requestedRoles, setRequestedRoles] = useState<string[]>([])

  const allRoles = ['learner', 'author', 'mentor']
  const currentRoles = user?.roles || []

  const inputClass = "w-full px-3.5 py-2.5 rounded-md text-sm"
  const inputStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }
  const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }

  const saveName = async () => {
    if (!name.trim()) return
    setBusy(true)
    try {
      await updateProfile({ name: name.trim() } as any)
      toast('Name updated', 'success')
    } catch (e: any) { toast('Failed: ' + e.message, 'error') }
    setBusy(false)
  }

  const saveDob = async () => {
    if (!dob) return
    setBusy(true)
    try {
      const yearLevel = dobToYearLevel(dob) || undefined
      await updateProfile({ dob, yearLevel } as any)
      toast(`DOB updated — ${yearLevel}`, 'success')
    } catch (e: any) { toast('Failed: ' + e.message, 'error') }
    setBusy(false)
  }

  const handleChangeEmail = async () => {
    if (!newEmail.trim() || !currentPassword) { toast('Enter new email and current password', 'error'); return }
    setBusy(true)
    try {
      await changeEmail(newEmail.trim(), currentPassword)
      toast('Email updated', 'success')
      setNewEmail(''); setCurrentPassword('')
    } catch (e: any) {
      toast(e.code === 'auth/wrong-password' ? 'Incorrect password' : 'Failed: ' + e.message, 'error')
    }
    setBusy(false)
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) { toast('Enter current and new password', 'error'); return }
    if (newPassword.length < 6) { toast('Password must be 6+ characters', 'error'); return }
    if (newPassword !== confirmPassword) { toast('Passwords do not match', 'error'); return }
    setBusy(true)
    try {
      await changePassword(currentPassword, newPassword)
      toast('Password changed', 'success')
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
    } catch (e: any) {
      toast(e.code === 'auth/wrong-password' ? 'Incorrect password' : 'Failed: ' + e.message, 'error')
    }
    setBusy(false)
  }

  const handleRoleRequest = async () => {
    const newRoles = requestedRoles.filter(r => !currentRoles.includes(r))
    if (newRoles.length === 0) { toast('You already have all selected roles', 'info'); return }
    setBusy(true)
    try {
      await DB.notifyAdmin({
        type: 'role_request', userId: user!.id, userName: user!.name, userEmail: user!.email,
        requestedRoles: newRoles,
        message: `${user!.name} (${user!.email}) requesting: ${newRoles.join(', ')}`
      })
      toast(`Role request submitted: ${newRoles.join(', ')}`, 'success')
      setRequestedRoles([])
    } catch (e: any) { toast('Failed: ' + e.message, 'error') }
    setBusy(false)
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('DELETE your account and ALL data? This cannot be undone.')) return
    if (!window.confirm('FINAL WARNING: All test history, progress, badges, and data will be permanently removed.')) return
    setBusy(true)
    try {
      await deleteAccount()
      toast('Account deleted', 'info')
    } catch (e: any) { toast('Failed: ' + e.message + '. Try logging out and back in first.', 'error') }
    setBusy(false)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
        <button className="text-sm" style={{ color: 'var(--text-secondary)' }} onClick={onBack}>← Back</button>
        <div className="text-lg font-extrabold" style={{ background: 'linear-gradient(135deg, #a29bfe, #00cec9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>StudyFlow</div>
        <button className="text-xs" style={{ color: 'var(--text-secondary)' }} onClick={onLogout}>Logout</button>
      </nav>

      <div className="max-w-xl mx-auto px-4 py-4">
        <h1 className="text-2xl font-extrabold mb-1">⚙️ My Profile</h1>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>Manage your account settings</p>

        {/* Account info */}
        <div className="p-3.5 mb-3 rounded-xl" style={cardStyle}>
          <h3 className="text-sm font-bold mb-1">Account</h3>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Email: {user?.email}</div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Roles: {currentRoles.map(r => r === 'learner' ? '🎓' : r === 'author' ? '✏️' : r === 'mentor' ? '🧭' : r === 'admin' ? '🛡️' : r).join(' ')}</div>
          {user?.yearLevel && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Year Level: {user.yearLevel}</div>}
        </div>

        {/* Edit name */}
        <div className="p-3.5 mb-3 rounded-xl" style={cardStyle}>
          <h3 className="text-sm font-bold mb-2">✏️ Name</h3>
          <div className="flex gap-2">
            <input className={inputClass} style={inputStyle} value={name} onChange={e => setName(e.target.value)} />
            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--primary)' }} onClick={saveName} disabled={busy || name.trim() === user?.name}>Save</button>
          </div>
        </div>

        {/* Edit DOB */}
        <div className="p-3.5 mb-3 rounded-xl" style={cardStyle}>
          <h3 className="text-sm font-bold mb-2">🎂 Date of Birth</h3>
          <div className="flex gap-2 items-center">
            <input type="date" className={inputClass} style={{ ...inputStyle, colorScheme: 'dark' }} value={dob} onChange={e => setDob(e.target.value)} />
            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--primary)' }} onClick={saveDob} disabled={busy || !dob}>Save</button>
          </div>
          {dob && <p className="text-xs mt-1" style={{ color: 'var(--accent)' }}>Year level: {dobToYearLevel(dob)}</p>}
        </div>

        {/* Change email */}
        <div className="p-3.5 mb-3 rounded-xl" style={cardStyle}>
          <h3 className="text-sm font-bold mb-2">📧 Change Email</h3>
          <input className={inputClass + ' mb-2'} style={inputStyle} type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="New email address" />
          <input className={inputClass + ' mb-2'} style={inputStyle} type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current password (required)" />
          <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--primary)' }} onClick={handleChangeEmail} disabled={busy || !newEmail.trim()}>Update Email</button>
        </div>

        {/* Change password */}
        <div className="p-3.5 mb-3 rounded-xl" style={cardStyle}>
          <h3 className="text-sm font-bold mb-2">🔒 Change Password</h3>
          <input className={inputClass + ' mb-2'} style={inputStyle} type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current password" />
          <input className={inputClass + ' mb-2'} style={inputStyle} type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New password (min 6 chars)" />
          <input className={inputClass + ' mb-2'} style={inputStyle} type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
          <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--primary)' }} onClick={handleChangePassword} disabled={busy || !currentPassword || !newPassword}>Change Password</button>
        </div>

        {/* Request roles */}
        <div className="p-3.5 mb-3 rounded-xl" style={cardStyle}>
          <h3 className="text-sm font-bold mb-2">🎭 Request Additional Roles</h3>
          <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Select roles to request. An admin will review.</p>
          <div className="flex gap-1.5 flex-wrap mb-2">
            {allRoles.map(role => {
              const has = currentRoles.includes(role)
              const req = requestedRoles.includes(role)
              return (
                <button key={role} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                  style={{
                    background: has ? 'rgba(0,184,148,.15)' : req ? 'var(--primary)' : 'var(--bg)',
                    color: has ? 'var(--success)' : req ? 'white' : 'var(--text-muted)',
                    border: `1px solid ${has ? 'var(--success)' : req ? 'var(--primary)' : 'var(--border)'}`,
                    cursor: has ? 'default' : 'pointer',
                  }}
                  onClick={() => { if (!has) setRequestedRoles(p => p.includes(role) ? p.filter(r => r !== role) : [...p, role]) }}>
                  {role === 'learner' ? '🎓' : role === 'author' ? '✏️' : '🧭'} {role}{has ? ' ✓' : ''}
                </button>
              )
            })}
          </div>
          {requestedRoles.filter(r => !currentRoles.includes(r)).length > 0 && (
            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--primary)' }} onClick={handleRoleRequest} disabled={busy}>
              📤 Submit Request ({requestedRoles.filter(r => !currentRoles.includes(r)).length} new)
            </button>
          )}
        </div>

        {/* Danger zone */}
        <div className="p-3.5 mb-10 rounded-xl" style={{ ...cardStyle, borderColor: 'rgba(225,112,85,.3)' }}>
          <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--danger)' }}>⚠️ Account</h3>
          <div className="flex gap-2 flex-wrap">
            <button className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} onClick={onLogout}>Log Out</button>
            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ color: 'var(--danger)', border: '1px solid var(--danger)', background: 'transparent' }} onClick={handleDeleteAccount} disabled={busy}>🗑️ Delete Account & Data</button>
          </div>
          <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>Deleting removes all data, results, progress. Complies with right-to-be-forgotten.</p>
        </div>
      </div>
    </div>
  )
}
