'use client'
import { useState } from 'react'
import { useToast } from '@/lib/contexts/ThemeContext'
import { FileUpload } from './FileUpload'
import { AbnLookup } from './AbnLookup'

interface VerificationFormProps {
  group: any
  onSubmit: (data: any) => void
}

export function VerificationForm({ group, onSubmit }: VerificationFormProps) {
  const { toast } = useToast()
  const [contactName, setContactName] = useState('')
  const [officePhone, setOfficePhone] = useState('')
  const [mobile, setMobile] = useState('')
  const [officialEmail, setOfficialEmail] = useState('')
  const [abn, setAbn] = useState('')
  const [abnData, setAbnData] = useState<any>(null)
  const [notes, setNotes] = useState('')
  const [docUrl, setDocUrl] = useState('')
  const [docName, setDocName] = useState('')

  const inputStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }

  return (
    <div className="animate-fade-in">
      <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
        To verify this as an official {group.type} group, please provide the details of an authorised contact person
        and upload a letter on official letterhead confirming their authority to administer this group.
      </p>
      <div className="mb-2">
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Official Contact Name *</label>
        <input className="w-full px-3 py-2 rounded-md text-sm" style={inputStyle} value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Full name of authorised person" />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Office Phone *</label>
          <input className="w-full px-3 py-2 rounded-md text-sm" style={inputStyle} value={officePhone} onChange={e => setOfficePhone(e.target.value)} placeholder="02 1234 5678" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Mobile</label>
          <input className="w-full px-3 py-2 rounded-md text-sm" style={inputStyle} value={mobile} onChange={e => setMobile(e.target.value)} placeholder="0412 345 678" />
        </div>
      </div>
      <div className="mb-2">
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Official Email Address *</label>
        <input className="w-full px-3 py-2 rounded-md text-sm" style={inputStyle} type="email" value={officialEmail} onChange={e => setOfficialEmail(e.target.value)} placeholder="contact@school.edu.au or contact@company.com.au" />
        <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Must be from the school/company domain (not personal email)</div>
      </div>
      {group.type === 'company' && (
        <div className="mb-2">
          <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>ABN (Australian Business Number) *</label>
          <AbnLookup value={abn} onChange={setAbn} onResult={setAbnData} inputStyle={inputStyle} />
        </div>
      )}
      <div className="mb-2">
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Verification Document</label>
        <div className="p-3.5 rounded-lg" style={{ background: 'var(--bg)', border: '1px dashed var(--border)' }}>
          <p className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
            Upload a letter on official {group.type} letterhead confirming authority to administer this StudyFlow group.
            {group.type === 'company' ? ' Must include ABN.' : ''}
          </p>
          <FileUpload
            path={`verification/${group.id}`}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            maxSizeMB={5}
            label="Upload letter of authority (PDF or image)"
            onUploaded={(url, name) => { setDocUrl(url); setDocName(name) }}
          />
        </div>
      </div>
      <div className="mb-2">
        <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>Additional Notes</label>
        <textarea className="w-full px-3 py-2 rounded-md text-sm" style={{ ...inputStyle, minHeight: 50 }} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional context..." />
      </div>
      <button
        className="px-4 py-2 rounded-lg text-xs font-bold text-white"
        style={{ background: 'var(--primary)', opacity: (!contactName.trim() || !officePhone.trim() || !officialEmail.trim()) ? 0.5 : 1 }}
        disabled={!contactName.trim() || !officePhone.trim() || !officialEmail.trim()}
        onClick={() => {
          if (!contactName.trim() || !officePhone.trim() || !officialEmail.trim()) { toast('Please fill in all required fields', 'error'); return }
          if (group.type === 'company' && !abn.trim()) { toast('ABN is required for company verification', 'error'); return }
          onSubmit({ contactName, officePhone, mobile, officialEmail, abn, abnLookupData: abnData || null, notes, documentUrl: docUrl, documentName: docName, submittedAt: Date.now() })
        }}>
        📤 Submit Verification Request
      </button>
    </div>
  )
}
