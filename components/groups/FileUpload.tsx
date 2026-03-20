'use client'

import { useState, useRef } from 'react'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '@/lib/firebase'

interface FileUploadProps {
  path: string // Firebase Storage path e.g. 'verification/groupId'
  accept?: string
  maxSizeMB?: number
  onUploaded: (url: string, fileName: string) => void
  label?: string
}

export function FileUpload({ path, accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx', maxSizeMB = 5, onUploaded, label = 'Upload Document' }: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [uploadedName, setUploadedName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File too large. Max ${maxSizeMB}MB.`)
      return
    }

    setUploading(true)
    setError('')
    setProgress(0)

    try {
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`)
      // Simple upload (no progress tracking with uploadBytes, but it's simpler)
      setProgress(50)
      await uploadBytes(storageRef, file)
      setProgress(90)
      const url = await getDownloadURL(storageRef)
      setProgress(100)
      setUploadedName(file.name)
      onUploaded(url, file.name)
    } catch (err: any) {
      console.error('Upload error:', err)
      if (err.code === 'storage/unauthorized') {
        setError('Firebase Storage not configured. Enable Storage in your Firebase console.')
      } else {
        setError(err.message || 'Upload failed')
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        onChange={handleUpload}
        style={{ display: 'none' }}
      />
      {uploadedName ? (
        <div className="flex items-center gap-2 py-1.5">
          <span className="text-xs" style={{ color: 'var(--success)' }}>✅ {uploadedName}</span>
          <button className="text-[10px]" style={{ color: 'var(--primary)' }} onClick={() => { setUploadedName(''); if (fileRef.current) fileRef.current.value = '' }}>Change</button>
        </div>
      ) : (
        <button
          className="px-3 py-2 rounded-lg text-xs w-full text-center"
          style={{
            border: '2px dashed var(--border)',
            background: 'var(--bg)',
            color: uploading ? 'var(--text-muted)' : 'var(--text-secondary)',
            cursor: uploading ? 'wait' : 'pointer',
          }}
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? `Uploading... ${progress}%` : `📎 ${label}`}
        </button>
      )}
      {error && <div className="text-[10px] mt-1" style={{ color: 'var(--danger)' }}>{error}</div>}
      <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Max {maxSizeMB}MB · {accept.replace(/\./g, '').toUpperCase()}</div>
    </div>
  )
}
