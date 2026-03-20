'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useToast, useModal } from '@/lib/contexts/ThemeContext'
import * as DB from '@/lib/db'
import { BADGES, getLevel, getXpForNextLevel, genId, shuffle, pickRandom, getEmoji } from '@/lib/constants'
import { generateQuestions } from '@/lib/question-generator'
import type { Question } from '@/lib/question-generator'
import { PdfExport } from '@/components/publisher/PdfExport'
import { StudyPlanPanel } from './StudyPlanPanel'
import { VoiceInput } from './VoiceInput'
import { PodcastPlayer } from './PodcastPlayer'
import { moderateText } from '@/lib/content-moderation'
import { StudyBuddy } from './StudyBuddy'
import { AiMentor } from './AiMentor'
import { AiVisualLearning } from './AiVisualLearning'
import NaplanPractice from './NaplanPractice'
import { GlobalSpotifyBar } from '@/components/layout/GlobalSpotifyBar'

interface LearnerDashboardProps {
  onSwitchView: ((view: string | null) => void) | null
  onLogout: () => void
}

export function LearnerDashboard({ onSwitchView, onLogout }: LearnerDashboardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { showPrompt } = useModal()
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [screen, setScreen] = useState<'browse' | 'progress' | 'podcasts' | 'social' | 'learn' | 'test-setup' | 'test' | 'detail' | 'naplan'>('browse')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAllYears, setShowAllYears] = useState(false)
  const [activePkg, setActivePkg] = useState<any>(null)
  const [myResults, setMyResults] = useState<any[]>([])
  const [myProgress, setMyProgress] = useState<any[]>([])
  const [gamData, setGamData] = useState<any>({ xp: 0, streak: 0, level: 1, badges: [], bestStreak: 0, testsCompleted: 0, perfectScores: 0 })
  const [newBadgePopup, setNewBadgePopup] = useState<any>(null)

  // Test state
  const [testQuestions, setTestQuestions] = useState<Question[]>([])
  const [testQCount, setTestQCount] = useState(5)
  const [testScope, setTestScope] = useState<'all' | 'practice'>('all')
  const [currentQ, setCurrentQ] = useState(0)
  const [answer, setAnswer] = useState<any>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [testResults, setTestResults] = useState<any[]>([])
  const [testFinished, setTestFinished] = useState(false)
  const [testStartTime] = useState(Date.now())

  // Learn state
  const [learnIndex, setLearnIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [learnMode, setLearnMode] = useState<'swipe' | 'scroll' | 'tiktok' | 'podcast' | 'buddy'>('swipe')
  const [spacedRepMode, setSpacedRepMode] = useState(false)
  const [dueForReview, setDueForReview] = useState<string[]>([])
  const [shuffledFacts, setShuffledFacts] = useState<any[]>([])

  // Feedback / ratings
  const [feedbackText, setFeedbackText] = useState('')
  const [learningRating, setLearningRating] = useState(0)
  const [testingRating, setTestingRating] = useState(0)

  // Social
  const [followSearch, setFollowSearch] = useState('')
  const [followSearchResults, setFollowSearchResults] = useState<any[]>([])
  const [following, setFollowing] = useState<string[]>([])
  const [followingData, setFollowingData] = useState<Record<string, any>>({})
  const [followRequests, setFollowRequests] = useState<any[]>([])
  const [mentorRequests, setMentorRequests] = useState<any[]>([])
  const [cheers, setCheers] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [showStudyBuddy, setShowStudyBuddy] = useState(false)
  const [showNaplan, setShowNaplan] = useState(false)
  const [showVisualLearning, setShowVisualLearning] = useState(false)
  const [listeningStatuses, setListeningStatuses] = useState<Record<string, any>>({})
  const [musicShares, setMusicShares] = useState<any[]>([])
  const [privacySettings, setPrivacySettings] = useState<any>({ showInSearch: true, showProgress: true, showOnLeaderboard: true })
  const [testCategoryFilter, setTestCategoryFilter] = useState<string>('all')
  const [studyBuddyPersonality, setStudyBuddyPersonality] = useState<'encouraging' | 'strict' | 'humorous'>('encouraging')
  const [userGroups, setUserGroups] = useState<any[]>([])
  const [groupLeaderboards, setGroupLeaderboards] = useState<Record<string, any[]>>({})
  const [activeGroupLb, setActiveGroupLb] = useState<string | null>(null)

  // Load all data
  useEffect(() => {
    if (!user) return
    Promise.all([
      DB.loadPackages(),
      DB.getTestResultsForUser(user.id),
      DB.getLearnerProgress(user.id),
      DB.getGamification(user.id),
      DB.getFollowRequests(user.id),
      DB.getMentorRequests(user.id),
      DB.getCheers(user.id),
      DB.getFollowing(user.id),
      DB.getAnnouncements(user.id),
    ]).then(async ([pkgs, results, progress, gam, fReqs, mReqs, ch, followIds, announceRaw]) => {
      setPackages((pkgs as any[]).filter(p => p.status === 'published'))
      setMyResults(results as any[])
      setMyProgress(progress as any[])
      setGamData(gam)
      setFollowRequests(fReqs as any[])
      setMentorRequests(mReqs as any[])
      setCheers(ch as any[])
      setFollowing(followIds as string[])
      setAnnouncements(announceRaw as any[])

      // Load following data
      if ((followIds as string[]).length > 0) {
        const allUsers = await DB.getAllUsers()
        const data: Record<string, any> = {}
        for (const fid of followIds as string[]) {
          const u = (allUsers as any[]).find(x => x.uid === fid)
          if (u) {
            const [fGam, fRes] = await Promise.all([DB.getGamification(fid), DB.getTestResultsForUser(fid)])
            data[fid] = { name: u.name, email: u.email, gam: fGam, results: fRes }
          }
        }
        setFollowingData(data)
      }

      // Load listening statuses for followed users
      const lsMap: Record<string, any> = {}
      for (const fid of followIds as string[]) {
        const ls = await DB.getListeningStatus(fid)
        if (ls) lsMap[fid] = ls
      }
      setListeningStatuses(lsMap)

      // Load music shares
      const shares = await DB.getMusicShares(user.id)
      setMusicShares(shares as any[])

      // Load privacy settings
      const privacy = await DB.getPrivacySettings(user.id)
      setPrivacySettings(privacy)

      // Load user's groups and group leaderboards
      const groups = await DB.getGroupsForUser(user.id)
      setUserGroups(groups as any[])
      if ((groups as any[]).length > 0) {
        const lbs: Record<string, any[]> = {}
        for (const g of groups as any[]) {
          lbs[g.id] = await DB.getGroupLeaderboard(g.id)
        }
        setGroupLeaderboards(lbs)
      }

      setLoading(false)
    })
  }, [user])

  // Helpers
  const getProgressForPkg = (id: string) => myProgress.find((p: any) => p.packageId === id)
  const getResultsForPkg = (id: string) => myResults.filter(r => r.packageId === id)
  const getBestScore = (id: string) => { const r = getResultsForPkg(id); return r.length ? Math.max(...r.map((x: any) => Math.round((x.correct / x.total) * 100))) : null }
  const getAttemptCount = (id: string) => getResultsForPkg(id).length
  const totalAttempts = myResults.length
  const avgScore = totalAttempts ? Math.round(myResults.reduce((a: number, r: any) => a + (r.correct / r.total) * 100, 0) / totalAttempts) : 0

  // Filtered packages with smart filters
  const filtered = packages.filter(p => {
    if (search) {
      const q = search.toLowerCase()
      if (!(p.name || '').toLowerCase().includes(q) && !(p.subject || '').toLowerCase().includes(q) && !(p.description || '').toLowerCase().includes(q)) return false
    }
    // Year level filtering
    if (!showAllYears && user?.yearLevel && p.yearLevel) {
      const userYr = parseInt((user.yearLevel || '').replace(/\D/g, '')) || 0
      const pkgYr = parseInt((p.yearLevel || '').replace(/\D/g, '')) || 0
      if (pkgYr > userYr + 1) return false
    }
    // Status filters
    const prog = getProgressForPkg(p.id)
    const results = getResultsForPkg(p.id)
    if (filterStatus === 'new' && (prog || results.length > 0)) return false
    if (filterStatus === 'inprogress' && (!results.length || (prog && prog.completed))) return false
    if (filterStatus === 'completed' && (!prog || !prog.completed)) return false
    if (filterStatus === 'all' && prog && prog.completed) return false
    return true
  })

  const goHome = () => {
    setScreen('browse'); setActivePkg(null); setTestQuestions([]); setTestFinished(false)
    setCurrentQ(0); setAnswer(null); setSubmitted(false); setIsCorrect(null); setTestResults([])
    setFeedbackText(''); setLearningRating(0); setTestingRating(0)
  }

  const markComplete = async (pkgId: string) => {
    await DB.saveLearnerProgress(user!.id, pkgId, { completed: true, packageName: packages.find(p => p.id === pkgId)?.name })
    setMyProgress(prev => {
      const exists = prev.find((p: any) => p.packageId === pkgId)
      return exists ? prev.map((p: any) => p.packageId === pkgId ? { ...p, completed: true } : p) : [...prev, { packageId: pkgId, userId: user!.id, completed: true }]
    })
    toast('Course marked complete', 'success')
  }

  // Test functions
  const startTest = () => {
    if (!activePkg?.facts || activePkg.facts.length < 2) { toast('Not enough content', 'error'); return }
    const filteredFacts = testCategoryFilter === 'all' ? activePkg.facts : activePkg.facts.filter((f: any) => f.category === testCategoryFilter)
    const qs = generateQuestions(filteredFacts, activePkg.categories || [], testQCount, null, activePkg.testPatterns, testScope)
    if (qs.length === 0) { toast('Could not generate questions', 'error'); return }
    setTestQuestions(qs)
    setCurrentQ(0); setAnswer(null); setSubmitted(false); setIsCorrect(null)
    setTestResults([]); setTestFinished(false)
    setScreen('test')
  }

  const checkAnswer = () => {
    if (answer === null || (Array.isArray(answer) && answer.length === 0)) return
    const q = testQuestions[currentQ]
    let correct = false
    if (q.type === 'mcq') correct = q.options?.[answer]?.correct === true
    else if (q.type === 'truefalse') correct = answer === q.correctAnswer
    else if (q.type === 'selectall') {
      const selected = new Set(Array.isArray(answer) ? answer : [])
      const correctIdxs = (q.options || []).map((o, i) => o.correct ? i : -1).filter(i => i >= 0)
      const wrongIdxs = (q.options || []).map((o, i) => !o.correct ? i : -1).filter(i => i >= 0)
      correct = correctIdxs.every(i => selected.has(i)) && wrongIdxs.every(i => !selected.has(i))
    }
    setIsCorrect(correct); setSubmitted(true)
    setTestResults(prev => [...prev, { question: q, answer, correct }])
  }

  const nextQuestion = async () => {
    if (currentQ >= testQuestions.length - 1) {
      setTestFinished(true)
      const correct = testResults.filter(r => r.correct).length + (isCorrect ? 1 : 0)
      const total = testQuestions.length
      const score = Math.round((correct / total) * 100)
      const elapsed = Math.floor((Date.now() - testStartTime) / 1000)
      if (user && activePkg) {
        const result = { userId: user.id, userName: user.name, userEmail: user.email, packageId: activePkg.id, packageName: activePkg.name, score, total, correct, elapsed }
        await DB.saveTestResult(result)
        setMyResults(prev => [result, ...prev])
        // Gamification
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
          const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toDateString()
          if (lastDay === yesterday) {
            newGam.streak = (newGam.streak || 0) + 1
          } else if (lastDay === twoDaysAgo && (newGam.streakFreezes || 0) > 0) {
            // Use a streak freeze — missed one day but had a freeze token
            newGam.streak = (newGam.streak || 0) + 1
            newGam.streakFreezes = (newGam.streakFreezes || 0) - 1
            newGam.freezesUsed = (newGam.freezesUsed || 0) + 1
          } else {
            newGam.streak = 1
          }
          newGam.bestStreak = Math.max(newGam.bestStreak || 0, newGam.streak)
          newGam.lastActive = Date.now()
          // Award a streak freeze every 7-day streak milestone
          if (newGam.streak > 0 && newGam.streak % 7 === 0) {
            newGam.streakFreezes = Math.min((newGam.streakFreezes || 0) + 1, 3) // Max 3
          }
        }
        const newBadges = BADGES.filter(b => b.check(newGam) && !(newGam.badges || []).includes(b.id)).map(b => b.id)
        newGam.badges = [...(newGam.badges || []), ...newBadges]
        await DB.updateGamification(user.id, newGam)
        setGamData(newGam)
        if (newBadges.length > 0) { const badge = BADGES.find(b => b.id === newBadges[0]); if (badge) setNewBadgePopup(badge) }
      }
      return
    }
    setCurrentQ(i => i + 1); setAnswer(null); setSubmitted(false); setIsCorrect(null)
  }

  const submitFeedback = async () => {
    if (!feedbackText.trim() || !activePkg || !user) return
    const mod = moderateText(feedbackText)
    if (mod.severity === 'severe') { toast('Message contains inappropriate content and cannot be sent.', 'error'); return }
    const messageToSend = mod.clean ? feedbackText : mod.sanitised
    await DB.saveFeedback({ userId: user.id, userName: user.name, userEmail: user.email, packageId: activePkg.id, packageName: activePkg.name, message: messageToSend })
    setFeedbackText('')
    toast(mod.clean ? 'Feedback sent!' : 'Feedback sent (some words were filtered).', 'success')
  }

  const saveRatings = async () => {
    if (!activePkg || !user) return
    await DB.saveRating(user.id, activePkg.id, { learning: learningRating, testing: testingRating })
    toast('Rating saved!', 'success')
  }

  const cs = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 } // card style
  const is = { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' } // input style

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}><div className="w-10 h-10 rounded-full" style={{ borderWidth: 3, borderColor: 'var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} /></div>

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Badge popup with animation */}
      {newBadgePopup && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,.8)' }} onClick={() => setNewBadgePopup(null)}>
          <div className="p-8 rounded-2xl text-center animate-bounce-in badge-confetti relative" style={{ ...cs, borderColor: 'var(--primary)', boxShadow: '0 0 60px rgba(108,92,231,.3)' }} onClick={e => e.stopPropagation()}>
            <div className="animate-shimmer absolute inset-0 rounded-2xl pointer-events-none" />
            <div className="text-7xl mb-3 animate-float">{newBadgePopup.icon}</div>
            <h2 className="text-xl font-extrabold mb-1" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Badge Unlocked!</h2>
            <div className="text-lg font-bold mb-1" style={{ color: 'var(--primary)' }}>{newBadgePopup.name}</div>
            <div className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>{newBadgePopup.desc}</div>
            <button className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }} onClick={() => setNewBadgePopup(null)}>Awesome! 🎉</button>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
        {!['browse', 'progress', 'podcasts', 'social'].includes(screen) ? (
          <button className="text-sm" style={{ color: 'var(--text-secondary)' }} onClick={goHome}>← Back</button>
        ) : <div />}
        <div className="text-lg font-extrabold" style={{ background: 'linear-gradient(135deg, #a29bfe, #00cec9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>StudyFlow</div>
        <div className="flex items-center gap-2">
          <GlobalSpotifyBar />
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(0,206,201,.15)', color: 'var(--accent)' }}>Learner</span>
          {onSwitchView && <button className="text-xs px-2 py-1" style={{ color: 'var(--text-secondary)' }} onClick={() => onSwitchView(null)}>Switch</button>}
          <button className="text-xs px-2 py-1" style={{ color: 'var(--text-secondary)' }} onClick={onLogout}>Logout</button>
        </div>
      </nav>

      {/* Gamification bar */}
      {['browse', 'progress', 'podcasts', 'social'].includes(screen) && (
        <div className="flex items-center gap-2.5 px-4 py-2 border-b text-xs" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
          <span className="font-extrabold" style={{ color: 'var(--primary)' }}>Lv{gamData.level || 1}</span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, var(--primary), var(--accent))', width: `${getXpForNextLevel(gamData.xp || 0) ? ((gamData.xp || 0) / (getXpForNextLevel(gamData.xp || 0) || 1)) * 100 : 100}%` }} />
          </div>
          <span className="font-semibold" style={{ color: 'var(--accent)' }}>{gamData.xp || 0} XP</span>
          <span style={{ color: (gamData.streak || 0) >= 3 ? 'var(--warning)' : 'var(--text-muted)' }}>{gamData.streak || 0}🔥</span>
          {(gamData.streakFreezes || 0) > 0 && <span className="text-[10px]" title="Streak freezes available" style={{ color: 'var(--accent)' }}>🧊{gamData.streakFreezes}</span>}
        </div>
      )}

      {/* Cheers */}
      {cheers.length > 0 && ['browse', 'social'].includes(screen) && (
        <div className="px-4 py-2 border-b" style={{ background: 'rgba(253,203,110,.08)', borderColor: 'rgba(253,203,110,.2)' }}>
          {cheers.map(c => (
            <div key={c.id} className="flex justify-between items-center py-1 text-xs">
              <span>💪 <strong>{c.fromName}</strong>: {c.message}</span>
              <button className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: 'var(--text-muted)' }} onClick={async () => { await DB.markCheerRead(c.id); setCheers(prev => prev.filter(x => x.id !== c.id)) }}>✓</button>
            </div>
          ))}
        </div>
      )}

      {/* New course announcements */}
      {announcements.length > 0 && ['browse'].includes(screen) && (
        <div className="px-4 py-2 border-b" style={{ background: 'rgba(108,92,231,.06)', borderColor: 'rgba(108,92,231,.15)' }}>
          {announcements.map(a => (
            <div key={a.id} className="flex justify-between items-center py-1 text-xs">
              <span>🆕 <strong>{a.message}</strong></span>
              <button className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: 'var(--text-muted)' }}
                onClick={async () => { await DB.markAnnouncementRead(a.id, user!.id); setAnnouncements(prev => prev.filter(x => x.id !== a.id)) }}>Dismiss</button>
            </div>
          ))}
        </div>
      )}

      {/* Follow/mentor requests */}
      {(followRequests.length > 0 || mentorRequests.length > 0) && ['browse', 'social'].includes(screen) && (
        <div className="px-4 py-2 border-b" style={{ background: 'rgba(108,92,231,.04)', borderColor: 'var(--border)' }}>
          {followRequests.map(r => (
            <div key={r.id} className="flex justify-between items-center py-1 text-xs">
              <span>👋 <strong>{r.fromName}</strong> wants to follow you</span>
              <div className="flex gap-1">
                <button className="px-2 py-0.5 rounded text-[10px] text-white" style={{ background: 'var(--success)' }} onClick={async () => { await DB.respondFollowRequest(r.id, 'accepted'); setFollowRequests(prev => prev.filter(x => x.id !== r.id)) }}>Accept</button>
                <button className="px-2 py-0.5 rounded text-[10px]" style={{ color: 'var(--text-muted)' }} onClick={async () => { await DB.respondFollowRequest(r.id, 'declined'); setFollowRequests(prev => prev.filter(x => x.id !== r.id)) }}>Decline</button>
              </div>
            </div>
          ))}
          {mentorRequests.map(r => (
            <div key={r.id} className="flex justify-between items-center py-1 text-xs">
              <span>🧭 <strong>{r.mentorName}</strong> wants to mentor you</span>
              <div className="flex gap-1">
                <button className="px-2 py-0.5 rounded text-[10px] text-white" style={{ background: 'var(--success)' }} onClick={async () => { await DB.respondMentorRequest(r.id, 'accepted'); setMentorRequests(prev => prev.filter(x => x.id !== r.id)) }}>Accept</button>
                <button className="px-2 py-0.5 rounded text-[10px]" style={{ color: 'var(--text-muted)' }} onClick={async () => { await DB.respondMentorRequest(r.id, 'declined'); setMentorRequests(prev => prev.filter(x => x.id !== r.id)) }}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab bar */}
      {['browse', 'progress', 'podcasts', 'social'].includes(screen) && (
        <div className="flex border-b px-4 overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
          {[{ id: 'browse', label: '📚 Courses' }, { id: 'progress', label: '📊 Progress' }, { id: 'podcasts', label: '🎧 Podcasts' }, { id: 'social', label: '👥 Social' }].map(t => (
            <button key={t.id} className="px-4 py-2 text-sm font-semibold border-b-2 whitespace-nowrap"
              style={{ borderColor: screen === t.id ? 'var(--primary)' : 'transparent', color: screen === t.id ? 'var(--text)' : 'var(--text-muted)' }}
              onClick={() => setScreen(t.id as any)}>{t.label}</button>
          ))}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-4">

        {/* ============ BROWSE ============ */}
        {screen === 'browse' && (
          <div className="animate-fade-in">
            {/* AI Coach Nudge Banner */}
            {(() => {
              // Build a smart nudge based on user's data
              const lowScorePkgs = myResults.filter((r: any) => r.score < 60)
              const untestedPkgs = packages.filter((p: any) => p.status === 'published' && !myResults.some((r: any) => r.packageId === p.id))
              const recentAvg = myResults.slice(0, 5).reduce((a: number, r: any) => a + (r.score || 0), 0) / (Math.min(5, myResults.length) || 1)
              let nudge: { icon: string; text: string; action?: () => void; actionLabel?: string } | null = null

              if (myResults.length === 0 && packages.length > 0) {
                nudge = { icon: '👋', text: `Hey ${user?.name?.split(' ')[0] || 'there'}! Pick a course and start learning — I'll track your progress and give you tips along the way.` }
              } else if (lowScorePkgs.length > 0 && myResults.length >= 2) {
                const weakPkg = packages.find((p: any) => p.id === lowScorePkgs[0]?.packageId)
                if (weakPkg) {
                  nudge = { icon: '💡', text: `Your score on "${weakPkg.name}" could use a boost. Try reviewing in Learn mode before retaking the test!`, action: () => { setActivePkg(weakPkg); setScreen('learn') }, actionLabel: 'Review Now' }
                }
              } else if (recentAvg >= 80 && untestedPkgs.length > 0) {
                nudge = { icon: '🚀', text: `You're crushing it! Ready for something new? Try "${untestedPkgs[0].name}".`, action: () => { setActivePkg(untestedPkgs[0]); setScreen('detail') }, actionLabel: 'Check it out' }
              } else if (gamData.streak >= 3) {
                nudge = { icon: '🔥', text: `${gamData.streak}-day streak! Keep the momentum — consistency beats intensity.` }
              }

              if (!nudge) return null
              return (
                <div className="flex items-start gap-2.5 p-3 rounded-xl mb-3" style={{ background: 'linear-gradient(135deg, rgba(108,92,231,.06), rgba(0,206,201,.06))', border: '1px solid rgba(108,92,231,.12)' }}>
                  <span className="text-lg">{nudge.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>{nudge.text}</p>
                    {nudge.action && (
                      <button className="mt-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold text-white" style={{ background: 'var(--primary)' }} onClick={nudge.action}>
                        {nudge.actionLabel} →
                      </button>
                    )}
                  </div>
                </div>
              )
            })()}

            {/* Search + Filter row */}
            <div className="flex gap-2 mb-3 items-center">
              <div className="relative flex-1">
                <select
                  className="appearance-none pl-2.5 pr-7 py-2 rounded-lg text-xs font-medium cursor-pointer"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: filterStatus === 'all' ? 'var(--text-muted)' : 'var(--primary)' }}
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Courses</option>
                  <option value="new">🆕 New</option>
                  <option value="inprogress">📖 In Progress</option>
                  <option value="completed">✅ Completed</option>
                </select>
                {filterStatus !== 'all' && (
                  <button
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] w-4 h-4 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--primary)', color: 'white' }}
                    onClick={() => setFilterStatus('all')}
                    title="Clear filter"
                  >✕</button>
                )}
              </div>
              <input className="flex-[2] px-3 py-2 rounded-lg text-sm" style={is} value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search courses..." />
            </div>

            {/* NAPLAN Practice Card */}
            <button
              className="w-full p-3.5 mb-3 rounded-xl flex items-center gap-3 transition-transform hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, rgba(0,206,201,.12), rgba(108,92,231,.12))', border: '1px solid rgba(0,206,201,.25)' }}
              onClick={() => setShowNaplan(true)}
            >
              <span className="text-2xl">🇦🇺</span>
              <div className="flex-1 text-left">
                <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>NAPLAN Practice</div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Year 7 &amp; 9 · Numeracy, Reading, Writing, Language</div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(0,206,201,.2)', color: 'var(--accent)' }}>Start</span>
            </button>

            {/* Year level toggle */}
            {user?.yearLevel && (
              <div className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>
                {showAllYears ? <>Showing all years. <button className="underline" style={{ color: 'var(--primary)' }} onClick={() => setShowAllYears(false)}>Show {user.yearLevel} only</button></> :
                  <>Showing {user.yearLevel} and below. <button className="underline" style={{ color: 'var(--primary)' }} onClick={() => setShowAllYears(true)}>Show all</button></>}
              </div>
            )}

            {/* Stats bar */}
            {totalAttempts > 0 && (
              <div className="flex gap-2 mb-4 flex-wrap">
                {[{ n: totalAttempts, l: 'Tests', c: 'var(--primary)' }, { n: avgScore + '%', l: 'Avg', c: avgScore >= 70 ? 'var(--success)' : 'var(--warning)' }, { n: myProgress.length, l: 'Courses', c: 'var(--accent)' }].map((s, i) => (
                  <div key={i} className="flex-1 min-w-[70px] p-2 rounded-lg text-center" style={cs}>
                    <div className="text-lg font-extrabold" style={{ color: s.c }}>{s.n}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.l}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Course cards */}
            {filtered.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {filtered.map((pkg, i) => {
                  const best = getBestScore(pkg.id)
                  const attempts = getAttemptCount(pkg.id)
                  const prog = getProgressForPkg(pkg.id)
                  return (
                    <div key={pkg.id} className="p-4 rounded-xl animate-fade-in" style={{ ...cs, animationDelay: `${i * 0.05}s`, borderTop: pkg.brandColor ? `3px solid ${pkg.brandColor}` : 'none' }}>
                      <div className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: pkg.brandColor || 'var(--primary)' }}>{pkg.brandIcon || ''} {pkg.subject}</div>
                      <div className="font-bold text-base mb-1">{pkg.name}</div>
                      <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{pkg.description}</div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {pkg.groupName && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(108,92,231,.08)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>📂 {pkg.groupName}</span>}
                        {pkg.yearLevel && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{pkg.yearLevel}</span>}
                        {best !== null && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: best >= 70 ? 'rgba(0,184,148,.15)' : 'rgba(225,112,85,.15)', color: best >= 70 ? 'var(--success)' : 'var(--danger)' }}>Best: {best}%</span>}
                        {!prog && attempts === 0 && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(108,92,231,.15)', color: 'var(--primary)' }}>🆕</span>}
                      </div>
                      <div className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>By {pkg.publisherDisplayName || pkg.authorName}</div>
                      <div className="flex gap-1.5">
                        {(pkg.facts || []).length > 0 && <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--primary)' }} onClick={async () => {
                          setActivePkg(pkg); setLearnIndex(0); setFlipped(false); setSpacedRepMode(false)
                          setShuffledFacts(shuffle(pkg.facts || []))
                          // Load spaced rep data
                          if (user) {
                            const srData = await DB.getSpacedRepData(user.id, pkg.id) as any[]
                            const now = Date.now()
                            const due = srData.filter(d => !d.nextReview || d.nextReview <= now).map(d => d.factId)
                            setDueForReview(due)
                          }
                          setScreen('learn')
                        }}>⚡ Learn</button>}
                        <button className="px-3 py-1.5 rounded-lg text-xs" style={{ ...cs, color: 'var(--text-secondary)' }} onClick={() => { setActivePkg(pkg); setScreen('test-setup') }}>📝 Test</button>
                        <button className="px-2 py-1.5 rounded-lg text-[10px]" style={{ color: 'var(--text-muted)' }} onClick={() => { setActivePkg(pkg); setScreen('detail') }}>📊</button>
                      </div>
                      {prog && !prog.completed && attempts > 0 && (
                        <button className="text-[10px] mt-1.5" style={{ color: 'var(--text-muted)', background: 'none', border: 'none' }} onClick={() => markComplete(pkg.id)}>✓ Mark complete</button>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">📖</div>
                <h3 className="text-base font-bold">{search ? 'No matches' : filterStatus === 'completed' ? 'No completed courses' : 'No courses available'}</h3>
              </div>
            )}
          </div>
        )}

        {/* ============ PROGRESS ============ */}
        {screen === 'progress' && (
          <div className="animate-fade-in">
            <h1 className="text-xl font-extrabold mb-4">📊 My Progress</h1>

            {/* AI Study Plan */}
            <StudyPlanPanel packages={packages} testResults={myResults} cardStyle={cs} />

            <div className="flex gap-2 mb-5 flex-wrap">
              {[{ n: totalAttempts, l: 'Tests', c: 'var(--primary)' }, { n: avgScore + '%', l: 'Avg', c: avgScore >= 70 ? 'var(--success)' : 'var(--warning)' }, { n: myProgress.length, l: 'Started', c: 'var(--accent)' }, { n: myProgress.filter((p: any) => p.completed).length, l: 'Done', c: 'var(--success)' }].map((s, i) => (
                <div key={i} className="flex-1 min-w-[70px] p-3 rounded-xl text-center" style={cs}>
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
                <div key={pkg.id} className="p-3 mb-2 rounded-xl cursor-pointer" style={cs} onClick={() => { setActivePkg(pkg); setScreen('detail') }}>
                  <div className="flex justify-between items-center">
                    <div><div className="font-bold text-sm">{pkg.name}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>{results.length} tests · Best: {best}%</div></div>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-extrabold" style={{ border: `3px solid ${best >= 70 ? 'var(--success)' : 'var(--danger)'}` }}>{best}%</div>
                  </div>
                </div>
              )
            })}
            {myResults.length === 0 && <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>Take a test to see progress</p>}
          </div>
        )}

        {/* ============ PODCASTS ============ */}
        {screen === 'podcasts' && (
          <div className="animate-fade-in">
            <h1 className="text-xl font-extrabold mb-1">🎧 Podcasts</h1>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Listen and learn — audio lessons for all your courses</p>

            {/* Podcast cards for each course that has facts */}
            {packages.filter((p: any) => p.facts && p.facts.length > 0).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🎙️</div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No courses with content available for podcasts yet.</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Courses with facts will appear here as audio lessons.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {packages.filter((p: any) => p.facts && p.facts.length > 0).map((pkg: any) => {
                  const factCount = pkg.facts?.length || 0
                  const estMinutes = Math.max(1, Math.ceil(factCount * 0.4))
                  return (
                    <div key={pkg.id} className="p-4 rounded-xl" style={cs}>
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
                          🎧
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold truncate">{pkg.name}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {factCount} facts · ~{estMinutes} min · {pkg.subject || 'General'}
                          </div>
                          {pkg.yearLevel && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full mt-1 inline-block" style={{ background: 'rgba(108,92,231,.1)', color: 'var(--primary)' }}>{pkg.yearLevel}</span>
                          )}
                        </div>
                        <button
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shrink-0"
                          style={{ background: 'var(--primary)' }}
                          onClick={() => { setActivePkg(pkg); setLearnMode('podcast'); setScreen('learn') }}
                        >
                          ▶ Play
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Podcast sync info */}
            <div className="mt-6 p-4 rounded-xl text-center" style={{ background: 'rgba(108,92,231,.04)', border: '1px solid rgba(108,92,231,.12)' }}>
              <div className="text-lg mb-1">📲</div>
              <p className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>Podcast App Sync</p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Coming soon — subscribe to your StudyFlow podcasts in Apple Podcasts, Spotify, and other podcast apps via RSS feed.</p>
            </div>
          </div>
        )}

        {/* ============ SOCIAL ============ */}
        {screen === 'social' && (
          <div className="animate-fade-in">
            <h1 className="text-xl font-extrabold mb-4">👥 Social</h1>

            {/* Search */}
            <div className="p-3.5 mb-4 rounded-xl" style={cs}>
              <h3 className="text-sm font-bold mb-2">Find Learners</h3>
              <input className="w-full px-3 py-2 rounded-md text-sm" style={is} value={followSearch}
                onChange={e => {
                  const q = e.target.value
                  setFollowSearch(q)
                  if (q.trim().length < 2) { setFollowSearchResults([]); return }
                  clearTimeout((window as any).__followSearchTimer)
                  ;(window as any).__followSearchTimer = setTimeout(async () => {
                    const r = await DB.searchUsers(q.trim())
                    setFollowSearchResults((r as any[]).filter(u => u.uid !== user?.id))
                  }, 300)
                }} placeholder="Start typing to find learners..." />
              {followSearchResults.map(u => (
                <div key={u.uid} className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div><div className="font-semibold text-sm">{u.name}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>{u.email}</div></div>
                  {following.includes(u.uid) ? <span className="text-xs" style={{ color: 'var(--success)' }}>✓ Following</span> :
                    <button className="px-3 py-1 rounded-lg text-xs text-white" style={{ background: 'var(--primary)' }} onClick={async () => { await DB.sendFollowRequest(user!.id, u.uid, user!.name); toast('Follow request sent!', 'success') }}>Follow</button>}
                </div>
              ))}
            </div>

            {/* Following */}
            <h3 className="text-sm font-bold mb-2">Following ({following.length})</h3>
            {following.length === 0 ? (
              <div className="text-center py-8"><div className="text-4xl mb-2">👥</div><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Search to connect with classmates</p></div>
            ) : following.map(fid => {
              const fd = followingData[fid]
              if (!fd) return null
              const avg = fd.results?.length ? Math.round(fd.results.reduce((a: number, r: any) => a + (r.correct / r.total) * 100, 0) / fd.results.length) : 0
              return (
                <div key={fid} className="p-3 mb-2 rounded-xl" style={cs}>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-sm">{fd.name}</div>
                      <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Lv{fd.gam?.level || 1} · {fd.gam?.streak || 0}🔥 · {fd.gam?.xp || 0} XP</div>
                      {listeningStatuses[fid] && (
                        <div className="text-[10px] mt-0.5 flex items-center gap-1" style={{ color: '#1DB954' }}>
                          🎵 Listening to <strong>{listeningStatuses[fid].name}</strong> — {listeningStatuses[fid].artist}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <div className="text-center"><div className="text-base font-extrabold" style={{ color: avg >= 70 ? 'var(--success)' : 'var(--warning)' }}>{avg}%</div><div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Avg</div></div>
                      <button className="px-2 py-1 rounded text-[10px]" style={{ background: 'rgba(253,203,110,.15)', color: 'var(--warning)' }}
                        onClick={async () => { const msg = await showPrompt('Send encouragement:', 'Keep it up! 💪', 'Send Cheer'); if (msg) { const mod = moderateText(msg); if (mod.severity === 'severe') { toast('Message contains inappropriate content.', 'error'); return } await DB.sendCheer(user!.id, user!.name, fid, mod.clean ? msg : mod.sanitised); toast(mod.clean ? 'Cheer sent!' : 'Cheer sent (some words filtered).', 'success') } }}>💪</button>
                      <button className="px-1.5 py-1 rounded text-[10px]" style={{ background: 'rgba(225,112,85,.1)', color: 'var(--danger)' }}
                        onClick={async () => { const reason = await showPrompt('Report reason:', '', 'Report'); if (reason) { await DB.reportContent({ reporterId: user!.id, reporterName: user!.name, contentType: 'message', contentText: '', targetUserId: fid, reason }); toast('Report submitted', 'success') } }}>🚩</button>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Music Shares */}
            {musicShares.length > 0 && (
              <>
                <h3 className="text-sm font-bold mt-5 mb-2">🎶 Shared With You</h3>
                <div className="space-y-1.5 mb-2">
                  {musicShares.slice(0, 5).map((s: any) => (
                    <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={cs}>
                      <span className="text-base">🎵</span>
                      <div className="flex-1"><strong>{s.fromName}</strong> shared <strong>{s.track?.name}</strong> — {s.track?.artist}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Leaderboard */}
            {following.length > 0 && (
              <>
                <div className="flex items-center justify-between mt-5 mb-2">
                  <h3 className="text-sm font-bold">🏅 Leaderboard</h3>
                  <button className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: privacySettings.showOnLeaderboard ? 'rgba(0,212,106,.12)' : 'rgba(225,112,85,.1)', color: privacySettings.showOnLeaderboard ? 'var(--success)' : 'var(--danger)' }}
                    onClick={async () => { const newVal = !privacySettings.showOnLeaderboard; setPrivacySettings((p: any) => ({ ...p, showOnLeaderboard: newVal })); await DB.updatePrivacySettings(user!.id, { ...privacySettings, showOnLeaderboard: newVal }); toast(newVal ? 'Visible on leaderboard' : 'Hidden from leaderboard', 'info') }}>
                    {privacySettings.showOnLeaderboard ? '👁️ Visible' : '🙈 Hidden'}
                  </button>
                </div>
                <div className="rounded-xl overflow-hidden" style={cs}>
                  {[
                    ...(privacySettings.showOnLeaderboard ? [{ name: user!.name, xp: gamData.xp || 0, level: gamData.level || 1, streak: gamData.streak || 0, isMe: true }] : []),
                    ...following.map(fid => { const fd = followingData[fid]; return fd ? { name: fd.name, xp: fd.gam?.xp || 0, level: fd.gam?.level || 1, streak: fd.gam?.streak || 0, isMe: false } : null }).filter(Boolean) as any[]
                  ].sort((a, b) => b.xp - a.xp).map((entry, rank) => (
                    <div key={rank} className="flex items-center gap-2.5 px-3.5 py-2.5 border-b" style={{ borderColor: 'var(--border)', background: entry.isMe ? 'rgba(108,92,231,.04)' : 'transparent' }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold" style={{ background: rank < 3 ? 'linear-gradient(135deg, #fdcb6e, #e17055)' : 'var(--bg)', color: rank < 3 ? 'white' : 'var(--text-muted)' }}>
                        {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : rank + 1}
                      </div>
                      <div className="flex-1"><div className="text-sm font-semibold">{entry.name}{entry.isMe ? ' (you)' : ''}</div><div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Lv{entry.level} · {entry.streak}🔥</div></div>
                      <div className="text-base font-extrabold" style={{ color: 'var(--primary)' }}>{entry.xp} XP</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Group Leaderboards */}
            {userGroups.length > 0 && (
              <>
                <h3 className="text-sm font-bold mt-5 mb-2">📂 Group Leaderboards</h3>
                <div className="flex gap-1.5 flex-wrap mb-2">
                  {userGroups.map(g => (
                    <button key={g.id} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      style={{ background: activeGroupLb === g.id ? 'var(--primary)' : 'var(--bg)', color: activeGroupLb === g.id ? 'white' : 'var(--text-muted)', border: `1px solid ${activeGroupLb === g.id ? 'var(--primary)' : 'var(--border)'}` }}
                      onClick={() => setActiveGroupLb(activeGroupLb === g.id ? null : g.id)}>
                      {g.name || g.id}
                    </button>
                  ))}
                </div>
                {activeGroupLb && groupLeaderboards[activeGroupLb] && (
                  <div className="rounded-xl overflow-hidden mb-2" style={cs}>
                    {groupLeaderboards[activeGroupLb].map((entry, rank) => (
                      <div key={entry.userId} className="flex items-center gap-2.5 px-3.5 py-2.5 border-b" style={{ borderColor: 'var(--border)', background: entry.userId === user?.id ? 'rgba(108,92,231,.04)' : 'transparent' }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold" style={{ background: rank < 3 ? 'linear-gradient(135deg, #fdcb6e, #e17055)' : 'var(--bg)', color: rank < 3 ? 'white' : 'var(--text-muted)' }}>
                          {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : rank + 1}
                        </div>
                        <div className="flex-1"><div className="text-sm font-semibold">{entry.name}{entry.userId === user?.id ? ' (you)' : ''}</div><div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Lv{entry.level} · {entry.streak}🔥</div></div>
                        <div className="text-base font-extrabold" style={{ color: 'var(--primary)' }}>{entry.xp} XP</div>
                      </div>
                    ))}
                    {groupLeaderboards[activeGroupLb].length === 0 && <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>No members yet</p>}
                  </div>
                )}
              </>
            )}

            {/* Badges */}
            <h3 className="text-sm font-bold mt-5 mb-2">🏆 Badges ({(gamData.badges || []).length}/{BADGES.length})</h3>
            <div className="flex flex-wrap gap-2 pb-8">
              {BADGES.map(b => {
                const earned = (gamData.badges || []).includes(b.id)
                return (
                  <div key={b.id} className="p-2.5 rounded-lg text-center w-20" style={{ ...cs, borderColor: earned ? 'var(--primary)' : 'var(--border)', opacity: earned ? 1 : 0.4 }}>
                    <div className="text-2xl">{b.icon}</div>
                    <div className="text-[10px] font-semibold mt-0.5">{b.name}</div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ============ COURSE DETAIL ============ */}
        {screen === 'detail' && activePkg && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-extrabold mb-1">{activePkg.name}</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{activePkg.subject} · {activePkg.yearLevel}</p>

            <div className="flex gap-2 mb-4">
              <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--primary)' }} onClick={() => setScreen('learn')}>⚡ Learn</button>
              <button className="px-3 py-1.5 rounded-lg text-xs" style={cs} onClick={() => setScreen('test-setup')}>📝 Test</button>
              {getAttemptCount(activePkg.id) > 0 && <button className="px-3 py-1.5 rounded-lg text-xs" style={cs} onClick={() => markComplete(activePkg.id)}>✓ Complete</button>}
            </div>

            {/* Test history */}
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-bold">📈 Test History</h3>
              {getResultsForPkg(activePkg.id).length > 0 && (
                <PdfExport
                  results={getResultsForPkg(activePkg.id).map((r: any) => ({
                    ...r,
                    score: Math.round((r.correct / r.total) * 100),
                  }))}
                  packageName={activePkg.name || 'Course'}
                  userName={user?.name || 'Learner'}
                />
              )}
            </div>
            {getResultsForPkg(activePkg.id).length > 0 ? getResultsForPkg(activePkg.id).map((r: any, i: number) => (
              <div key={i} className="p-2.5 mb-1 rounded-lg" style={cs}>
                <div className="flex justify-between items-center">
                  <div><div className="text-sm font-semibold">{Math.round((r.correct / r.total) * 100)}% — {r.correct}/{r.total}</div><div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{r.timestamp ? new Date(r.timestamp).toLocaleString() : ''}</div></div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-extrabold" style={{ background: Math.round((r.correct / r.total) * 100) >= 70 ? 'rgba(0,184,148,.15)' : 'rgba(225,112,85,.15)', color: Math.round((r.correct / r.total) * 100) >= 70 ? 'var(--success)' : 'var(--danger)' }}>{Math.round((r.correct / r.total) * 100)}%</div>
                </div>
              </div>
            )) : <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No tests taken yet.</p>}

            {/* Ratings */}
            <h3 className="text-sm font-bold mt-5 mb-2">⭐ Rate This Course</h3>
            <div className="flex gap-4 mb-3">
              <div className="flex-1"><div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>📚 Learning</div><div className="flex gap-0.5">{[1, 2, 3, 4, 5].map(n => <button key={n} className="text-xl" style={{ background: 'none', border: 'none', opacity: n <= learningRating ? 0.9 : 0.3 }} onClick={() => setLearningRating(n)}>⭐</button>)}</div></div>
              <div className="flex-1"><div className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>📝 Testing</div><div className="flex gap-0.5">{[1, 2, 3, 4, 5].map(n => <button key={n} className="text-xl" style={{ background: 'none', border: 'none', opacity: n <= testingRating ? 0.9 : 0.3 }} onClick={() => setTestingRating(n)}>⭐</button>)}</div></div>
            </div>
            {(learningRating > 0 || testingRating > 0) && <button className="px-3 py-1 rounded-lg text-xs mb-4" style={cs} onClick={saveRatings}>Save Rating</button>}

            {/* Feedback */}
            <h3 className="text-sm font-bold mt-3 mb-2">💬 Feedback</h3>
            <textarea className="w-full px-3 py-2 rounded-md text-sm min-h-[50px] mb-2" style={is} value={feedbackText} onChange={e => setFeedbackText(e.target.value)} placeholder="Share your thoughts..." />
            <button className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--primary)', opacity: feedbackText.trim() ? 1 : 0.4 }} onClick={submitFeedback} disabled={!feedbackText.trim()}>📤 Send</button>
          </div>
        )}

        {/* ============ LEARN MODE ============ */}
        {screen === 'learn' && activePkg && (() => {
          // Spaced rep: sort due-for-review cards first when in review mode
          const activeFacts = spacedRepMode && dueForReview.length > 0
            ? [...shuffledFacts.filter(f => dueForReview.includes(f.id)), ...shuffledFacts.filter(f => !dueForReview.includes(f.id))]
            : (shuffledFacts.length > 0 ? shuffledFacts : activePkg.facts)
          const currentFact = activeFacts[learnIndex]
          const progress = ((learnIndex + 1) / activeFacts.length) * 100

          const rateConfidence = async (level: number) => {
            if (user && activePkg) {
              const fact = activeFacts[learnIndex]
              await DB.saveFactConfidence(user.id, activePkg.id, fact.id, level)
            }
            // Move to next card
            if (learnIndex < activeFacts.length - 1) {
              setFlipped(false)
              setTimeout(() => setLearnIndex(i => i + 1), 100)
            }
          }

          return (
          <div className="animate-fade-in text-center py-4">
            {/* Progress */}
            <div className="flex items-center gap-2 mb-2 px-4">
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, var(--primary), var(--accent))', width: `${progress}%` }} />
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{learnIndex + 1}/{activeFacts.length}</span>
              {dueForReview.length > 0 && <span className="text-[10px]" style={{ color: 'var(--warning)', whiteSpace: 'nowrap' }}>{dueForReview.length} due</span>}
            </div>

            {/* Mode toggle */}
            <div className="flex gap-1 p-0.5 rounded-full mx-auto w-fit mb-4" style={{ background: 'var(--bg-card)' }}>
              <button className="px-3 py-1 rounded-full text-[11px] font-semibold" style={{ background: learnMode === 'swipe' ? 'var(--primary)' : 'transparent', color: learnMode === 'swipe' ? 'white' : 'var(--text-muted)' }} onClick={() => setLearnMode('swipe')}>🃏 Cards</button>
              <button className="px-3 py-1 rounded-full text-[11px] font-semibold" style={{ background: learnMode === 'scroll' ? 'var(--primary)' : 'transparent', color: learnMode === 'scroll' ? 'white' : 'var(--text-muted)' }} onClick={() => setLearnMode('scroll')}>📜 Scroll</button>
              <button className="px-3 py-1 rounded-full text-[11px] font-semibold" style={{ background: learnMode === 'tiktok' ? 'var(--primary)' : 'transparent', color: learnMode === 'tiktok' ? 'white' : 'var(--text-muted)' }} onClick={() => setLearnMode('tiktok')}>📱 Feed</button>
              {activePkg?.facts?.length > 0 && (
                <button className="px-3 py-1 rounded-full text-[11px] font-semibold" style={{ background: learnMode === 'podcast' ? 'var(--primary)' : 'transparent', color: learnMode === 'podcast' ? 'white' : 'var(--text-muted)' }} onClick={() => setLearnMode('podcast')}>🎧 Podcast</button>
              )}
              {dueForReview.length > 0 && (
                <button className="px-3 py-1 rounded-full text-[10px] font-semibold" style={{ background: spacedRepMode ? 'var(--warning)' : 'transparent', color: spacedRepMode ? 'white' : 'var(--text-muted)' }} onClick={() => setSpacedRepMode(!spacedRepMode)}>🧠 Review</button>
              )}
              <button className="px-3 py-1 rounded-full text-[11px] font-semibold" style={{ background: learnMode === 'buddy' ? 'var(--primary)' : 'transparent', color: learnMode === 'buddy' ? 'white' : 'var(--text-muted)' }} onClick={() => setLearnMode('buddy')}>🤖 AI Buddy</button>
              <button className="px-3 py-1 rounded-full text-[10px] font-semibold" style={{ background: 'transparent', color: 'var(--accent)' }} onClick={() => setShowVisualLearning(true)}>🎨 Visual</button>
            </div>

            {/* Video content (if course has embedded videos) */}
            {activePkg && (activePkg.videos || []).length > 0 && (
              <div className="mb-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {(activePkg.videos || []).map((v: any, vi: number) => (
                    <button key={vi} className="shrink-0 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap" style={cs}
                      onClick={() => {
                        const el = document.getElementById('video-embed-player') as HTMLIFrameElement
                        if (el) el.src = v.embedUrl || v.url
                      }}>
                      {v.url?.includes('youtube') || v.url?.includes('youtu.be') ? '📺' : '🎬'} {v.title || `Video ${vi + 1}`}
                    </button>
                  ))}
                </div>
                <div className="rounded-xl overflow-hidden mt-2" style={{ background: '#000', aspectRatio: '16/9' }}>
                  <iframe
                    id="video-embed-player"
                    src={(activePkg.videos[0] as any).embedUrl || (activePkg.videos[0] as any).url}
                    className="w-full h-full"
                    style={{ border: 'none', aspectRatio: '16/9' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {learnMode === 'swipe' && currentFact ? (
              <>
                <div className="max-w-md mx-auto p-6 rounded-xl min-h-[200px] flex flex-col items-center justify-center cursor-pointer" style={cs} onClick={() => setFlipped(!flipped)}>
                  {!flipped ? (
                    <><div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--primary)' }}>{currentFact.category}</div><div className="text-4xl mb-3">{getEmoji(learnIndex)}</div><div className="text-lg font-semibold leading-relaxed">{currentFact.text}</div><div className="text-[11px] mt-4" style={{ color: 'var(--text-muted)' }}>👆 Tap for details</div></>
                  ) : (
                    <><div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--accent)' }}>💡 Details</div><div className="text-base leading-relaxed">{currentFact.text}</div>{currentFact.detail && <div className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>{currentFact.detail}</div>}</>
                  )}
                </div>

                {/* Spaced rep confidence rating (shown when flipped) */}
                {flipped && user && activePkg && (
                  <div className="flex justify-center gap-2 mt-3 px-4">
                    <button className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ background: 'rgba(225,112,85,.15)', color: 'var(--danger)', border: '1px solid var(--danger)' }} onClick={() => rateConfidence(0)}>😕 Forgot</button>
                    <button className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ background: 'rgba(253,203,110,.15)', color: 'var(--warning)', border: '1px solid var(--warning)' }} onClick={() => rateConfidence(0.5)}>🤔 Partly</button>
                    <button className="flex-1 py-2 rounded-lg text-xs font-semibold" style={{ background: 'rgba(0,184,148,.15)', color: 'var(--success)', border: '1px solid var(--success)' }} onClick={() => rateConfidence(1)}>😊 Knew it</button>
                  </div>
                )}

                <div className="flex justify-center gap-3 mt-4">
                  <button className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={cs} onClick={() => { if (learnIndex > 0) { setLearnIndex(i => i - 1); setFlipped(false) } }} disabled={learnIndex === 0}>◀</button>
                  <button className="w-12 h-12 rounded-full flex items-center justify-center text-xl text-white" style={{ background: 'var(--primary)', borderRadius: '50%' }} onClick={() => setFlipped(!flipped)}>🔄</button>
                  <button className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={cs} onClick={() => { if (learnIndex < activeFacts.length - 1) { setLearnIndex(i => i + 1); setFlipped(false) } }}>▶</button>
                </div>

                {/* Voice commands for hands-free learning */}
                <div className="mt-3 text-center">
                  <VoiceInput
                    placeholder="Say: next, back, flip"
                    onTranscript={(text) => {
                      const lower = text.toLowerCase().trim()
                      if (lower.includes('next') || lower.includes('forward')) {
                        if (learnIndex < activeFacts.length - 1) { setLearnIndex(i => i + 1); setFlipped(false) }
                      } else if (lower.includes('back') || lower.includes('previous')) {
                        if (learnIndex > 0) { setLearnIndex(i => i - 1); setFlipped(false) }
                      } else if (lower.includes('flip') || lower.includes('details') || lower.includes('show')) {
                        setFlipped(!flipped)
                      } else if (lower.includes('forgot') || lower.includes("don't know")) {
                        rateConfidence(0)
                      } else if (lower.includes('partly') || lower.includes('kind of') || lower.includes('sort of')) {
                        rateConfidence(0.5)
                      } else if (lower.includes('knew it') || lower.includes('know') || lower.includes('easy')) {
                        rateConfidence(1)
                      }
                    }}
                  />
                </div>
              </>
            ) : learnMode === 'scroll' ? (
              /* Scroll mode */
              <div className="text-left space-y-4 pb-8">
                {activeFacts.map((fact: any, i: number) => (
                  <div key={fact.id || i} className="p-5 rounded-xl" style={cs}>
                    <div className="text-4xl font-black mb-2" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{i + 1}</div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold mb-2" style={{ color: 'var(--primary)' }}>{fact.category}</div>
                    <div className="text-lg font-bold leading-relaxed mb-2">{fact.text}</div>
                    {fact.detail && <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{fact.detail}</div>}
                  </div>
                ))}
              </div>
            ) : learnMode === 'tiktok' ? (
              /* TikTok-style full-screen scroll */
              <div className="scroll-snap-container -mx-4 -mt-4">
                {activeFacts.map((fact: any, i: number) => (
                  <div key={fact.id || i} className="scroll-snap-item px-6">
                    <div className="w-full max-w-md text-center">
                      <div className="text-5xl mb-4 animate-float">{getEmoji(i)}</div>
                      <div className="text-[10px] uppercase tracking-wider font-bold mb-3" style={{ color: 'var(--primary)' }}>{fact.category}</div>
                      <div className="text-xl font-bold leading-relaxed mb-4">{fact.text}</div>
                      {fact.detail && <div className="text-sm px-4" style={{ color: 'var(--text-secondary)' }}>{fact.detail}</div>}
                      <div className="mt-6 flex justify-center gap-2">
                        <button className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(225,112,85,.12)', color: 'var(--danger)', border: '1px solid rgba(225,112,85,.3)' }} onClick={() => rateConfidence(0)}>😕</button>
                        <button className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(253,203,110,.12)', color: 'var(--warning)', border: '1px solid rgba(253,203,110,.3)' }} onClick={() => rateConfidence(0.5)}>🤔</button>
                        <button className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'rgba(0,184,148,.12)', color: 'var(--success)', border: '1px solid rgba(0,184,148,.3)' }} onClick={() => rateConfidence(1)}>😊</button>
                      </div>
                      <div className="text-[10px] mt-4" style={{ color: 'var(--text-muted)' }}>{i + 1}/{activeFacts.length} · Swipe up for next</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : learnMode === 'podcast' && activePkg?.facts?.length > 0 ? (
              /* Podcast mode — audio learning */
              <PodcastPlayer facts={activePkg.facts} packageName={activePkg.name} packageId={activePkg.id} cardStyle={cs} />
            ) : learnMode === 'buddy' ? (
              /* AI Buddy mode — course-specific chat */
              <div className="rounded-xl overflow-hidden" style={{ ...cs, minHeight: 400 }}>
                <StudyBuddy
                  subject={activePkg?.subject}
                  yearLevel={activePkg?.yearLevel}
                  facts={activePkg?.facts}
                  packageName={activePkg?.name}
                  personality={studyBuddyPersonality}
                  onClose={() => setLearnMode('swipe')}
                  embedded
                />
              </div>
            ) : null}
          </div>
          )
        })()}

        {/* ============ TEST SETUP ============ */}
        {screen === 'test-setup' && activePkg && (
          <div className="animate-fade-in max-w-md mx-auto text-center">
            <h2 className="text-xl font-extrabold mb-1">📝 Test Setup</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>{activePkg.name}</p>

            {/* Scope toggle */}
            {activePkg.testPatterns && activePkg.testPatterns.sampleQuestions?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2 text-left">Test Style</h3>
                <div className="flex gap-2">
                  {[{ id: 'all', icon: '📚', name: 'Full Course', desc: 'All material' }, { id: 'practice', icon: '🎯', name: 'Exam Prep', desc: 'Practice test topics' }].map(s => (
                    <div key={s.id} className="flex-1 p-3 rounded-xl text-center cursor-pointer" style={{ ...cs, borderColor: testScope === s.id ? (s.id === 'all' ? 'var(--primary)' : 'var(--accent)') : 'var(--border)', background: testScope === s.id ? (s.id === 'all' ? 'rgba(108,92,231,.08)' : 'rgba(0,206,201,.08)') : 'var(--bg-card)' }}
                      onClick={() => setTestScope(s.id as any)}>
                      <div className="text-xl mb-1">{s.icon}</div><div className="text-sm font-bold">{s.name}</div><div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Category filter */}
            {(activePkg.categories || []).length > 1 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold mb-2 text-left">Category</h3>
                <div className="flex gap-1.5 flex-wrap">
                  <button className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: testCategoryFilter === 'all' ? 'var(--primary)' : 'var(--bg-card)', color: testCategoryFilter === 'all' ? 'white' : 'var(--text-secondary)', border: `1px solid ${testCategoryFilter === 'all' ? 'var(--primary)' : 'var(--border)'}` }}
                    onClick={() => setTestCategoryFilter('all')}>All Topics</button>
                  {(activePkg.categories || []).map((cat: string) => (
                    <button key={cat} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: testCategoryFilter === cat ? 'var(--primary)' : 'var(--bg-card)', color: testCategoryFilter === cat ? 'white' : 'var(--text-secondary)', border: `1px solid ${testCategoryFilter === cat ? 'var(--primary)' : 'var(--border)'}` }}
                      onClick={() => setTestCategoryFilter(cat)}>{cat}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Question count */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2 text-left">Questions</h3>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map(n => (
                  <button key={n} className="flex-1 py-2 rounded-xl text-sm font-bold" style={{ background: testQCount === n ? 'var(--primary)' : 'var(--bg-card)', color: testQCount === n ? 'white' : 'var(--text-secondary)', border: `1px solid ${testQCount === n ? 'var(--primary)' : 'var(--border)'}` }}
                    onClick={() => setTestQCount(n)}>{n}</button>
                ))}
              </div>
            </div>

            <button className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }} onClick={startTest}>Start Test →</button>
          </div>
        )}

        {/* ============ TEST ============ */}
        {screen === 'test' && !testFinished && testQuestions.length > 0 && (
          <div className="animate-fade-in max-w-lg mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, var(--primary), var(--accent))', width: `${((currentQ + 1) / testQuestions.length) * 100}%` }} />
              </div>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Q{currentQ + 1}/{testQuestions.length}</span>
            </div>

            <span className="inline-block text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-semibold mb-3" style={{
              background: testQuestions[currentQ]?.type === 'mcq' ? 'rgba(108,92,231,.15)' : testQuestions[currentQ]?.type === 'truefalse' ? 'rgba(253,203,110,.15)' : 'rgba(85,239,196,.15)',
              color: testQuestions[currentQ]?.type === 'mcq' ? 'var(--primary)' : testQuestions[currentQ]?.type === 'truefalse' ? 'var(--warning)' : 'var(--accent)',
            }}>
              {testQuestions[currentQ]?.type === 'mcq' ? '🔘 Pick One' : testQuestions[currentQ]?.type === 'truefalse' ? '✅ True or False' : '☑️ Select All'}
            </span>
            <div className="text-lg font-bold leading-relaxed mb-3">{testQuestions[currentQ]?.question}</div>

            {/* Voice input for answering */}
            {!submitted && (
              <div className="mb-3 text-center">
                <VoiceInput
                  placeholder={
                    testQuestions[currentQ]?.type === 'truefalse' ? 'Say True or False'
                    : testQuestions[currentQ]?.type === 'mcq' ? 'Say A, B, C, or D'
                    : 'Say option letters'
                  }
                  onTranscript={(text) => {
                    const lower = text.toLowerCase().trim()
                    const qType = testQuestions[currentQ]?.type
                    if (qType === 'truefalse') {
                      if (lower.includes('true')) setAnswer(true)
                      else if (lower.includes('false')) setAnswer(false)
                    } else if (qType === 'mcq') {
                      // Match "A", "B", "C", "D" or "first", "second", etc.
                      const letterMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, first: 0, second: 1, third: 2, fourth: 3, one: 0, two: 1, three: 2, four: 3 }
                      for (const [word, idx] of Object.entries(letterMap)) {
                        if (lower.includes(word) && idx < (testQuestions[currentQ]?.options?.length || 0)) {
                          setAnswer(idx)
                          break
                        }
                      }
                    } else if (qType === 'selectall') {
                      // Parse multiple letters: "A and C", "A, B, D", etc.
                      const letterMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 }
                      const selected: number[] = []
                      for (const [letter, idx] of Object.entries(letterMap)) {
                        if (lower.includes(letter) && idx < (testQuestions[currentQ]?.options?.length || 0)) {
                          selected.push(idx)
                        }
                      }
                      if (selected.length > 0) setAnswer(selected)
                    }
                  }}
                />
              </div>
            )}

            {/* MCQ + Select All */}
            {(testQuestions[currentQ]?.type === 'mcq' || testQuestions[currentQ]?.type === 'selectall') && (
              <div className="flex flex-col gap-2">
                {testQuestions[currentQ]?.options?.map((opt, i) => {
                  const isSA = testQuestions[currentQ]?.type === 'selectall'
                  const isSel = isSA ? (Array.isArray(answer) && answer.includes(i)) : answer === i
                  let bg = 'var(--bg-card)', bc = 'var(--border)'
                  if (submitted && opt.correct) { bg = 'rgba(0,184,148,.08)'; bc = 'var(--success)' }
                  else if (submitted && isSel && !opt.correct) { bg = 'rgba(225,112,85,.08)'; bc = 'var(--danger)' }
                  else if (isSel) { bg = 'rgba(108,92,231,.08)'; bc = 'var(--primary)' }
                  return (
                    <div key={i} className="flex items-center gap-3 text-sm rounded-xl p-3 cursor-pointer" style={{ background: bg, border: `1px solid ${bc}` }}
                      onClick={() => { if (submitted) return; if (isSA) { const cur = Array.isArray(answer) ? answer : []; setAnswer(cur.includes(i) ? cur.filter((x: number) => x !== i) : [...cur, i]) } else setAnswer(i) }}>
                      <div className="w-7 h-7 flex items-center justify-center text-xs font-bold flex-shrink-0" style={{
                        borderRadius: isSA ? 4 : '50%',
                        background: submitted && opt.correct ? 'var(--success)' : submitted && isSel && !opt.correct ? 'var(--danger)' : isSel ? 'var(--primary)' : 'var(--bg)',
                        color: (submitted && (opt.correct || isSel)) || isSel ? 'white' : 'var(--text-muted)',
                      }}>{isSA ? (isSel ? '✓' : ' ') : String.fromCharCode(65 + i)}</div>
                      <div>{opt.text}</div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* True/False */}
            {testQuestions[currentQ]?.type === 'truefalse' && (
              <div className="flex gap-3">
                {[true, false].map(val => {
                  let bg = 'var(--bg-card)', bc = 'var(--border)'
                  if (submitted && val === testQuestions[currentQ]?.correctAnswer) { bg = 'rgba(0,184,148,.08)'; bc = 'var(--success)' }
                  else if (submitted && val === answer && val !== testQuestions[currentQ]?.correctAnswer) { bg = 'rgba(225,112,85,.08)'; bc = 'var(--danger)' }
                  else if (val === answer) { bg = 'rgba(108,92,231,.08)'; bc = 'var(--primary)' }
                  return (
                    <div key={String(val)} className="flex-1 p-4 rounded-xl text-center text-base font-bold cursor-pointer" style={{ background: bg, border: `1px solid ${bc}` }}
                      onClick={() => { if (!submitted) setAnswer(val) }}>
                      {val ? '✅ True' : '❌ False'}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-4">
              {!submitted ? (
                <button className="w-full py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--primary)', opacity: (answer === null || (Array.isArray(answer) && answer.length === 0)) ? 0.4 : 1 }}
                  onClick={checkAnswer} disabled={answer === null || (Array.isArray(answer) && answer.length === 0)}>Check Answer</button>
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

        {/* ============ SCORE ============ */}
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
                    <button className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'var(--primary)' }} onClick={() => { setScreen('test-setup') }}>🔄 Retry</button>
                    <button className="flex-1 py-3 rounded-xl text-sm font-bold" style={cs} onClick={goHome}>🏠 Home</button>
                  </div>
                </>
              )
            })()}
          </div>
        )}
      </div>

      {/* AI Coach — floating button on all screens */}
      <AiMentor
        packages={packages}
        testResults={myResults}
        gamification={gamData}
        currentPackage={activePkg}
        onNavigate={(s, pkg) => { if (pkg) setActivePkg(pkg); if (s === 'studybuddy') { setShowStudyBuddy(true) } else { setScreen(s as any) } }}
      />

      {/* Study Buddy overlay (full-screen chat) */}
      {showStudyBuddy && (
        <StudyBuddy
          subject={activePkg?.subject}
          yearLevel={activePkg?.yearLevel || user?.yearLevel}
          facts={activePkg?.facts}
          packageName={activePkg?.name}
          personality={studyBuddyPersonality}
          onClose={() => setShowStudyBuddy(false)}
        />
      )}

      {/* NAPLAN Practice overlay */}
      {showNaplan && (
        <div className="fixed inset-0 z-50" style={{ background: 'var(--bg)' }}>
          <NaplanPractice
            onClose={() => setShowNaplan(false)}
            yearLevel={user?.yearLevel}
          />
        </div>
      )}

      {/* Visual Learning overlay */}
      {showVisualLearning && activePkg && (
        <div className="fixed inset-0 z-50" style={{ background: 'var(--bg)' }}>
          <AiVisualLearning
            facts={activePkg.facts || []}
            packageName={activePkg.name}
            subject={activePkg.subject || ''}
            yearLevel={activePkg.yearLevel || user?.yearLevel || ''}
            onClose={() => setShowVisualLearning(false)}
          />
        </div>
      )}
    </div>
  )
}
