/**
 * Spotify OAuth Cloud Functions
 * ==============================
 * Handles Spotify OAuth2 authorization code flow:
 * - spotifyAuth: Generates the authorization URL
 * - spotifyCallback: Exchanges code for tokens
 * - spotifyRefresh: Refreshes expired access tokens
 *
 * Config:
 *   firebase functions:config:set spotify.client_id="YOUR_CLIENT_ID"
 *   firebase functions:config:set spotify.client_secret="YOUR_CLIENT_SECRET"
 *   firebase functions:config:set spotify.redirect_uri="YOUR_REDIRECT_URI"
 */

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import cors from 'cors'
import fetch from 'node-fetch'

const corsHandler = cors({ origin: true })

function getSpotifyConfig() {
  const config = functions.config().spotify || {}
  return {
    clientId: config.client_id || '',
    clientSecret: config.client_secret || '',
    redirectUri: config.redirect_uri || '',
  }
}

/**
 * Generate Spotify authorization URL
 */
export const spotifyAuth = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const { clientId, redirectUri } = getSpotifyConfig()
      if (!clientId) {
        res.status(500).json({ error: 'Spotify not configured' })
        return
      }

      const { userId } = req.query as { userId?: string }
      if (!userId) {
        res.status(400).json({ error: 'userId required' })
        return
      }

      const scopes = [
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-currently-playing',
        'streaming',
        'playlist-read-private',
        'user-library-read',
      ].join(' ')

      const state = Buffer.from(JSON.stringify({ userId })).toString('base64')
      const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&show_dialog=true`

      res.json({ authUrl })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })
})

/**
 * Handle Spotify OAuth callback — exchange code for tokens
 */
export const spotifyCallback = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const { code, state } = req.query as { code?: string; state?: string }
      if (!code || !state) {
        res.status(400).json({ error: 'Missing code or state' })
        return
      }

      const { clientId, clientSecret, redirectUri } = getSpotifyConfig()
      const { userId } = JSON.parse(Buffer.from(state, 'base64').toString())

      // Exchange code for tokens
      const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
        }),
      })

      const tokens = await tokenRes.json() as any
      if (tokens.error) {
        res.status(400).json({ error: tokens.error_description || tokens.error })
        return
      }

      // Store tokens in Firestore (encrypted in production)
      await admin.firestore().doc(`spotify_tokens/${userId}`).set({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Date.now() + (tokens.expires_in * 1000),
        scope: tokens.scope,
        updatedAt: Date.now(),
      })

      // Redirect back to app with success flag
      const appUrl = functions.config().app?.url || 'https://studyflow-app.web.app'
      res.redirect(`${appUrl}?spotify=connected`)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })
})

/**
 * Refresh Spotify access token
 */
export const spotifyRefresh = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const { userId } = req.body as { userId?: string }
      if (!userId) {
        res.status(400).json({ error: 'userId required' })
        return
      }

      // Verify Firebase auth
      const authHeader = req.headers.authorization
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }
      const idToken = authHeader.split('Bearer ')[1]
      const decoded = await admin.auth().verifyIdToken(idToken)
      if (decoded.uid !== userId) {
        res.status(403).json({ error: 'Forbidden' })
        return
      }

      const tokenDoc = await admin.firestore().doc(`spotify_tokens/${userId}`).get()
      if (!tokenDoc.exists) {
        res.status(404).json({ error: 'No Spotify connection found' })
        return
      }

      const { refreshToken } = tokenDoc.data()!
      const { clientId, clientSecret } = getSpotifyConfig()

      const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      })

      const tokens = await tokenRes.json() as any
      if (tokens.error) {
        res.status(400).json({ error: tokens.error_description || tokens.error })
        return
      }

      // Update stored tokens
      await admin.firestore().doc(`spotify_tokens/${userId}`).update({
        accessToken: tokens.access_token,
        expiresAt: Date.now() + (tokens.expires_in * 1000),
        ...(tokens.refresh_token ? { refreshToken: tokens.refresh_token } : {}),
        updatedAt: Date.now(),
      })

      res.json({
        accessToken: tokens.access_token,
        expiresAt: Date.now() + (tokens.expires_in * 1000),
      })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  })
})
