'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useToast } from '@/lib/contexts/ThemeContext'
import * as DB from '@/lib/db'

interface NotificationPreferencesProps {
  cardStyle: any
}

/**
 * Notification preferences panel for Profile screen.
 * Per-channel (email, push, SMS) and per-type toggles.
 */
export function NotificationPreferences({ cardStyle }: NotificationPreferencesProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [prefs, setPrefs] = useState({
    email: true,
    push: true,
    sms: false,
    emailNotifications: true,
    // Per-type
    newCourse: true,
    testReminder: true,
    weeklyDigest: true,
    streakAlert: true,
    mentorActivity: true,
    socialActivity: true,
    // DND
    dndEnabled: false,
    dndStart: '22:00',
    dndEnd: '07:00',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    DB.getUser(user.id).then((u: any) => {
      if (u?.notificationPrefs) {
        setPrefs(prev => ({ ...prev, ...u.notificationPrefs }))
      }
    })
  }, [user?.id])

  const save = async () => {
    if (!user?.id) return
    setSaving(true)
    try {
      await DB.updateUser(user.id, { notificationPrefs: prefs, emailNotifications: prefs.email && prefs.emailNotifications })
      toast('Notification preferences saved', 'success')
    } catch (e: any) {
      toast('Failed to save: ' + e.message, 'error')
    }
    setSaving(false)
  }

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      className="w-10 h-5 rounded-full relative transition-colors flex-shrink-0"
      style={{ background: value ? 'var(--primary)' : 'var(--border)' }}
    >
      <div className="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all" style={{ left: value ? 21 : 2 }} />
    </button>
  )

  const channels = [
    { key: 'email', label: 'Email', emoji: '📧', desc: 'Course updates, weekly digest' },
    { key: 'push', label: 'Push notifications', emoji: '🔔', desc: 'Study reminders, streak alerts' },
    { key: 'sms', label: 'SMS', emoji: '💬', desc: 'Critical alerts only' },
  ]

  const types = [
    { key: 'newCourse', label: 'New courses', emoji: '📚' },
    { key: 'testReminder', label: 'Study reminders', emoji: '⏰' },
    { key: 'weeklyDigest', label: 'Weekly progress digest', emoji: '📊' },
    { key: 'streakAlert', label: 'Streak about to break', emoji: '🔥' },
    { key: 'mentorActivity', label: 'Mentor/mentee activity', emoji: '🧭' },
    { key: 'socialActivity', label: 'Follows, cheers, badges', emoji: '👥' },
  ]

  return (
    <div className="rounded-xl p-4" style={cardStyle}>
      <h3 className="text-sm font-bold mb-3">🔔 Notification Preferences</h3>

      {/* Channels */}
      <div className="mb-3">
        <label className="text-[10px] font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>Channels</label>
        <div className="space-y-2">
          {channels.map(ch => (
            <div key={ch.key} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'var(--bg)' }}>
              <span>{ch.emoji}</span>
              <div className="flex-1">
                <div className="text-xs font-semibold">{ch.label}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{ch.desc}</div>
              </div>
              <Toggle value={prefs[ch.key as keyof typeof prefs] as boolean} onChange={(v) => setPrefs(p => ({ ...p, [ch.key]: v }))} />
            </div>
          ))}
        </div>
      </div>

      {/* Notification types */}
      <div className="mb-3">
        <label className="text-[10px] font-semibold uppercase tracking-wider block mb-2" style={{ color: 'var(--text-muted)' }}>Types</label>
        <div className="space-y-1.5">
          {types.map(t => (
            <div key={t.key} className="flex items-center gap-3 px-3 py-1.5 rounded-lg" style={{ background: 'var(--bg)' }}>
              <span>{t.emoji}</span>
              <div className="flex-1 text-xs">{t.label}</div>
              <Toggle value={prefs[t.key as keyof typeof prefs] as boolean} onChange={(v) => setPrefs(p => ({ ...p, [t.key]: v }))} />
            </div>
          ))}
        </div>
      </div>

      {/* Do Not Disturb */}
      <div className="mb-3">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'var(--bg)' }}>
          <span>🌙</span>
          <div className="flex-1">
            <div className="text-xs font-semibold">Do Not Disturb</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Silence notifications during sleep hours</div>
          </div>
          <Toggle value={prefs.dndEnabled} onChange={(v) => setPrefs(p => ({ ...p, dndEnabled: v }))} />
        </div>
        {prefs.dndEnabled && (
          <div className="flex gap-2 mt-1.5 px-3">
            <div className="flex-1">
              <label className="text-[10px] block mb-0.5" style={{ color: 'var(--text-muted)' }}>From</label>
              <input type="time" className="w-full px-2 py-1 rounded text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
                value={prefs.dndStart} onChange={e => setPrefs(p => ({ ...p, dndStart: e.target.value }))} />
            </div>
            <div className="flex-1">
              <label className="text-[10px] block mb-0.5" style={{ color: 'var(--text-muted)' }}>To</label>
              <input type="time" className="w-full px-2 py-1 rounded text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
                value={prefs.dndEnd} onChange={e => setPrefs(p => ({ ...p, dndEnd: e.target.value }))} />
            </div>
          </div>
        )}
      </div>

      <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: saving ? 'var(--text-muted)' : 'var(--primary)' }}>
        {saving ? 'Saving...' : '💾 Save Preferences'}
      </button>
    </div>
  )
}
