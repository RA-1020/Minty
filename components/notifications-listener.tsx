"use client"

import { useNotificationsListener } from '@/lib/services/notifications-listener'
import dynamic from 'next/dynamic'

// Create a client-side only version of the component
const NotificationsListenerClient = ({ children }: { children: React.ReactNode }) => {
  useNotificationsListener()
  return <>{children}</>
}

// Export a dynamic component with SSR disabled
export const NotificationsListener = dynamic(
  () => Promise.resolve(NotificationsListenerClient),
  { ssr: false }
)
