'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/contexts/AuthContext'
import { useToast } from '@/lib/contexts/ThemeContext'
import * as DB from '@/lib/db'
import { GROUP_TYPES } from '@/lib/constants'

interface CrossPublishPanelProps {
  packageId: string
  packageName: string
  crossPublished: Array<{ groupId: string; groupName: string; mode: string }>
  onUpdate: (published: Array<{ groupId: string; groupName: string; mode: string }>) => void
}

export function CrossPublishPanel({ packageId, packageName, crossPublished, onUpdate }: CrossPublishPanelProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [groups, setGroups] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (user?.id) {
      DB.getGroupsForUser(user.id).then(g => {
        setGroups((g as any[]).filter(gr => gr.id !== 'personal_' + user.id))
        setLoaded(true)
      })
    }
  }, [user?.id])

  if (!loaded || groups.length === 0) return null

  const published = crossPublished || []

  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        📢 Cross-Publish to Other Groups
      </label>
      <div className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
        Share this course with other groups you have publisher access to.
      </div>
      {groups.map(g => {
        const isPublished = published.find(p => p.groupId === g.id)
        const hasPublisherAccess = (g.members || []).some((m: any) => m.userId === user?.id && (m.roles || []).includes('publisher'))
        if (!hasPublisherAccess && !isPublished) return null
        return (
          <div key={g.id} className="flex justify-between items-center p-1.5 px-2 rounded-lg mb-1" style={{ background: 'var(--bg)', fontSize: 12 }}>
            <span>{GROUP_TYPES.find(t => t.id === g.type)?.icon || '📂'} {g.name}</span>
            {isPublished ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px]" style={{ color: 'var(--success)' }}>✓ {isPublished.mode === 'link' ? 'Linked' : 'Copied'}</span>
                <button className="text-[11px]" style={{ color: 'var(--text-muted)' }} onClick={() => onUpdate(published.filter(p => p.groupId !== g.id))}>Remove</button>
              </div>
            ) : (
              <div className="flex gap-1">
                <button className="px-2 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                  onClick={async () => {
                    await DB.crossPublishCourse(packageId, g.id, 'link')
                    onUpdate([...published, { groupId: g.id, groupName: g.name, mode: 'link' }])
                    toast(`Linked to ${g.name}`, 'success')
                  }}>🔗 Link</button>
                <button className="px-2 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                  onClick={async () => {
                    await DB.crossPublishCourse(packageId, g.id, 'copy')
                    onUpdate([...published, { groupId: g.id, groupName: g.name, mode: 'copy' }])
                    toast(`Copied to ${g.name}`, 'success')
                  }}>📋 Copy</button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
