'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, X, FileText, Users, Upload, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export interface Notification {
  id: string
  type: 'pdf_upload' | 'pdf_ready' | 'pdf_error' | 'member_join' | 'member_online' | 'system'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
}

interface NotificationsProps {
  className?: string
}

export function Notifications({ className }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = notifications.filter(n => !n.read).length

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      read: false,
    }
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)) // Keep last 50
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, read: true } : n
    ))
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Example: Add some demo notifications on mount
  useEffect(() => {
    const demoNotifications: Omit<Notification, 'id' | 'timestamp' | 'read'>[] = [
      {
        type: 'pdf_ready',
        title: 'PDF Ready',
        message: 'map_overlay_v1.pdf is now ready for viewing',
        actionUrl: '/dashboard/overlays',
      },
      {
        type: 'member_online',
        title: 'Team Member Online',
        message: 'John Doe is now online',
      },
    ]

    // Add demo notifications after a short delay
    const timeout = setTimeout(() => {
      demoNotifications.forEach(notif => addNotification(notif))
    }, 2000)

    return () => clearTimeout(timeout)
  }, [addNotification])

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'pdf_upload':
        return <Upload className="h-4 w-4 text-blue-500" />
      case 'pdf_ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pdf_error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'member_join':
      case 'member_online':
        return <Users className="h-4 w-4 text-purple-500" />
      case 'system':
        return <FileText className="h-4 w-4 text-gray-500" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return timestamp.toLocaleDateString()
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
          aria-label={`Notifications (${unreadCount} unread)`}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold">Notifications</h3>
          {notifications.length > 0 && (
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-8 text-xs"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-8 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "flex gap-3 p-4 hover:bg-accent/50 transition-colors cursor-pointer",
                    !notification.read && "bg-accent/30"
                  )}
                  onClick={() => {
                    markAsRead(notification.id)
                    if (notification.actionUrl) {
                      window.location.href = notification.actionUrl
                    }
                  }}
                >
                  <div className="mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-none">
                        {notification.title}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeNotification(notification.id)
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimestamp(notification.timestamp)}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="mt-2">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

// Export a hook to add notifications from other components
export function useNotifications() {
  // This would be implemented with a context provider in a real app
  // For now, we'll just return a stub
  return {
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      console.log('Notification:', notification)
      // In a real implementation, this would dispatch to a global notification context
    }
  }
}
