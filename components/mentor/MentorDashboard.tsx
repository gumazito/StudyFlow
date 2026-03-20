'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useToast } from '@/lib/contexts/ThemeContext'
import * as DB from '@/lib/db'
import { GlobalSpotifyBar } from '@/components/layout/GlobalSpotifyBar'
import { RoleAiBuddy } from '@/components/shared/RoleAiBuddy'

interface MentorDashboardProps {
  onSwitchView: ((view: string | null) => void) | null
  onLogout: () => void
}

export function MentorDashboard({ onSwitchView, onLogout }: MentorDashboardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [mentees, setMentees] = useState<any[]>([])
  const [menteeData, setMenteeData] = useState<Record<string, any>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAiBuddy, setShowAiBuddy] = useState(false)
  const [selectedMentee, setSelectedMentee] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) return
    const menteeIds = await DB.getMentees(user.id)
    const allUsers = await DB.getAllUsers()
    const menteeUsers = (allUsers as any[]).filter(u => menteeIds.includes(u.uid))
    setMentees(menteeUsers)

    const data: Record<string, any> = {}
    for (const m of menteeUsers) {
      const [results, progress, gam] = await Promise.all([
        DB.getTestResultsForUser(m.uid),
        DB.getLearnerProgress(m.uid),
        DB.getGamification(m.uid),
      ])
      data[m.uid] = { results, progress, gam }
    }
    setMenteeData(data)
    setLoading(false)
  }

  // Live search with debounce
  const searchTimerRef = { current: null as any }
  const searchForLearner = async (query?: string) => {
    const q = (query ?? searchQuery).trim()
    if (!q || q.length < 2) { setSearchResults([]); return }
    const results = await DB.searchUsers(q)
    setSearchResults((results as any[]).filter(u => u.uid !== user?.id))
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => searchForLearner(value), 300)
  }

  const requestMentee = async (learner: any) => {
    if (!user) return
    await DB.sendMentorRequest(user.id, user.name, learner.uid)
    toast(`Mentor request sent to ${learner.name}`, 'success')
    setSearchQuery('')
    setSearchResults([])
  }

  const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="text-lg font-extrabold" style={{ background: 'linear-gradient(135deg, #a29bfe, #00cec9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>StudyFlow</div>
        <div className="flex items-center gap-2">
          <GlobalSpotifyBar />
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(225,112,85,.15)', color: '#fdcb6e' }}>Mentor</span>
          {onSwitchView && <button className="text-xs px-2 py-1" style={{ color: 'var(--text-secondary)' }} onClick={() => onSwitchView(null)}>Switch</button>}
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{user?.name}</span>
          <button className="text-xs px-2 py-1" style={{ color: 'var(--text-secondary)' }} onClick={onLogout}>Logout</button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-4">
        <h1 className="text-2xl font-extrabold mb-1">🧭 Mentor Dashboard</h1>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>Track and guide your learners</p>

        {/* Search & add */}
        <div className="p-3.5 mb-4 rounded-xl" style={cardStyle}>
          <h3 className="text-sm font-bold mb-2">Add a Learner</h3>
          <div className="flex gap-2">
            <input className="flex-1 px-3 py-2 rounded-md text-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              value={searchQuery} onChange={e => handleSearchChange(e.target.value)} placeholder="Start typing to search learners..." />
          </div>
          {searchResults.map(u => (
            <div key={u.uid} className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <div>
                <div className="font-semibold text-sm">{u.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</div>
              </div>
              <button className="px-3 py-1 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--primary)' }} onClick={() => requestMentee(u)}>Request</button>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-10">
            <div className="w-10 h-10 rounded-full mx-auto mb-3" style={{ borderWidth: 3, borderColor: 'var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <>
            <h3 className="text-base font-bold mb-2.5">My Mentees ({mentees.length})</h3>
            {mentees.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">🧭</div>
                <h3 className="text-base font-bold">No mentees yet</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Search above to send a mentor request</p>
              </div>
            ) : mentees.map(m => {
              const d = menteeData[m.uid] || { results: [], progress: [], gam: {} }
              const avg = d.results.length ? Math.round(d.results.reduce((a: number, r: any) => a + (r.correct / r.total) * 100, 0) / d.results.length) : 0
              return (
                <div key={m.uid} className="p-3.5 mb-2 rounded-xl cursor-pointer transition-all" style={cardStyle}
                  onClick={() => setSelectedMentee(selectedMentee === m.uid ? null : m.uid)}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-base">{m.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {m.email} · Level {d.gam.level || 1} · {d.gam.streak || 0} day streak {(d.gam.streak || 0) >= 3 ? '🔥' : ''}
                      </div>
                    </div>
                    <div className="flex gap-2.5">
                      <div className="text-center">
                        <div className="text-lg font-extrabold" style={{ color: 'var(--primary-light, #a29bfe)' }}>{d.results.length}</div>
                        <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Tests</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-extrabold" style={{ color: avg >= 70 ? 'var(--success)' : 'var(--warning)' }}>{avg}%</div>
                        <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Avg</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-extrabold" style={{ color: 'var(--accent)' }}>{d.progress.length}</div>
                        <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Courses</div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {selectedMentee === m.uid && (
                    <div className="mt-3 pt-3 border-t animate-fade-in" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex gap-2 flex-wrap mb-2.5">
                        {[
                          { label: 'XP', value: d.gam.xp || 0 },
                          { label: 'Best streak', value: `${d.gam.bestStreak || 0} days` },
                          { label: 'Badges', value: (d.gam.badges || []).length },
                          { label: 'Completed', value: `${d.progress.filter((p: any) => p.completed).length} courses` },
                        ].map((s, i) => (
                          <div key={i} className="px-3 py-1.5 rounded-md text-xs" style={{ background: 'var(--bg)' }}>
                            <strong>{s.label}:</strong> {s.value}
                          </div>
                        ))}
                      </div>
                      <h4 className="text-sm font-bold mb-1.5">Recent Tests</h4>
                      {d.results.slice(0, 10).map((r: any, i: number) => (
                        <div key={i} className="flex justify-between py-1 text-xs border-b" style={{ borderColor: 'var(--border)' }}>
                          <span>{r.packageName || 'Course'} — {r.correct}/{r.total}</span>
                          <span className="font-bold" style={{ color: r.score >= 70 ? 'var(--success)' : 'var(--danger)' }}>{r.score}%</span>
                        </div>
                      ))}
                      {d.results.length === 0 && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No tests taken yet</p>}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}
      </div>
      {/* AI Buddy floating button */}
      {!showAiBuddy && (
        <button
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg z-50 transition-transform hover:scale-110"
          style={{ background: 'linear-gradient(135deg, #e17055, #fdcb6e)', color: 'white', boxShadow: '0 4px 20px rgba(225,112,85,.4)' }}
          onClick={() => setShowAiBuddy(true)}
          title="AI Mentor Assistant"
        >
          🧭
        </button>
      )}

      {/* AI Buddy overlay */}
      {showAiBuddy && (
        <RoleAiBuddy
          role="mentor"
          mentees={mentees.map(m => ({ ...m, ...menteeData[m.userId] }))}
          testResults={Object.values(menteeData).flatMap((d: any) => d?.results || [])}
          onClose={() => setShowAiBuddy(false)}
        />
      )}
    </div>
  )
}
