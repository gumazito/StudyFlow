'use client'
import { useState, useEffect } from 'react'
import * as DB from '@/lib/db'

interface JoinRequestsPanelProps {
  groupId: string
  onApprove: (request: any) => void
  onReject: (request: any) => void
}

export function JoinRequestsPanel({ groupId, onApprove, onReject }: JoinRequestsPanelProps) {
  const [requests, setRequests] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    DB.getGroupJoinRequests(groupId).then(r => { setRequests(r as any[]); setLoaded(true) })
  }, [groupId])

  if (!loaded || requests.length === 0) return null

  const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }

  return (
    <div className="p-3.5 mb-3 rounded-xl" style={{ ...cardStyle, borderColor: 'rgba(253,203,110,.3)' }}>
      <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--warning)' }}>⏳ Join Requests ({requests.length})</h3>
      {requests.map(r => (
        <div key={r.id} className="flex justify-between items-center py-1.5 border-b text-xs" style={{ borderColor: 'var(--border)' }}>
          <div>
            <div className="font-semibold">{r.userName}</div>
            <div style={{ color: 'var(--text-muted)' }}>Wants: {(r.requestedRoles || ['learner']).join(', ')}</div>
          </div>
          <div className="flex gap-1">
            <button className="px-2 py-1 rounded-lg text-[10px] font-semibold text-white" style={{ background: 'var(--success)' }}
              onClick={() => { onApprove(r); setRequests(prev => prev.filter(x => x.id !== r.id)) }}>✓ Approve</button>
            <button className="px-2 py-1 rounded-lg text-[10px]" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              onClick={() => { onReject(r); setRequests(prev => prev.filter(x => x.id !== r.id)) }}>✗ Reject</button>
          </div>
        </div>
      ))}
    </div>
  )
}
