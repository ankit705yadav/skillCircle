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
  const clientRef = useRef<Client | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const connectionSubscriptionsRef = useRef<Map<number, any>>(new Map());

  const connect = useCallback(async () => {
    if (!userId) return;

    try {
      const token = await getToken();
      if (!token) return;

      const client = new Client({
        webSocketFactory: () =>
          new SockJS(`${process.env.NEXT_PUBLIC_API_BASE_URL}/ws`),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: (str) => {
          console.log("STOMP Debug:", str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      client.onConnect = () => {
        console.log("WebSocket Connected");
        setIsConnected(true);

        // Subscribe to user-specific notifications queue
        client.subscribe(`/user/queue/notifications`, (message) => {
          const notification: NotificationData = JSON.parse(message.body);
          console.log("Received notification:", notification);

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

            case "NEW_MESSAGE":
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
      };

      client.onWebSocketClose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
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

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        notifications,
        subscribeToConnection,
        clearNotifications,
        unreadCount,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
