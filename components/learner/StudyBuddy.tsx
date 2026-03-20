'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { callAiWithFallback } from '@/lib/ai-providers'
import * as DB from '@/lib/db'
import { moderateText } from '@/lib/content-moderation'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

interface StudyBuddyProps {
  subject?: string
  yearLevel?: string
  facts?: any[]
  packageName?: string
  personality?: 'encouraging' | 'strict' | 'humorous'
  onClose: () => void
  /** When true, renders inline (not as a fixed overlay). Used in learn mode. */
  embedded?: boolean
}

/**
 * Conversational AI tutor — "Study Buddy"
 * Provides contextual help based on the active course/subject.
 * Uses the multi-provider AI fallback system.
 */
export function StudyBuddy({ subject, yearLevel, facts, packageName, personality = 'encouraging', onClose, embedded = false }: StudyBuddyProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiConfig, setAiConfig] = useState<any>(null)
  const [configLoaded, setConfigLoaded] = useState(false)
  const [activePersonality, setActivePersonality] = useState(personality)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load AI config
  useEffect(() => {
    if (!user?.id) return
    DB.getAiConfig(user.id).then(cfg => {
      setAiConfig(cfg)
      setConfigLoaded(true)
    })
  }, [user?.id])

  // Add system welcome on mount
  useEffect(() => {
    const welcome: Message = {
      role: 'assistant',
      content: packageName
        ? `Hey! I'm your Study Buddy for **${packageName}**${subject ? ` (${subject})` : ''}. Ask me anything about the topic — I can explain concepts, quiz you, give examples, or help with tricky questions. What would you like to know?`
        : `Hey! I'm your Study Buddy. I can help explain concepts, give examples, quiz you, or clarify anything you're studying. What subject are you working on?`,
      timestamp: Date.now(),
    }
    setMessages([welcome])
  }, [packageName, subject])

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const buildSystemPrompt = () => {
    const personalityGuide = activePersonality === 'strict'
      ? 'You are direct, no-nonsense, and hold students to high standards. Push them to think harder. Don\'t sugarcoat mistakes.'
      : personality === 'humorous'
      ? 'You are witty and use humour, puns, and jokes to make learning fun. Keep it light and entertaining while still being educational.'
      : 'You are warm, supportive, and celebrate every effort. Use positive reinforcement and encouragement generously.'
    let system = `You are "Study Buddy", an AI tutor for Australian high school students. Personality: ${personalityGuide}`
    if (yearLevel) system += ` The student is in ${yearLevel}.`
    if (subject) system += ` Current subject: ${subject}.`
    if (packageName) system += ` Current topic: ${packageName}.`
    system += `\n\nGuidelines:
- Keep explanations clear and age-appropriate
- Use Australian English spelling (colour, organise, etc.)
- Give examples and analogies when helpful
- Encourage the student and celebrate progress
- If they ask you to quiz them, create questions and check their answers
- Keep responses concise (2-4 paragraphs max unless they ask for detail)
- Use markdown formatting for clarity
- Never give harmful, inappropriate, or off-topic content
- If they ask something unrelated to studying, gently redirect`

    if (facts && facts.length > 0) {
      const factSummary = facts.slice(0, 15).map((f, i) => `${i + 1}. ${f.text}`).join('\n')
      system += `\n\nKey facts for this topic:\n${factSummary}`
    }
    return system
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    // Content moderation
    const mod = moderateText(text)
    if (mod.severity === 'severe') {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I noticed some inappropriate language. Let's keep things positive and focused on learning! Try rephrasing your question.",
        timestamp: Date.now(),
      }])
      return
    }

    const userMsg: Message = { role: 'user', content: mod.clean ? text : mod.sanitised, timestamp: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      if (!aiConfig || !configLoaded) {
        throw new Error('AI not configured. Go to Profile > AI Provider Settings to add an API key.')
      }

      const systemPrompt = buildSystemPrompt()
      const conversationHistory = [...messages, userMsg]
        .filter(m => m.role !== 'system')
        .slice(-10) // Keep last 10 messages for context
        .map(m => `${m.role === 'user' ? 'Student' : 'Study Buddy'}: ${m.content}`)
        .join('\n\n')

      const fullPrompt = `${systemPrompt}\n\nConversation so far:\n${conversationHistory}\n\nStudy Buddy:`

      const result = await callAiWithFallback(aiConfig, fullPrompt)
      const response = result.text.replace(/^Study Buddy:\s*/i, '').trim()

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      }])
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Oops! I couldn't process that: ${err.message}. Make sure your AI provider is configured in Profile settings.`,
        timestamp: Date.now(),
      }])
    } finally {
      setLoading(false)
    }
  }

  const quickPrompts = [
    { label: 'Explain this topic', prompt: `Can you explain ${packageName || 'this topic'} in simple terms?` },
    { label: 'Quiz me', prompt: 'Give me a quick quiz question to test my knowledge!' },
    { label: 'Give an example', prompt: 'Can you give me a real-world example of this?' },
    { label: 'Simplify', prompt: "I don't understand. Can you explain it more simply?" },
  ]

  return (
    <div className={embedded ? "flex flex-col" : "fixed inset-0 z-[999] flex flex-col"} style={{ background: 'var(--bg)', ...(embedded ? { minHeight: 400, maxHeight: '70vh' } : {}) }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)', background: 'var(--bg-card)', ...(embedded ? { borderRadius: '12px 12px 0 0' } : {}) }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <div>
            <div className="text-sm font-bold">Study Buddy</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {packageName || 'AI Tutor'}{subject ? ` · ${subject}` : ''}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {([['encouraging', '😊'], ['strict', '📏'], ['humorous', '😂']] as const).map(([p, emoji]) => (
            <button key={p} className="px-2 py-1 rounded-lg text-[10px]" title={p}
              style={{ background: activePersonality === p ? 'var(--primary)' : 'var(--bg)', color: activePersonality === p ? 'white' : 'var(--text-muted)', border: `1px solid ${activePersonality === p ? 'var(--primary)' : 'var(--border)'}` }}
              onClick={() => setActivePersonality(p)}>{emoji}</button>
          ))}
          <button className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} onClick={onClose}>
            Close
          </button>
        </div>
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
                <p key={li} className={li > 0 ? 'mt-1.5' : ''}>{
                  line.replace(/\*\*(.*?)\*\*/g, '«$1»').split('«').map((part, pi) => {
                    if (part.includes('»')) {
                      const [bold, rest] = part.split('»')
                      return <span key={pi}><strong>{bold}</strong>{rest}</span>
                    }
                    return <span key={pi}>{part}</span>
                  })
                }</p>
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
          {quickPrompts.map((qp, i) => (
            <button key={i} className="px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--primary)' }}
              onClick={() => { setInput(qp.prompt); }}>
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
            placeholder="Ask your Study Buddy..."
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
