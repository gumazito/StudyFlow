'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useToast } from '@/lib/contexts/ThemeContext'
import * as DB from '@/lib/db'

const PROVIDERS = [
  { id: 'anthropic', name: 'Claude (Anthropic)', icon: '🟣', keyPrefix: 'sk-ant-', setupUrl: 'https://console.anthropic.com/settings/keys', desc: 'Best for detailed, nuanced research content' },
  { id: 'openai', name: 'ChatGPT (OpenAI)', icon: '🟢', keyPrefix: 'sk-', setupUrl: 'https://platform.openai.com/api-keys', desc: 'Fast, versatile content generation' },
  { id: 'gemini', name: 'Gemini (Google)', icon: '🔵', keyPrefix: 'AI', setupUrl: 'https://aistudio.google.com/app/apikey', desc: 'Strong at structured, factual content' },
  { id: 'grok', name: 'Grok (xAI)', icon: '⚫', keyPrefix: 'xai-', setupUrl: 'https://console.x.ai/', desc: 'Creative and concise explanations' },
]

interface AiProviderSettingsProps {
  cardStyle: any
  inputStyle: any
}

export function AiProviderSettings({ cardStyle, inputStyle }: AiProviderSettingsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [keyInputs, setKeyInputs] = useState<Record<string, string>>({})
  const [showSetup, setShowSetup] = useState<string | null>(null)
  const [priority, setPriority] = useState<string[]>(['anthropic', 'openai', 'gemini', 'grok'])

  useEffect(() => {
    if (user?.id) {
      DB.getAiConfig(user.id).then(cfg => {
        if (cfg) {
          setConfig(cfg)
          if ((cfg as any).priority) setPriority((cfg as any).priority)
        }
        setLoading(false)
      })
    }
  }, [user?.id])

  const saveKey = async (providerId: string) => {
    if (!user?.id) return
    const key = keyInputs[providerId]?.trim()
    if (!key) return

    const newConfig = {
      ...config,
      providers: {
        ...(config?.providers || {}),
        [providerId]: { key, addedAt: Date.now(), status: 'active' },
      },
      priority,
      provider: config?.provider || providerId, // Keep backward compat
      apiKey: config?.apiKey || (providerId === 'anthropic' || providerId === 'openai' ? key : config?.apiKey),
    }
    await DB.saveAiConfig(user.id, newConfig)
    setConfig(newConfig)
    setKeyInputs(prev => ({ ...prev, [providerId]: '' }))
    toast(`${PROVIDERS.find(p => p.id === providerId)?.name} key saved`, 'success')
  }

  const removeKey = async (providerId: string) => {
    if (!user?.id || !config) return
    const providers = { ...(config.providers || {}) }
    delete providers[providerId]
    const newConfig = { ...config, providers }
    await DB.saveAiConfig(user.id, newConfig)
    setConfig(newConfig)
    toast('API key removed', 'success')
  }

  const movePriority = (providerId: string, direction: 'up' | 'down') => {
    const idx = priority.indexOf(providerId)
    if (idx < 0) return
    const newIdx = direction === 'up' ? idx - 1 : idx + 1
    if (newIdx < 0 || newIdx >= priority.length) return
    const newPriority = [...priority]
    newPriority[idx] = newPriority[newIdx]
    newPriority[newIdx] = providerId
    setPriority(newPriority)
    // Auto-save
    if (user?.id) {
      DB.saveAiConfig(user.id, { ...config, priority: newPriority })
    }
  }

  const hasKey = (providerId: string) => {
    return config?.providers?.[providerId]?.key || (providerId === (config?.provider || 'anthropic') && config?.apiKey)
  }

  if (loading) return <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading AI settings...</div>

  return (
    <div>
      <h3 className="text-sm font-bold mb-3">🤖 AI Provider Settings</h3>
      <div className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>
        Configure one or more AI providers for auto-research. If your primary provider fails, StudyFlow will automatically try the next one in your priority order.
      </div>

      {/* Priority order */}
      <div className="mb-4 p-3 rounded-xl" style={cardStyle}>
        <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Fallback Priority Order</div>
        {priority.map((pId, i) => {
          const prov = PROVIDERS.find(p => p.id === pId)
          if (!prov) return null
          const connected = hasKey(pId)
          return (
            <div key={pId} className="flex items-center gap-2 py-1.5">
              <span className="text-xs font-bold w-5" style={{ color: 'var(--text-muted)' }}>{i + 1}.</span>
              <span className="text-sm">{prov.icon}</span>
              <span className="text-xs font-semibold flex-1">{prov.name}</span>
              {connected ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(0,184,148,.12)', color: 'var(--success)' }}>Connected</span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg)', color: 'var(--text-muted)' }}>Not set up</span>
              )}
              <button className="text-[10px]" style={{ color: 'var(--text-muted)' }} onClick={() => movePriority(pId, 'up')} disabled={i === 0}>▲</button>
              <button className="text-[10px]" style={{ color: 'var(--text-muted)' }} onClick={() => movePriority(pId, 'down')} disabled={i === priority.length - 1}>▼</button>
            </div>
          )
        })}
      </div>

      {/* Provider cards */}
      {PROVIDERS.map(prov => {
        const connected = hasKey(prov.id)
        const isExpanded = showSetup === prov.id
        return (
          <div key={prov.id} className="mb-2 rounded-xl p-3" style={cardStyle}>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowSetup(isExpanded ? null : prov.id)}>
              <span className="text-lg">{prov.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold">{prov.name}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{prov.desc}</div>
              </div>
              {connected ? (
                <span className="text-[10px] font-semibold" style={{ color: 'var(--success)' }}>✅</span>
              ) : (
                <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>Set up →</span>
              )}
            </div>
            {isExpanded && (
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                {connected ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: 'var(--success)' }}>Key saved: ****{(config?.providers?.[prov.id]?.key || config?.apiKey || '').slice(-6)}</span>
                    <button className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(225,112,85,.12)', color: 'var(--danger)' }} onClick={() => removeKey(prov.id)}>Remove</button>
                  </div>
                ) : (
                  <>
                    <div className="text-[11px] mb-2" style={{ color: 'var(--text-secondary)' }}>
                      1. Go to <a href={prov.setupUrl} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--primary)' }}>{prov.setupUrl}</a><br />
                      2. Create an account or sign in<br />
                      3. Generate an API key and paste it below
                    </div>
                    <div className="flex gap-2">
                      <input
                        className="flex-1 px-3 py-2 rounded-md text-xs"
                        style={inputStyle}
                        type="password"
                        placeholder={`Paste your ${prov.name} API key...`}
                        value={keyInputs[prov.id] || ''}
                        onChange={e => setKeyInputs(prev => ({ ...prev, [prov.id]: e.target.value }))}
                      />
                      <button
                        className="px-4 py-2 rounded-lg text-xs font-semibold text-white"
                        style={{ background: 'var(--primary)' }}
                        onClick={() => saveKey(prov.id)}
                      >Save</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
