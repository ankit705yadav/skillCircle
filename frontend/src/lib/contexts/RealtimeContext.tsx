"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Bell, CheckCircle, MessageSquare } from "lucide-react";
import { getSupabase } from "@/lib/supabase/client";
import {
  fetchConnection,
  fetchProfile,
  type Connection,
  type Message,
} from "@/lib/supabase/queries";
import type { Database } from "@/lib/supabase/database.types";
import { useAuth } from "./AuthContext";

type ConnectionRow = Database["public"]["Tables"]["connections"]["Row"];
type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

export type RealtimeNotification =
  | { type: "CONNECTION_REQUEST"; connection: Connection }
  | { type: "CONNECTION_STATUS_CHANGED"; connectionId: number };

type MessageListener = (message: Message) => void;

interface RealtimeContextType {
  isConnected: boolean;
  notifications: RealtimeNotification[];
  subscribeToConnection: (
    connectionId: number,
    callback: MessageListener,
  ) => () => void;
  clearNotifications: () => void;
  unreadCount: number;
  unreadMessagesCount: number;
  clearMessagesCount: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(
  undefined,
);

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
};

const goTo = (path: string) => {
  window.location.href = path;
};

// One Supabase Realtime channel per signed-in user. Postgres Changes are
// filtered by RLS, so each user only receives rows they are allowed to read.
export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const userId = user?.id;
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<RealtimeNotification[]>(
    [],
  );
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const messageListenersRef = useRef<Map<number, Set<MessageListener>>>(
    new Map(),
  );

  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabase();

    const onNewRequest = async (row: ConnectionRow) => {
      const connection = await fetchConnection(row.id).catch(() => null);
      if (!connection) return;
      setNotifications((prev) => [
        { type: "CONNECTION_REQUEST", connection },
        ...prev,
      ]);
      setUnreadCount((prev) => prev + 1);
      toast.info(
        `New connection request from ${connection.requester.username}`,
        {
          duration: 5000,
          icon: <Bell className="w-5 h-5 text-blue-600" />,
          description: "Click to view connection requests",
          action: { label: "View", onClick: () => goTo("/notifications") },
        },
      );
    };

    // A request I approve/decline (possibly in another tab) is no longer pending.
    const onMyDecision = (row: ConnectionRow) => {
      setNotifications((prev) => [
        { type: "CONNECTION_STATUS_CHANGED", connectionId: row.id },
        ...prev,
      ]);
    };

    const onMyRequestAnswered = async (row: ConnectionRow) => {
      const connection = await fetchConnection(row.id).catch(() => null);
      const approver = connection?.approver.username ?? "Someone";
      if (row.status === "ACCEPTED") {
        setUnreadCount((prev) => prev + 1);
        toast.success(`${approver} accepted your connection request`, {
          duration: 5000,
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          description: "You can now start chatting",
          action: { label: "Chat", onClick: () => goTo(`/chats/${row.approver_id}`) },
        });
      } else if (row.status === "REJECTED") {
        toast.info(`${approver} declined your connection request`, {
          duration: 4000,
          icon: <Bell className="w-5 h-5 text-gray-600" />,
        });
      }
    };

    const onNewMessage = async (row: MessageRow) => {
      if (row.sender_id === userId) return;

      const message: Message = {
        id: row.id,
        content: row.content,
        timestamp: row.created_at,
        connectionId: row.connection_id,
        sender: { id: row.sender_id, username: null },
      };

      const listeners = messageListenersRef.current.get(row.connection_id);
      listeners?.forEach((listener) => listener(message));

      // The open chat page shows the message itself.
      const chatPath = `/chats/${row.sender_id}`;
      if (window.location.pathname === chatPath) return;

      setUnreadMessagesCount((prev) => prev + 1);
      const sender = await fetchProfile(row.sender_id).catch(() => null);
      toast.info(`New message from ${sender?.username ?? "a connection"}`, {
        duration: 5000,
        icon: <MessageSquare className="w-5 h-5 text-blue-600" />,
        description:
          row.content.substring(0, 50) + (row.content.length > 50 ? "..." : ""),
        action: { label: "Open Chat", onClick: () => goTo(chatPath) },
      });
    };

    const channel = supabase
      .channel(`user:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "connections",
          filter: `approver_id=eq.${userId}`,
        },
        (payload) => onNewRequest(payload.new as ConnectionRow),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "connections",
          filter: `approver_id=eq.${userId}`,
        },
        (payload) => onMyDecision(payload.new as ConnectionRow),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "connections",
          filter: `requester_id=eq.${userId}`,
        },
        (payload) => onMyRequestAnswered(payload.new as ConnectionRow),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => onNewMessage(payload.new as MessageRow),
      )
      .subscribe((status) => setIsConnected(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
      setNotifications([]);
      setUnreadCount(0);
      setUnreadMessagesCount(0);
    };
  }, [userId]);

  const subscribeToConnection = useCallback(
    (connectionId: number, callback: MessageListener) => {
      const listeners = messageListenersRef.current;
      if (!listeners.has(connectionId)) listeners.set(connectionId, new Set());
      listeners.get(connectionId)!.add(callback);

      return () => {
        const set = listeners.get(connectionId);
        set?.delete(callback);
        if (set?.size === 0) listeners.delete(connectionId);
      };
    },
    [],
  );

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const clearMessagesCount = useCallback(() => {
    setUnreadMessagesCount(0);
  }, []);

  return (
    <RealtimeContext.Provider
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
    </RealtimeContext.Provider>
  );
};
