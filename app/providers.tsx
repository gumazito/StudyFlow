'use client'
import { AuthProvider } from '@/lib/contexts/AuthContext'
import { ThemeProvider, ToastProvider } from '@/lib/contexts/ThemeContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
