'use client'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useToast } from '@/lib/contexts/ThemeContext'
import * as DB from '@/lib/db'
import { callAiWithFallback } from '@/lib/ai-providers'

interface AiMentorProps {
  packages: any[]
  testResults: any[]
  gamification: any
  currentPackage?: any
  onNavigate?: (screen: string, pkg?: any) => void
}

interface Recommendation {
  type: 'practice' | 'review' | 'new_course' | 'strength' | 'milestone' | 'tip'
  title: string
  detail: string
  action?: string
  packageId?: string
  category?: string
  priority: number // 1 = highest
  icon: string
}

interface WeakArea {
  category: string
  avgScore: number
  attempts: number
  trend: 'improving' | 'declining' | 'stable'
  packageName: string
}

export function AiMentor({ packages, testResults, gamification, currentPackage, onNavigate }: AiMentorProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [expanded, setExpanded] = useState(false)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [weakAreas, setWeakAreas] = useState<WeakArea[]>([])
  const [aiInsight, setAiInsight] = useState('')
  const [loadingInsight, setLoadingInsight] = useState(false)
  const [showDetail, setShowDetail] = useState<number | null>(null)
  const [mentorMood, setMentorMood] = useState<'encouraging' | 'focused' | 'celebrating'>('encouraging')
  const analysisRan = useRef(false)

  // Analyse performance and generate recommendations on mount
  useEffect(() => {
    if (analysisRan.current || !testResults.length) return
    analysisRan.current = true
    analysePerformance()
  }, [testResults])

  const analysePerformance = () => {
    const recs: Recommendation[] = []
    const weakMap = new Map<string, { scores: number[]; pkg: string; trend: number[] }>()

    // Aggregate scores by category across all tests
    testResults.forEach((r: any) => {
      if (r.categoryScores) {
        Object.entries(r.categoryScores).forEach(([cat, score]) => {
          const key = `${r.packageId}:${cat}`
          if (!weakMap.has(key)) weakMap.set(key, { scores: [], pkg: r.packageName || 'Course', trend: [] })
          const entry = weakMap.get(key)!
          entry.scores.push(score as number)
          entry.trend.push(score as number)
        })
      }
    })

    // Identify weak areas (avg < 70%)
    const weak: WeakArea[] = []
    weakMap.forEach((data, key) => {
      const [pkgId, cat] = key.split(':')
      const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length
      if (avg < 70) {
        // Determine trend from last 3 attempts
        const recent = data.trend.slice(-3)
        let trend: 'improving' | 'declining' | 'stable' = 'stable'
        if (recent.length >= 2) {
          const diff = recent[recent.length - 1] - recent[0]
          if (diff > 5) trend = 'improving'
          else if (diff < -5) trend = 'declining'
        }
        weak.push({ category: cat, avgScore: Math.round(avg), attempts: data.scores.length, trend, packageName: data.pkg })
      }
    })
    weak.sort((a, b) => a.avgScore - b.avgScore)
    setWeakAreas(weak)

    // Generate recommendations based on analysis
    // 1. Weak areas need practice
    weak.slice(0, 3).forEach((w, i) => {
      recs.push({
        type: 'practice',
        title: `Focus on ${w.category}`,
        detail: w.trend === 'declining'
          ? `Your scores in ${w.category} have been dropping (avg ${w.avgScore}%). Let's turn this around with focused practice.`
          : w.trend === 'improving'
            ? `You're improving in ${w.category} (avg ${w.avgScore}%) — keep the momentum going!`
            : `${w.category} is at ${w.avgScore}% — targeted practice will help lift this.`,
        action: 'Practice Now',
        category: w.category,
        priority: i + 1,
        icon: w.trend === 'declining' ? '🔴' : w.trend === 'improving' ? '🟡' : '🟠',
      })
    })

    // 2. Check for courses not attempted recently
    const testedPkgIds = new Set(testResults.map((r: any) => r.packageId))
    const untestedPkgs = packages.filter(p => p.status === 'published' && !testedPkgIds.has(p.id))
    if (untestedPkgs.length > 0) {
      const pkg = untestedPkgs[0]
      recs.push({
        type: 'new_course',
        title: `Try "${pkg.name}"`,
        detail: `You haven't started this course yet. It covers ${pkg.subject || 'new material'} — give it a go!`,
        action: 'Start Learning',
        packageId: pkg.id,
        priority: 4,
        icon: '🆕',
      })
    }

    // 3. Celebrate strengths (categories > 85%)
    weakMap.forEach((data, key) => {
      const [_, cat] = key.split(':')
      const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length
      if (avg >= 85 && data.scores.length >= 2) {
        recs.push({
          type: 'strength',
          title: `Strong in ${cat}!`,
          detail: `You're averaging ${Math.round(avg)}% in ${cat} — this is a real strength. Consider helping others or trying extension-level content.`,
          priority: 8,
          icon: '💪',
        })
      }
    })

    // 4. Streaks and milestones
    if (gamification?.currentStreak >= 3) {
      setMentorMood('celebrating')
      recs.push({
        type: 'milestone',
        title: `${gamification.currentStreak}-day streak!`,
        detail: `Amazing dedication! You've studied ${gamification.currentStreak} days in a row. Keep this momentum — consistency is the key to long-term retention.`,
        priority: 2,
        icon: '🔥',
      })
    }

    if (gamification?.testsCompleted && gamification.testsCompleted % 10 === 0 && gamification.testsCompleted > 0) {
      recs.push({
        type: 'milestone',
        title: `${gamification.testsCompleted} tests completed!`,
        detail: `You've hit a major milestone. That's real commitment to your learning.`,
        priority: 7,
        icon: '🏆',
      })
    }

    // 5. Smart tips based on patterns
    const recentResults = testResults.slice(0, 5)
    const recentAvg = recentResults.length ? recentResults.reduce((a: number, r: any) => a + (r.score || 0), 0) / recentResults.length : 0
    if (recentAvg < 50 && recentResults.length >= 3) {
      setMentorMood('focused')
      recs.push({
        type: 'tip',
        title: 'Try Learn Mode first',
        detail: `Your recent test scores suggest the material needs more review. Try spending time in Learn Mode (swipe cards or podcast) before testing — it makes a big difference.`,
        priority: 1,
        icon: '💡',
      })
    } else if (recentAvg >= 80) {
      setMentorMood('celebrating')
      recs.push({
        type: 'tip',
        title: 'Ready for a challenge?',
        detail: `You're crushing it with ${Math.round(recentAvg)}% average! Consider trying harder questions or a new subject to keep growing.`,
        priority: 6,
        icon: '🚀',
      })
    }

    recs.sort((a, b) => a.priority - b.priority)
    setRecommendations(recs)
  }

  const generateAiInsight = async () => {
    if (!user) return
    setLoadingInsight(true)
    try {
      const aiConfig = await DB.getAiConfig(user.id)
      if (!aiConfig || !(aiConfig as any).apiKey) {
        // Use built-in insight
        const insight = generateBuiltInInsight()
        setAiInsight(insight)
        setLoadingInsight(false)
        return
      }

      const recentScores = testResults.slice(0, 10).map((r: any) => ({
        course: r.packageName, score: r.score, date: new Date(r.timestamp).toLocaleDateString(),
      }))

      const prompt = `You are a friendly, encouraging Australian study coach for a secondary school student named ${user.name}.

Here are their recent test results:
${JSON.stringify(recentScores, null, 2)}

Their weak areas: ${weakAreas.map(w => `${w.category} (${w.avgScore}%, ${w.trend})`).join(', ') || 'None identified yet'}
Their streak: ${gamification?.currentStreak || 0} days
Tests completed: ${gamification?.testsCompleted || 0}

Give a brief (3-4 sentences), personalised coaching message. Be specific about what they should focus on. Use Australian English. Be warm and supportive but also actionable. Don't use bullet points — write naturally as if you're talking to them.`

      const result = await callAiWithFallback(aiConfig as any, prompt)
      setAiInsight(result.text)
    } catch {
      setAiInsight(generateBuiltInInsight())
    }
    setLoadingInsight(false)
  }

  const generateBuiltInInsight = (): string => {
    if (weakAreas.length > 0) {
      const weakest = weakAreas[0]
      return `Hey ${user?.name || 'there'}! I've been looking at your progress and I think the best thing you can focus on right now is ${weakest.category} — you're sitting at ${weakest.avgScore}% there, and with a bit of targeted practice you can really lift that. Try doing a few rounds in Learn Mode for that topic before your next test. You've got this!`
    }
    if (testResults.length === 0) {
      return `Welcome! The best way to start is to pick a course that interests you and dive into Learn Mode. Once you're feeling confident, take a practice test to see where you stand. I'll be here to guide you along the way.`
    }
    const avg = testResults.slice(0, 5).reduce((a: number, r: any) => a + (r.score || 0), 0) / Math.min(5, testResults.length)
    if (avg >= 80) {
      return `You're doing brilliantly — averaging ${Math.round(avg)}% on recent tests! Consider challenging yourself with a new subject or trying the extension-level questions. Consistency is key, so keep that study routine going.`
    }
    return `You're making solid progress! Your recent average is ${Math.round(avg)}%. To keep improving, try reviewing the topics you got wrong after each test — that's where the real learning happens. Even 15 minutes of focused review can make a big difference.`
  }

  const mentorEmoji = mentorMood === 'celebrating' ? '🎉' : mentorMood === 'focused' ? '🎯' : '😊'

  if (!expanded) {
    // Collapsed: floating mentor button
    return (
      <div className="fixed bottom-20 right-4 z-50">
        <button
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-lg transition-all hover:scale-110"
          style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)', boxShadow: '0 4px 20px rgba(108,92,231,.4)' }}
          onClick={() => { setExpanded(true); if (!aiInsight) generateAiInsight() }}
        >
          {mentorEmoji}
        </button>
        {recommendations.length > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
            {Math.min(recommendations.length, 9)}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[9980] flex items-end justify-end p-4" onClick={() => setExpanded(false)}>
      <div className="w-full max-w-sm max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl animate-fade-in flex flex-col"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)' }}>
          <div className="text-3xl">{mentorEmoji}</div>
          <div className="flex-1 text-white">
            <div className="font-bold text-sm">AI Study Coach</div>
            <div className="text-xs opacity-80">Personalised guidance for you</div>
          </div>
          <button className="text-white text-lg opacity-70 hover:opacity-100" onClick={() => setExpanded(false)}>✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* AI Insight */}
          <div className="p-3 rounded-xl mb-3" style={{ background: 'rgba(108,92,231,.06)', border: '1px solid rgba(108,92,231,.15)' }}>
            {loadingInsight ? (
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <div className="w-4 h-4 rounded-full" style={{ borderWidth: 2, borderColor: 'var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
                Thinking about your progress...
              </div>
            ) : aiInsight ? (
              <div>
                <div className="text-xs leading-relaxed" style={{ color: 'var(--text)' }}>{aiInsight}</div>
                <button className="text-[10px] mt-2" style={{ color: 'var(--primary)' }} onClick={generateAiInsight}>Refresh insight</button>
              </div>
            ) : (
              <button className="text-xs font-semibold" style={{ color: 'var(--primary)' }} onClick={generateAiInsight}>
                ✨ Get personalised coaching advice
              </button>
            )}
          </div>

          {/* Weak Areas Summary */}
          {weakAreas.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Areas to Improve</h4>
              <div className="flex flex-wrap gap-1.5">
                {weakAreas.slice(0, 5).map(w => (
                  <div key={w.category} className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px]" style={{
                    background: w.avgScore < 40 ? 'rgba(214,48,49,.1)' : w.avgScore < 60 ? 'rgba(253,203,110,.1)' : 'rgba(0,206,201,.1)',
                    border: `1px solid ${w.avgScore < 40 ? 'rgba(214,48,49,.2)' : w.avgScore < 60 ? 'rgba(253,203,110,.2)' : 'rgba(0,206,201,.2)'}`,
                    color: 'var(--text-secondary)',
                  }}>
                    <span>{w.trend === 'improving' ? '📈' : w.trend === 'declining' ? '📉' : '➡️'}</span>
                    <span className="font-semibold">{w.category}</span>
                    <span>{w.avgScore}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Recommendations</h4>
              {recommendations.slice(0, 6).map((rec, i) => (
                <div key={i} className="p-2.5 rounded-xl mb-1.5 cursor-pointer transition-all" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                  onClick={() => setShowDetail(showDetail === i ? null : i)}>
                  <div className="flex items-start gap-2">
                    <span className="text-base">{rec.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold">{rec.title}</div>
                      {showDetail === i && (
                        <div className="text-[11px] mt-1 leading-relaxed animate-fade-in" style={{ color: 'var(--text-secondary)' }}>
                          {rec.detail}
                          {rec.action && onNavigate && (
                            <button className="block mt-1.5 px-3 py-1 rounded-lg text-[10px] font-bold text-white" style={{ background: 'var(--primary)' }}
                              onClick={e => { e.stopPropagation(); /* Navigate to relevant screen */ }}>
                              {rec.action} →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{showDetail === i ? '▲' : '▼'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {recommendations.length === 0 && testResults.length === 0 && (
            <div className="text-center py-6">
              <div className="text-3xl mb-2">📚</div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Take your first test and I'll start giving you personalised guidance!</p>
            </div>
          )}
        </div>

        {/* Quick Actions Footer */}
        <div className="p-3 border-t flex gap-2" style={{ borderColor: 'var(--border)' }}>
          <button className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            onClick={() => { if (onNavigate) onNavigate('studybuddy') }}>
            💬 Chat with AI
          </button>
          <button className="flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            onClick={() => { if (onNavigate) onNavigate('studyplan') }}>
            📋 Study Plan
          </button>
        </div>
      </div>
    </div>
  )
}
