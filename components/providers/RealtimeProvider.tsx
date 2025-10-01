'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { useRealtime, type PDFDocument, type OrganizationMember, type RealtimeUpdate } from '@/lib/hooks/useRealtime'
import { useToast } from '@/hooks/use-toast'

interface RealtimeContextValue {
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  reconnect: () => void
  error: Error | null
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined)

interface RealtimeProviderProps {
  children: ReactNode
  enableNotifications?: boolean
  autoReconnect?: boolean
  reconnectInterval?: number
}

export function RealtimeProvider({
  children,
  enableNotifications = true,
  autoReconnect = true,
  reconnectInterval = 5000,
}: RealtimeProviderProps) {
  const { toast } = useToast()
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const maxReconnectAttempts = 5

  const handlePDFChange = useCallback((update: RealtimeUpdate<PDFDocument>) => {
    if (!enableNotifications) return

    switch (update.eventType) {
      case 'INSERT':
        toast({
          title: 'New PDF Uploaded',
          description: `${update.new.title} has been added`,
        })
        break
      case 'UPDATE':
        if (update.new.status === 'ready' && update.old.status !== 'ready') {
          toast({
            title: 'PDF Ready',
            description: `${update.new.title} is now ready for viewing`,
          })
        } else if (update.new.status === 'error') {
          toast({
            title: 'PDF Processing Failed',
            description: `${update.new.title} encountered an error`,
            variant: 'destructive',
          })
        }
        break
      case 'DELETE':
        toast({
          title: 'PDF Deleted',
          description: `${update.old.title} has been removed`,
        })
        break
    }
  }, [enableNotifications, toast])

  const handleMemberChange = useCallback((update: RealtimeUpdate<OrganizationMember>) => {
    if (!enableNotifications) return

    switch (update.eventType) {
      case 'INSERT':
        toast({
          title: 'New Team Member',
          description: `${update.new.user_metadata?.['full_name'] || 'A user'} joined the organization`,
        })
        break
      case 'UPDATE':
        if (update.new.status === 'online' && update.old.status !== 'online') {
          toast({
            title: 'Member Online',
            description: `${update.new.user_metadata?.['full_name'] || 'A team member'} is now online`,
          })
        }
        break
      case 'DELETE':
        toast({
          title: 'Member Left',
          description: `${update.old.user_metadata?.['full_name'] || 'A team member'} left the organization`,
        })
        break
    }
  }, [enableNotifications, toast])

  const handleError = useCallback((error: Error) => {
    console.error('Realtime error:', error)
    toast({
      title: 'Connection Error',
      description: 'Real-time updates may be delayed',
      variant: 'destructive',
    })
  }, [toast])

  const { isConnected, connectionStatus, subscribe, unsubscribe, error } = useRealtime({
    onPDFChange: handlePDFChange,
    onMemberChange: handleMemberChange,
    onError: handleError,
  })

  // Auto-reconnect logic
  useEffect(() => {
    if (!autoReconnect) return

    if (connectionStatus === 'error' || connectionStatus === 'disconnected') {
      if (reconnectAttempts < maxReconnectAttempts) {
        const timeout = setTimeout(() => {
          console.log(`Attempting to reconnect (${reconnectAttempts + 1}/${maxReconnectAttempts})...`)
          unsubscribe()
          subscribe()
          setReconnectAttempts(prev => prev + 1)
        }, reconnectInterval * Math.pow(2, reconnectAttempts)) // Exponential backoff

        return () => clearTimeout(timeout)
      } else {
        toast({
          title: 'Connection Failed',
          description: 'Unable to establish real-time connection. Please refresh the page.',
          variant: 'destructive',
        })
      }
    } else if (connectionStatus === 'connected') {
      // Reset reconnect attempts on successful connection
      setReconnectAttempts(0)
    }

    return undefined
  }, [connectionStatus, reconnectAttempts, autoReconnect, reconnectInterval, subscribe, unsubscribe, toast])

  const reconnect = useCallback(() => {
    setReconnectAttempts(0)
    unsubscribe()
    subscribe()
  }, [subscribe, unsubscribe])

  const value: RealtimeContextValue = {
    isConnected,
    connectionStatus,
    reconnect,
    error,
  }

  return (
    <RealtimeContext.Provider value={value}>
      {children}
      <ConnectionStatusIndicator
        status={connectionStatus}
        onReconnect={reconnect}
      />
    </RealtimeContext.Provider>
  )
}

export function useRealtimeContext() {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtimeContext must be used within a RealtimeProvider')
  }
  return context
}

// Connection status indicator component
function ConnectionStatusIndicator({
  status,
  onReconnect,
}: {
  status: string
  onReconnect: () => void
}) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Show indicator when not connected or connecting
    if (status === 'connecting' || status === 'disconnected' || status === 'error') {
      setShow(true)
      return undefined
    } else {
      // Hide after a delay when connected
      const timeout = setTimeout(() => setShow(false), 3000)
      return () => clearTimeout(timeout)
    }
  }, [status])

  if (!show) return null

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500'
      case 'connecting':
        return 'bg-yellow-500'
      case 'disconnected':
      case 'error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected'
      case 'connecting':
        return 'Connecting...'
      case 'disconnected':
        return 'Disconnected'
      case 'error':
        return 'Connection Error'
      default:
        return 'Unknown'
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg bg-background px-4 py-2 shadow-lg border">
      <div className={`h-2 w-2 rounded-full ${getStatusColor()} ${status === 'connecting' ? 'animate-pulse' : ''}`} />
      <span className="text-sm font-medium">{getStatusText()}</span>
      {(status === 'disconnected' || status === 'error') && (
        <button
          onClick={onReconnect}
          className="ml-2 text-xs text-primary hover:underline"
        >
          Retry
        </button>
      )}
    </div>
  )
}
