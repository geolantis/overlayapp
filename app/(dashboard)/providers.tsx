'use client'

import { RealtimeProvider } from "@/components/providers/RealtimeProvider"

export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <RealtimeProvider
      enableNotifications={true}
      autoReconnect={true}
      reconnectInterval={5000}
    >
      {children}
    </RealtimeProvider>
  )
}
