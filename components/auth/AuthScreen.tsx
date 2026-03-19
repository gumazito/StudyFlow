'use client'
import { useState } from 'react'
import { useAuth, dobToYearLevel } from '@/lib/contexts/AuthContext'
import { useToast } from '@/lib/contexts/ThemeContext'

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['learner'])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)
  const { login, signup, resetPassword } = useAuth()
  const { toast } = useToast()

  const toggleRole = (r: string) => {
    setSelectedRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])
  }

  const handleLogin = async () => {
    if (!email || !password) { setError('Please enter email and password'); return }
    setBusy(true); setError('')
    try { await login(email, password) }
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
            <button className="w-full py-3.5 rounded-lg text-sm font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }} onClick={handleLogin} disabled={busy}>
              {busy ? 'Logging in...' : '\uD83D\uDD10 Log In'}
            </button>
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
            <button className="w-full py-3.5 rounded-lg text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }} onClick={handleSignup} disabled={busy}>
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
