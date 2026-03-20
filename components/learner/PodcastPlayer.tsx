'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useToast } from '@/lib/contexts/ThemeContext'
import { generateTts } from '@/lib/cloud-functions'
import { useAudioBackground } from '@/lib/use-audio-background'

interface PodcastPlayerProps {
  facts: { text: string; category?: string }[]
  packageName: string
  packageId: string
  cardStyle: any
}

/**
 * Podcast-style audio learning player.
 * Converts course facts to speech via Cloud Function TTS.
 * Plays through facts sequentially with play/pause/skip controls.
 */
export function PodcastPlayer({ facts, packageName, packageId, cardStyle }: PodcastPlayerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { setMediaSession, cacheAudio, startKeepAlive, stopKeepAlive } = useAudioBackground()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [audioUrls, setAudioUrls] = useState<Record<number, string>>({})
  const [provider, setProvider] = useState('')
  const [expanded, setExpanded] = useState(false)

  // Voice options
  const voices = [
    { id: 'nova', name: 'Nova', desc: 'Friendly & youthful' },
    { id: 'alloy', name: 'Alloy', desc: 'Balanced & clear' },
    { id: 'echo', name: 'Echo', desc: 'Deep & warm' },
    { id: 'shimmer', name: 'Shimmer', desc: 'Bright & expressive' },
  ]
  const [selectedVoice, setSelectedVoice] = useState('nova')

  const currentFact = facts[currentIndex]

  const generateAudio = async (index: number) => {
    if (audioUrls[index]) return audioUrls[index]

    const fact = facts[index]
    if (!fact) return null

    setLoading(true)
    try {
      // Build engaging intro text for first fact
      const prefix = index === 0
        ? `Welcome to ${packageName}. Let's learn together! Here's the first key point: `
        : index === facts.length - 1
          ? `And finally: `
          : `Next up: `

      const result = await generateTts(`${prefix}${fact.text}`, {
        voice: selectedVoice,
        packageId,
        factIndex: index,
      })

      let url: string
      if (result.audioUrl) {
        url = result.audioUrl
      } else if (result.audioBlob) {
        url = URL.createObjectURL(result.audioBlob)
      } else {
        throw new Error('No audio returned')
      }

      setAudioUrls(prev => ({ ...prev, [index]: url }))
      setProvider(result.provider)
      return url
    } catch (err: any) {
      toast(err.message || 'Failed to generate audio. Set up a TTS provider in Cloud Functions.', 'error')
      return null
    } finally {
      setLoading(false)
    }
  }

  const play = async () => {
    const url = await generateAudio(currentIndex)
    if (!url) return

    if (audioRef.current) {
      audioRef.current.src = url
      audioRef.current.play()
      setPlaying(true)
      startKeepAlive()

      // Set lock-screen / media session controls
      setMediaSession(
        { title: `${currentFact?.category || packageName} — Fact ${currentIndex + 1}/${facts.length}`, artist: packageName, album: 'StudyFlow Audio Learning' },
        { onPlay: () => audioRef.current?.play(), onPause: () => { audioRef.current?.pause(); setPlaying(false) }, onNext: () => skip('next'), onPrev: () => skip('prev') }
      )

      // Pre-cache next audio
      if (currentIndex + 1 < facts.length) {
        generateAudio(currentIndex + 1).then(nextUrl => { if (nextUrl) cacheAudio(nextUrl) })
      }
    }
  }

  const pause = () => {
    audioRef.current?.pause()
    setPlaying(false)
    stopKeepAlive()
  }

  const skip = async (direction: 'next' | 'prev') => {
    const newIndex = direction === 'next'
      ? Math.min(currentIndex + 1, facts.length - 1)
      : Math.max(currentIndex - 1, 0)

    setCurrentIndex(newIndex)
    if (playing) {
      const url = await generateAudio(newIndex)
      if (url && audioRef.current) {
        audioRef.current.src = url
        audioRef.current.play()
      }
    }
  }

  // Auto-play next fact when current one ends
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = async () => {
      if (currentIndex < facts.length - 1) {
        const newIndex = currentIndex + 1
        setCurrentIndex(newIndex)
        const url = await generateAudio(newIndex)
        if (url) {
          audio.src = url
          audio.play()
        }
      } else {
        setPlaying(false)
        toast('Podcast complete! Great listening.', 'success')
      }
    }

    audio.addEventListener('ended', handleEnded)
    return () => audio.removeEventListener('ended', handleEnded)
  }, [currentIndex, facts.length])

  if (facts.length === 0) return null

  return (
    <div className="rounded-xl p-4 mb-4" style={cardStyle}>
      <audio ref={audioRef} />

      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold">🎧 Podcast Mode</h3>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[10px]"
          style={{ color: 'var(--primary)' }}
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      <p className="text-[11px] mb-3" style={{ color: 'var(--text-muted)' }}>
        Listen to {facts.length} facts from {packageName} as an audio lesson.
        {provider && <span className="ml-1 opacity-60">via {provider}</span>}
      </p>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
          {currentIndex + 1}/{facts.length}
        </span>
        <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--bg)' }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${((currentIndex + 1) / facts.length) * 100}%`,
              background: 'var(--primary)',
            }}
          />
        </div>
      </div>

      {/* Current fact display */}
      <div className="text-xs p-3 rounded-lg mb-3" style={{ background: 'var(--bg)', color: 'var(--text-secondary)' }}>
        {currentFact?.category && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full mb-1 inline-block" style={{ background: 'rgba(108,92,231,.12)', color: 'var(--primary)' }}>
            {currentFact.category}
          </span>
        )}
        <p className="leading-relaxed">{currentFact?.text || 'No content'}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => skip('prev')}
          disabled={currentIndex === 0 || loading}
          className="text-lg"
          style={{ opacity: currentIndex === 0 ? 0.3 : 1 }}
        >
          ⏮️
        </button>

        <button
          onClick={playing ? pause : play}
          disabled={loading}
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
          style={{
            background: loading ? 'var(--text-muted)' : 'var(--primary)',
            color: 'white',
          }}
        >
          {loading ? '⏳' : playing ? '⏸️' : '▶️'}
        </button>

        <button
          onClick={() => skip('next')}
          disabled={currentIndex === facts.length - 1 || loading}
          className="text-lg"
          style={{ opacity: currentIndex === facts.length - 1 ? 0.3 : 1 }}
        >
          ⏭️
        </button>
      </div>

      {/* Voice selector (expanded) */}
      {expanded && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
          <label className="text-[10px] font-semibold block mb-1.5" style={{ color: 'var(--text-muted)' }}>Voice</label>
          <div className="flex gap-1.5 flex-wrap">
            {voices.map(v => (
              <button
                key={v.id}
                onClick={() => {
                  setSelectedVoice(v.id)
                  setAudioUrls({}) // Clear cache to regenerate with new voice
                }}
                className="px-2.5 py-1 rounded-lg text-[10px]"
                style={{
                  background: selectedVoice === v.id ? 'var(--primary)' : 'var(--bg)',
                  color: selectedVoice === v.id ? 'white' : 'var(--text-secondary)',
                  border: '1px solid var(--border)',
                }}
              >
                {v.name} — {v.desc}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
