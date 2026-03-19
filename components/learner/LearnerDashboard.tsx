'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useToast } from '@/lib/contexts/ThemeContext'
import * as DB from '@/lib/db'
import { BADGES, getLevel, getXpForNextLevel, genId, shuffle, pickRandom, getEmoji } from '@/lib/constants'

interface LearnerDashboardProps {
  onSwitchView: ((view: string | null) => void) | null
  onLogout: () => void
}

export function LearnerDashboard({ onSwitchView, onLogout }: LearnerDashboardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [screen, setScreen] = useState<'browse' | 'progress' | 'social' | 'learn' | 'test' | 'detail'>('browse')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [activePkg, setActivePkg] = useState<any>(null)
  const [myResults, setMyResults] = useState<any[]>([])
  const [myProgress, setMyProgress] = useState<any[]>([])
  const [gamData, setGamData] = useState<any>({ xp: 0, streak: 0, level: 1, badges: [], bestStreak: 0 })

  // Test state
  const [testQuestions, setTestQuestions] = useState<any[]>([])
  const [currentQ, setCurrentQ] = useState(0)
  const [answer, setAnswer] = useState<any>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [testResults, setTestResults] = useState<any[]>([])
  const [testFinished, setTestFinished] = useState(false)

  // Learn state
  const [learnIndex, setLearnIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    if (!user) return
    Promise.all([
      DB.loadPackages(),
      DB.getTestResultsForUser(user.id),
      DB.getLearnerProgress(user.id),
      DB.getGamification(user.id),
    ]).then(([pkgs, results, progress, gam]) => {
      setPackages((pkgs as any[]).filter(p => p.status === 'published'))
      setMyResults(results as any[])
      setMyProgress(progress as any[])
      setGamData(gam)
      setLoading(false)
    })
  }, [user])

  const getResultsForPkg = (id: string) => myResults.filter(r => r.packageId === id)
  const getBestScore = (id: string) => { const r = getResultsForPkg(id); return r.length ? Math.max(...r.map((x: any) => Math.round((x.correct / x.total) * 100))) : null }
  const getAttemptCount = (id: string) => getResultsForPkg(id).length
  const totalAttempts = myResults.length
  const avgScore = totalAttempts ? Math.round(myResults.reduce((a: number, r: any) => a + (r.correct / r.total) * 100, 0) / totalAttempts) : 0

  const filtered = packages.filter(p => {
    if (search) {
      const q = search.toLowerCase()
      if (!(p.name || '').toLowerCase().includes(q) && !(p.subject || '').toLowerCase().includes(q) && !(p.description || '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const goHome = () => { setScreen('browse'); setActivePkg(null); setTestQuestions([]); setTestFinished(false); setCurrentQ(0); setAnswer(null); setSubmitted(false) }

  // Generate simple MCQ questions from facts
  const generateQuestions = (facts: any[], count: number = 5) => {
    if (facts.length < 4) return []
    const selected = pickRandom(facts, Math.min(count * 2, facts.length))
    return selected.slice(0, count).map(fact => {
      const otherFacts = facts.filter(f => f.id !== fact.id)
      const correctAnswer = fact.text.split('.')[0].slice(0, 100)
      const distractors = pickRandom(otherFacts, 3).map(f => f.text.split('.')[0].slice(0, 100))
      const options = shuffle([
        { text: correctAnswer, correct: true },
        ...distractors.map(d => ({ text: d, correct: false })),
      ])
      return {
        id: genId(), type: 'mcq', category: fact.category,
        question: `Which of the following is true about ${fact.category}?`,
        options, correctAnswer,
        explanation: fact.text + (fact.detail ? ' — ' + fact.detail : ''),
      }
    })
  }

  const startTest = () => {
    if (!activePkg || !activePkg.facts || activePkg.facts.length < 4) { toast('Not enough content for a test', 'error'); return }
    const qs = generateQuestions(activePkg.facts, 5)
    setTestQuestions(qs)
    setCurrentQ(0)
    setAnswer(null)
    setSubmitted(false)
    setTestResults([])
    setTestFinished(false)
    setScreen('test')
  }

  const checkAnswer = () => {
    if (answer === null) return
    const q = testQuestions[currentQ]
    const correct = q.options[answer]?.correct === true
    setIsCorrect(correct)
    setSubmitted(true)
    setTestResults(prev => [...prev, { question: q, answer, correct }])
  }

  const nextQuestion = async () => {
    if (currentQ >= testQuestions.length - 1) {
      setTestFinished(true)
      const correct = testResults.filter(r => r.correct).length + (isCorrect ? 1 : 0)
      const total = testQuestions.length
      const score = Math.round((correct / total) * 100)
      if (user && activePkg) {
        const result = { userId: user.id, userName: user.name, userEmail: user.email, packageId: activePkg.id, packageName: activePkg.name, score, total, correct, elapsed: 0 }
        await DB.saveTestResult(result)
        setMyResults(prev => [result, ...prev])

        // Award XP
        const xpAmount = score >= 100 ? 100 : score >= 70 ? 50 : 25
        const newGam = { ...gamData }
        newGam.xp = (newGam.xp || 0) + xpAmount
        newGam.level = getLevel(newGam.xp)
        newGam.testsCompleted = (newGam.testsCompleted || 0) + 1
        if (score >= 100) newGam.perfectScores = (newGam.perfectScores || 0) + 1
        const today = new Date().toDateString()
        const lastDay = newGam.lastActive ? new Date(newGam.lastActive).toDateString() : null
        if (lastDay !== today) {
          const yesterday = new Date(Date.now() - 86400000).toDateString()
          newGam.streak = lastDay === yesterday ? (newGam.streak || 0) + 1 : 1
          newGam.bestStreak = Math.max(newGam.bestStreak || 0, newGam.streak)
          newGam.lastActive = Date.now()
        }
        // Check badges
        const newBadges = BADGES.filter(b => b.check(newGam) && !(newGam.badges || []).includes(b.id)).map(b => b.id)
        newGam.badges = [...(newGam.badges || []), ...newBadges]
        await DB.updateGamification(user.id, newGam)
        setGamData(newGam)
        if (newBadges.length > 0) {
          const badge = BADGES.find(b => b.id === newBadges[0])
          if (badge) toast(`Badge unlocked: ${badge.icon} ${badge.name}!`, 'success')
        }
      }
      return
    }
    setCurrentQ(i => i + 1)
    setAnswer(null)
    setSubmitted(false)
    setIsCorrect(null)
  }

  const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}><div className="w-10 h-10 rounded-full" style={{ borderWidth: 3, borderColor: 'var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} /></div>

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
        {screen !== 'browse' && screen !== 'progress' && screen !== 'social' ? (
          <button className="text-sm" style={{ color: 'var(--text-secondary)' }} onClick={goHome}>← Back</button>
        ) : <div />}
        <div className="text-lg font-extrabold" style={{ background: 'linear-gradient(135deg, #a29bfe, #00cec9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>StudyFlow</div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(0,206,201,.15)', color: 'var(--accent)' }}>Learner</span>
          {onSwitchView && <button className="text-xs px-2 py-1" style={{ color: 'var(--text-secondary)' }} onClick={() => onSwitchView(null)}>Switch</button>}
          <button className="text-xs px-2 py-1" style={{ color: 'var(--text-secondary)' }} onClick={onLogout}>Logout</button>
        </div>
      </nav>

      {/* Gamification bar */}
      {(screen === 'browse' || screen === 'progress' || screen === 'social') && (
        <div className="flex items-center gap-2.5 px-4 py-2 border-b text-xs" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <span className="font-extrabold" style={{ color: 'var(--primary, #a29bfe)' }}>Lv{gamData.level || 1}</span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full transition-all" style={{ background: 'linear-gradient(90deg, var(--primary), var(--accent))', width: `${getXpForNextLevel(gamData.xp || 0) ? ((gamData.xp || 0) / (getXpForNextLevel(gamData.xp || 0) || 1)) * 100 : 100}%` }} />
          </div>
          <span className="font-semibold" style={{ color: 'var(--accent)' }}>{gamData.xp || 0} XP</span>
          <span style={{ color: (gamData.streak || 0) >= 3 ? 'var(--warning)' : 'var(--text-muted)' }}>{gamData.streak || 0}🔥</span>
        </div>
      )}

      {/* Tabs */}
      {(screen === 'browse' || screen === 'progress' || screen === 'social') && (
        <div className="flex border-b px-4" style={{ borderColor: 'var(--border)' }}>
          <button className="px-4 py-2 text-sm font-semibold border-b-2" style={{ borderColor: screen === 'browse' ? 'var(--primary)' : 'transparent', color: screen === 'browse' ? 'var(--text)' : 'var(--text-muted)' }} onClick={() => setScreen('browse')}>📚 Courses</button>
          <button className="px-4 py-2 text-sm font-semibold border-b-2" style={{ borderColor: screen === 'progress' ? 'var(--primary)' : 'transparent', color: screen === 'progress' ? 'var(--text)' : 'var(--text-muted)' }} onClick={() => setScreen('progress')}>📊 Progress</button>
          <button className="px-4 py-2 text-sm font-semibold border-b-2" style={{ borderColor: screen === 'social' ? 'var(--primary)' : 'transparent', color: screen === 'social' ? 'var(--text)' : 'var(--text-muted)' }} onClick={() => setScreen('social')}>👥 Social</button>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-4">
        {/* BROWSE */}
        {screen === 'browse' && (
          <div className="animate-fade-in">
            <input className="w-full px-3.5 py-2.5 rounded-md text-sm mb-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
              value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search courses..." />

            {totalAttempts > 0 && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {[
                  { n: totalAttempts, l: 'Tests', c: 'var(--primary, #6c5ce7)' },
                  { n: avgScore + '%', l: 'Avg Score', c: avgScore >= 70 ? 'var(--success)' : 'var(--warning)' },
                  { n: myProgress.length, l: 'Courses', c: 'var(--accent)' },
                ].map((s, i) => (
                  <div key={i} className="flex-1 min-w-[70px] p-2 rounded-lg text-center" style={cardStyle}>
                    <div className="text-lg font-extrabold" style={{ color: s.c }}>{s.n}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            )}

            {filtered.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {filtered.map((pkg, i) => {
                  const best = getBestScore(pkg.id)
                  const attempts = getAttemptCount(pkg.id)
                  return (
                    <div key={pkg.id} className="p-4 rounded-xl animate-fade-in" style={{ ...cardStyle, animationDelay: `${i * 0.05}s`, borderTop: pkg.brandColor ? `3px solid ${pkg.brandColor}` : 'none' }}>
                      <div className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: pkg.brandColor || 'var(--primary, #a29bfe)' }}>{pkg.brandIcon || ''} {pkg.subject}</div>
                      <div className="font-bold text-base mb-1">{pkg.name}</div>
                      <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{pkg.description}</div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {pkg.yearLevel && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{pkg.yearLevel}</span>}
                        {best !== null && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: best >= 70 ? 'rgba(0,184,148,.15)' : 'rgba(225,112,85,.15)', color: best >= 70 ? 'var(--success)' : 'var(--danger)' }}>Best: {best}%</span>}
                        {attempts > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{attempts} tests</span>}
                      </div>
                      <div className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>By {pkg.publisherDisplayName || pkg.authorName}</div>
                      <div className="flex gap-1.5">
                        {(pkg.facts || []).length > 0 && (
                          <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--primary)' }}
                            onClick={() => { setActivePkg(pkg); setLearnIndex(0); setFlipped(false); setScreen('learn') }}>⚡ Learn</button>
                        )}
                        <button className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                          onClick={() => { setActivePkg(pkg); startTest() }}>📝 Test</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">📖</div>
                <h3 className="text-base font-bold">{search ? 'No matches' : 'No courses available'}</h3>
              </div>
            )}
          </div>
        )}

        {/* PROGRESS */}
        {screen === 'progress' && (
          <div className="animate-fade-in">
            <h1 className="text-xl font-extrabold mb-4">📊 My Progress</h1>
            <div className="flex gap-2 mb-4 flex-wrap">
              {[
                { n: totalAttempts, l: 'Tests', c: 'var(--primary, #6c5ce7)' },
                { n: avgScore + '%', l: 'Avg', c: avgScore >= 70 ? 'var(--success)' : 'var(--warning)' },
                { n: myProgress.length, l: 'Started', c: 'var(--accent)' },
              ].map((s, i) => (
                <div key={i} className="flex-1 min-w-[80px] p-3.5 rounded-xl text-center" style={cardStyle}>
                  <div className="text-2xl font-extrabold" style={{ color: s.c }}>{s.n}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.l}</div>
                </div>
              ))}
            </div>
            <h3 className="text-sm font-bold mb-2">Course Breakdown</h3>
            {packages.map(pkg => {
              const results = getResultsForPkg(pkg.id)
              if (results.length === 0) return null
              const best = Math.max(...results.map((r: any) => Math.round((r.correct / r.total) * 100)))
              return (
                <div key={pkg.id} className="p-3 mb-2 rounded-xl" style={cardStyle}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-sm">{pkg.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{results.length} tests · Best: {best}%</div>
                    </div>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-extrabold" style={{ border: `3px solid ${best >= 70 ? 'var(--success)' : 'var(--danger)'}` }}>{best}%</div>
                  </div>
                </div>
              )
            })}
            {myResults.length === 0 && <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>Take a test to see progress</p>}
          </div>
        )}

        {/* SOCIAL */}
        {screen === 'social' && (
          <div className="animate-fade-in">
            <h1 className="text-xl font-extrabold mb-4">👥 Social</h1>
            <h3 className="text-sm font-bold mb-2">🏆 My Badges ({(gamData.badges || []).length}/{BADGES.length})</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {BADGES.map(b => {
                const earned = (gamData.badges || []).includes(b.id)
                return (
                  <div key={b.id} className="p-2.5 rounded-lg text-center w-20" style={{ ...cardStyle, borderColor: earned ? 'var(--primary)' : 'var(--border)', opacity: earned ? 1 : 0.4 }}>
                    <div className="text-2xl">{b.icon}</div>
                    <div className="text-[10px] font-semibold mt-0.5">{b.name}</div>
                  </div>
                )
              })}
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Full social features (following, cheers, leaderboard) coming in next sprint.</p>
          </div>
        )}

        {/* LEARN */}
        {screen === 'learn' && activePkg && (
          <div className="animate-fade-in text-center py-8">
            <div className="text-xs uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--primary, #a29bfe)' }}>
              {activePkg.facts[learnIndex]?.category || activePkg.name}
            </div>
            <div className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{learnIndex + 1} / {activePkg.facts.length}</div>

            <div className="max-w-md mx-auto p-6 rounded-xl min-h-[200px] flex flex-col items-center justify-center cursor-pointer" style={cardStyle}
              onClick={() => setFlipped(!flipped)}>
              {!flipped ? (
                <>
                  <div className="text-4xl mb-3">{getEmoji(learnIndex)}</div>
                  <div className="text-lg font-semibold leading-relaxed">{activePkg.facts[learnIndex]?.text}</div>
                  <div className="text-[11px] mt-4" style={{ color: 'var(--text-muted)' }}>👆 Tap for details</div>
                </>
              ) : (
                <>
                  <div className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--accent)' }}>💡 Details</div>
                  <div className="text-base leading-relaxed">{activePkg.facts[learnIndex]?.text}</div>
                  {activePkg.facts[learnIndex]?.detail && <div className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{activePkg.facts[learnIndex].detail}</div>}
                </>
              )}
            </div>

            <div className="flex justify-center gap-3 mt-4">
              <button className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{ ...cardStyle }} onClick={() => { if (learnIndex > 0) { setLearnIndex(i => i - 1); setFlipped(false) } }} disabled={learnIndex === 0}>◀</button>
              <button className="w-12 h-12 rounded-full flex items-center justify-center text-xl text-white" style={{ background: 'var(--primary)', borderRadius: '50%' }} onClick={() => setFlipped(!flipped)}>🔄</button>
              <button className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{ ...cardStyle }} onClick={() => { if (learnIndex < activePkg.facts.length - 1) { setLearnIndex(i => i + 1); setFlipped(false) } }} disabled={learnIndex >= activePkg.facts.length - 1}>▶</button>
            </div>
          </div>
        )}

        {/* TEST */}
        {screen === 'test' && !testFinished && testQuestions.length > 0 && (
          <div className="animate-fade-in max-w-lg mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full transition-all" style={{ background: 'linear-gradient(90deg, var(--primary), var(--accent))', width: `${((currentQ + 1) / testQuestions.length) * 100}%` }} />
              </div>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Q{currentQ + 1}/{testQuestions.length}</span>
            </div>

            <span className="inline-block text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-semibold mb-3" style={{ background: 'rgba(108,92,231,.15)', color: 'var(--primary, #a29bfe)' }}>🔘 Pick One</span>
            <div className="text-lg font-bold leading-relaxed mb-5">{testQuestions[currentQ]?.question}</div>

            <div className="flex flex-col gap-2">
              {testQuestions[currentQ]?.options?.map((opt: any, i: number) => {
                let style: any = { ...cardStyle, cursor: 'pointer', padding: '12px 14px' }
                if (submitted && opt.correct) style = { ...style, borderColor: 'var(--success)', background: 'rgba(0,184,148,.08)' }
                else if (submitted && i === answer && !opt.correct) style = { ...style, borderColor: 'var(--danger)', background: 'rgba(225,112,85,.08)' }
                else if (i === answer) style = { ...style, borderColor: 'var(--primary)', background: 'rgba(108,92,231,.08)' }
                return (
                  <div key={i} className="flex items-center gap-3 text-sm rounded-xl transition-colors" style={style}
                    onClick={() => { if (!submitted) setAnswer(i) }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{
                      background: submitted && opt.correct ? 'var(--success)' : submitted && i === answer && !opt.correct ? 'var(--danger)' : i === answer ? 'var(--primary)' : 'var(--bg)',
                      color: (submitted && (opt.correct || i === answer)) || i === answer ? 'white' : 'var(--text-muted)',
                    }}>{String.fromCharCode(65 + i)}</div>
                    <div>{opt.text}</div>
                  </div>
                )
              })}
            </div>

            <div className="mt-4">
              {!submitted ? (
                <button className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--primary)', opacity: answer === null ? 0.4 : 1 }}
                  onClick={checkAnswer} disabled={answer === null}>Check Answer</button>
              ) : (
                <>
                  <div className="p-3 rounded-xl mb-3" style={{ background: isCorrect ? 'rgba(0,184,148,.08)' : 'rgba(225,112,85,.08)', border: `1px solid ${isCorrect ? 'rgba(0,184,148,.25)' : 'rgba(225,112,85,.25)'}` }}>
                    <div className="text-2xl mb-1">{isCorrect ? '🎉' : '😔'}</div>
                    <div className="text-sm font-bold" style={{ color: isCorrect ? 'var(--success)' : 'var(--danger)' }}>{isCorrect ? 'Correct!' : 'Not quite'}</div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{testQuestions[currentQ]?.explanation}</div>
                  </div>
                  <button className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--accent), var(--success))' }} onClick={nextQuestion}>
                    {currentQ >= testQuestions.length - 1 ? '🏁 Finish' : 'Next →'}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* SCORE */}
        {screen === 'test' && testFinished && (
          <div className="animate-fade-in text-center py-8 max-w-sm mx-auto">
            {(() => {
              const correct = testResults.filter(r => r.correct).length
              const total = testQuestions.length
              const pct = Math.round((correct / total) * 100)
              const grade = pct >= 80 ? 'great' : pct >= 50 ? 'ok' : 'needs-work'
              return (
                <>
                  <div className="w-40 h-40 rounded-full mx-auto mb-5 flex flex-col items-center justify-center animate-bounce-in" style={{
                    border: `3px solid ${grade === 'great' ? 'var(--success)' : grade === 'ok' ? 'var(--warning)' : 'var(--danger)'}`,
                    background: grade === 'great' ? 'rgba(0,184,148,.1)' : grade === 'ok' ? 'rgba(253,203,110,.1)' : 'rgba(225,112,85,.1)',
                  }}>
                    <div className="text-4xl font-black">{pct}%</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Score</div>
                  </div>
                  <h2 className="text-lg font-bold mb-1">{grade === 'great' ? 'Amazing! 🌟' : grade === 'ok' ? 'Getting there! 💪' : 'Keep going! 📚'}</h2>
                  <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>{correct}/{total} correct</p>
                  <div className="flex gap-2.5">
                    <button className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--primary)' }} onClick={() => { setActivePkg(activePkg); startTest() }}>🔄 Retry</button>
                    <button className="flex-1 py-3 rounded-xl text-sm font-bold" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }} onClick={goHome}>🏠 Home</button>
                  </div>
                </>
              )
            })()}
          </div>
        )}
      </div>
    </div>
  )
}
