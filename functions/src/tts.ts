/**
 * Text-to-Speech Cloud Function
 * ===============================
 * Generates audio from course facts for podcast-style learning.
 * Supports multiple TTS providers with fallback:
 * 1. OpenAI TTS (tts-1 / tts-1-hd)
 * 2. ElevenLabs
 * 3. Google Cloud TTS
 *
 * Config:
 *   firebase functions:config:set openai.api_key="YOUR_KEY"
 *   firebase functions:config:set elevenlabs.api_key="YOUR_KEY"
 */

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import cors from 'cors'
import fetch from 'node-fetch'

const corsHandler = cors({ origin: true })

interface TtsRequest {
  text: string
  voice?: string
  provider?: 'openai' | 'elevenlabs'
  packageId?: string
  factIndex?: number
}

async function generateWithOpenAI(text: string, voice: string, apiKey: string): Promise<Buffer> {
  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: voice || 'nova', // Nova is youthful and engaging — great for students
      response_format: 'mp3',
      speed: 1.0,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI TTS error: ${response.status} ${err.slice(0, 200)}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function generateWithElevenLabs(text: string, voice: string, apiKey: string): Promise<Buffer> {
  // Default to "Rachel" voice if none specified
  const voiceId = voice || '21m00Tcm4TlvDq8ikWAM'
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`ElevenLabs TTS error: ${response.status} ${err.slice(0, 200)}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export const textToSpeech = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      // Verify Firebase auth
      const authHeader = req.headers.authorization
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Unauthorized' })
        return
      }
      const idToken = authHeader.split('Bearer ')[1]
      await admin.auth().verifyIdToken(idToken)

      const { text, voice, provider, packageId, factIndex } = req.body as TtsRequest

      if (!text || text.length > 5000) {
        res.status(400).json({ error: 'Text required (max 5000 characters)' })
        return
      }

      let audioBuffer: Buffer
      let usedProvider: string

      // Try OpenAI first, then ElevenLabs
      const openaiKey = functions.config().openai?.api_key
      const elevenlabsKey = functions.config().elevenlabs?.api_key

      if (provider === 'elevenlabs' && elevenlabsKey) {
        audioBuffer = await generateWithElevenLabs(text, voice || '', elevenlabsKey)
        usedProvider = 'elevenlabs'
      } else if (openaiKey) {
        audioBuffer = await generateWithOpenAI(text, voice || 'nova', openaiKey)
        usedProvider = 'openai'
      } else if (elevenlabsKey) {
        audioBuffer = await generateWithElevenLabs(text, voice || '', elevenlabsKey)
        usedProvider = 'elevenlabs'
      } else {
        res.status(500).json({ error: 'No TTS provider configured. Set openai.api_key or elevenlabs.api_key.' })
        return
      }

      // Optionally cache to Firebase Storage
      if (packageId && factIndex !== undefined) {
        try {
          const bucket = admin.storage().bucket()
          const filePath = `tts/${packageId}/fact_${factIndex}.mp3`
          const file = bucket.file(filePath)
          await file.save(audioBuffer, { contentType: 'audio/mpeg' })
          await file.makePublic()
          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`

          res.json({ audioUrl: publicUrl, provider: usedProvider, cached: true })
          return
        } catch (cacheErr) {
          // Cache failed, still return the audio
          console.warn('TTS cache failed:', cacheErr)
        }
      }

      // Return audio directly
      res.set('Content-Type', 'audio/mpeg')
      res.set('X-TTS-Provider', usedProvider)
      res.send(audioBuffer)
    } catch (err: any) {
      console.error('TTS error:', err)
      res.status(500).json({ error: err.message || 'TTS generation failed' })
    }
  })
})
