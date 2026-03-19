'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useToast } from '@/lib/contexts/ThemeContext'
import * as DB from '@/lib/db'
import { SUBJECTS, YEAR_LEVELS, genId } from '@/lib/constants'
import { PackageEditor } from './PackageEditor'

interface PublisherDashboardProps {
  onSwitchView: ((view: string | null) => void) | null
  onLogout: () => void
}

export function PublisherDashboard({ onSwitchView, onLogout }: PublisherDashboardProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [screen, setScreen] = useState<'dashboard' | 'analytics' | 'editor'>('dashboard')
  const [editingPkg, setEditingPkg] = useState<any>(null)
  const [analyticsData, setAnalyticsData] = useState<any[] | null>(null)

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

  const createNew = async () => {
    if (!user) return
    const pkg = {
      id: genId(), name: 'New Course', subject: '', yearLevel: '', description: '',
      status: 'draft', autoResearch: false, authorId: user.id, authorName: user.name,
      createdAt: Date.now(), updatedAt: Date.now(),
      content: [], facts: [], categories: [], testPatterns: null,
    }
    await DB.savePackage(pkg)
    setPackages(prev => [pkg, ...prev])
    toast('New course created — edit it to add content', 'success')
  }

  const togglePublish = async (pkg: any) => {
    const newStatus = pkg.status === 'published' ? 'draft' : 'published'
    if (newStatus === 'published' && !pkg.name) { toast('Package needs a name', 'error'); return }
    if (newStatus === 'published' && (pkg.facts || []).length === 0 && !pkg.autoResearch) { toast('Add content or enable auto-research first', 'error'); return }
    const updated = { ...pkg, status: newStatus, updatedAt: Date.now() }
    await DB.savePackage(updated)
    setPackages(prev => prev.map(p => p.id === pkg.id ? updated : p))
    toast(newStatus === 'published' ? 'Course published!' : 'Course unpublished', newStatus === 'published' ? 'success' : 'info')
  }

  const deletePkg = async (id: string) => {
    if (!window.confirm('Delete this course?')) return
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
          <button className="px-4 py-2 rounded-lg text-sm font-bold text-white" style={{ background: 'var(--primary)' }} onClick={createNew}>+ New Package</button>
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
                    <button className="px-3 py-1 rounded-lg text-xs" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                      onClick={() => exportToCSV(analyticsData.map((r: any) => ({ Student: r.userName, Course: r.packageName, Score: r.score + '%', Date: r.timestamp ? new Date(r.timestamp).toLocaleDateString() : '' })), 'studyflow-results.csv')}>
                      📥 Export CSV
                    </button>
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
      </div>
    </div>
  )
}
