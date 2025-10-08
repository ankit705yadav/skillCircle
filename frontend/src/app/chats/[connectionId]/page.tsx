"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ChatPage() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const connectionId = params.connectionId as string;
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!connectionId) return;

    const fetchMessages = async () => {
      const token = await getToken();
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/connections/${connectionId}/messages`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (response.ok) {
          setMessages(await response.json());
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        toast.error("Failed to load messages");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [connectionId, getToken]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const messageContent = newMessage;
    setNewMessage("");

    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/connections/${connectionId}/messages`,
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
        setMessages((prev) => [...prev, newMsg]);
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
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Chat</h1>
            <p className="text-sm text-gray-500">Connection #{connectionId}</p>
          </div>
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
