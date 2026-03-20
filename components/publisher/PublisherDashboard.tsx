'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useToast } from '@/lib/contexts/ThemeContext'
import * as DB from '@/lib/db'
import { SUBJECTS, YEAR_LEVELS, COUNTRIES, SUBJECT_TOPICS, DEFAULT_TEMPLATES, genId } from '@/lib/constants'
import { useModal } from '@/lib/contexts/ThemeContext'
import { PackageEditor } from './PackageEditor'
import { PdfExport } from './PdfExport'

interface PublisherDashboardProps {
  onSwitchView: ((view: string | null) => void) | null
  onLogout: () => void
}

export function PublisherDashboard({ onSwitchView, onLogout }: PublisherDashboardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { showConfirm } = useModal()
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [screen, setScreen] = useState<'dashboard' | 'analytics' | 'editor'>('dashboard')
  const [editingPkg, setEditingPkg] = useState<any>(null)
  const [analyticsData, setAnalyticsData] = useState<any[] | null>(null)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showAiForm, setShowAiForm] = useState(false)
  const [aiForm, setAiForm] = useState({ subject: '', yearLevel: '', country: 'AU', topic: '', difficulty: 'standard', numFacts: '30', selectedTopics: [] as string[], customTopic: '', additionalNotes: '' })
  const [bulkEmails, setBulkEmails] = useState('')

  useEffect(() => {
    DB.loadPackages().then(pkgs => {
      setPackages((pkgs as any[]).filter(p => p.authorId === user?.id || p.authorId === 'demo-author'))
      setLoading(false)
    })
  }, [user])

  const filtered = packages.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return (p.name || '').toLowerCase().includes(q) || (p.subject || '').toLowerCase().includes(q)
  })

  const createNew = async (template?: any, openEditor = false) => {
    if (!user) return
    const t = template || {}
    const pkg = {
      id: genId(), name: t.name || 'New Course', subject: t.subject || '', yearLevel: t.yearLevel || '',
      description: t.description || '', country: t.country || '',
      status: 'draft', autoResearch: t.autoResearch || false, authorId: user.id, authorName: user.name,
      createdAt: Date.now(), updatedAt: Date.now(),
      content: [], facts: [], categories: [], testPatterns: null,
      collaborators: [], difficulty: t.difficulty || '', topic: t.topic || '',
    }
    await DB.savePackage(pkg)
    setPackages(prev => [pkg, ...prev])
    if (openEditor) {
      setEditingPkg(pkg)
      setScreen('editor')
    } else {
      toast('New course created — edit it to add content', 'success')
    }
  }

  const togglePublish = async (pkg: any) => {
    const newStatus = pkg.status === 'published' ? 'draft' : 'published'
    if (newStatus === 'published' && !pkg.name) { toast('Package needs a name', 'error'); return }
    if (newStatus === 'published' && (pkg.facts || []).length === 0 && !pkg.autoResearch) { toast('Add content or enable auto-research first', 'error'); return }
    const updated = { ...pkg, status: newStatus, updatedAt: Date.now() }
    await DB.savePackage(updated)
    if (newStatus === 'published') {
      try { await DB.createAnnouncement(pkg.id, pkg.name) } catch {}
    }
    setPackages(prev => prev.map(p => p.id === pkg.id ? updated : p))
    toast(newStatus === 'published' ? 'Course published!' : 'Course unpublished', newStatus === 'published' ? 'success' : 'info')
  }

  const deletePkg = async (id: string) => {
    const confirmed = await showConfirm('Are you sure you want to delete this course? This cannot be undone.', 'Delete Course')
    if (!confirmed) return
    await DB.deletePackage(id)
    setPackages(prev => prev.filter(p => p.id !== id))
    toast('Course deleted', 'info')
  }

  const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return
    const headers = Object.keys(data[0])
    const csv = [headers.join(','), ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="text-lg font-extrabold" style={{ background: 'linear-gradient(135deg, #a29bfe, #00cec9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>StudyFlow</div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(108,92,231,.15)', color: 'var(--primary, #6c5ce7)' }}>Publisher</span>
          {onSwitchView && <button className="text-xs px-2 py-1" style={{ color: 'var(--text-secondary)' }} onClick={() => onSwitchView(null)}>Switch</button>}
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{user?.name}</span>
          <button className="text-xs px-2 py-1" style={{ color: 'var(--text-secondary)' }} onClick={onLogout}>Logout</button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex justify-between items-start flex-wrap gap-2 mb-4">
          <div>
            <h1 className="text-2xl font-extrabold">My Learning Packages</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Create and manage study content</p>
          </div>
          <button className="px-4 py-2 rounded-lg text-sm font-bold text-white" style={{ background: 'var(--primary)' }} onClick={() => setShowTemplates(true)}>+ New Package</button>
        </div>

        <input className="w-full px-3.5 py-2.5 rounded-md text-sm mb-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
          value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search your packages..." />

        <div className="flex border-b mb-3" style={{ borderColor: 'var(--border)' }}>
          <button className="px-4 py-2 text-sm font-semibold border-b-2" style={{ borderColor: screen === 'dashboard' ? 'var(--primary)' : 'transparent', color: screen === 'dashboard' ? 'var(--text)' : 'var(--text-muted)' }}
            onClick={() => setScreen('dashboard')}>📦 Packages</button>
          <button className="px-4 py-2 text-sm font-semibold border-b-2" style={{ borderColor: screen === 'analytics' ? 'var(--primary)' : 'transparent', color: screen === 'analytics' ? 'var(--text)' : 'var(--text-muted)' }}
            onClick={async () => { setScreen('analytics'); const r = await DB.getAllTestResults(); setAnalyticsData(r as any[]) }}>📊 Analytics</button>
        </div>

        {loading ? (
          <div className="text-center py-10"><div className="w-10 h-10 rounded-full mx-auto mb-3" style={{ borderWidth: 3, borderColor: 'var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} /></div>
        ) : screen === 'dashboard' ? (
          <>
            {filtered.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {filtered.map((pkg, i) => (
                  <div key={pkg.id} className="p-4 rounded-xl animate-fade-in" style={{ ...cardStyle, animationDelay: `${i * 0.05}s` }}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-base flex-1 mr-2">{pkg.name || 'Untitled'}</div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: pkg.status === 'published' ? 'rgba(0,184,148,.15)' : 'rgba(253,203,110,.15)', color: pkg.status === 'published' ? 'var(--success)' : 'var(--warning)' }}>{pkg.status}</span>
                    </div>
                    <div className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{pkg.description || 'No description'}</div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {pkg.subject && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{pkg.subject}</span>}
                      {pkg.yearLevel && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{pkg.yearLevel}</span>}
                    </div>
                    <div className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>
                      📄 {(pkg.content || []).length} files · 💡 {(pkg.facts || []).length} facts · 📂 {(pkg.categories || []).length} categories
                    </div>
                    <div className="flex gap-1.5">
                      <button className="px-2.5 py-1 rounded-lg text-[11px] font-semibold" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                        onClick={() => { setEditingPkg(pkg); setScreen('editor') }}>✏️ Edit</button>
                      <button className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white"
                        style={{ background: pkg.status === 'published' ? 'var(--warning)' : 'var(--success)', color: pkg.status === 'published' ? '#000' : '#fff' }}
                        onClick={() => togglePublish(pkg)}>{pkg.status === 'published' ? '⏸ Unpublish' : '🚀 Publish'}</button>
                      <button className="px-2.5 py-1 rounded-lg text-[11px]" style={{ color: 'var(--danger)', border: '1px solid var(--danger)', background: 'transparent' }}
                        onClick={() => deletePkg(pkg.id)}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">📦</div>
                <h3 className="text-base font-bold">{search ? 'No matches' : 'No packages yet'}</h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Create your first learning package</p>
              </div>
            )}
          </>
        ) : (
          /* ANALYTICS */
          <div className="animate-fade-in">
            {analyticsData === null ? (
              <div className="text-center py-10"><p>Loading analytics...</p></div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">📊 Analytics</h2>
                  {analyticsData.length > 0 && (
                    <div className="flex gap-2">
                      <button className="px-3 py-1 rounded-lg text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                        onClick={() => exportToCSV(analyticsData.map((r: any) => ({ Student: r.userName, Course: r.packageName, Score: r.score + '%', Date: r.timestamp ? new Date(r.timestamp).toLocaleDateString() : '' })), 'studyflow-results.csv')}>
                        📥 Export CSV
                      </button>
                      <PdfExport results={analyticsData} packageName="All Courses" userName={user?.name || 'Publisher'} />
                    </div>
                  )}
                </div>
                <div className="flex gap-2.5 flex-wrap mb-5">
                  {[
                    { n: analyticsData.length, l: 'Total Tests', c: 'var(--primary, #6c5ce7)' },
                    { n: [...new Set(analyticsData.map((r: any) => r.userId))].length, l: 'Learners', c: 'var(--accent)' },
                    { n: analyticsData.length ? Math.round(analyticsData.reduce((a: number, r: any) => a + (r.score || 0), 0) / analyticsData.length) + '%' : '—', l: 'Avg Score', c: 'var(--success)' },
                  ].map((s, i) => (
                    <div key={i} className="flex-1 min-w-[80px] p-3.5 rounded-xl text-center" style={cardStyle}>
                      <div className="text-2xl font-extrabold" style={{ color: s.c }}>{s.n}</div>
                      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <h3 className="text-sm font-bold mb-2">Recent Results</h3>
                {analyticsData.slice(0, 20).map((r: any, i: number) => (
                  <div key={r.id || i} className="p-2.5 mb-1 rounded-lg" style={cardStyle}>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-semibold">{r.userName || 'Unknown'} — {r.packageName || 'Course'}</div>
                        <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{r.timestamp ? new Date(r.timestamp).toLocaleString() : ''}</div>
                      </div>
                      <div className="text-base font-extrabold" style={{ color: (r.score || 0) >= 70 ? 'var(--success)' : 'var(--danger)' }}>{r.score}%</div>
                    </div>
                  </div>
                ))}
                {analyticsData.length === 0 && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No test results yet.</p>}
              </>
            )}
          </div>
        )}

        {screen === 'editor' && editingPkg && (
          <PackageEditor
            pkg={editingPkg}
            onSave={async (updated: any) => {
              updated.updatedAt = Date.now()
              await DB.savePackage(updated)
              setPackages(prev => {
                const exists = prev.find(p => p.id === updated.id)
                return exists ? prev.map(p => p.id === updated.id ? updated : p) : [updated, ...prev]
              })
              setScreen('dashboard')
              setEditingPkg(null)
              toast('Package saved', 'success')
            }}
            onCancel={() => { setScreen('dashboard'); setEditingPkg(null) }}
          />
        )}

        {/* TEMPLATE PICKER OVERLAY — simplified to Blank + AI */}
        {showTemplates && !showAiForm && (
          <div className="fixed inset-0 z-[9990] flex items-center justify-center p-5" style={{ background: 'rgba(0,0,0,.7)' }} onClick={() => setShowTemplates(false)}>
            <div className="w-full max-w-md p-6 rounded-xl animate-fade-in" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-extrabold">Create New Package</h2>
                <button className="text-lg" style={{ color: 'var(--text-muted)' }} onClick={() => setShowTemplates(false)}>✕</button>
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>How would you like to start?</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-5 rounded-xl text-center cursor-pointer transition-all hover:scale-[1.02]" style={{ background: 'var(--bg)', border: '2px solid var(--border)' }}
                  onClick={() => { setShowTemplates(false); createNew({ name: '' }, true) }}>
                  <div className="text-4xl mb-2">📄</div>
                  <div className="text-sm font-bold">Blank</div>
                  <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Start from scratch — add your own content</div>
                </div>
                <div className="p-5 rounded-xl text-center cursor-pointer transition-all hover:scale-[1.02]" style={{ background: 'var(--bg)', border: '2px solid rgba(108,92,231,.3)' }}
                  onClick={() => { setShowAiForm(true) }}>
                  <div className="text-4xl mb-2">🤖</div>
                  <div className="text-sm font-bold">AI Generated</div>
                  <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Tell us the subject and we'll create content</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI GENERATION FORM — dynamic, subject-aware */}
        {showTemplates && showAiForm && (() => {
          const subjectTopics = SUBJECT_TOPICS[aiForm.subject]
          const toggleTopic = (t: string) => setAiForm(f => ({ ...f, selectedTopics: f.selectedTopics.includes(t) ? f.selectedTopics.filter(x => x !== t) : [...f.selectedTopics, t] }))
          const selStyle = { background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }
          return (
          <div className="fixed inset-0 z-[9990] flex items-center justify-center p-5" style={{ background: 'rgba(0,0,0,.7)' }} onClick={() => { setShowAiForm(false); setShowTemplates(false) }}>
            <div className="w-full max-w-lg p-6 rounded-xl animate-fade-in max-h-[90vh] overflow-y-auto" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-1">
                <h2 className="text-lg font-extrabold">🤖 AI Course Generator</h2>
                <button className="text-lg" style={{ color: 'var(--text-muted)' }} onClick={() => { setShowAiForm(false); setShowTemplates(false) }}>✕</button>
              </div>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>The more detail you provide, the better the AI-generated content will be</p>

              {/* Row 1: Subject + Year Level */}
              <div className="flex gap-3 mb-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Subject *</label>
                  <select className="w-full px-3 py-2.5 rounded-md text-sm appearance-none" style={selStyle}
                    value={aiForm.subject} onChange={e => setAiForm(f => ({ ...f, subject: e.target.value, selectedTopics: [], customTopic: '' }))}>
                    <option value="">Select subject...</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Year Level *</label>
                  <select className="w-full px-3 py-2.5 rounded-md text-sm appearance-none" style={selStyle}
                    value={aiForm.yearLevel} onChange={e => setAiForm(f => ({ ...f, yearLevel: e.target.value }))}>
                    <option value="">Select year level...</option>
                    {YEAR_LEVELS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Dynamic topics for selected subject */}
              {aiForm.subject && subjectTopics && (
                <div className="mb-3 animate-fade-in">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>{subjectTopics.label} — select topics to include</label>
                  <div className="flex flex-wrap gap-1.5 p-3 rounded-lg max-h-[160px] overflow-y-auto" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                    {subjectTopics.topics.map(t => {
                      const sel = aiForm.selectedTopics.includes(t)
                      return (
                        <button key={t} className="px-2.5 py-1 rounded-full text-[11px] transition-all" style={{
                          background: sel ? 'var(--primary)' : 'var(--bg-card)',
                          color: sel ? 'white' : 'var(--text-muted)',
                          border: sel ? '1px solid var(--primary)' : '1px solid var(--border)',
                        }} onClick={() => toggleTopic(t)}>{sel ? '✓ ' : ''}{t}</button>
                      )
                    })}
                  </div>
                  {aiForm.selectedTopics.length > 0 && (
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-[10px]" style={{ color: 'var(--primary)' }}>{aiForm.selectedTopics.length} topic{aiForm.selectedTopics.length !== 1 ? 's' : ''} selected</p>
                      <button className="text-[10px]" style={{ color: 'var(--text-muted)' }} onClick={() => setAiForm(f => ({ ...f, selectedTopics: [] }))}>Clear all</button>
                    </div>
                  )}
                  {aiForm.selectedTopics.length === 0 && (
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>No topics selected = AI covers the full subject. Select specific topics to narrow the focus.</p>
                  )}
                </div>
              )}

              {/* Custom topic for Other or additional specificity */}
              {aiForm.subject && (
                <div className="mb-3 animate-fade-in">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    {!subjectTopics ? 'Describe the topic *' : 'Additional focus or specific topic'}
                  </label>
                  <input className="w-full px-3 py-2.5 rounded-md text-sm" style={selStyle}
                    value={aiForm.customTopic} onChange={e => setAiForm(f => ({ ...f, customTopic: e.target.value }))}
                    placeholder={!subjectTopics ? 'e.g. Describe what the course should cover...' : 'e.g. Focus on Term 2 content, or a specific chapter...'} />
                </div>
              )}

              {/* Country / Curriculum */}
              <div className="mb-3">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Country / Curriculum</label>
                <select className="w-full px-3 py-2.5 rounded-md text-sm appearance-none" style={selStyle}
                  value={aiForm.country} onChange={e => setAiForm(f => ({ ...f, country: e.target.value }))}>
                  <option value="">Not specified</option>
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}{c.curriculum ? ` — ${c.curriculum}` : ''}</option>)}
                </select>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Ensures content aligns with your country's curriculum standards</p>
              </div>

              {/* Row: Difficulty + Content amount */}
              <div className="flex gap-3 mb-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Difficulty</label>
                  <select className="w-full px-3 py-2.5 rounded-md text-sm appearance-none" style={selStyle}
                    value={aiForm.difficulty} onChange={e => setAiForm(f => ({ ...f, difficulty: e.target.value }))}>
                    <option value="foundation">Foundation — simplified concepts</option>
                    <option value="standard">Standard — grade-level content</option>
                    <option value="advanced">Advanced — challenging</option>
                    <option value="extension">Extension / Gifted</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Content Amount</label>
                  <select className="w-full px-3 py-2.5 rounded-md text-sm appearance-none" style={selStyle}
                    value={aiForm.numFacts} onChange={e => setAiForm(f => ({ ...f, numFacts: e.target.value }))}>
                    <option value="15">Quick (15 facts)</option>
                    <option value="30">Standard (30 facts)</option>
                    <option value="50">Comprehensive (50 facts)</option>
                    <option value="80">Deep Dive (80+ facts)</option>
                  </select>
                </div>
              </div>

              {/* Additional notes */}
              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>Additional Instructions</label>
                <textarea className="w-full px-3 py-2 rounded-md text-sm min-h-[60px]" style={selStyle}
                  value={aiForm.additionalNotes} onChange={e => setAiForm(f => ({ ...f, additionalNotes: e.target.value }))}
                  placeholder="Any extra details? e.g. 'Focus on exam prep', 'Include real-world examples', 'Keep language simple for ESL students'..." />
              </div>

              {/* Generate button */}
              <div className="flex gap-2">
                <button className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                  onClick={() => setShowAiForm(false)}>← Back</button>
                <button className="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold text-white" style={{ background: 'var(--primary)', opacity: (!aiForm.subject || !aiForm.yearLevel) ? 0.5 : 1 }}
                  disabled={!aiForm.subject || !aiForm.yearLevel}
                  onClick={() => {
                    const countryObj = COUNTRIES.find(c => c.code === aiForm.country)
                    const countryName = countryObj?.name || ''
                    const curriculumName = countryObj?.curriculum || ''
                    const topicsList = aiForm.selectedTopics.length > 0 ? aiForm.selectedTopics.join(', ') : ''
                    const topicPart = topicsList || aiForm.customTopic || ''
                    const shortTopic = topicPart.length > 40 ? topicPart.slice(0, 40) + '...' : topicPart
                    const name = `${aiForm.subject} ${aiForm.yearLevel}${shortTopic ? ` — ${shortTopic}` : ''}`
                    const descParts: string[] = []
                    if (countryName && aiForm.country !== 'OTHER') descParts.push(`${aiForm.subject} for ${countryName} ${aiForm.yearLevel} students`)
                    else descParts.push(`${aiForm.subject} for ${aiForm.yearLevel} students`)
                    if (curriculumName) descParts.push(`Aligned to ${curriculumName}`)
                    if (topicsList) descParts.push(`Topics: ${topicsList}`)
                    if (aiForm.customTopic) descParts.push(`Focus: ${aiForm.customTopic}`)
                    if (aiForm.difficulty !== 'standard') descParts.push(`Difficulty: ${aiForm.difficulty}`)
                    if (aiForm.additionalNotes) descParts.push(`Notes: ${aiForm.additionalNotes}`)

                    setShowTemplates(false)
                    setShowAiForm(false)
                    createNew({
                      name,
                      subject: aiForm.subject,
                      yearLevel: aiForm.yearLevel,
                      description: descParts.join('. '),
                      autoResearch: true,
                      country: aiForm.country,
                      topic: topicPart,
                      selectedTopics: aiForm.selectedTopics,
                      customTopic: aiForm.customTopic,
                      difficulty: aiForm.difficulty,
                      numFacts: parseInt(aiForm.numFacts),
                      additionalNotes: aiForm.additionalNotes,
                    }, true)
                    setAiForm({ subject: '', yearLevel: '', country: 'AU', topic: '', difficulty: 'standard', numFacts: '30', selectedTopics: [], customTopic: '', additionalNotes: '' })
                  }}>
                  🤖 Generate Course
                </button>
              </div>
            </div>
          </div>
          )
        })()}
      </div>
    </div>
  )
}
