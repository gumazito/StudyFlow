'use client'

import { useState } from 'react'
import { useToast } from '@/lib/contexts/ThemeContext'
import { lookupAbn, searchAbnByName } from '@/lib/cloud-functions'

interface AbnLookupProps {
  value: string
  onChange: (abn: string) => void
  onResult?: (result: any) => void
  inputStyle: any
}

/**
 * ABN (Australian Business Number) lookup component.
 * Supports two modes:
 * - Search by ABN number (11 digits)
 * - Search by company/business name
 */
export function AbnLookup({ value, onChange, onResult, inputStyle }: AbnLookupProps) {
  const { toast } = useToast()
  const [looking, setLooking] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [nameResults, setNameResults] = useState<any[]>([])
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'abn' | 'name'>('abn')
  const [nameQuery, setNameQuery] = useState('')

  const formatAbn = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`
    if (digits.length <= 8) return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
  }

  const nameSearchTimer = { current: null as any }

  const handleChange = (raw: string) => {
    const formatted = formatAbn(raw)
    onChange(formatted)
    setResult(null)
    setNameResults([])
    setError('')
    // Auto-lookup when 11 digits entered
    const digits = raw.replace(/\D/g, '')
    if (digits.length === 11) {
      setTimeout(() => doAbnLookup(), 100)
    }
  }

  const handleNameChange = (val: string) => {
    setNameQuery(val)
    setError('')
    if (nameSearchTimer.current) clearTimeout(nameSearchTimer.current)
    if (val.trim().length < 2) { setNameResults([]); return }
    nameSearchTimer.current = setTimeout(() => doNameSearch(val), 400)
  }

  const doAbnLookup = async () => {
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
      if (!data.isActive) setError('This ABN is not currently active')
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

  const doNameSearch = async (query?: string) => {
    const q = (query ?? nameQuery).trim()
    if (q.length < 2) return

    setLooking(true)
    setError('')
    setNameResults([])
    try {
      const data = await searchAbnByName(q)
      if (data.results && data.results.length > 0) {
        setNameResults(data.results)
      } else {
        setError('No businesses found matching that name')
      }
    } catch (err: any) {
      if (err.message?.includes('not configured')) {
        setError('ABN lookup service not yet configured. Enter ABN manually.')
      } else {
        setError(err.message || 'Name search failed')
      }
    } finally {
      setLooking(false)
    }
  }

  const selectResult = (r: any) => {
    const formatted = formatAbn(r.abn)
    onChange(formatted)
    setResult(r)
    onResult?.(r)
    setNameResults([])
    setNameQuery('')
    setMode('abn')
  }

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex gap-1 mb-1.5">
        <button
          className="px-2 py-0.5 rounded-full text-[10px]"
          style={{ background: mode === 'abn' ? 'var(--primary)' : 'var(--bg)', color: mode === 'abn' ? 'white' : 'var(--text-muted)', border: '1px solid var(--border)' }}
          onClick={() => { setMode('abn'); setNameResults([]); setError('') }}
        >
          Search by ABN
        </button>
        <button
          className="px-2 py-0.5 rounded-full text-[10px]"
          style={{ background: mode === 'name' ? 'var(--primary)' : 'var(--bg)', color: mode === 'name' ? 'white' : 'var(--text-muted)', border: '1px solid var(--border)' }}
          onClick={() => { setMode('name'); setResult(null); setError('') }}
        >
          Search by Name
        </button>
      </div>

      {mode === 'abn' ? (
        <div>
          <input
            className="w-full px-3 py-2 rounded-md text-sm"
            style={inputStyle}
            value={value}
            onChange={e => handleChange(e.target.value)}
            placeholder="XX XXX XXX XXX"
            maxLength={14}
          />
          {looking && <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Looking up ABN...</p>}
          {value.replace(/\D/g, '').length > 0 && value.replace(/\D/g, '').length < 11 && (
            <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{11 - value.replace(/\D/g, '').length} digits remaining</p>
          )}
        </div>
      ) : (
        <div>
          <input
            className="w-full px-3 py-2 rounded-md text-sm"
            style={inputStyle}
            value={nameQuery}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="Start typing company or business name..."
          />
          {looking && <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Searching...</p>}
        </div>
      )}

      {/* ABN lookup result */}
      {result && result.isActive && (
        <div className="mt-1.5 p-2 rounded-lg text-xs" style={{ background: 'rgba(0,212,106,.08)', border: '1px solid rgba(0,212,106,.2)' }}>
          <div className="font-semibold" style={{ color: 'var(--text)' }}>{result.entityName}</div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            ABN: {result.abn} · {result.entityType} · {result.state} {result.postcode} · Status: {result.status}
          </div>
        </div>
      )}

      {/* Name search results */}
      {nameResults.length > 0 && (
        <div className="mt-1.5 max-h-[200px] overflow-y-auto rounded-lg" style={{ border: '1px solid var(--border)' }}>
          {nameResults.map((r: any, i: number) => (
            <button
              key={i}
              className="w-full text-left px-3 py-2 text-xs hover:bg-opacity-10 border-b last:border-b-0"
              style={{ borderColor: 'var(--border)', background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg-card)' }}
              onClick={() => selectResult(r)}
            >
              <div className="font-semibold" style={{ color: r.isActive ? 'var(--text)' : 'var(--text-muted)' }}>
                {r.entityName} {!r.isActive && <span style={{ color: 'var(--danger)' }}>(Inactive)</span>}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                ABN: {r.abn} · {r.entityType || 'Business'} · {r.state} {r.postcode}
              </div>
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-1 text-[10px]" style={{ color: 'var(--danger)' }}>{error}</div>
      )}

      <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
        {mode === 'abn' ? 'Must match the ABN on the letterhead document' : 'Select a business to auto-fill the ABN'}
      </div>
    </div>
  )
}
