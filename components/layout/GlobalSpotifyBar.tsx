'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useToast } from '@/lib/contexts/ThemeContext'
import { getSpotifyAuthUrl, refreshSpotifyToken } from '@/lib/cloud-functions'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import * as DB from '@/lib/db'

/**
 * Global Spotify bar that lives in the header across all views.
 * Click the music icon to expand a dropdown with playlists, search, and the player.
 */
export function GlobalSpotifyBar() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [expanded, setExpanded] = useState(false)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<{ uri: string; name: string; artist: string } | null>(null)
  const [accessToken, setAccessToken] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Study music presets
  const studyPlaylists = [
    { name: 'Lo-Fi Study Beats', uri: 'spotify:playlist:0vvXsWCC9xrXsKd4FyS8kM', emoji: '🎵' },
    { name: 'Deep Focus', uri: 'spotify:playlist:37i9dQZF1DWZeKCadgRdKQ', emoji: '🧠' },
    { name: 'Peaceful Piano', uri: 'spotify:playlist:37i9dQZF1DX4sWSpwq3LiO', emoji: '🎹' },
    { name: 'Nature Sounds', uri: 'spotify:playlist:37i9dQZF1DX4PP3DA4J0N8', emoji: '🌿' },
    { name: 'Classical Focus', uri: 'spotify:playlist:37i9dQZF1DWWEJlAGA9gs0', emoji: '🎻' },
    { name: 'Ambient Chill', uri: 'spotify:playlist:37i9dQZF1DX3Ogo9pFvBkY', emoji: '🌊' },
    { name: 'Jazz Study', uri: 'spotify:playlist:37i9dQZF1DX0SM0LYsmbMT', emoji: '🎷' },
    { name: 'Electronic Focus', uri: 'spotify:playlist:37i9dQZF1DX5trt9i14X7j', emoji: '⚡' },
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setExpanded(false)
      }
    }
    if (expanded) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [expanded])

  // Check Spotify connection
  useEffect(() => {
    if (!user?.id) return
    const check = async () => {
      try {
        const tokenDoc = await getDoc(doc(db, 'spotify_tokens', user.id))
        if (tokenDoc.exists()) {
          const data = tokenDoc.data()
          setConnected(true)
          if (data.accessToken && data.expiresAt > Date.now()) {
            setAccessToken(data.accessToken)
          } else if (data.refreshToken) {
            try {
              const result = await refreshSpotifyToken(user.id)
              setAccessToken(result.accessToken)
            } catch {
              setConnected(false)
            }
          }
        }
      } catch {
        // No tokens yet
      }
      setLoading(false)
    }
    check()
  }, [user?.id])

  const connectSpotify = async () => {
    if (!user?.id) return
    try {
      const authUrl = await getSpotifyAuthUrl(user.id)
      window.open(authUrl, '_blank', 'width=500,height=700')
    } catch {
      toast('Spotify connection requires Cloud Functions setup. Using preset playlists for now.', 'info')
    }
  }

  const searchSpotify = useCallback(async () => {
    if (!searchQuery.trim() || !accessToken) return
    setSearching(true)
    try {
      const resp = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track,playlist&limit=8`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!resp.ok) throw new Error('Search failed')
      const data = await resp.json()
      const tracks = (data.tracks?.items || []).map((t: any) => ({
        type: 'track', name: t.name, artist: t.artists?.map((a: any) => a.name).join(', '), uri: t.uri, albumArt: t.album?.images?.[2]?.url,
      }))
      const playlists = (data.playlists?.items || []).map((p: any) => ({
        type: 'playlist', name: p.name, artist: p.owner?.display_name, uri: p.uri, albumArt: p.images?.[0]?.url,
      }))
      setSearchResults([...tracks, ...playlists])
    } catch {
      toast('Search failed', 'error')
    }
    setSearching(false)
  }, [searchQuery, accessToken, toast])

  const playItem = (item: { uri: string; name: string; artist: string }) => {
    setCurrentTrack(item)
    if (user?.id) DB.updateListeningStatus(user.id, item)
  }

  const stopPlaying = () => {
    setCurrentTrack(null)
    if (user?.id) DB.updateListeningStatus(user.id, null)
  }

  const getEmbedUrl = (uri: string) => {
    const parts = uri.split(':')
    if (parts.length >= 3) return `https://open.spotify.com/embed/${parts[1]}/${parts[2]}?utm_source=generator&theme=0`
    return ''
  }

  if (loading || !user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Compact bar button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors text-xs"
        style={{
          background: currentTrack ? 'rgba(29,185,84,.15)' : expanded ? 'var(--bg-card)' : 'transparent',
          color: currentTrack ? '#1DB954' : 'var(--text-secondary)',
          border: expanded ? '1px solid var(--border)' : '1px solid transparent',
        }}
        aria-label="Toggle music player"
        aria-expanded={expanded}
      >
        {currentTrack ? (
          <>
            <span className="animate-pulse-soft">🎵</span>
            <span className="max-w-[100px] truncate font-medium hidden sm:inline">{currentTrack.name}</span>
          </>
        ) : (
          <span>🎵</span>
        )}
      </button>

      {/* Dropdown panel */}
      {expanded && (
        <div
          className="absolute right-0 top-full mt-2 w-[340px] rounded-xl shadow-2xl z-[60] overflow-hidden animate-fade-in"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <h3 className="text-sm font-bold">🎵 Study Music</h3>
            <div className="flex items-center gap-2">
              {connected ? (
                <span className="text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(29,185,84,.12)', color: '#1DB954' }}>Connected</span>
              ) : (
                <button onClick={connectSpotify} className="text-[10px] px-2.5 py-1 rounded-full font-semibold" style={{ background: '#1DB954', color: 'white' }}>
                  Connect Spotify
                </button>
              )}
              {currentTrack && (
                <button onClick={stopPlaying} className="text-[10px] px-2 py-0.5 rounded" style={{ color: 'var(--danger)' }}>Stop</button>
              )}
            </div>
          </div>

          {/* Preset playlists */}
          <div className="px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Study Playlists</div>
            <div className="flex flex-wrap gap-1.5">
              {studyPlaylists.map((pl, i) => (
                <button
                  key={i}
                  onClick={() => playItem({ uri: pl.uri, name: pl.name, artist: 'Study Music' })}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors"
                  style={{
                    background: currentTrack?.uri === pl.uri ? 'var(--primary)' : 'var(--bg)',
                    color: currentTrack?.uri === pl.uri ? 'white' : 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {pl.emoji} {pl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          {connected && accessToken && (
            <div className="px-4 pb-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>Search</div>
              <div className="flex gap-1.5">
                <input
                  className="flex-1 px-2.5 py-1.5 rounded-lg text-xs"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
                  placeholder="Search songs, playlists, artists..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchSpotify()}
                />
                <button onClick={searchSpotify} disabled={searching} className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white" style={{ background: 'var(--primary)' }}>
                  {searching ? '...' : '🔍'}
                </button>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {searchResults.map((item, i) => (
                    <button key={i} onClick={() => { playItem(item); setSearchResults([]) }} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs hover:opacity-80" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                      {item.albumArt && <img src={item.albumArt} alt="" className="w-6 h-6 rounded" />}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate text-[11px]" style={{ color: 'var(--text)' }}>{item.name}</div>
                        <div className="text-[9px] truncate" style={{ color: 'var(--text-muted)' }}>{item.type === 'playlist' ? '📋' : '🎵'} {item.artist}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Embedded Player */}
          {currentTrack && (
            <div className="px-4 pb-3">
              <iframe
                src={getEmbedUrl(currentTrack.uri)}
                width="100%"
                height="80"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                style={{ borderRadius: 8 }}
                title="Spotify Player"
              />
            </div>
          )}

          {!connected && !currentTrack && (
            <div className="px-4 pb-3">
              <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
                Tap a playlist above for free study music, or connect Spotify to search.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
