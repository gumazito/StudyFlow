'use client'
import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react'

interface ThemeContextType {
  dark: boolean
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextType>({ dark: true, toggle: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const root = document.documentElement
    if (dark) {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
    }
  }, [dark])

  const toggle = useCallback(() => setDark(d => !d), [])

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() { return useContext(ThemeContext) }

// ============================================================
// TOAST SYSTEM
// ============================================================
type ToastType = 'success' | 'error' | 'info'

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<{ message: string; type: ToastType } | null>(null)
  const timer = useRef<NodeJS.Timeout>()

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    setCurrent({ message, type })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCurrent(null), 3500)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {current && (
        <div
          onClick={() => setCurrent(null)}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-5 py-2.5 rounded-lg text-sm font-semibold text-white cursor-pointer shadow-lg animate-fade-in"
          style={{
            background: current.type === 'success' ? 'var(--success)' : current.type === 'error' ? 'var(--danger)' : 'var(--primary)',
          }}
        >
          {current.type === 'success' ? '\u2705 ' : current.type === 'error' ? '\u274C ' : '\u2139\uFE0F '}
          {current.message}
        </div>
      )}
    </ToastContext.Provider>
  )
}

export function useToast() { return useContext(ToastContext) }

// ============================================================
// MODAL SYSTEM (confirm/prompt/alert)
// ============================================================
type ModalType = 'alert' | 'confirm' | 'prompt'

interface ModalState {
  type: ModalType
  title: string
  message: string
  defaultValue?: string
  resolve: (value: any) => void
}

interface ModalContextType {
  showAlert: (message: string, title?: string) => Promise<void>
  showConfirm: (message: string, title?: string) => Promise<boolean>
  showPrompt: (message: string, defaultVal?: string, title?: string) => Promise<string | null>
}

const ModalContext = createContext<ModalContextType>({
  showAlert: async () => {},
  showConfirm: async () => false,
  showPrompt: async () => null,
})

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState | null>(null)
  const [promptValue, setPromptValue] = useState('')

  const showAlert = useCallback((message: string, title?: string): Promise<void> => {
    return new Promise(resolve => {
      setModal({ type: 'alert', title: title || 'Notice', message, resolve: () => { setModal(null); resolve() } })
    })
  }, [])

  const showConfirm = useCallback((message: string, title?: string): Promise<boolean> => {
    return new Promise(resolve => {
      setModal({ type: 'confirm', title: title || 'Confirm', message, resolve: (val: boolean) => { setModal(null); resolve(val) } })
    })
  }, [])

  const showPrompt = useCallback((message: string, defaultVal?: string, title?: string): Promise<string | null> => {
    setPromptValue(defaultVal || '')
    return new Promise(resolve => {
      setModal({ type: 'prompt', title: title || '', message, defaultValue: defaultVal, resolve: (val: string | null) => { setModal(null); resolve(val) } })
    })
  }, [])

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      {modal && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-5" style={{ background: 'rgba(0,0,0,.7)' }}>
          <div className="w-full max-w-[420px] p-6 rounded-xl animate-fade-in" style={{ background: 'var(--bg-elevated, var(--bg-card))', border: '1px solid var(--primary)' }}>
            {modal.title && <h3 className="text-base font-extrabold mb-2">{modal.title}</h3>}
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{modal.message}</p>
            {modal.type === 'prompt' && (
              <input
                className="w-full px-3 py-2.5 rounded-md text-sm mb-3"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text)' }}
                value={promptValue}
                onChange={e => setPromptValue(e.target.value)}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') modal.resolve(promptValue) }}
              />
            )}
            <div className="flex gap-2 justify-end">
              {(modal.type === 'confirm' || modal.type === 'prompt') && (
                <button className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
                  onClick={() => modal.resolve(modal.type === 'prompt' ? null : false)}>Cancel</button>
              )}
              <button className="px-4 py-2 rounded-lg text-sm font-bold text-white" style={{ background: 'var(--primary)' }}
                onClick={() => modal.resolve(modal.type === 'prompt' ? promptValue : true)}>
                {modal.type === 'alert' ? 'OK' : modal.type === 'confirm' ? 'Confirm' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  )
}

export function useModal() { return useContext(ModalContext) }

// ============================================================
// PROCESSING OVERLAY
// ============================================================
interface ProcessingContextType {
  showProcessing: (message?: string) => void
  hideProcessing: () => void
}

const ProcessingContext = createContext<ProcessingContextType>({
  showProcessing: () => {},
  hideProcessing: () => {},
})

export function ProcessingProvider({ children }: { children: ReactNode }) {
  const [processing, setProcessing] = useState<{ message: string } | null>(null)

  const showProcessing = useCallback((message?: string) => setProcessing({ message: message || 'Processing...' }), [])
  const hideProcessing = useCallback(() => setProcessing(null), [])

  return (
    <ProcessingContext.Provider value={{ showProcessing, hideProcessing }}>
      {children}
      {processing && (
        <div className="fixed inset-0 z-[9997] flex items-center justify-center" style={{ background: 'rgba(0,0,0,.6)' }}>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full mx-auto mb-3" style={{ borderWidth: 3, borderColor: 'var(--border)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
            <h3 className="text-base font-bold">{processing.message}</h3>
          </div>
        </div>
      )}
    </ProcessingContext.Provider>
  )
}

export function useProcessing() { return useContext(ProcessingContext) }
