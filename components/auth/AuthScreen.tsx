'use client'
import { useState } from 'react'
import { useAuth, dobToYearLevel } from '@/lib/contexts/AuthContext'
import { useToast } from '@/lib/contexts/ThemeContext'
import { auth } from '@/lib/firebase'
import { setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth'

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['learner'])
  const [tosAccepted, setTosAccepted] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const { login, signup, resetPassword, loginWithGoogle, loginWithApple, loginWithMicrosoft } = useAuth()
  const { toast } = useToast()

  const toggleRole = (r: string) => {
    setSelectedRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])
  }

  const handleLogin = async () => {
    if (!email || !password) { setError('Please enter email and password'); return }
    setBusy(true); setError('')
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence)
      await login(email, password)
    }
    catch (e: any) {
      setError(e.code === 'auth/invalid-credential' ? 'Incorrect email or password' :
        e.code === 'auth/user-not-found' ? 'No account found' :
        'Login failed: ' + e.message)
    }
    setBusy(false)
  }

  const handleSignup = async () => {
    if (!name.trim()) { setError('Please enter your name'); return }
    if (!email || !password) { setError('Please enter email and password'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (selectedRoles.length === 0) { setError('Please select at least one role'); return }
    if (!tosAccepted) { setError('You must accept the Terms of Service and Privacy Policy'); return }
    setBusy(true); setError('')
    try { await signup(email, password, name.trim(), selectedRoles, dob || undefined) }
    catch (e: any) {
      setError(e.code === 'auth/email-already-in-use' ? 'An account with that email already exists' :
        e.code === 'auth/weak-password' ? 'Password is too weak' :
        'Signup failed: ' + e.message)
    }
    setBusy(false)
  }

  const handleForgot = async () => {
    if (!email) { setError('Please enter your email'); return }
    setBusy(true); setError('')
    try { await resetPassword(email); setSuccess('Password reset email sent!') }
    catch (e: any) { setError('Failed: ' + e.message) }
    setBusy(false)
  }

  const inputClass = "w-full px-3.5 py-3 rounded-md text-sm transition-colors duration-200 focus:outline-none"
  const inputStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }

  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black" style={{
            background: 'linear-gradient(135deg, #a29bfe, #00cec9)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>StudyFlow</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Interactive learning for high school students</p>
        </div>

        {error && <div className="rounded-md px-3.5 py-2.5 text-sm mb-3.5" style={{ background: 'rgba(225,112,85,.1)', border: '1px solid rgba(225,112,85,.3)', color: 'var(--danger)' }}>{error}</div>}
        {success && <div className="rounded-md px-3.5 py-2.5 text-sm mb-3.5" style={{ background: 'rgba(0,184,148,.1)', border: '1px solid rgba(0,184,148,.3)', color: 'var(--success)' }}>{success}</div>}

        {mode === 'login' && (
          <>
            <div className="mb-3.5">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" className={inputClass} style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <div className="mb-3.5">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <input type="password" className={inputClass} style={inputStyle} value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" onKeyDown={e => { if (e.key === 'Enter') handleLogin() }} />
            </div>
            <label className="flex items-center gap-2 mb-3 cursor-pointer">
              <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="rounded" />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Remember me</span>
            </label>
            <button className="w-full py-3.5 rounded-lg text-sm font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }} onClick={handleLogin} disabled={busy}>
              {busy ? 'Logging in...' : '\uD83D\uDD10 Log In'}
            </button>

            {/* Social login divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>or continue with</span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>

            <div className="flex gap-2">
              <button className="flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onClick={async () => { setBusy(true); setError(''); try { await loginWithGoogle() } catch (e: any) { setError(e.message) } setBusy(false) }} disabled={busy}>
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </button>
              <button className="flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onClick={async () => { setBusy(true); setError(''); try { await loginWithApple() } catch (e: any) { setError(e.message) } setBusy(false) }} disabled={busy}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                Apple
              </button>
              <button className="flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
                onClick={async () => { setBusy(true); setError(''); try { await loginWithMicrosoft() } catch (e: any) { setError(e.message) } setBusy(false) }} disabled={busy}>
                <svg width="16" height="16" viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>
                Microsoft
              </button>
            </div>

            <div className="text-center mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
              <button className="underline" style={{ color: 'var(--primary-light, #a29bfe)' }} onClick={() => { setError(''); setSuccess(''); setMode('forgot') }}>Forgot password?</button>
              {' \u00B7 '}
              <button className="underline" style={{ color: 'var(--primary-light, #a29bfe)' }} onClick={() => { setError(''); setSuccess(''); setMode('signup') }}>Create account</button>
            </div>
          </>
        )}

        {mode === 'signup' && (
          <>
            <div className="mb-3.5">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Your Name</label>
              <input className={inputClass} style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" />
            </div>
            <div className="mb-3.5">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Date of Birth</label>
              <input type="date" className={inputClass} style={{ ...inputStyle, colorScheme: 'dark' }} value={dob} onChange={e => setDob(e.target.value)} />
              {dob && <p className="text-xs mt-1" style={{ color: 'var(--accent)' }}>Auto-detected: {dobToYearLevel(dob)}</p>}
            </div>
            <div className="mb-3.5">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" className={inputClass} style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <div className="mb-3.5">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
              <input type="password" className={inputClass} style={inputStyle} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <div className="mb-3.5">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>I want to... (select all that apply)</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'learner', icon: '\uD83C\uDF93', name: 'Learner', desc: 'Take courses' },
                  { id: 'author', icon: '\u270F\uFE0F', name: 'Publisher', desc: 'Create courses' },
                  { id: 'mentor', icon: '\uD83E\uDDED', name: 'Mentor', desc: 'Guide learners' },
                ].map(role => (
                  <button key={role.id} onClick={() => toggleRole(role.id)}
                    className="p-3 rounded-lg text-center transition-all"
                    style={{
                      border: `2px solid ${selectedRoles.includes(role.id) ? 'var(--primary)' : 'var(--border)'}`,
                      background: selectedRoles.includes(role.id) ? 'rgba(108,92,231,.08)' : 'var(--bg-card)',
                    }}>
                    <div className="text-2xl">{role.icon}</div>
                    <div className="text-xs font-bold mt-1">{role.name}</div>
                    <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{role.desc}</div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>Select all that apply. An admin will review your account.</p>
            </div>

            {/* Terms of Service acceptance */}
            <div className="mb-3.5">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tosAccepted}
                  onChange={e => setTosAccepted(e.target.checked)}
                  className="mt-0.5 flex-shrink-0"
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span className="text-[11px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  I agree to the{' '}
                  <a href="/terms" target="_blank" className="underline" style={{ color: 'var(--primary)' }}>Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" target="_blank" className="underline" style={{ color: 'var(--primary)' }}>Privacy Policy</a>.
                  {dob && new Date().getFullYear() - new Date(dob).getFullYear() < 13 && (
                    <span className="block mt-1" style={{ color: 'var(--warning)' }}>
                      Users under 13 require parental consent. A parent or guardian must create this account.
                    </span>
                  )}
                </span>
              </label>
            </div>

            <button className="w-full py-3.5 rounded-lg text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', opacity: !tosAccepted ? 0.5 : 1 }} onClick={handleSignup} disabled={busy || !tosAccepted}>
              {busy ? 'Creating account...' : '\uD83D\uDE80 Create Account'}
            </button>
            <div className="text-center mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
              Already have an account? <button className="underline" style={{ color: 'var(--primary-light, #a29bfe)' }} onClick={() => { setError(''); setMode('login') }}>Log in</button>
            </div>
          </>
        )}

        {mode === 'forgot' && (
          <>
            <div className="mb-3.5">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" className={inputClass} style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
            </div>
            <button className="w-full py-3.5 rounded-lg text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }} onClick={handleForgot} disabled={busy}>
              {busy ? 'Sending...' : '\uD83D\uDCE7 Send Reset Email'}
            </button>
            <div className="text-center mt-4 text-sm">
              <button className="underline" style={{ color: 'var(--primary-light, #a29bfe)' }} onClick={() => { setError(''); setSuccess(''); setMode('login') }}>Back to login</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
