'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useToast } from '@/lib/contexts/ThemeContext'
import { getSpotifyAuthUrl, refreshSpotifyToken } from '@/lib/cloud-functions'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import * as DB from '@/lib/db'

interface SpotifyPlayerProps {
  cardStyle: any
}

/**
 * Spotify Music Integration for study sessions.
 * - Connect via OAuth (handled by Cloud Function)
 * - Search songs/playlists
 * - Embedded Spotify player (free radio mode via iframe)
 * - Currently listening status visible to followers
 */
export function SpotifyPlayer({ cardStyle }: SpotifyPlayerProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<{ uri: string; name: string; artist: string } | null>(null)
  const [accessToken, setAccessToken] = useState('')

  // Study music presets
  const studyPlaylists = [
    { name: 'Lo-Fi Study Beats', uri: 'spotify:playlist:0vvXsWCC9xrXsKd4FyS8kM', emoji: '🎵' },
    { name: 'Deep Focus', uri: 'spotify:playlist:37i9dQZF1DWZeKCadgRdKQ', emoji: '🧠' },
    { name: 'Peaceful Piano', uri: 'spotify:playlist:37i9dQZF1DX4sWSpwq3LiO', emoji: '🎹' },
    { name: 'Nature Sounds', uri: 'spotify:playlist:37i9dQZF1DX4PP3DA4J0N8', emoji: '🌿' },
    { name: 'Classical Focus', uri: 'spotify:playlist:37i9dQZF1DWWEJlAGA9gs0', emoji: '🎻' },
  ]

  // Check if Spotify is connected
  useEffect(() => {
    if (!user?.id) return
    const checkConnection = async () => {
      try {
        const tokenDoc = await getDoc(doc(db, 'spotify_tokens', user.id))
        if (tokenDoc.exists()) {
          const data = tokenDoc.data()
          setConnected(true)
          if (data.accessToken && data.expiresAt > Date.now()) {
            setAccessToken(data.accessToken)
          } else if (data.refreshToken) {
            // Refresh expired token
            try {
              const result = await refreshSpotifyToken(user.id)
              setAccessToken(result.accessToken)
            } catch {
              // Token refresh failed, need re-auth
              setConnected(false)
            }
          }
        }
      } catch {
        // Spotify tokens collection may not exist yet
      } finally {
        setLoading(false)
      }
    }
    checkConnection()
  }, [user?.id])

  const connectSpotify = async () => {
    if (!user?.id) return
    try {
      const authUrl = await getSpotifyAuthUrl(user.id)
      window.open(authUrl, '_blank', 'width=500,height=700')
    } catch (err: any) {
      toast(err.message || 'Failed to connect Spotify', 'error')
    }
  }

  const searchSpotify = useCallback(async () => {
    if (!searchQuery.trim() || !accessToken) return
    setSearching(true)
    try {
      const resp = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track,playlist&limit=5`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!resp.ok) throw new Error('Search failed')
      const data = await resp.json()

      const tracks = (data.tracks?.items || []).map((t: any) => ({
        type: 'track',
        name: t.name,
        artist: t.artists?.map((a: any) => a.name).join(', '),
        uri: t.uri,
        albumArt: t.album?.images?.[2]?.url,
      }))

      const playlists = (data.playlists?.items || []).map((p: any) => ({
        type: 'playlist',
        name: p.name,
        artist: p.owner?.display_name,
        uri: p.uri,
        albumArt: p.images?.[0]?.url,
      }))

      setSearchResults([...tracks, ...playlists])
    } catch (err: any) {
      toast('Search failed — try reconnecting Spotify', 'error')
    } finally {
      setSearching(false)
    }
  }, [searchQuery, accessToken, toast])

  const playItem = (item: any) => {
    const track = { uri: item.uri, name: item.name, artist: item.artist }
    setCurrentTrack(track)
    // Update listening status in Firestore for followers to see
    if (user?.id) DB.updateListeningStatus(user.id, track)
  }

  // Clear listening status when component unmounts or track stops
  useEffect(() => {
    return () => { if (user?.id) DB.updateListeningStatus(user.id, null) }
  }, [user?.id])

  const getEmbedUrl = (uri: string) => {
    // Convert spotify:track:xxx or spotify:playlist:xxx to embed URL
    const parts = uri.split(':')
    if (parts.length >= 3) {
      return `https://open.spotify.com/embed/${parts[1]}/${parts[2]}?utm_source=generator&theme=0`
    }
    return ''
  }

  if (loading) return null

  return (
    <div className="rounded-xl p-4 mb-4" style={cardStyle}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold">🎵 Study Music</h3>
        {connected ? (
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,212,106,.12)', color: '#00d46a' }}>
            Spotify Connected
          </span>
        ) : (
          <button
            onClick={connectSpotify}
            className="text-[11px] px-3 py-1 rounded-full font-semibold"
            style={{ background: '#1DB954', color: 'white' }}
          >
            Connect Spotify
          </button>
        )}
      </div>

      {/* Study Playlist Presets */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        {studyPlaylists.map((pl, i) => (
          <button
            key={i}
            onClick={() => { const t = { uri: pl.uri, name: pl.name, artist: 'Study Music' }; setCurrentTrack(t); if (user?.id) DB.updateListeningStatus(user.id, t) }}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap"
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

      {/* Search (requires connected account) */}
      {connected && accessToken && (
        <div className="mb-3">
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-1.5 rounded-lg text-xs"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }}
              placeholder="Search songs or playlists..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && searchSpotify()}
            />
            <button
              onClick={searchSpotify}
              disabled={searching}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: 'var(--primary)' }}
            >
              {searching ? '...' : '🔍'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
              {searchResults.map((item, i) => (
                <button
                  key={i}
                  onClick={() => playItem(item)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs hover:opacity-80"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  {item.albumArt && <img src={item.albumArt} alt="" className="w-7 h-7 rounded" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate" style={{ color: 'var(--text)' }}>{item.name}</div>
                    <div className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                      {item.type === 'playlist' ? '📋' : '🎵'} {item.artist}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Embedded Player */}
      {currentTrack && (
        <div className="rounded-lg overflow-hidden">
          <iframe
            src={getEmbedUrl(currentTrack.uri)}
            width="100%"
            height="152"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{ borderRadius: 12 }}
          />
        </div>
      )}

      {!connected && !currentTrack && (
        <p className="text-[11px] text-center py-2" style={{ color: 'var(--text-muted)' }}>
          Connect your Spotify account to search and play music while studying, or tap a preset above for free study playlists.
        </p>
      )}
    </div>
  )
}
