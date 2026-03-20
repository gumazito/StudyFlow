'use client'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useToast } from '@/lib/contexts/ThemeContext'
import * as DB from '@/lib/db'
import { SUBJECTS, YEAR_LEVELS, genId } from '@/lib/constants'
import { CrossPublishPanel } from './CrossPublishPanel'
import { FileUpload } from '../groups/FileUpload'
import { parseFile, extractResearchFacts, extractTestPatterns, aiAutoResearch, generateFromKnowledgeBank } from '@/lib/content-engine'
import type { Fact, TestPatterns } from '@/lib/content-engine'

interface PackageEditorProps {
  pkg: any
  onSave: (pkg: any) => void
  onCancel: () => void
}

export function PackageEditor({ pkg, onSave, onCancel }: PackageEditorProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState({ ...pkg })
  const [processing, setProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'content' | 'preview'>('details')
  const [otherSubject, setOtherSubject] = useState(SUBJECTS.includes(pkg.subject) ? '' : pkg.subject)
  const [aiConfig, setAiConfig] = useState<any>(null)
  const [aiKeyInput, setAiKeyInput] = useState('')
  const [aiProvider, setAiProvider] = useState<'anthropic' | 'openai'>('anthropic')
  const [showAiSetup, setShowAiSetup] = useState(false)
  const [editingFact, setEditingFact] = useState<{ index: number; text: string; detail: string; category: string } | null>(null)
  const [syncing, setSyncing] = useState(false)

  const update = (key: string, val: any) => setData((d: any) => ({ ...d, [key]: val }))

  // Load AI config
  useEffect(() => {
    if (user?.id) {
      DB.getAiConfig(user.id).then(cfg => { if (cfg) { setAiConfig(cfg); setAiProvider((cfg as any).provider || 'anthropic') } })
    }
  }, [user?.id])

  const handleFiles = async (files: File[], contentType: 'research' | 'practice_test') => {
    setProcessing(true)
    try {
      const newContent = [...(data.content || [])]
      let allResearchText = (data.content || []).filter((c: any) => c.type === 'research').map((c: any) => c.text).join('\n\n')
      let allTestText = (data.content || []).filter((c: any) => c.type === 'practice_test').map((c: any) => c.text).join('\n\n')

      for (const file of files) {
        const text = await parseFile(file)
        if (text.trim().length < 20) { toast(`"${file.name}" doesn't have enough content`, 'error'); continue }
        newContent.push({ id: genId(), name: file.name, type: contentType, text, addedAt: Date.now() })
        if (contentType === 'research') allResearchText += '\n\n' + text
        else allTestText += '\n\n' + text
      }

      const topicName = data.name || data.subject || 'Study Material'
      const { facts, categories } = allResearchText.trim() ? extractResearchFacts(allResearchText, topicName) : { facts: [], categories: [] }
      const testPatterns = allTestText.trim() ? extractTestPatterns(allTestText) : null

      setData((d: any) => ({ ...d, content: newContent, facts, categories, testPatterns }))
      toast(`${files.length} file(s) processed`, 'success')
    } catch (err: any) {
      toast('Error processing file: ' + err.message, 'error')
    }
    setProcessing(false)
  }

  const removeContent = (id: string) => {
    const newContent = (data.content || []).filter((c: any) => c.id !== id)
    const topicName = data.name || data.subject || 'Study Material'
    const researchText = newContent.filter((c: any) => c.type === 'research').map((c: any) => c.text).join('\n\n')
    const testText = newContent.filter((c: any) => c.type === 'practice_test').map((c: any) => c.text).join('\n\n')
    const { facts, categories } = researchText.trim() ? extractResearchFacts(researchText, topicName) : { facts: [], categories: [] }
    const testPatterns = testText.trim() ? extractTestPatterns(testText) : null
    setData((d: any) => ({ ...d, content: newContent, facts, categories, testPatterns }))
  }

  const runAutoResearch = async () => {
    if (!data.subject && !data.name) { toast('Set a name or subject first', 'error'); return }
    setProcessing(true)
    let result
    if (aiConfig?.apiKey) {
      result = await aiAutoResearch(data.subject, data.yearLevel, data.name, data.testPatterns, aiConfig.apiKey, aiConfig.provider)
      if (result.error || result.facts.length === 0) {
        result = generateFromKnowledgeBank(data.subject, data.yearLevel, data.name, data.testPatterns)
        result.note += ' (AI fallback)'
      }
    } else {
      result = generateFromKnowledgeBank(data.subject, data.yearLevel, data.name, data.testPatterns)
    }
    const existingTexts = new Set((data.facts || []).map((f: Fact) => f.text))
    const newFacts = result.facts.filter(f => !existingTexts.has(f.text))
    setData((d: any) => ({
      ...d,
      facts: [...(d.facts || []), ...newFacts],
      categories: [...new Set([...(d.categories || []), ...result.categories])],
      autoResearchGenerated: true, autoResearchNote: result.note,
    }))
    setProcessing(false)
    toast(result.note, 'success')
  }

  const saveAiKey = async () => {
    if (!aiKeyInput.trim() || !user?.id) return
    const config = { provider: aiProvider, apiKey: aiKeyInput.trim() }
    await DB.saveAiConfig(user.id, config)
    setAiConfig(config)
    setShowAiSetup(false)
    setAiKeyInput('')
    toast('AI key saved', 'success')
  }

  const save = () => {
    if (!data.name?.trim()) { toast('Enter a package name', 'error'); return }
    if (data.autoResearch && (data.facts || []).length === 0) {
      const result = generateFromKnowledgeBank(data.subject, data.yearLevel, data.name, data.testPatterns)
      data.facts = result.facts
      data.categories = result.categories
      data.autoResearchGenerated = true
    }
    onSave(data)
  }

  const researchContent = (data.content || []).filter((c: any) => c.type === 'research')
  const practiceContent = (data.content || []).filter((c: any) => c.type === 'practice_test')

  const inputStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }
  const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }

  return (
    <div className="max-w-3xl mx-auto px-4 py-4 pb-24 animate-fade-in">
      <div className="flex justify-between items-start flex-wrap gap-2 mb-4">
        <div>
          <h1 className="text-xl font-extrabold">{pkg.name ? 'Edit Package' : 'New Package'}</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Configure details and content</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-lg text-xs" style={{ ...cardStyle, color: 'var(--text-secondary)' }} onClick={onCancel}>Cancel</button>
          <button className="px-4 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: 'var(--primary)' }} onClick={save}>💾 Save</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-4" style={{ borderColor: 'var(--border)' }}>
        {(['details', 'content', 'preview'] as const).map(tab => (
          <button key={tab} className="px-4 py-2 text-sm font-semibold border-b-2"
            style={{ borderColor: activeTab === tab ? 'var(--primary)' : 'transparent', color: activeTab === tab ? 'var(--text)' : 'var(--text-muted)' }}
            onClick={() => setActiveTab(tab)}>
            {tab === 'details' ? '📋 Details' : tab === 'content' ? `📄 Content (${(data.content || []).length})` : '👁 Preview'}
          </button>
        ))}
      </div>

      {/* DETAILS TAB */}
      {activeTab === 'details' && (
        <div>
          <div className="mb-3">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Package Name *</label>
            <input className="w-full px-3 py-2.5 rounded-md text-sm" style={inputStyle} value={data.name || ''} onChange={e => update('name', e.target.value)} placeholder="e.g. Year 8 Algebra Fundamentals" />
          </div>
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Subject *</label>
              <select className="w-full px-3 py-2.5 rounded-md text-sm appearance-none" style={inputStyle} value={SUBJECTS.includes(data.subject) ? data.subject : 'Other'} onChange={e => update('subject', e.target.value === 'Other' ? '' : e.target.value)}>
                <option value="">Select...</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Year Level *</label>
              <select className="w-full px-3 py-2.5 rounded-md text-sm appearance-none" style={inputStyle} value={data.yearLevel || ''} onChange={e => update('yearLevel', e.target.value)}>
                <option value="">Select...</option>
                {YEAR_LEVELS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Description</label>
            <textarea className="w-full px-3 py-2 rounded-md text-sm min-h-[80px]" style={inputStyle} value={data.description || ''} onChange={e => update('description', e.target.value)} placeholder="Describe what this package covers..." />
          </div>
          {/* Branding */}
          <div className="mb-3">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Course Branding</label>
            <div className="flex gap-3">
              <div>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Colour</span>
                <div className="flex gap-1 mt-1">
                  {['#6c5ce7', '#00cec9', '#e17055', '#00b894', '#fdcb6e', '#fd79a8', '#636e72'].map(c => (
                    <div key={c} className="w-7 h-7 rounded-full cursor-pointer" style={{ background: c, border: (data.brandColor || '#6c5ce7') === c ? '3px solid white' : '3px solid transparent' }} onClick={() => update('brandColor', c)} />
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Icon</span>
                <div className="flex gap-1 mt-1 flex-wrap">
                  {['📚', '🧠', '🔬', '📐', '🌍', '🎨', '💻', '🏃', '✝️', '🎵', '📖', '🧪'].map(e => (
                    <button key={e} className="text-lg w-8 h-8 rounded flex items-center justify-center" style={{ background: (data.brandIcon || '📚') === e ? 'var(--primary)' : 'var(--bg-card)', border: '1px solid var(--border)' }} onClick={() => update('brandIcon', e)}>{e}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Collaborators */}
          <div className="mb-3">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>👥 Collaborators</label>
            <div className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>Add other publishers as contributors to this course.</div>
            {(data.collaborators || []).map((c: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-1 text-xs">
                <span>{c.name || c.email} — <span className="font-semibold">{c.role}</span></span>
                <button className="text-[10px]" style={{ color: 'var(--text-muted)' }} onClick={() => update('collaborators', (data.collaborators || []).filter((_: any, j: number) => j !== i))}>Remove</button>
              </div>
            ))}
            <div className="flex gap-2 mt-1">
              <input className="flex-1 px-3 py-1.5 rounded-md text-xs" style={inputStyle} id="collab-email" placeholder="Publisher email..." />
              <select className="px-2 py-1.5 rounded-md text-xs" style={inputStyle} id="collab-role">
                <option value="contributor">Contributor</option>
                <option value="owner">Co-Owner</option>
              </select>
              <button className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                onClick={() => {
                  const emailEl = document.getElementById('collab-email') as HTMLInputElement
                  const roleEl = document.getElementById('collab-role') as HTMLSelectElement
                  if (!emailEl?.value.includes('@')) return
                  update('collaborators', [...(data.collaborators || []), { email: emailEl.value, role: roleEl.value, addedAt: Date.now() }])
                  emailEl.value = ''
                }}>+ Add</button>
            </div>
          </div>

          {/* Video Embeds (YouTube / Vimeo) */}
          <div className="mb-3">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>🎬 Video Content</label>
            <div className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>Add YouTube or Vimeo videos for learners to watch alongside flash cards.</div>
            {(data.videos || []).map((v: any, i: number) => (
              <div key={i} className="flex justify-between items-center py-1.5 px-2 mb-1 rounded-lg text-xs" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span>{v.url?.includes('youtube') || v.url?.includes('youtu.be') ? '📺' : '🎬'}</span>
                  <span className="truncate">{v.title || v.url}</span>
                </div>
                <button className="text-[10px] ml-2 shrink-0" style={{ color: 'var(--danger)' }} onClick={() => update('videos', (data.videos || []).filter((_: any, j: number) => j !== i))}>Remove</button>
              </div>
            ))}
            <div className="flex gap-2 mt-1">
              <input className="flex-1 px-3 py-1.5 rounded-md text-xs" style={inputStyle} id="video-url" placeholder="YouTube or Vimeo URL..." />
              <input className="w-32 px-3 py-1.5 rounded-md text-xs" style={inputStyle} id="video-title" placeholder="Title (optional)" />
              <button className="px-3 py-1.5 rounded-lg text-xs" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                onClick={() => {
                  const urlEl = document.getElementById('video-url') as HTMLInputElement
                  const titleEl = document.getElementById('video-title') as HTMLInputElement
                  const url = urlEl?.value?.trim()
                  if (!url) return
                  const isYT = url.includes('youtube.com') || url.includes('youtu.be')
                  const isVimeo = url.includes('vimeo.com')
                  if (!isYT && !isVimeo) { alert('Please enter a YouTube or Vimeo URL'); return }
                  let embedUrl = url
                  if (isYT) {
                    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
                    if (match) embedUrl = `https://www.youtube.com/embed/${match[1]}`
                  }
                  if (isVimeo) {
                    const match = url.match(/vimeo\.com\/(\d+)/)
                    if (match) embedUrl = `https://player.vimeo.com/video/${match[1]}`
                  }
                  update('videos', [...(data.videos || []), { url, embedUrl, title: titleEl?.value || '', addedAt: Date.now() }])
                  urlEl.value = ''
                  if (titleEl) titleEl.value = ''
                }}>+ Add</button>
            </div>
          </div>

          {/* Direct Video Upload */}
          {data.id && (
            <div className="mb-3">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>📤 Upload Video File</label>
              <div className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>Upload video directly (MP4, MOV, WebM — max 100MB). Stored in Firebase Storage.</div>
              <FileUpload
                path={`videos/${data.id}`}
                accept=".mp4,.mov,.webm,.avi"
                maxSizeMB={100}
                label="Upload video file"
                onUploaded={(url, name) => {
                  const storagePath = `videos/${data.id}/${Date.now()}_${name}`
                  DB.addVideoToPackage(data.id, { name, url, storagePath })
                  update('videos', [...(data.videos || []), { url, title: name, embedUrl: url, isUpload: true, addedAt: Date.now() }])
                  toast(`Video "${name}" uploaded`, 'success')
                }}
              />
            </div>
          )}

          {/* Cross-Publish */}
          {user && data.id && (
            <CrossPublishPanel
              packageId={data.id}
              packageName={data.name || ''}
              crossPublished={data.crossPublished || []}
              onUpdate={(published) => update('crossPublished', published)}
            />
          )}

          {/* Sync Linked Courses */}
          {user && data.id && (data.crossPublished || []).some((cp: any) => cp.mode === 'link') && (
            <div className="mt-3 p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold">🔄 Sync Linked Courses</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Push your latest facts & categories to all linked copies</div>
                </div>
                <button
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                  style={{ background: syncing ? 'var(--text-muted)' : 'var(--primary)' }}
                  disabled={syncing}
                  onClick={async () => {
                    setSyncing(true)
                    try {
                      const updated = await DB.propagateLinkedCourseUpdates(data.id)
                      toast(`Synced to ${updated.length} linked course${updated.length !== 1 ? 's' : ''}`, 'success')
                    } catch (err: any) {
                      toast('Sync failed: ' + err.message, 'error')
                    }
                    setSyncing(false)
                  }}>
                  {syncing ? '⏳ Syncing...' : '🔄 Sync Now'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTENT TAB */}
      {activeTab === 'content' && (
        <div>
          {/* Research upload */}
          <div className="mb-5">
            <h3 className="text-sm font-bold mb-1">📚 Research / Learning Content</h3>
            <p className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>Textbook material, notes — used to teach and generate tests</p>
            <label className="block p-5 rounded-xl border-2 border-dashed text-center cursor-pointer transition-colors" style={{ borderColor: 'var(--border)' }}>
              <div className="text-sm font-semibold">📄 Upload learning material</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>PDF, TXT, DOCX, MD, HTML</div>
              <input type="file" multiple accept=".pdf,.txt,.md,.docx,.doc,.html,.htm,.csv" className="hidden"
                onChange={e => { if (e.target.files?.length) handleFiles(Array.from(e.target.files), 'research'); e.target.value = '' }} />
            </label>
            {researchContent.map((c: any) => (
              <div key={c.id} className="flex items-center gap-3 p-2.5 mt-1 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <span className="text-lg">📄</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{c.name}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{(c.text.length / 1000).toFixed(1)}k chars</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(108,92,231,.15)', color: 'var(--primary)' }}>Research</span>
                <button className="text-sm" style={{ color: 'var(--text-muted)' }} onClick={() => removeContent(c.id)}>✕</button>
              </div>
            ))}
          </div>

          {/* Practice test upload */}
          <div className="mb-5">
            <h3 className="text-sm font-bold mb-1">📝 Practice Test Content</h3>
            <p className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>Sample exams — shapes test style (NOT taught as facts)</p>
            <label className="block p-5 rounded-xl border-2 border-dashed text-center cursor-pointer" style={{ borderColor: 'var(--border)' }}>
              <div className="text-sm font-semibold">📝 Upload practice tests</div>
              <input type="file" multiple accept=".pdf,.txt,.md,.docx,.doc,.html,.htm,.csv" className="hidden"
                onChange={e => { if (e.target.files?.length) handleFiles(Array.from(e.target.files), 'practice_test'); e.target.value = '' }} />
            </label>
            {practiceContent.map((c: any) => (
              <div key={c.id} className="flex items-center gap-3 p-2.5 mt-1 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <span className="text-lg">📝</span>
                <div className="flex-1 min-w-0"><div className="text-sm font-semibold truncate">{c.name}</div></div>
                <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,206,201,.15)', color: 'var(--accent)' }}>Practice</span>
                <button className="text-sm" style={{ color: 'var(--text-muted)' }} onClick={() => removeContent(c.id)}>✕</button>
              </div>
            ))}
          </div>

          {/* Auto-Research */}
          <div className="p-3.5 mb-4 rounded-xl" style={{ ...cardStyle, borderColor: data.autoResearch ? 'rgba(108,92,231,.3)' : 'var(--border)' }}>
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => update('autoResearch', !data.autoResearch)}>
              <div className="w-11 h-6 rounded-full relative" style={{ background: data.autoResearch ? 'var(--primary)' : 'var(--border)' }}>
                <div className="w-5 h-5 rounded-full bg-white absolute top-0.5" style={{ left: data.autoResearch ? 22 : 2 }} />
              </div>
              <div>
                <div className="text-sm font-bold">🔍 Auto-Research Mode</div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Uses AI to generate learning content</div>
              </div>
            </div>
            {data.autoResearch && (
              <div className="mt-3">
                {aiConfig?.apiKey ? (
                  <div className="flex justify-between items-center p-2 rounded-lg" style={{ background: 'rgba(108,92,231,.06)' }}>
                    <div>
                      <div className="text-xs font-semibold" style={{ color: 'var(--success)' }}>✅ {aiConfig.provider === 'anthropic' ? 'Claude' : 'ChatGPT'} connected</div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Key: ...{aiConfig.apiKey.slice(-8)}</div>
                    </div>
                    <button className="text-xs px-2 py-1 rounded" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }} onClick={() => setShowAiSetup(true)}>Update</button>
                  </div>
                ) : (
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(108,92,231,.06)' }}>
                    <div className="text-xs font-semibold mb-1" style={{ color: 'var(--warning)' }}>⚠️ No AI key — using built-in content</div>
                    <button className="px-3 py-1 rounded-lg text-xs text-white" style={{ background: 'var(--primary)' }} onClick={() => setShowAiSetup(true)}>🔑 Set Up AI</button>
                  </div>
                )}
                {showAiSetup && (
                  <div className="mt-2 p-3 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--primary)' }}>
                    <div className="flex gap-1.5 mb-2">
                      {(['anthropic', 'openai'] as const).map(p => (
                        <button key={p} className="px-2.5 py-1 rounded-full text-xs" style={{ background: aiProvider === p ? 'var(--primary)' : 'var(--bg-card)', color: aiProvider === p ? 'white' : 'var(--text-muted)', border: `1px solid ${aiProvider === p ? 'var(--primary)' : 'var(--border)'}` }}
                          onClick={() => setAiProvider(p)}>{p === 'anthropic' ? 'Claude' : 'ChatGPT'}</button>
                      ))}
                    </div>
                    <input type="password" className="w-full px-3 py-2 rounded-md text-sm mb-2" style={inputStyle} value={aiKeyInput} onChange={e => setAiKeyInput(e.target.value)}
                      placeholder={aiProvider === 'anthropic' ? 'sk-ant-api03-...' : 'sk-proj-...'} />
                    <div className="flex gap-1.5">
                      <button className="px-3 py-1 rounded-lg text-xs text-white" style={{ background: 'var(--primary)' }} onClick={saveAiKey}>Save Key</button>
                      <button className="px-3 py-1 rounded-lg text-xs" style={{ color: 'var(--text-muted)' }} onClick={() => setShowAiSetup(false)}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Facts list */}
          {(data.facts || []).length > 0 && (
            <div className="p-3.5 mb-4 rounded-xl" style={cardStyle}>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-bold">📝 Facts ({(data.facts || []).length})</h4>
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Click to edit</span>
              </div>
              <div className="max-h-[250px] overflow-y-auto">
                {(data.facts || []).map((f: Fact, i: number) => (
                  <div key={f.id || i} className="py-1.5 border-b flex gap-2 items-start" style={{ borderColor: 'var(--border)' }}>
                    {editingFact?.index === i ? (
                      <div className="flex-1">
                        <input className="w-full px-2 py-1 rounded text-xs mb-1" style={inputStyle} value={editingFact.text} onChange={e => setEditingFact({ ...editingFact, text: e.target.value })} />
                        <input className="w-full px-2 py-1 rounded text-xs mb-1" style={inputStyle} value={editingFact.detail} onChange={e => setEditingFact({ ...editingFact, detail: e.target.value })} placeholder="Detail..." />
                        <div className="flex gap-1">
                          <input className="flex-1 px-2 py-1 rounded text-xs" style={inputStyle} value={editingFact.category} onChange={e => setEditingFact({ ...editingFact, category: e.target.value })} placeholder="Category" />
                          <button className="px-2 py-1 rounded text-xs text-white" style={{ background: 'var(--primary)' }} onClick={() => {
                            const facts = [...(data.facts || [])]
                            facts[i] = { ...facts[i], text: editingFact.text, detail: editingFact.detail, category: editingFact.category }
                            setData((d: any) => ({ ...d, facts }))
                            setEditingFact(null)
                          }}>✓</button>
                          <button className="px-2 py-1 rounded text-xs" style={{ color: 'var(--text-muted)' }} onClick={() => setEditingFact(null)}>✕</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 cursor-pointer min-w-0" onClick={() => setEditingFact({ index: i, text: f.text, detail: f.detail || '', category: f.category || '' })}>
                          <div className="text-xs font-medium leading-relaxed">{f.text}</div>
                          <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{f.category}{f.aiGenerated ? ' · 🤖' : ''}</div>
                        </div>
                        <button className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }} onClick={() => {
                          setData((d: any) => ({ ...d, facts: (d.facts || []).filter((_: any, j: number) => j !== i) }))
                        }}>✕</button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          {((data.facts || []).length > 0 || data.testPatterns) && (
            <div className="p-3 rounded-xl text-xs" style={{ ...cardStyle, background: 'rgba(108,92,231,.05)' }}>
              <h4 className="text-sm font-bold mb-1">📊 Analysis</h4>
              <div className="flex gap-4 flex-wrap">
                <span>💡 {(data.facts || []).length} facts</span>
                <span>📂 {(data.categories || []).length} categories</span>
                {data.testPatterns && <span>📝 {data.testPatterns.sampleQuestions?.length || 0} practice Qs</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* PREVIEW TAB */}
      {activeTab === 'preview' && (
        <div>
          {(data.facts || []).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">👁</div>
              <h3 className="text-base font-bold">Nothing to preview</h3>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Add content first</p>
            </div>
          ) : (
            <>
              <div className="p-3 rounded-xl mb-3" style={cardStyle}>
                <h3 className="text-base font-bold mb-1">{data.name || 'Untitled'}</h3>
                <div className="flex gap-1.5 flex-wrap mb-1">
                  {data.subject && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>{data.subject}</span>}
                  {data.yearLevel && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>{data.yearLevel}</span>}
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{(data.facts || []).length} facts across {(data.categories || []).length} categories</p>
              </div>
              <h4 className="text-sm font-bold mb-2">Sample Facts (first 5):</h4>
              {(data.facts || []).slice(0, 5).map((f: Fact, i: number) => (
                <div key={f.id || i} className="flex items-start gap-2 p-2 mb-1 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                  <span>{'💡📌🔑📎⭐'[i] || '💡'}</span>
                  <div>
                    <div className="text-xs font-medium">{f.text}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{f.category}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Processing overlay */}
      {processing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(10,10,15,.95)' }}>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-4" style={{ borderWidth: 3, borderColor: 'var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
            <h3 className="font-bold">Processing...</h3>
          </div>
        </div>
      )}
    </div>
  )
}
