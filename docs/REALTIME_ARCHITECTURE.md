# Real-time Architecture Documentation

## Overview

This document describes the real-time architecture implementation for the Overlay App, including WebSocket connections, data synchronization, and optimistic UI updates.

## Architecture Components

### 1. Real-time Hook (`useRealtime`)

**Location**: `/lib/hooks/useRealtime.ts`

**Purpose**: Manages WebSocket subscriptions to Supabase Realtime for real-time data updates.

**Key Features**:
- Subscribe to PDF document changes
- Subscribe to organization member status changes
- Automatic connection lifecycle management
- Error handling and recovery
- Optimistic UI updates

**Usage**:
```typescript
const { isConnected, connectionStatus, subscribe, unsubscribe, error } = useRealtime({
  onPDFChange: (update) => {
    console.log('PDF changed:', update)
  },
  onMemberChange: (update) => {
    console.log('Member status changed:', update)
  },
  onError: (error) => {
    console.error('Realtime error:', error)
  }
})
```

### 2. Realtime Provider (`RealtimeProvider`)

**Location**: `/components/providers/RealtimeProvider.tsx`

**Purpose**: Provides global real-time context and manages connection status across the application.

**Key Features**:
- Context provider for real-time state
- Automatic reconnection with exponential backoff
- Connection status indicator UI
- Toast notifications for real-time events
- Configurable notification preferences

**Configuration Options**:
- `enableNotifications`: Enable/disable toast notifications (default: true)
- `autoReconnect`: Enable automatic reconnection (default: true)
- `reconnectInterval`: Base interval for reconnection attempts (default: 5000ms)

**Usage**:
```typescript
<RealtimeProvider
  enableNotifications={true}
  autoReconnect={true}
  reconnectInterval={5000}
>
  {children}
</RealtimeProvider>
```

### 3. Notifications Component

**Location**: `/components/dashboard/Notifications.tsx`

**Purpose**: Displays real-time notifications to users with a bell icon and unread count.

**Key Features**:
- Popover-based notification panel
- Unread count badge
- Mark as read functionality
- Clear all notifications
- Timestamped notifications
- Action URLs for navigation
- Auto-dismiss after reading

**Notification Types**:
- `pdf_upload`: New PDF uploaded
- `pdf_ready`: PDF processing complete
- `pdf_error`: PDF processing failed
- `member_join`: New team member joined
- `member_online`: Team member came online
- `system`: System notifications

## Data Flow

### Real-time Update Flow

```
Supabase Database Change
    ↓
Realtime Channel (WebSocket)
    ↓
useRealtime Hook
    ↓
RealtimeProvider Context
    ↓
Component Callbacks
    ↓
UI Update + Toast Notification
```

### Optimistic Update Flow

```
User Action
    ↓
Optimistic UI Update (immediate)
    ↓
API Call to Supabase
    ↓
Real-time Confirmation
    ↓
Confirm/Revert Optimistic Update
```

## Database Schema Requirements

### pdf_overlays Table

The real-time system expects the following structure:

```sql
CREATE TABLE pdf_overlays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  status TEXT CHECK (status IN ('uploading', 'processing', 'ready', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  file_url TEXT,
  thumbnail_url TEXT
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE pdf_overlays;
```

### organization_members Table

```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  role TEXT CHECK (role IN ('owner', 'admin', 'member')),
  status TEXT CHECK (status IN ('online', 'offline')),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  user_metadata JSONB
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE organization_members;
```

## Connection Management

### Connection States

1. **Disconnected**: Initial state, no connection
2. **Connecting**: Attempting to establish connection
3. **Connected**: Active WebSocket connection
4. **Error**: Connection failed or lost

### Reconnection Strategy

The system implements exponential backoff for reconnection:

```
Attempt 1: 5 seconds
Attempt 2: 10 seconds
Attempt 3: 20 seconds
Attempt 4: 40 seconds
Attempt 5: 80 seconds
Max attempts: 5
```

After max attempts, user must manually refresh or click retry.

## Optimistic Updates

The `useOptimisticUpdate` hook provides utilities for implementing optimistic UI:

```typescript
const {
  data,
  pendingUpdates,
  addOptimistic,
  updateOptimistic,
  removeOptimistic,
  confirmUpdate,
  revertUpdate
} = useOptimisticUpdate(initialData)

// Add optimistic item
addOptimistic(newItem)

// Later, confirm when real-time update arrives
confirmUpdate(newItem.id, confirmedItem)

// Or revert if operation failed
revertUpdate(newItem.id)
```

## Performance Considerations

### Connection Pooling

- Single WebSocket connection per user session
- Multiple subscriptions on same channel
- Automatic channel cleanup on unmount

### Memory Management

- Notifications limited to last 50 items
- Automatic cleanup of read notifications
- Efficient state updates using React hooks

### Network Efficiency

- Debounced reconnection attempts
- Exponential backoff prevents connection spam
- Selective subscriptions based on user context

## Security Considerations

### Row Level Security (RLS)

Ensure RLS policies are configured for real-time tables:

```sql
-- PDF overlays: users can only see their own documents
CREATE POLICY "Users can view own PDFs"
  ON pdf_overlays FOR SELECT
  USING (auth.uid() = user_id);

-- Organization members: users can see members in their organization
CREATE POLICY "Users can view org members"
  ON organization_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

### Authentication

- Real-time subscriptions use Supabase auth tokens
- Automatic token refresh handled by Supabase client
- Connections closed on logout

## Testing

### Manual Testing Checklist

- [ ] Connect to real-time on page load
- [ ] Receive notifications for PDF uploads
- [ ] Receive notifications for member status changes
- [ ] Connection indicator shows correct status
- [ ] Automatic reconnection works after network loss
- [ ] Notifications show correct timestamps
- [ ] Mark as read functionality works
- [ ] Clear all notifications works
- [ ] Optimistic updates confirm correctly
- [ ] Error states display properly

### Automated Testing

Future implementation should include:
- Unit tests for hooks
- Integration tests for provider
- E2E tests for real-time flows
- Performance tests for connection handling

## Future Enhancements

### Planned Features

1. **Presence System**: Track who's currently viewing a document
2. **Typing Indicators**: Show when team members are editing
3. **Collaborative Cursors**: See other users' cursors on maps
4. **Live Comments**: Real-time comment threads on PDFs
5. **Activity Feed**: Detailed activity log with filtering
6. **Notification Preferences**: Per-channel notification settings
7. **Desktop Notifications**: Browser push notifications
8. **Sound Notifications**: Optional audio alerts

### Performance Optimizations

1. **Connection Sharing**: Share connections across tabs
2. **Delta Updates**: Send only changed fields
3. **Compression**: Compress real-time payloads
4. **Batching**: Batch multiple updates together
5. **Lazy Loading**: Load notifications on demand

## Troubleshooting

### Common Issues

**Issue**: Real-time not connecting
- Check Supabase project settings
- Verify realtime is enabled for tables
- Check network/firewall settings
- Verify authentication token is valid

**Issue**: Notifications not appearing
- Check `enableNotifications` prop
- Verify event handlers are registered
- Check browser console for errors
- Verify RLS policies allow access

**Issue**: Connection keeps dropping
- Check network stability
- Verify WebSocket support in browser
- Check Supabase service status
- Review reconnection logs

## References

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [React Hooks Best Practices](https://react.dev/reference/react)
- [WebSocket Protocol](https://datatracker.ietf.org/doc/html/rfc6455)

## Changelog

### 2025-10-01
- Initial implementation of real-time architecture
- Created useRealtime hook
- Created RealtimeProvider component
- Created Notifications component
- Documented architecture and data flows
