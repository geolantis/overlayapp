'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export interface PDFDocument {
  id: string
  title: string
  status: 'uploading' | 'processing' | 'ready' | 'error'
  created_at: string
  updated_at: string
  user_id: string
  file_url?: string
  thumbnail_url?: string
}

export interface OrganizationMember {
  id: string
  user_id: string
  organization_id: string
  role: 'owner' | 'admin' | 'member'
  status: 'online' | 'offline'
  last_seen: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

export interface RealtimeUpdate<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: T
  old: T
}

interface UseRealtimeOptions {
  onPDFChange?: (update: RealtimeUpdate<PDFDocument>) => void
  onMemberChange?: (update: RealtimeUpdate<OrganizationMember>) => void
  onError?: (error: Error) => void
}

interface UseRealtimeReturn {
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  subscribe: () => void
  unsubscribe: () => void
  error: Error | null
}

export function useRealtime(options: UseRealtimeOptions = {}): UseRealtimeReturn {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const [error, setError] = useState<Error | null>(null)
  const [channel, setChannel] = useState<RealtimeChannel | null>(null)
  const supabase = createClient()

  const handlePDFChange = useCallback((payload: RealtimePostgresChangesPayload<PDFDocument>) => {
    const update: RealtimeUpdate<PDFDocument> = {
      eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
      new: payload.new as PDFDocument,
      old: payload.old as PDFDocument,
    }
    options.onPDFChange?.(update)
  }, [options])

  const handleMemberChange = useCallback((payload: RealtimePostgresChangesPayload<OrganizationMember>) => {
    const update: RealtimeUpdate<OrganizationMember> = {
      eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
      new: payload.new as OrganizationMember,
      old: payload.old as OrganizationMember,
    }
    options.onMemberChange?.(update)
  }, [options])

  const subscribe = useCallback(() => {
    if (channel) {
      console.warn('Already subscribed to realtime channel')
      return
    }

    setConnectionStatus('connecting')

    const newChannel = supabase
      .channel('overlay-app-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pdf_overlays'
        },
        handlePDFChange
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_members'
        },
        handleMemberChange
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)
          setConnectionStatus('connected')
          setError(null)
        } else if (status === 'CLOSED') {
          setIsConnected(false)
          setConnectionStatus('disconnected')
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false)
          setConnectionStatus('error')
          const err = new Error('Realtime channel error')
          setError(err)
          options.onError?.(err)
        }
      })

    setChannel(newChannel)
  }, [channel, supabase, handlePDFChange, handleMemberChange, options])

  const unsubscribe = useCallback(() => {
    if (channel) {
      supabase.removeChannel(channel)
      setChannel(null)
      setIsConnected(false)
      setConnectionStatus('disconnected')
    }
  }, [channel, supabase])

  // Auto-subscribe on mount, unsubscribe on unmount
  useEffect(() => {
    subscribe()
    return () => unsubscribe()
  }, []) // Empty deps - only run on mount/unmount

  return {
    isConnected,
    connectionStatus,
    subscribe,
    unsubscribe,
    error,
  }
}

// Hook for optimistic updates
export function useOptimisticUpdate<T>(initialData: T[]) {
  const [data, setData] = useState<T[]>(initialData)
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set())

  const addOptimistic = useCallback((item: T & { id: string }) => {
    setData(prev => [...prev, item])
    setPendingUpdates(prev => new Set([...prev, item.id]))
  }, [])

  const updateOptimistic = useCallback((id: string, updates: Partial<T>) => {
    setData(prev => prev.map(item =>
      (item as any).id === id ? { ...item, ...updates } : item
    ))
    setPendingUpdates(prev => new Set([...prev, id]))
  }, [])

  const removeOptimistic = useCallback((id: string) => {
    setData(prev => prev.filter(item => (item as any).id !== id))
    setPendingUpdates(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const confirmUpdate = useCallback((id: string, confirmedItem?: T) => {
    if (confirmedItem) {
      setData(prev => prev.map(item =>
        (item as any).id === id ? confirmedItem : item
      ))
    }
    setPendingUpdates(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const revertUpdate = useCallback((id: string) => {
    setPendingUpdates(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  return {
    data,
    setData,
    pendingUpdates,
    addOptimistic,
    updateOptimistic,
    removeOptimistic,
    confirmUpdate,
    revertUpdate,
  }
}
