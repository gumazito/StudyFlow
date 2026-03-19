'use client'
import { useState, useEffect } from 'react'

export default function Home() {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => { setLoaded(true) }, [])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className={"text-center transition-all duration-500 " + (loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4')}>
        <h1 className="text-5xl font-black mb-2" style={{
          background: 'linear-gradient(135deg, #a29bfe, #00cec9)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          StudyFlow
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          Interactive learning for high school students
        </p>
        <div className="text-sm px-4 py-2 rounded-lg inline-block" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          v2.0 — Architecture rebuild in progress
        </div>
        <div className="mt-6 text-xs" style={{ color: 'var(--text-muted)' }}>
          <p>Next.js + Firebase + Tailwind</p>
          <p className="mt-1">Sprint 0: Foundation complete</p>
        </div>
      </div>
    </div>
  )
}
