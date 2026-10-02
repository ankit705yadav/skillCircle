"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  User,
  ChevronRight,
  Inbox,
  Briefcase,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRealtime } from "@/lib/contexts/RealtimeContext";
import {
  fetchActiveConnections,
  type Author,
  type Connection,
} from "@/lib/supabase/queries";

interface GroupedChat {
  otherUser: Author;
  connections: Connection[];
  latestAcceptedAt: string;
}

export default function ChatsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { clearMessagesCount } = useRealtime();
  const [groupedChats, setGroupedChats] = useState<GroupedChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Clear unread messages count when user visits chats page
    clearMessagesCount();
  }, [clearMessagesCount]);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadConversations = async () => {
      try {
        const data = await fetchActiveConnections();
        // Group connections by other user
        const grouped = new Map<string, GroupedChat>();

        data.forEach((connection) => {
          const otherUser =
            user.id === connection.requester.id
              ? connection.approver
              : connection.requester;

          const userId = otherUser.id;

          if (grouped.has(userId)) {
            const existing = grouped.get(userId)!;
            existing.connections.push(connection);
            // Update latest accepted date if this one is more recent
            const acceptedAt = connection.acceptedAt ?? connection.createdAt;
            if (new Date(acceptedAt) > new Date(existing.latestAcceptedAt)) {
              existing.latestAcceptedAt = acceptedAt;
            }
          } else {
            grouped.set(userId, {
              otherUser,
              connections: [connection],
              latestAcceptedAt: connection.acceptedAt ?? connection.createdAt,
            });
          }
        });

        // Convert to array and sort by latest accepted date
        const groupedArray = Array.from(grouped.values()).sort(
          (a, b) =>
            new Date(b.latestAcceptedAt).getTime() -
            new Date(a.latestAcceptedAt).getTime(),
        );

        setGroupedChats(groupedArray);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, [user]);

  const handleChatClick = (otherUserId: string) => {
    router.push(`/chats/${encodeURIComponent(otherUserId)}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Messages</h1>
          </div>
          <p className="text-gray-600">Your active conversations</p>
        </div>

        {/* Conversations Count Badge */}
        {groupedChats.length > 0 && (
          <div className="mb-6">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
              {groupedChats.length} active{" "}
              {groupedChats.length === 1 ? "conversation" : "conversations"}
            </span>
          </div>
        )}

        {/* Conversations List */}
        {groupedChats.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <Inbox className="w-20 h-20 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No conversations yet
            </h3>
            <p className="text-gray-500">
              Start connecting with others to begin chatting!
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
            {groupedChats.map((chat, index) => {
              return (
                <div key={chat.otherUser.id}>
                  <button
                    onClick={() => handleChatClick(chat.otherUser.id)}
                    className="w-full px-6 py-4 hover:bg-gray-50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {chat.otherUser.username}
                          </h3>
                          {chat.connections.length > 1 && (
                            <span className="px-3 py-1 text-sm font-semibold rounded-full bg-purple-600 text-white">
                              {chat.connections.length} posts
                            </span>
                          )}
                        </div>
                        {/* Show only the most recent offer */}
                        {(() => {
                          // Sort connections by acceptedAt to get the latest
                          const latestConnection = [...chat.connections].sort(
                            (a, b) =>
                              new Date(b.acceptedAt ?? 0).getTime() -
                              new Date(a.acceptedAt ?? 0).getTime(),
                          )[0];

                          return (
                            <div className="flex items-start gap-2">
                              <span
                                className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                                  latestConnection.skillPost.type === "OFFER"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-blue-100 text-blue-700"
                                }`}
                              >
                                {latestConnection.skillPost.type === "OFFER" ? (
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
                              <div className="flex-grow min-w-0">
                                <p className="text-sm text-gray-700 truncate">
                                  offer by {latestConnection.skillPost.title}
                                </p>
                                {latestConnection.acceptedAt && (
                                  <p className="text-xs text-gray-500">
                                    {new Date(
                                      latestConnection.acceptedAt,
                                    ).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Arrow */}
                      <div className="flex-shrink-0">
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </div>
                  </button>

                  {/* Divider */}
                  {index < groupedChats.length - 1 && (
                    <div className="border-b border-gray-200"></div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
