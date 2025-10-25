# WebSocket Live Notifications Implementation

## Overview
This document describes the WebSocket implementation for real-time notifications in the SkillCircle application.

## Features Implemented

### 1. Real-Time Connection Requests
- Users receive instant notifications when someone wants to connect
- Notifications appear without page refresh
- Toast notifications for new connection requests

### 2. Real-Time Chat Messages
- Messages are delivered instantly between users
- No need to refresh or poll for new messages
- Connection-specific message channels

### 3. Connection Status Updates
- Both parties are notified when connections are accepted/rejected
- Real-time updates to connection lists

### 4. Visual Indicators
- **Notification Badge**: Red badge on Bell icon in header showing unread count
- **Live Status**: Green "Live" indicator when WebSocket is connected
- **Offline Status**: Red "Offline" indicator when WebSocket is disconnected

## Architecture

### Backend (Spring Boot)

#### 1. WebSocket Configuration
**File**: `backend/src/main/java/com/skillcircle/config/WebSocketConfig.java`
- STOMP over WebSocket configuration
- Endpoints: `/ws` (WebSocket handshake)
- Message broker: In-memory simple broker
- Application destination prefix: `/app`
- User destination prefix: `/user`

#### 2. Notification Service
**File**: `backend/src/main/java/com/skillcircle/service/NotificationService.java`
- `notifyConnectionRequest()` - Sends notification to post author
- `notifyConnectionAccepted()` - Sends notification to requester
- `notifyNewMessage()` - Sends message to recipient
- `notifyConnectionStatusChange()` - Broadcasts status changes

#### 3. DTOs
**File**: `backend/src/main/java/com/skillcircle/dto/NotificationDTO.java`
- Notification type (CONNECTION_REQUEST, CONNECTION_ACCEPTED, NEW_MESSAGE, etc.)
- Entity ID (connection or message ID)
- Message text
- Timestamp
- Additional data payload

#### 4. Security
**File**: `backend/src/main/java/com/skillcircle/config/SecurityConfig.java`
- WebSocket endpoint `/ws/**` permitted for all authenticated users
- JWT authentication maintained through Clerk

### Frontend (Next.js)

#### 1. WebSocket Context
**File**: `frontend/src/lib/contexts/WebSocketContext.tsx`
- Global WebSocket connection management
- Automatic reconnection on disconnect
- User-specific notification queue subscription
- Connection-specific message subscriptions
- Unread notification counter

#### 2. Integration Points

**Layout** (`frontend/src/app/layout.tsx`)
- WebSocketProvider wraps entire application
- Ensures single WebSocket connection throughout app

**Header** (`frontend/src/app/components/Header.tsx`)
- Real-time notification badge with unread count
- Shows "9+" for counts over 9

**Notifications Page** (`frontend/src/app/notifications/page.tsx`)
- Real-time connection request updates
- Automatic addition of new requests
- Live status indicator
- Auto-clears unread count when page is viewed

**Chat Page** (`frontend/src/app/chats/[connectionId]/page.tsx`)
- Real-time message delivery
- Connection-specific subscriptions
- Live status indicator
- Duplicate message prevention

## WebSocket Channels

### User-Specific Notifications
**Channel**: `/user/queue/notifications`
**Subscription**: Automatically subscribed when WebSocket connects
**Messages**:
- Connection requests
- Connection accepted/rejected notifications
- System notifications

### Connection-Specific Messages
**Channel**: `/topic/connection/{connectionId}`
**Subscription**: Subscribed when user enters a chat
**Messages**:
- Real-time chat messages for that specific connection

## Testing Instructions

### Prerequisites
1. Backend server running on `http://localhost:8080`
2. Frontend running on `http://localhost:3000`
3. PostgreSQL database running
4. Two different user accounts for testing

### Test Scenarios

#### Test 1: Connection Request Notification
1. **User A**: Login and create a skill post (OFFER or ASK)
2. **User B**: Login, find User A's post, and send a connection request
3. **Expected**:
   - User A sees notification badge appear on Bell icon immediately
   - User A navigates to notifications page and sees new request (no refresh needed)
   - Toast notification appears for User A

#### Test 2: Connection Acceptance Notification
1. **User A**: Accept connection request from Test 1
2. **Expected**:
   - User B receives notification immediately
   - User B's notifications page updates in real-time
   - Both users can now see the connection in their chats list

#### Test 3: Real-Time Chat
1. **User A**: Navigate to chats and open conversation with User B
2. **User B**: Navigate to same chat
3. **User A**: Send a message
4. **Expected**:
   - User B sees message appear immediately without refresh
   - "Live" status indicator shows green for both users

#### Test 4: WebSocket Reconnection
1. Stop backend server
2. **Expected**: Frontend shows "Offline" status in red
3. Restart backend server
4. **Expected**: Frontend automatically reconnects and shows "Live" status

#### Test 5: Multiple Browser Sessions
1. Open User A in Browser 1
2. Open User A in Browser 2 (same account)
3. Send notification to User A
4. **Expected**: Both browser sessions receive the notification

### Browser Console Debugging

Check browser console for WebSocket debug messages:
```
STOMP Debug: Connected
Received notification: {type: "CONNECTION_REQUEST", ...}
Received message for connection 123: {content: "Hello", ...}
```

### Backend Logs

Check Spring Boot logs for WebSocket activity:
```
WebSocket connection established
Sending message to user: user_xxxxx
Message sent successfully
```

## Troubleshooting

### WebSocket Won't Connect
1. Check that backend is running on port 8080
2. Verify `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
3. Check browser console for CORS errors
4. Ensure JWT token is valid (login again)

### Notifications Not Received
1. Check WebSocket status indicator (should be green "Live")
2. Open browser console and look for subscription confirmations
3. Verify user is logged in with Clerk
4. Check backend logs for message sending

### Duplicate Messages
- This should be prevented by duplicate detection logic
- If occurring, check message ID comparison in chat page

### Page Refresh Clears Notifications
- This is expected behavior - notifications are transient
- Historical data is loaded from REST API on page load
- WebSocket provides real-time updates only

## Performance Considerations

### Connection Management
- Single WebSocket connection per user session
- Automatic reconnection with 5-second delay
- Heartbeat every 4 seconds to maintain connection

### Scalability
- Current implementation uses in-memory broker (single server)
- For production with multiple servers, consider:
  - RabbitMQ or Redis as external message broker
  - Session affinity/sticky sessions
  - Or scale horizontally with message broker

### Resource Usage
- WebSocket connection: ~1-2 KB per user
- Heartbeat traffic: ~100 bytes every 4 seconds
- Message overhead: ~200-500 bytes per notification

## Security

### Authentication
- JWT tokens validated on WebSocket handshake
- Clerk JWT validation via Spring Security OAuth2 Resource Server
- User-specific queues ensure isolation

### Authorization
- Users only subscribe to their own notification queues
- Connection-specific subscriptions validated
- Message sending requires connection participation

## Future Enhancements

### Potential Improvements
1. **Typing Indicators**: Show when user is typing
2. **Read Receipts**: Mark messages as read/delivered
3. **Online Status**: Show which users are currently online
4. **Presence**: Show last seen timestamp
5. **Push Notifications**: Browser notifications when tab is not active
6. **Message Reactions**: Emoji reactions to messages
7. **File Sharing**: Send images/files via WebSocket
8. **Audio/Video Calls**: WebRTC integration

### Performance Optimizations
1. Message batching for high-frequency updates
2. Compression for large payloads
3. Binary protocol instead of JSON
4. Connection pooling
5. Message persistence and offline queue

## Dependencies

### Backend
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```

### Frontend
```json
{
  "sockjs-client": "^1.6.1",
  "@stomp/stompjs": "^7.0.0"
}
```

## API Reference

### NotificationService Methods

#### notifyConnectionRequest
```java
void notifyConnectionRequest(String approverClerkId, ConnectionResponseDTO connection)
```
Sends notification to post author when connection request is created.

#### notifyConnectionAccepted
```java
void notifyConnectionAccepted(String requesterClerkId, ConnectionResponseDTO connection)
```
Sends notification to requester when their connection is accepted.

#### notifyNewMessage
```java
void notifyNewMessage(String recipientClerkId, Long connectionId, MessageResponseDTO message)
```
Sends real-time message notification to recipient.

#### notifyConnectionStatusChange
```java
void notifyConnectionStatusChange(String requesterClerkId, String approverClerkId, ConnectionResponseDTO connection)
```
Broadcasts connection status change to both parties.

### WebSocket Context API

#### useWebSocket Hook
```typescript
const {
  isConnected,           // boolean - WebSocket connection status
  notifications,          // NotificationData[] - Array of notifications
  subscribeToConnection,  // (connectionId, callback) => unsubscribe
  clearNotifications,     // () => void - Clear notification list
  unreadCount            // number - Unread notification count
} = useWebSocket();
```

## Conclusion

The WebSocket implementation provides a robust, real-time communication layer for the SkillCircle application. It enhances user experience by eliminating the need for page refreshes and providing instant updates for connection requests, chat messages, and status changes.

The implementation follows best practices for Spring Boot WebSocket integration and React context-based state management, ensuring maintainability and scalability for future enhancements.
