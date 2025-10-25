"use client";

import { useAuth, useUser } from "@clerk/nextjs";
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
import { useWebSocket } from "@/lib/contexts/WebSocketContext";

export default function ChatPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const otherUserId = decodeURIComponent(params.userId as string);
  const [messages, setMessages] = useState<any[]>([]);
  const [userConnections, setUserConnections] = useState<any[]>([]);
  const [otherUserInfo, setOtherUserInfo] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isSkillsExpanded, setIsSkillsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { subscribeToConnection, isConnected } = useWebSocket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!otherUserId) return;

    const fetchData = async () => {
      const token = await getToken();
      try {
        // Fetch all connections
        const connectionsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/connections/active`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (connectionsResponse.ok) {
          const allConnections = await connectionsResponse.json();

          // Filter connections with the specific user
          const connectionsWithUser = allConnections.filter((conn: any) => {
            const otherUser =
              user?.id === conn.requester.clerkUserId
                ? conn.approver
                : conn.requester;
            return otherUser.clerkUserId === otherUserId;
          });

          setUserConnections(connectionsWithUser);

          if (connectionsWithUser.length > 0) {
            // Set other user info from first connection
            const firstConn = connectionsWithUser[0];
            const otherUser =
              user?.id === firstConn.requester.clerkUserId
                ? firstConn.approver
                : firstConn.requester;
            setOtherUserInfo(otherUser);

            // Fetch messages from all connections with this user
            const allMessages: any[] = [];

            for (const conn of connectionsWithUser) {
              const messagesResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/connections/${conn.id}/messages`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                },
              );
              if (messagesResponse.ok) {
                const msgs = await messagesResponse.json();
                // Tag each message with its connection info for display
                const taggedMsgs = msgs.map((msg: any) => ({
                  ...msg,
                  connectionId: conn.id,
                  skillPost: conn.skillPost,
                }));
                allMessages.push(...taggedMsgs);
              }
            }

            // Sort all messages by timestamp
            allMessages.sort(
              (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime(),
            );

            setMessages(allMessages);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load chat");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [otherUserId, getToken, user?.id]);

  // Subscribe to real-time messages for all connections with this user
  useEffect(() => {
    if (userConnections.length === 0 || !isConnected) return;

    const unsubscribes: (() => void)[] = [];

    userConnections.forEach((conn) => {
      const unsubscribe = subscribeToConnection(
        Number(conn.id),
        (newMessage) => {
          setMessages((prev) => {
            // Check if message already exists to avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) {
              return prev;
            }
            // Only add if it's from the other person (not us)
            if (newMessage.sender.clerkUserId !== user?.id) {
              // Tag the message with connection info
              const taggedMessage = {
                ...newMessage,
                connectionId: conn.id,
                skillPost: conn.skillPost,
              };
              // Insert in correct chronological order
              const newMessages = [...prev, taggedMessage].sort(
                (a, b) =>
                  new Date(a.timestamp).getTime() -
                  new Date(b.timestamp).getTime(),
              );
              return newMessages;
            }
            return prev;
          });
        },
      );
      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [userConnections, isConnected, subscribeToConnection, user?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || userConnections.length === 0) return;

    setIsSending(true);
    const messageContent = newMessage;
    setNewMessage("");

    // Use the most recent connection (first in the sorted array)
    const primaryConnection = userConnections[0];

    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/connections/${primaryConnection.id}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: messageContent }),
        },
      );

      if (response.ok) {
        const newMsg = await response.json();
        // Tag the message with connection info
        const taggedMessage = {
          ...newMsg,
          connectionId: primaryConnection.id,
          skillPost: primaryConnection.skillPost,
        };
        setMessages((prev) => [...prev, taggedMessage]);
      } else {
        toast.error("Failed to send message");
        setNewMessage(messageContent); // Restore the message
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
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
                    {/* Sort connections by acceptedAt to show latest first */}
                    {(() => {
                      const sortedConnections = [...userConnections].sort(
                        (a, b) =>
                          new Date(b.acceptedAt).getTime() -
                          new Date(a.acceptedAt).getTime(),
                      );
                      const connectionsToShow = isSkillsExpanded
                        ? sortedConnections
                        : [sortedConnections[0]];

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
              const isMyMessage = user?.id === msg.sender.clerkUserId;
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
                        {msg.sender.generatedUsername}
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
