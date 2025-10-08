"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  User,
  ChevronRight,
  MessageSquare,
  Inbox,
} from "lucide-react";

interface Author {
  clerkUserId: string;
  username: string;
}
interface SkillPost {
  title: string;
}
interface Connection {
  id: number;
  skillPost: SkillPost;
  requester: Author;
  approver: Author;
}

export default function ChatsPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActiveConnections = async () => {
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/connections/active`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (response.ok) {
          const data = await response.json();
          setConnections(data);
        }
      } catch (error) {
        console.error("Failed to fetch active connections:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveConnections();
  }, [getToken]);

  const handleConnectionClick = (connectionId: number) => {
    router.push(`/chats/${connectionId}`);
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
        {connections.length > 0 && (
          <div className="mb-6">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
              {connections.length} active{" "}
              {connections.length === 1 ? "conversation" : "conversations"}
            </span>
          </div>
        )}

        {/* Conversations List */}
        {connections.length === 0 ? (
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
            {connections.map((connection, index) => {
              const otherUser =
                user?.id === connection.requester.clerkUserId
                  ? connection.approver
                  : connection.requester;

              return (
                <div key={connection.id}>
                  <button
                    onClick={() => handleConnectionClick(connection.id)}
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
                            {otherUser.username}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MessageSquare className="w-4 h-4 flex-shrink-0" />
                          <p className="truncate">
                            Regarding: {connection.skillPost.title}
                          </p>
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex-shrink-0">
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </div>
                  </button>

                  {/* Divider */}
                  {index < connections.length - 1 && (
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
