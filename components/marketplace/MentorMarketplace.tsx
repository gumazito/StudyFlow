'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useToast } from '@/lib/contexts/ThemeContext'
import * as DB from '@/lib/db'

interface MentorProfile {
  id: string
  userId: string
  name: string
  email: string
  avatarEmoji?: string
  avatarUrl?: string
  bio: string
  subjects: string[]
  yearLevels: string[]
  qualifications: string[]
  rating: number
  reviewCount: number
  studentsHelped: number
  responseTime: string // 'instant' | 'hours' | 'day'
  availability: 'available' | 'busy' | 'offline'
  pricing: 'free' | 'paid' | 'both'
  hourlyRate?: number
  currency: string
  specialties: string[]
  languages: string[]
  verified: boolean
  featured: boolean
  createdAt: number
}

interface MentorReview {
  id: string
  mentorId: string
  studentId: string
  studentName: string
  rating: number
  comment: string
  subject: string
  createdAt: number
}

interface MentorMarketplaceProps {
  onBack: () => void
}

const SUBJECTS = ['Mathematics', 'English', 'Science', 'HAAS', 'Religion', 'Sport & PE', 'IT/Digital Tech', 'Art & Design', 'Music', 'Languages', 'Health', 'Business']
const YEAR_LEVELS = ['Year 7', 'Year 8', 'Year 9', 'Year 10', 'Year 11', 'Year 12']

export function MentorMarketplace({ onBack }: MentorMarketplaceProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [mentors, setMentors] = useState<MentorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSubject, setFilterSubject] = useState('all')
  const [filterPricing, setFilterPricing] = useState<'all' | 'free' | 'paid'>('all')
  const [filterAvailability, setFilterAvailability] = useState<'all' | 'available'>('all')
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'students' | 'price'>('rating')
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null)
  const [reviews, setReviews] = useState<MentorReview[]>([])
  const [showCreateProfile, setShowCreateProfile] = useState(false)
  const [myMentorProfile, setMyMentorProfile] = useState<MentorProfile | null>(null)

  // Edit profile form state
  const [editBio, setEditBio] = useState('')
  const [editSubjects, setEditSubjects] = useState<string[]>([])
  const [editYears, setEditYears] = useState<string[]>([])
  const [editPricing, setEditPricing] = useState<'free' | 'paid' | 'both'>('free')
  const [editRate, setEditRate] = useState('')
  const [editSpecialties, setEditSpecialties] = useState('')
  const [editQualifications, setEditQualifications] = useState('')
  const [saving, setSaving] = useState(false)

  const cs = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }
  const is = { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }

  useEffect(() => {
    loadData()
  }, [user])

  const loadData = async () => {
    if (!user) return
    try {
      const [allMentors, myProfile] = await Promise.all([
        DB.getMentorProfiles(),
        DB.getMentorProfile(user.id),
      ])
      setMentors(allMentors as MentorProfile[])
      if (myProfile) {
        setMyMentorProfile(myProfile as MentorProfile)
        setEditBio((myProfile as MentorProfile).bio)
        setEditSubjects((myProfile as MentorProfile).subjects)
        setEditYears((myProfile as MentorProfile).yearLevels)
        setEditPricing((myProfile as MentorProfile).pricing)
        setEditRate(String((myProfile as MentorProfile).hourlyRate || ''))
        setEditSpecialties((myProfile as MentorProfile).specialties.join(', '))
        setEditQualifications((myProfile as MentorProfile).qualifications.join(', '))
      }
    } catch (e) {
      // Mentor marketplace may not have data yet
      console.log('[MentorMarketplace] Loading mentors:', e)
    }
    setLoading(false)
  }

  const filteredMentors = useMemo(() => {
    let result = [...mentors]
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.bio.toLowerCase().includes(q) ||
        m.subjects.some(s => s.toLowerCase().includes(q)) ||
        m.specialties.some(s => s.toLowerCase().includes(q))
      )
    }
    if (filterSubject !== 'all') result = result.filter(m => m.subjects.includes(filterSubject))
    if (filterPricing !== 'all') result = result.filter(m => m.pricing === filterPricing || m.pricing === 'both')
    if (filterAvailability === 'available') result = result.filter(m => m.availability === 'available')

    // Sort
    result.sort((a, b) => {
      if (a.featured && !b.featured) return -1
      if (!a.featured && b.featured) return 1
      switch (sortBy) {
        case 'rating': return b.rating - a.rating
        case 'reviews': return b.reviewCount - a.reviewCount
        case 'students': return b.studentsHelped - a.studentsHelped
        case 'price': return (a.hourlyRate || 0) - (b.hourlyRate || 0)
        default: return 0
      }
    })
    return result
  }, [mentors, search, filterSubject, filterPricing, filterAvailability, sortBy])

  const loadReviews = async (mentorId: string) => {
    try {
      const r = await DB.getMentorReviews(mentorId)
      setReviews(r as MentorReview[])
    } catch { setReviews([]) }
  }

  const saveMentorProfile = async () => {
    if (!user) return
    if (!editBio.trim()) { toast('Please add a bio', 'error'); return }
    if (editSubjects.length === 0) { toast('Select at least one subject', 'error'); return }
    setSaving(true)
    try {
      const profile: Partial<MentorProfile> = {
        userId: user.id,
        name: user.name || 'Mentor',
        email: user.email,
        avatarEmoji: (user as any).avatarEmoji,
        avatarUrl: (user as any).avatarUrl,
        bio: editBio.trim(),
        subjects: editSubjects,
        yearLevels: editYears,
        pricing: editPricing,
        hourlyRate: editPricing !== 'free' ? parseFloat(editRate) || 0 : undefined,
        currency: 'AUD',
        specialties: editSpecialties.split(',').map(s => s.trim()).filter(Boolean),
        qualifications: editQualifications.split(',').map(s => s.trim()).filter(Boolean),
        availability: 'available',
        languages: ['English'],
        verified: false,
        featured: false,
      }
      await DB.saveMentorProfile(user.id, profile)
      toast('Mentor profile saved!', 'success')
      setShowCreateProfile(false)
      loadData()
    } catch (e: any) { toast('Failed: ' + e.message, 'error') }
    setSaving(false)
  }

  const requestMentor = async (mentor: MentorProfile) => {
    if (!user) return
    try {
      await DB.sendMentorMarketplaceRequest({
        fromUserId: user.id,
        fromName: user.name || 'Student',
        toUserId: mentor.userId,
        toName: mentor.name,
        subject: filterSubject !== 'all' ? filterSubject : mentor.subjects[0],
        message: `Hi ${mentor.name}, I'd love your help with ${filterSubject !== 'all' ? filterSubject : 'my studies'}!`,
        status: 'pending',
      })
      toast(`Request sent to ${mentor.name}!`, 'success')
    } catch (e: any) { toast('Failed: ' + e.message, 'error') }
  }

  const renderStars = (rating: number, size = 14) => (
    <span className="inline-flex gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} style={{ fontSize: size, opacity: n <= Math.round(rating) ? 1 : 0.25, color: 'var(--warning)' }}>★</span>
      ))}
    </span>
  )

  const availBadge = (status: string) => {
    const config: Record<string, { bg: string; color: string; label: string }> = {
      available: { bg: 'rgba(0,184,148,.15)', color: 'var(--success)', label: 'Available' },
      busy: { bg: 'rgba(253,203,110,.15)', color: 'var(--warning)', label: 'Busy' },
      offline: { bg: 'rgba(107,107,128,.15)', color: 'var(--text-muted)', label: 'Offline' },
    }
    const c = config[status] || config.offline
    return <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: c.bg, color: c.color }}>{c.label}</span>
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="processing-spinner w-8 h-8" />
      </div>
    )
  }

  // Mentor detail view
  if (selectedMentor) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <nav className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <button className="text-sm" style={{ color: 'var(--text-secondary)' }} onClick={() => { setSelectedMentor(null); setReviews([]) }}>← Back</button>
          <div className="text-lg font-extrabold" style={{ background: 'linear-gradient(135deg, #a29bfe, #00cec9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Mentor Profile</div>
          <div />
        </nav>

        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-3xl mb-3" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
              {selectedMentor.avatarEmoji || selectedMentor.name.charAt(0)}
            </div>
            <h1 className="text-xl font-extrabold" style={{ color: 'var(--text)' }}>{selectedMentor.name}</h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              {renderStars(selectedMentor.rating)}
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({selectedMentor.reviewCount} reviews)</span>
              {selectedMentor.verified && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(0,184,148,.15)', color: 'var(--success)' }}>✓ Verified</span>}
            </div>
            <div className="mt-2">{availBadge(selectedMentor.availability)}</div>
          </div>

          {/* Bio */}
          <div className="p-4 mb-3 rounded-xl" style={cs}>
            <h3 className="text-sm font-bold mb-2">About</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{selectedMentor.bio}</p>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-3 rounded-xl text-center" style={cs}>
              <div className="text-xl font-extrabold" style={{ color: 'var(--primary)' }}>{selectedMentor.studentsHelped}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Students Helped</div>
            </div>
            <div className="p-3 rounded-xl text-center" style={cs}>
              <div className="text-xl font-extrabold" style={{ color: 'var(--accent)' }}>
                {selectedMentor.pricing === 'free' ? 'Free' : `$${selectedMentor.hourlyRate}/hr`}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{selectedMentor.pricing === 'both' ? 'Free & Paid' : selectedMentor.pricing === 'free' ? 'Volunteer' : 'Per Hour (AUD)'}</div>
            </div>
          </div>

          {/* Subjects & Specialties */}
          <div className="p-4 mb-3 rounded-xl" style={cs}>
            <h3 className="text-sm font-bold mb-2">Subjects</h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedMentor.subjects.map(s => (
                <span key={s} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(108,92,231,.12)', color: 'var(--primary)' }}>{s}</span>
              ))}
            </div>
            <h3 className="text-sm font-bold mb-2">Year Levels</h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedMentor.yearLevels.map(y => (
                <span key={y} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(0,206,201,.12)', color: 'var(--accent)' }}>{y}</span>
              ))}
            </div>
            {selectedMentor.specialties.length > 0 && (
              <>
                <h3 className="text-sm font-bold mb-2">Specialties</h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedMentor.specialties.map(s => (
                    <span key={s} className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(253,203,110,.12)', color: 'var(--warning)' }}>{s}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Qualifications */}
          {selectedMentor.qualifications.length > 0 && (
            <div className="p-4 mb-3 rounded-xl" style={cs}>
              <h3 className="text-sm font-bold mb-2">Qualifications</h3>
              {selectedMentor.qualifications.map((q, i) => (
                <div key={i} className="text-sm py-1" style={{ color: 'var(--text-secondary)' }}>• {q}</div>
              ))}
            </div>
          )}

          {/* Request button */}
          {selectedMentor.userId !== user?.id && (
            <button
              className="w-full py-3 rounded-xl text-sm font-bold text-white mb-4"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}
              onClick={() => requestMentor(selectedMentor)}
            >
              Request Mentoring
            </button>
          )}

          {/* Reviews */}
          <div className="p-4 rounded-xl" style={cs}>
            <h3 className="text-sm font-bold mb-3">Reviews ({selectedMentor.reviewCount})</h3>
            {reviews.length === 0 && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No reviews yet</p>}
            {reviews.map(r => (
              <div key={r.id} className="py-3 border-t first:border-t-0" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold">{r.studentName}</span>
                  {renderStars(r.rating, 12)}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{r.comment}</p>
                <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{r.subject} · {new Date(r.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Create/edit mentor profile
  if (showCreateProfile) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
        <nav className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
          <button className="text-sm" style={{ color: 'var(--text-secondary)' }} onClick={() => setShowCreateProfile(false)}>← Cancel</button>
          <div className="text-lg font-extrabold" style={{ background: 'linear-gradient(135deg, #a29bfe, #00cec9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{myMentorProfile ? 'Edit' : 'Create'} Mentor Profile</div>
          <div />
        </nav>

        <div className="max-w-xl mx-auto px-4 py-6">
          {/* Bio */}
          <div className="p-4 mb-3 rounded-xl" style={cs}>
            <label className="text-sm font-bold block mb-2" htmlFor="mentor-bio">About You</label>
            <textarea
              id="mentor-bio"
              className="w-full px-3 py-2 rounded-md text-sm"
              style={is}
              rows={4}
              value={editBio}
              onChange={e => setEditBio(e.target.value)}
              placeholder="Tell students about your teaching style, experience, and what you can help with..."
              aria-required="true"
            />
          </div>

          {/* Subjects */}
          <div className="p-4 mb-3 rounded-xl" style={cs}>
            <label className="text-sm font-bold block mb-2">Subjects You Teach</label>
            <div className="flex flex-wrap gap-1.5">
              {SUBJECTS.map(s => (
                <button
                  key={s}
                  className="text-xs px-3 py-1.5 rounded-full transition-colors"
                  style={{
                    background: editSubjects.includes(s) ? 'var(--primary)' : 'var(--bg)',
                    color: editSubjects.includes(s) ? 'white' : 'var(--text-secondary)',
                    border: `1px solid ${editSubjects.includes(s) ? 'var(--primary)' : 'var(--border)'}`,
                  }}
                  onClick={() => setEditSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])}
                  aria-pressed={editSubjects.includes(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Year levels */}
          <div className="p-4 mb-3 rounded-xl" style={cs}>
            <label className="text-sm font-bold block mb-2">Year Levels</label>
            <div className="flex flex-wrap gap-1.5">
              {YEAR_LEVELS.map(y => (
                <button
                  key={y}
                  className="text-xs px-3 py-1.5 rounded-full transition-colors"
                  style={{
                    background: editYears.includes(y) ? 'var(--accent)' : 'var(--bg)',
                    color: editYears.includes(y) ? 'white' : 'var(--text-secondary)',
                    border: `1px solid ${editYears.includes(y) ? 'var(--accent)' : 'var(--border)'}`,
                  }}
                  onClick={() => setEditYears(prev => prev.includes(y) ? prev.filter(x => x !== y) : [...prev, y])}
                  aria-pressed={editYears.includes(y)}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="p-4 mb-3 rounded-xl" style={cs}>
            <label className="text-sm font-bold block mb-2">Pricing</label>
            <div className="flex gap-2 mb-3">
              {(['free', 'paid', 'both'] as const).map(p => (
                <button
                  key={p}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold"
                  style={{
                    background: editPricing === p ? 'var(--primary)' : 'var(--bg)',
                    color: editPricing === p ? 'white' : 'var(--text-secondary)',
                    border: `1px solid ${editPricing === p ? 'var(--primary)' : 'var(--border)'}`,
                  }}
                  onClick={() => setEditPricing(p)}
                  aria-pressed={editPricing === p}
                >
                  {p === 'free' ? 'Free (Volunteer)' : p === 'paid' ? 'Paid' : 'Free & Paid'}
                </button>
              ))}
            </div>
            {editPricing !== 'free' && (
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }} htmlFor="mentor-rate">Hourly Rate (AUD)</label>
                <input id="mentor-rate" type="number" className="w-full px-3 py-2 rounded-md text-sm" style={is} value={editRate} onChange={e => setEditRate(e.target.value)} placeholder="e.g. 40" />
              </div>
            )}
          </div>

          {/* Specialties & Qualifications */}
          <div className="p-4 mb-3 rounded-xl" style={cs}>
            <label className="text-sm font-bold block mb-2" htmlFor="mentor-specialties">Specialties</label>
            <input id="mentor-specialties" className="w-full px-3 py-2 rounded-md text-sm mb-3" style={is} value={editSpecialties} onChange={e => setEditSpecialties(e.target.value)} placeholder="e.g. NAPLAN prep, exam technique, dyslexia support" />
            <label className="text-sm font-bold block mb-2" htmlFor="mentor-quals">Qualifications</label>
            <input id="mentor-quals" className="w-full px-3 py-2 rounded-md text-sm" style={is} value={editQualifications} onChange={e => setEditQualifications(e.target.value)} placeholder="e.g. B.Ed (Hons), 5 years tutoring" />
          </div>

          {/* Save */}
          <button
            className="w-full py-3 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))', opacity: saving ? 0.6 : 1 }}
            onClick={saveMentorProfile}
            disabled={saving}
          >
            {saving ? 'Saving...' : myMentorProfile ? 'Update Profile' : 'Create Mentor Profile'}
          </button>
        </div>
      </div>
    )
  }

  // Main marketplace view
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'var(--border)' }}>
        <button className="text-sm" style={{ color: 'var(--text-secondary)' }} onClick={onBack}>← Back</button>
        <div className="text-lg font-extrabold" style={{ background: 'linear-gradient(135deg, #a29bfe, #00cec9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Mentor Marketplace</div>
        <button
          className="text-xs px-2.5 py-1 rounded-full font-semibold"
          style={{ background: 'rgba(108,92,231,.15)', color: 'var(--primary)' }}
          onClick={() => setShowCreateProfile(true)}
        >
          {myMentorProfile ? 'Edit Profile' : 'Become a Mentor'}
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-4">
        {/* Search */}
        <input
          className="w-full px-3.5 py-2.5 rounded-md text-sm mb-3"
          style={is}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search mentors by name, subject, or specialty..."
          aria-label="Search mentors"
        />

        {/* Filters */}
        <div className="flex gap-1.5 flex-wrap mb-3">
          <select
            className="text-xs px-3 py-1.5 rounded-full"
            style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
            aria-label="Filter by subject"
          >
            <option value="all">All Subjects</option>
            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {(['all', 'free', 'paid'] as const).map(p => (
            <button
              key={p}
              className="text-xs px-3 py-1.5 rounded-full font-medium"
              style={{
                background: filterPricing === p ? 'var(--primary)' : 'var(--bg-card)',
                color: filterPricing === p ? 'white' : 'var(--text-secondary)',
                border: `1px solid ${filterPricing === p ? 'var(--primary)' : 'var(--border)'}`,
              }}
              onClick={() => setFilterPricing(p)}
            >
              {p === 'all' ? 'All' : p === 'free' ? 'Free' : 'Paid'}
            </button>
          ))}
          <button
            className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={{
              background: filterAvailability === 'available' ? 'var(--success)' : 'var(--bg-card)',
              color: filterAvailability === 'available' ? 'white' : 'var(--text-secondary)',
              border: `1px solid ${filterAvailability === 'available' ? 'var(--success)' : 'var(--border)'}`,
            }}
            onClick={() => setFilterAvailability(prev => prev === 'all' ? 'available' : 'all')}
          >
            Available Now
          </button>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Sort:</span>
          {[{ id: 'rating', label: 'Top Rated' }, { id: 'reviews', label: 'Most Reviews' }, { id: 'students', label: 'Most Students' }, { id: 'price', label: 'Lowest Price' }].map(s => (
            <button
              key={s.id}
              className="text-[11px] px-2 py-0.5 rounded"
              style={{ color: sortBy === s.id ? 'var(--primary)' : 'var(--text-muted)', fontWeight: sortBy === s.id ? 600 : 400 }}
              onClick={() => setSortBy(s.id as any)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Results count */}
        <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{filteredMentors.length} mentor{filteredMentors.length !== 1 ? 's' : ''} found</div>

        {/* Mentor cards */}
        {filteredMentors.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🎓</div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No mentors found. Be the first!</p>
            <button
              className="mt-3 px-4 py-2 rounded-lg text-xs font-semibold text-white"
              style={{ background: 'var(--primary)' }}
              onClick={() => setShowCreateProfile(true)}
            >
              Create Mentor Profile
            </button>
          </div>
        )}

        {filteredMentors.map(m => (
          <button
            key={m.id}
            className="w-full p-4 mb-3 rounded-xl text-left transition-transform hover:scale-[1.01]"
            style={{ ...cs, position: 'relative' }}
            onClick={() => { setSelectedMentor(m); loadReviews(m.id) }}
          >
            {m.featured && <div className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(253,203,110,.15)', color: 'var(--warning)' }}>⭐ Featured</div>}
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
                {m.avatarEmoji || m.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{m.name}</span>
                  {m.verified && <span className="text-[10px]" style={{ color: 'var(--success)' }}>✓</span>}
                  {availBadge(m.availability)}
                </div>
                <div className="flex items-center gap-2 mb-1">
                  {renderStars(m.rating, 11)}
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>({m.reviewCount}) · {m.studentsHelped} students</span>
                </div>
                <p className="text-xs mb-1.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{m.bio}</p>
                <div className="flex flex-wrap gap-1">
                  {m.subjects.slice(0, 3).map(s => (
                    <span key={s} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(108,92,231,.1)', color: 'var(--primary)' }}>{s}</span>
                  ))}
                  {m.subjects.length > 3 && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>+{m.subjects.length - 3}</span>}
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: m.pricing === 'free' ? 'rgba(0,184,148,.1)' : 'rgba(253,203,110,.1)', color: m.pricing === 'free' ? 'var(--success)' : 'var(--warning)' }}>
                    {m.pricing === 'free' ? 'Free' : m.pricing === 'both' ? `Free / $${m.hourlyRate}/hr` : `$${m.hourlyRate}/hr`}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
