"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { Bell, MessageSquare, CheckCircle } from "lucide-react";

interface NotificationData {
  type: string;
  entityId: number;
  message: string;
  timestamp: string;
  data: any;
}

interface WebSocketContextType {
  isConnected: boolean;
  notifications: NotificationData[];
  subscribeToConnection: (
    connectionId: number,
    callback: (message: any) => void,
  ) => () => void;
  clearNotifications: () => void;
  unreadCount: number;
  unreadMessagesCount: number;
  clearMessagesCount: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined,
);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { getToken, userId } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const clientRef = useRef<Client | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const tokenRefreshIntervalRef = useRef<NodeJS.Timeout>();
  const connectionSubscriptionsRef = useRef<Map<number, any>>(new Map());

  const connect = useCallback(async () => {
    if (!userId) return;

    // Deactivate existing client if any
    if (clientRef.current && clientRef.current.active) {
      console.log("Deactivating existing WebSocket connection...");
      try {
        clientRef.current.deactivate();
      } catch (error) {
        console.error("Error deactivating client:", error);
      }
    }

    try {
      // Get a fresh token each time we connect
      // skipCache option forces Clerk to fetch a new token instead of using cached one
      const token = await getToken({ skipCache: true });
      if (!token) {
        console.error("No token available for WebSocket connection");
        return;
      }

      console.log("WebSocket connecting with fresh token (expires in ~1 hour)");

      const client = new Client({
        webSocketFactory: () =>
          new SockJS(`${process.env.NEXT_PUBLIC_API_BASE_URL}/ws`),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: (str) => {
          console.log("STOMP Debug:", str);
        },
        // Disable automatic reconnect - we'll handle it manually with fresh tokens
        reconnectDelay: 0,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      client.onConnect = () => {
        console.log("WebSocket Connected");
        setIsConnected(true);

        // Clear any existing token refresh interval
        if (tokenRefreshIntervalRef.current) {
          clearInterval(tokenRefreshIntervalRef.current);
        }

        // Refresh connection every 50 minutes (before 1-hour token expiry)
        tokenRefreshIntervalRef.current = setInterval(
          () => {
            console.log(
              "Proactively refreshing WebSocket connection with new token...",
            );
            connect();
          },
          50 * 60 * 1000,
        ); // 50 minutes in milliseconds

        // Subscribe to user-specific notifications queue
        client.subscribe(`/user/queue/notifications`, (message) => {
          const notification: NotificationData = JSON.parse(message.body);
          console.log("Received notification:", notification);

          // Handle NEW_MESSAGE separately - don't add to notifications list
          if (notification.type === "NEW_MESSAGE") {
            setUnreadMessagesCount((prev) => prev + 1);

            // Only show message toast if not currently on that chat page
            if (typeof window !== "undefined") {
              const currentPath = window.location.pathname;
              const messageConnectionId =
                notification.data?.connection?.id || notification.entityId;
              if (!currentPath.includes(`/chats/${messageConnectionId}`)) {
                const messageContent = notification.data?.content || "";
                toast.info(notification.message, {
                  duration: 5000,
                  icon: <MessageSquare className="w-5 h-5 text-blue-600" />,
                  description:
                    messageContent.substring(0, 50) +
                    (messageContent.length > 50 ? "..." : ""),
                  action: {
                    label: "Open Chat",
                    onClick: () => {
                      window.location.href = `/chats/${messageConnectionId}`;
                    },
                  },
                });
              }
            }
            return; // Don't process further for messages
          }

          // For non-message notifications, add to notifications list
          setNotifications((prev) => [notification, ...prev]);
          setUnreadCount((prev) => prev + 1);

          // Show toast notification globally based on type
          switch (notification.type) {
            case "CONNECTION_REQUEST":
              toast.info(notification.message, {
                duration: 5000,
                icon: <Bell className="w-5 h-5 text-blue-600" />,
                description: "Click to view connection requests",
                action: {
                  label: "View",
                  onClick: () => {
                    if (typeof window !== "undefined") {
                      window.location.href = "/notifications";
                    }
                  },
                },
              });
              break;

            case "CONNECTION_ACCEPTED":
              toast.success(notification.message, {
                duration: 5000,
                icon: <CheckCircle className="w-5 h-5 text-green-600" />,
                description: "You can now start chatting",
                action: {
                  label: "Chat",
                  onClick: () => {
                    if (typeof window !== "undefined") {
                      window.location.href = "/chats";
                    }
                  },
                },
              });
              break;

            case "CONNECTION_STATUS_CHANGED":
              toast.info(notification.message, {
                duration: 3000,
                icon: <Bell className="w-5 h-5 text-gray-600" />,
              });
              break;

            default:
              toast.info(notification.message, {
                duration: 4000,
              });
          }
        });
      };

      client.onStompError = (frame) => {
        console.error("STOMP error:", frame);
        setIsConnected(false);

        // Reconnect with a fresh token after error
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Reconnecting after STOMP error...");
          connect();
        }, 5000);
      };

      client.onWebSocketClose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);

        // Reconnect with a fresh token after disconnect
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Reconnecting after disconnect...");
          connect();
        }, 5000);
      };

      client.activate();
      clientRef.current = client;
    } catch (error) {
      console.error("WebSocket connection error:", error);
      setIsConnected(false);

      // Retry connection after 5 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 5000);
    }
  }, [userId, getToken]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (tokenRefreshIntervalRef.current) {
        clearInterval(tokenRefreshIntervalRef.current);
      }
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
      // Clean up all connection subscriptions
      connectionSubscriptionsRef.current.forEach((subscription) => {
        subscription.unsubscribe();
      });
      connectionSubscriptionsRef.current.clear();
    };
  }, [connect]);

  const subscribeToConnection = useCallback(
    (connectionId: number, callback: (message: any) => void) => {
      if (!clientRef.current || !isConnected) {
        console.warn("Cannot subscribe: WebSocket not connected");
        return () => {};
      }

      // Unsubscribe from previous subscription for this connection if exists
      const existingSubscription =
        connectionSubscriptionsRef.current.get(connectionId);
      if (existingSubscription) {
        existingSubscription.unsubscribe();
      }

      // Subscribe to connection-specific topic
      const subscription = clientRef.current.subscribe(
        `/topic/connection/${connectionId}`,
        (message) => {
          const messageData = JSON.parse(message.body);
          console.log(
            "Received message for connection",
            connectionId,
            ":",
            messageData,
          );
          callback(messageData);
        },
      );

      connectionSubscriptionsRef.current.set(connectionId, subscription);

      // Return unsubscribe function
      return () => {
        subscription.unsubscribe();
        connectionSubscriptionsRef.current.delete(connectionId);
      };
    },
    [isConnected],
  );

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const clearMessagesCount = useCallback(() => {
    setUnreadMessagesCount(0);
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        notifications,
        subscribeToConnection,
        clearNotifications,
        unreadCount,
        unreadMessagesCount,
        clearMessagesCount,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
