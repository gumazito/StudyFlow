'use client'

import { useState } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useToast } from '@/lib/contexts/ThemeContext'
import * as DB from '@/lib/db'
import { generateStudyPlan } from '@/lib/ai-providers'

interface StudyPlanPanelProps {
  packages: any[]
  testResults: any[]
  cardStyle: any
}

export function StudyPlanPanel({ packages, testResults, cardStyle }: StudyPlanPanelProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [plan, setPlan] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [provider, setProvider] = useState<string>('')

  const generatePlan = async () => {
    if (!user?.id) return
    setGenerating(true)
    try {
      const aiConfig = await DB.getAiConfig(user.id)
      if (!aiConfig) {
        toast('Set up an AI provider in your Profile first', 'error')
        return
      }

      // Build course summaries from test results
      const courseMap: Record<string, { scores: number[]; name: string; subject: string }> = {}
      for (const r of testResults as any[]) {
        const pkgId = r.packageId
        if (!courseMap[pkgId]) {
          const pkg = packages.find((p: any) => p.id === pkgId)
          courseMap[pkgId] = { scores: [], name: pkg?.name || r.packageName || 'Course', subject: pkg?.subject || '' }
        }
        if (r.score !== undefined) courseMap[pkgId].scores.push(r.score)
        else if (r.correct !== undefined && r.total) courseMap[pkgId].scores.push(Math.round((r.correct / r.total) * 100))
      }

      const courses = Object.values(courseMap).map(c => ({
        name: c.name,
        subject: c.subject,
        avgScore: c.scores.length ? Math.round(c.scores.reduce((a, b) => a + b, 0) / c.scores.length) : 0,
        testsCompleted: c.scores.length,
        weakTopics: c.scores.length > 0 && c.scores.reduce((a, b) => a + b, 0) / c.scores.length < 70
          ? [c.subject || c.name]
          : [],
      }))

      if (courses.length === 0) {
        toast('Take some tests first so we can build your plan', 'error')
        return
      }

      const result = await generateStudyPlan(aiConfig as any, user.name || 'Student', courses)
      setPlan(result.text)
      setProvider(result.provider)
    } catch (err: any) {
      toast(err.message || 'Failed to generate study plan', 'error')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="mb-4">
      {!plan ? (
        <div className="text-center p-5 rounded-xl" style={cardStyle}>
          <div className="text-3xl mb-2">📅</div>
          <h3 className="text-sm font-bold mb-1">AI Study Plan</h3>
          <p className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>
            Get a personalised 7-day study plan based on your test results and progress.
          </p>
          <button
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: generating ? 'var(--text-muted)' : 'var(--primary)' }}
            onClick={generatePlan}
            disabled={generating}
          >
            {generating ? '⏳ Generating...' : '🤖 Generate My Plan'}
          </button>
        </div>
      ) : (
        <div className="rounded-xl p-4" style={cardStyle}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold">📅 Your Study Plan</h3>
            <div className="flex gap-2">
              <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(108,92,231,.12)', color: 'var(--primary)' }}>via {provider}</span>
              <button className="text-[10px]" style={{ color: 'var(--primary)' }} onClick={() => setPlan(null)}>↻ New</button>
            </div>
          </div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
            {plan}
          </div>
        </div>
      )}
    </div>
  )
}
