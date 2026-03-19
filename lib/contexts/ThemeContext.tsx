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
