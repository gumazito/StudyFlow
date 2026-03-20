'use client'

import { useState } from 'react'
import { useToast } from '@/lib/contexts/ThemeContext'
import { sendEmail, sendSms, sendPush, sendPushToAll } from '@/lib/cloud-functions'

interface NotificationSenderProps {
  cardStyle: any
  inputStyle: any
}

/**
 * Admin notification sender — email, SMS, and push notifications.
 * Accessible from the Admin Dashboard.
 */
export function NotificationSender({ cardStyle, inputStyle }: NotificationSenderProps) {
  const { toast } = useToast()
  const [tab, setTab] = useState<'email' | 'sms' | 'push'>('email')
  const [sending, setSending] = useState(false)

  // Email
  const [emailTo, setEmailTo] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')

  // SMS
  const [smsTo, setSmsTo] = useState('')
  const [smsBody, setSmsBody] = useState('')

  // Push
  const [pushTarget, setPushTarget] = useState<'all' | 'user'>('all')
  const [pushUserId, setPushUserId] = useState('')
  const [pushTitle, setPushTitle] = useState('')
  const [pushBody, setPushBody] = useState('')

  const handleSendEmail = async () => {
    if (!emailTo || !emailSubject || !emailBody) {
      toast('Fill in all email fields', 'error')
      return
    }
    setSending(true)
    try {
      const html = `<div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6C5CE7;">${emailSubject}</h2>
        <div>${emailBody.replace(/\n/g, '<br>')}</div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
        <p style="color: #888; font-size: 12px;">Sent via StudyFlow Admin</p>
      </div>`
      await sendEmail(emailTo, emailSubject, html)
      toast('Email sent!', 'success')
      setEmailTo('')
      setEmailSubject('')
      setEmailBody('')
    } catch (err: any) {
      toast(err.message || 'Email failed', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleSendSms = async () => {
    if (!smsTo || !smsBody) {
      toast('Fill in all SMS fields', 'error')
      return
    }
    setSending(true)
    try {
      await sendSms(smsTo, smsBody)
      toast('SMS sent!', 'success')
      setSmsTo('')
      setSmsBody('')
    } catch (err: any) {
      toast(err.message || 'SMS failed', 'error')
    } finally {
      setSending(false)
    }
  }

  const handleSendPush = async () => {
    if (!pushTitle || !pushBody) {
      toast('Fill in title and body', 'error')
      return
    }
    setSending(true)
    try {
      if (pushTarget === 'all') {
        const result = await sendPushToAll(pushTitle, pushBody)
        toast(`Push sent to ${result.sent} devices`, 'success')
      } else {
        if (!pushUserId) {
          toast('Enter a user ID', 'error')
          return
        }
        await sendPush(pushUserId, pushTitle, pushBody)
        toast('Push sent!', 'success')
      }
      setPushTitle('')
      setPushBody('')
      setPushUserId('')
    } catch (err: any) {
      toast(err.message || 'Push failed', 'error')
    } finally {
      setSending(false)
    }
  }

  const tabs = [
    { id: 'email' as const, label: '📧 Email', color: '#6C5CE7' },
    { id: 'sms' as const, label: '💬 SMS', color: '#00b894' },
    { id: 'push' as const, label: '🔔 Push', color: '#fdcb6e' },
  ]

  return (
    <div className="rounded-xl p-4" style={cardStyle}>
      <h3 className="text-sm font-bold mb-3">📢 Send Notifications</h3>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-3">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              background: tab === t.id ? t.color : 'var(--bg)',
              color: tab === t.id ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${tab === t.id ? t.color : 'var(--border)'}`,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Email form */}
      {tab === 'email' && (
        <div className="space-y-2">
          <input
            className="w-full px-3 py-2 rounded-md text-sm"
            style={inputStyle}
            placeholder="Recipient email"
            value={emailTo}
            onChange={e => setEmailTo(e.target.value)}
          />
          <input
            className="w-full px-3 py-2 rounded-md text-sm"
            style={inputStyle}
            placeholder="Subject"
            value={emailSubject}
            onChange={e => setEmailSubject(e.target.value)}
          />
          <textarea
            className="w-full px-3 py-2 rounded-md text-sm"
            style={{ ...inputStyle, minHeight: 80 }}
            placeholder="Message body..."
            value={emailBody}
            onChange={e => setEmailBody(e.target.value)}
          />
          <button
            onClick={handleSendEmail}
            disabled={sending}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white"
            style={{ background: sending ? 'var(--text-muted)' : '#6C5CE7' }}
          >
            {sending ? 'Sending...' : '📧 Send Email'}
          </button>
        </div>
      )}

      {/* SMS form */}
      {tab === 'sms' && (
        <div className="space-y-2">
          <input
            className="w-full px-3 py-2 rounded-md text-sm"
            style={inputStyle}
            placeholder="Phone number (+61...)"
            value={smsTo}
            onChange={e => setSmsTo(e.target.value)}
          />
          <textarea
            className="w-full px-3 py-2 rounded-md text-sm"
            style={{ ...inputStyle, minHeight: 60 }}
            placeholder="SMS message (160 chars recommended)..."
            value={smsBody}
            onChange={e => setSmsBody(e.target.value)}
            maxLength={320}
          />
          <div className="text-[10px] text-right" style={{ color: 'var(--text-muted)' }}>
            {smsBody.length}/320
          </div>
          <button
            onClick={handleSendSms}
            disabled={sending}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white"
            style={{ background: sending ? 'var(--text-muted)' : '#00b894' }}
          >
            {sending ? 'Sending...' : '💬 Send SMS'}
          </button>
        </div>
      )}

      {/* Push form */}
      {tab === 'push' && (
        <div className="space-y-2">
          <div className="flex gap-2 mb-1">
            <button
              onClick={() => setPushTarget('all')}
              className="px-3 py-1 rounded-lg text-[11px]"
              style={{
                background: pushTarget === 'all' ? 'var(--primary)' : 'var(--bg)',
                color: pushTarget === 'all' ? 'white' : 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              All Users
            </button>
            <button
              onClick={() => setPushTarget('user')}
              className="px-3 py-1 rounded-lg text-[11px]"
              style={{
                background: pushTarget === 'user' ? 'var(--primary)' : 'var(--bg)',
                color: pushTarget === 'user' ? 'white' : 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              Specific User
            </button>
          </div>
          {pushTarget === 'user' && (
            <input
              className="w-full px-3 py-2 rounded-md text-sm"
              style={inputStyle}
              placeholder="User ID"
              value={pushUserId}
              onChange={e => setPushUserId(e.target.value)}
            />
          )}
          <input
            className="w-full px-3 py-2 rounded-md text-sm"
            style={inputStyle}
            placeholder="Notification title"
            value={pushTitle}
            onChange={e => setPushTitle(e.target.value)}
          />
          <textarea
            className="w-full px-3 py-2 rounded-md text-sm"
            style={{ ...inputStyle, minHeight: 60 }}
            placeholder="Notification body..."
            value={pushBody}
            onChange={e => setPushBody(e.target.value)}
          />
          <button
            onClick={handleSendPush}
            disabled={sending}
            className="px-4 py-2 rounded-lg text-xs font-bold text-white"
            style={{ background: sending ? 'var(--text-muted)' : '#fdcb6e', color: sending ? 'white' : '#333' }}
          >
            {sending ? 'Sending...' : '🔔 Send Push'}
          </button>
        </div>
      )}
    </div>
  )
}
