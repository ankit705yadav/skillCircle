"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import {
  Send,
  ArrowLeft,
  Loader2,
  Wifi,
  WifiOff,
  Calendar,
  Briefcase,
  BookOpen,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRealtime } from "@/lib/contexts/RealtimeContext";
import {
  fetchActiveConnections,
  fetchMessages,
  sendMessage,
  type Author,
  type Connection,
  type Message,
} from "@/lib/supabase/queries";

const byTimestamp = (a: Message, b: Message) =>
  new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();

export default function ChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const otherUserId = decodeURIComponent(params.userId as string);
  const [messages, setMessages] = useState<Message[]>([]);
  // Connections with this user, most recently accepted first.
  const [userConnections, setUserConnections] = useState<Connection[]>([]);
  const [otherUserInfo, setOtherUserInfo] = useState<Author | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSkillsExpanded, setIsSkillsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { subscribeToConnection, isConnected } = useRealtime();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!otherUserId || !user) return;

    const fetchData = async () => {
      try {
        // All of my active connections, newest first; keep the ones with this user
        const connectionsWithUser = (await fetchActiveConnections()).filter(
          (conn) =>
            (user.id === conn.requester.id ? conn.approver : conn.requester)
              .id === otherUserId,
        );

        setUserConnections(connectionsWithUser);

        if (connectionsWithUser.length > 0) {
          const firstConn = connectionsWithUser[0];
          setOtherUserInfo(
            user.id === firstConn.requester.id
              ? firstConn.approver
              : firstConn.requester,
          );

          // Messages from all connections with this user, in one timeline
          setMessages(
            await fetchMessages(connectionsWithUser.map((conn) => conn.id)),
          );
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load chat");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [otherUserId, user]);

  // Receive real-time messages for all connections with this user
  useEffect(() => {
    const unsubscribes = userConnections.map((conn) =>
      subscribeToConnection(conn.id, (newMessage) => {
        setMessages((prev) =>
          // Check if message already exists to avoid duplicates
          prev.some((m) => m.id === newMessage.id)
            ? prev
            : [...prev, newMessage].sort(byTimestamp),
        );
      }),
    );

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [userConnections, subscribeToConnection]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || userConnections.length === 0) return;

    setIsSending(true);
    const messageContent = newMessage;
    setNewMessage("");

    // Use the most recent connection (first in the sorted array)
    const primaryConnection = userConnections[0];

    try {
      const newMsg = await sendMessage(primaryConnection.id, messageContent);
      setMessages((prev) => [...prev, newMsg]);
    } catch (error: any) {
      toast.error(error.message);
      setNewMessage(messageContent); // Restore the message
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {otherUserInfo?.username}
                </h1>
                <p className="text-sm text-gray-500">
                  {userConnections.length}{" "}
                  {userConnections.length === 1 ? "connection" : "connections"}
                </p>
              </div>
            </div>
            {/* WebSocket Status Indicator */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
            >
              {isConnected ? (
                <Wifi className="w-3 h-3" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
              {isConnected ? "Live" : "Offline"}
            </div>
          </div>

          {/* Skill Posts Info Banner - Collapsable */}
          {userConnections.length > 0 && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <Info className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-700">
                      Connected Skills
                    </h4>
                    {userConnections.length > 1 && (
                      <button
                        onClick={() => setIsSkillsExpanded(!isSkillsExpanded)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        {isSkillsExpanded ? (
                          <>
                            <span>Show less</span>
                            <ChevronUp className="w-3 h-3" />
                          </>
                        ) : (
                          <>
                            <span>Show all ({userConnections.length})</span>
                            <ChevronDown className="w-3 h-3" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {/* Connections are already sorted latest first */}
                    {(() => {
                      const connectionsToShow = isSkillsExpanded
                        ? userConnections
                        : [userConnections[0]];

                      return connectionsToShow.map((conn) => (
                        <div
                          key={conn.id}
                          className="bg-white/60 rounded px-2 py-1.5"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                conn.skillPost.type === "OFFER"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {conn.skillPost.type === "OFFER" ? (
                                <span className="flex items-center gap-1">
                                  <Briefcase className="w-3 h-3" />
                                  Offer
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" />
                                  Ask
                                </span>
                              )}
                            </span>
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {conn.skillPost.title}
                            </h3>
                          </div>
                          {conn.acceptedAt && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(conn.acceptedAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </span>
                            </div>
                          )}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMyMessage = user?.id === msg.sender.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-2xl ${
                      isMyMessage
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                    }`}
                  >
                    {!isMyMessage && (
                      <p className="text-xs font-semibold mb-1 text-gray-600">
                        {otherUserInfo?.username}
                      </p>
                    )}
                    <p className="text-sm break-words">{msg.content}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              disabled={isSending}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
