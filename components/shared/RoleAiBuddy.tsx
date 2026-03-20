'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { callAiWithFallback } from '@/lib/ai-providers'
import * as DB from '@/lib/db'
import { moderateText } from '@/lib/content-moderation'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

type BuddyRole = 'mentor' | 'publisher' | 'group-owner'

interface RoleAiBuddyProps {
  role: BuddyRole
  /** For mentors: mentees data */
  mentees?: any[]
  /** For publishers: courses/packages data */
  packages?: any[]
  /** For group owners: group members + their results */
  groupMembers?: any[]
  groupName?: string
  /** Test results / analytics data */
  testResults?: any[]
  onClose: () => void
}

const ROLE_CONFIG: Record<BuddyRole, { title: string; icon: string; gradient: string; placeholder: string; quickPrompts: { label: string; prompt: string }[] }> = {
  mentor: {
    title: 'Mentor AI Assistant',
    icon: '🧭',
    gradient: 'linear-gradient(135deg, #e17055, #fdcb6e)',
    placeholder: 'Ask about your mentees, their progress, or get coaching tips...',
    quickPrompts: [
      { label: 'Who needs help?', prompt: 'Which of my mentees are struggling and might need extra support? What specific areas are they weak in?' },
      { label: 'Suggest a message', prompt: 'Draft an encouraging message I can send to a mentee who has been struggling with their recent test scores.' },
      { label: 'Progress overview', prompt: 'Give me a summary of how all my mentees are doing — who is improving, who is declining, and who is inactive.' },
      { label: 'Study tips to share', prompt: 'What study strategies should I recommend to my mentees based on their common weak areas?' },
    ],
  },
  publisher: {
    title: 'Publisher AI Assistant',
    icon: '✏️',
    gradient: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
    placeholder: 'Ask about your course performance, learner feedback, or get improvement suggestions...',
    quickPrompts: [
      { label: 'Course performance', prompt: 'How are my courses performing? Which ones have the highest and lowest completion/score rates?' },
      { label: 'Content gaps', prompt: 'Based on learner test results, which topics or categories seem to be causing the most difficulty? This might indicate content that needs improvement.' },
      { label: 'Improve a course', prompt: 'What specific improvements could I make to my lowest-performing course to help learners score better?' },
      { label: 'Engagement ideas', prompt: 'Suggest ways to make my courses more engaging — interactive elements, better structure, or additional content types.' },
    ],
  },
  'group-owner': {
    title: 'Group AI Assistant',
    icon: '👥',
    gradient: 'linear-gradient(135deg, #00cec9, #0984e3)',
    placeholder: 'Ask about group performance, member activity, or course effectiveness...',
    quickPrompts: [
      { label: 'Group overview', prompt: 'Give me a health check on my group — how active are members, what are average scores, and are there any concerns?' },
      { label: 'Struggling members', prompt: 'Which group members have low scores or haven\'t been active recently? What courses are they struggling with?' },
      { label: 'Best performers', prompt: 'Who are the top performers in the group? Should any of them be recognised or given mentoring roles?' },
      { label: 'Course effectiveness', prompt: 'Which courses in our group are most effective (high scores, good completion rates) and which might need to be replaced or improved?' },
    ],
  },
}

export function RoleAiBuddy({ role, mentees, packages, groupMembers, groupName, testResults, onClose }: RoleAiBuddyProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiConfig, setAiConfig] = useState<any>(null)
  const [configLoaded, setConfigLoaded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const config = ROLE_CONFIG[role]

  useEffect(() => {
    if (!user?.id) return
    DB.getAiConfig(user.id).then(cfg => { setAiConfig(cfg); setConfigLoaded(true) })
  }, [user?.id])

  useEffect(() => {
    const welcome: Message = {
      role: 'assistant',
      content: getWelcomeMessage(),
      timestamp: Date.now(),
    }
    setMessages([welcome])
  }, [role])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const getWelcomeMessage = () => {
    switch (role) {
      case 'mentor':
        return `Hey ${user?.name?.split(' ')[0] || 'there'}! I'm your Mentor AI Assistant. I can help you understand where your mentees are at, suggest personalised advice for them, draft encouraging messages, and identify who might need extra support. What would you like to know?`
      case 'publisher':
        return `Hey ${user?.name?.split(' ')[0] || 'there'}! I'm your Publisher AI Assistant. I can analyse how your courses are performing, identify content gaps, suggest improvements based on learner results, and help you create better educational content. What would you like to explore?`
      case 'group-owner':
        return `Hey ${user?.name?.split(' ')[0] || 'there'}! I'm your Group AI Assistant${groupName ? ` for "${groupName}"` : ''}. I can give you insights into member activity, identify who's struggling, highlight top performers, and assess which courses are working well. What do you want to know?`
    }
  }

  const buildContext = () => {
    let context = `You are an AI assistant for a ${role === 'group-owner' ? 'group administrator' : role} on StudyFlow, an Australian education platform.
User: ${user?.name || 'Unknown'}
Role: ${role}
Use Australian English. Be helpful, specific, and actionable. Keep responses concise (3-5 paragraphs max).
`

    if (role === 'mentor' && mentees) {
      context += `\nMentees (${mentees.length}):\n`
      mentees.slice(0, 20).forEach((m: any) => {
        context += `- ${m.name || m.email}: ${m.recentScore != null ? `Recent score ${m.recentScore}%` : 'No tests yet'}${m.lastActive ? `, last active ${m.lastActive}` : ''}\n`
      })
    }

    if (role === 'publisher' && packages) {
      context += `\nCourses (${packages.length}):\n`
      packages.slice(0, 20).forEach((p: any) => {
        context += `- "${p.name}" (${p.subject || 'General'}): ${p.facts?.length || 0} facts, ${p.totalAttempts || 0} test attempts, avg score ${p.avgScore || 'N/A'}%\n`
      })
    }

    if (role === 'group-owner') {
      if (groupName) context += `\nGroup: ${groupName}\n`
      if (groupMembers) {
        context += `Members (${groupMembers.length}):\n`
        groupMembers.slice(0, 30).forEach((m: any) => {
          context += `- ${m.name || m.email}: ${m.testsCompleted || 0} tests, avg ${m.avgScore || 'N/A'}%, last active ${m.lastActive || 'unknown'}\n`
        })
      }
    }

    if (testResults && testResults.length > 0) {
      context += `\nRecent test results (${testResults.length} total):\n`
      testResults.slice(0, 15).forEach((r: any) => {
        context += `- ${r.userName || 'Student'}: "${r.packageName}" — ${r.score}% (${new Date(r.timestamp || r.createdAt).toLocaleDateString()})\n`
      })
    }

    return context
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const mod = moderateText(text)
    if (mod.severity === 'severe') {
      setMessages(prev => [...prev, { role: 'assistant', content: "Let's keep things professional. Try rephrasing your question.", timestamp: Date.now() }])
      return
    }

    const userMsg: Message = { role: 'user', content: text, timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      if (!aiConfig || !configLoaded) {
        throw new Error('AI not configured. Go to Profile → AI Provider Settings to add an API key.')
      }

      const context = buildContext()
      const history = [...messages, userMsg]
        .slice(-10)
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n')

      const fullPrompt = `${context}\n\nConversation:\n${history}\n\nAssistant:`
      const result = await callAiWithFallback(aiConfig, fullPrompt)
      const response = result.text.replace(/^Assistant:\s*/i, '').trim()

      setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: Date.now() }])
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Oops: ${err.message}`, timestamp: Date.now() }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[999] flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: config.gradient }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">{config.icon}</span>
          <div className="text-white">
            <div className="text-sm font-bold">{config.title}</div>
            <div className="text-[10px] opacity-80">AI-powered insights for your role</div>
          </div>
        </div>
        <button className="text-white text-sm px-3 py-1 rounded-lg opacity-80 hover:opacity-100" style={{ background: 'rgba(255,255,255,.15)' }} onClick={onClose}>Close</button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm" style={{
              background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-card)',
              color: msg.role === 'user' ? 'white' : 'var(--text)',
              border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
              borderBottomRightRadius: msg.role === 'user' ? 4 : undefined,
              borderBottomLeftRadius: msg.role === 'assistant' ? 4 : undefined,
            }}>
              {msg.content.split('\n').map((line, li) => (
                <p key={li} className={li > 0 ? 'mt-1.5' : ''}>{line}</p>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-3.5 py-2.5 rounded-2xl text-sm" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderBottomLeftRadius: 4 }}>
              <span className="inline-flex gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--text-muted)', animation: 'pulse 1.4s infinite' }} />
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--text-muted)', animation: 'pulse 1.4s infinite 0.2s' }} />
                <span className="w-2 h-2 rounded-full" style={{ background: 'var(--text-muted)', animation: 'pulse 1.4s infinite 0.4s' }} />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      {messages.length <= 2 && (
        <div className="flex gap-1.5 px-4 pb-2 flex-wrap">
          {config.quickPrompts.map((qp, i) => (
            <button key={i} className="px-2.5 py-1.5 rounded-full text-[11px] font-semibold"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--primary)' }}
              onClick={() => setInput(qp.prompt)}>
              {qp.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)' }}>
        <div className="flex gap-2">
          <input
            className="flex-1 px-3.5 py-2.5 rounded-xl text-sm"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
            placeholder={config.placeholder}
            disabled={loading}
          />
          <button
            className="px-4 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: loading || !input.trim() ? 'var(--text-muted)' : 'var(--primary)' }}
            onClick={sendMessage}
            disabled={loading || !input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
