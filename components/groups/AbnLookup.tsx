'use client'

import { useState } from 'react'
import { useToast } from '@/lib/contexts/ThemeContext'
import { lookupAbn } from '@/lib/cloud-functions'

interface AbnLookupProps {
  value: string
  onChange: (abn: string) => void
  onResult?: (result: any) => void
  inputStyle: any
}

/**
 * ABN (Australian Business Number) lookup component.
 * Validates ABN format and looks up business details via ABR API Cloud Function.
 */
export function AbnLookup({ value, onChange, onResult, inputStyle }: AbnLookupProps) {
  const { toast } = useToast()
  const [looking, setLooking] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const formatAbn = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`
    if (digits.length <= 8) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
  }

  const handleChange = (raw: string) => {
    const formatted = formatAbn(raw)
    onChange(formatted)
    setResult(null)
    setError('')
  }

  const doLookup = async () => {
    const digits = value.replace(/\D/g, '')
    if (digits.length !== 11) {
      setError('ABN must be 11 digits')
      return
    }

    setLooking(true)
    setError('')
    try {
      const data = await lookupAbn(digits)
      setResult(data)
      onResult?.(data)

      if (!data.isActive) {
        setError('This ABN is not currently active')
      }
    } catch (err: any) {
      if (err.message?.includes('not configured')) {
        setError('ABN lookup service not yet configured. Enter ABN manually.')
      } else {
        setError(err.message || 'ABN lookup failed')
      }
    } finally {
      setLooking(false)
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-md text-sm"
          style={inputStyle}
          value={value}
          onChange={e => handleChange(e.target.value)}
          placeholder="XX XXX XXX XXX"
          maxLength={14}
        />
        <button
          onClick={doLookup}
          disabled={looking || value.replace(/\D/g, '').length !== 11}
          className="px-3 py-2 rounded-md text-xs font-semibold text-white whitespace-nowrap"
          style={{
            background: looking ? 'var(--text-muted)' : 'var(--primary)',
            opacity: value.replace(/\D/g, '').length !== 11 ? 0.5 : 1,
          }}
        >
          {looking ? '...' : '🔍 Lookup'}
        </button>
      </div>

      {result && result.isActive && (
        <div className="mt-1.5 p-2 rounded-lg text-xs" style={{ background: 'rgba(0,212,106,.08)', border: '1px solid rgba(0,212,106,.2)' }}>
          <div className="font-semibold" style={{ color: 'var(--text)' }}>{result.entityName}</div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {result.entityType} · {result.state} {result.postcode} · Status: {result.status}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-1 text-[10px]" style={{ color: 'var(--danger)' }}>{error}</div>
      )}

      <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
        Must match the ABN on the letterhead document
      </div>
    </div>
  )
}
