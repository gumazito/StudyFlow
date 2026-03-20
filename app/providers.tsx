'use client'
import { useEffect } from 'react'
import { AuthProvider } from '@/lib/contexts/AuthContext'
import { ThemeProvider, ToastProvider, ModalProvider, ProcessingProvider } from '@/lib/contexts/ThemeContext'
import { initPushNotifications, onForegroundMessage } from '@/lib/push-notifications'

function PushNotificationInit() {
  useEffect(() => {
    // Initialize push notifications after user interaction
    const handleInteraction = () => {
      initPushNotifications().catch(() => {
        // Silent fail — push not critical
      })
      document.removeEventListener('click', handleInteraction)
    }
    document.addEventListener('click', handleInteraction, { once: true })

    // Listen for foreground messages
    const unsubscribe = onForegroundMessage((payload: any) => {
      // Show browser notification while app is open
      if (Notification.permission === 'granted' && payload.notification) {
        new Notification(payload.notification.title || 'StudyFlow', {
          body: payload.notification.body || '',
          icon: '/icons/icon-192.png',
        })
      }
    })

    return () => {
      document.removeEventListener('click', handleInteraction)
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [])

  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ModalProvider>
          <ProcessingProvider>
            <AuthProvider>
              <PushNotificationInit />
              {children}
            </AuthProvider>
          </ProcessingProvider>
        </ModalProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
