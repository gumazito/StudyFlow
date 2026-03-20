'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  onListening?: (isListening: boolean) => void
  language?: string
  placeholder?: string
  disabled?: boolean
}

/**
 * Voice Input component using the Web Speech API (browser-native).
 * Supports speech-to-text for answering test questions verbally.
 * Falls back gracefully if the browser doesn't support it.
 */
export function VoiceInput({ onTranscript, onListening, language = 'en-AU', placeholder, disabled }: VoiceInputProps) {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [supported, setSupported] = useState(true)
  const [error, setError] = useState('')
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = language
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      setInterim(interimTranscript)
      if (finalTranscript) {
        onTranscript(finalTranscript.trim())
        setInterim('')
      }
    }

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') {
        setError('No speech detected. Try again.')
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Check browser permissions.')
      } else {
        setError(`Speech error: ${event.error}`)
      }
      setListening(false)
      onListening?.(false)
    }

    recognition.onend = () => {
      setListening(false)
      onListening?.(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
    }
  }, [language, onTranscript, onListening])

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return

    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
      onListening?.(false)
    } else {
      setError('')
      setInterim('')
      try {
        recognitionRef.current.start()
        setListening(true)
        onListening?.(true)
      } catch (err: any) {
        setError(err.message || 'Failed to start voice input')
      }
    }
  }, [listening, onListening])

  if (!supported) {
    return (
      <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
        Voice input not supported in this browser. Try Chrome or Edge.
      </div>
    )
  }

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <button
        onClick={toggleListening}
        disabled={disabled}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
        style={{
          background: listening ? 'var(--danger)' : 'var(--bg-card)',
          color: listening ? 'white' : 'var(--text-secondary)',
          border: `1px solid ${listening ? 'var(--danger)' : 'var(--border)'}`,
          animation: listening ? 'pulse 1.5s infinite' : 'none',
          opacity: disabled ? 0.5 : 1,
        }}
        title={listening ? 'Stop listening' : 'Speak your answer'}
      >
        {listening ? (
          <>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
            Listening...
          </>
        ) : (
          <>🎙️ {placeholder || 'Speak'}</>
        )}
      </button>

      {interim && (
        <div className="text-[11px] italic px-2 py-1 rounded-md max-w-xs text-center" style={{ color: 'var(--text-muted)', background: 'var(--bg)' }}>
          {interim}...
        </div>
      )}

      {error && (
        <div className="text-[10px] text-center" style={{ color: 'var(--danger)' }}>
          {error}
        </div>
      )}
    </div>
  )
}
