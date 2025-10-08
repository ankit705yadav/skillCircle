"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, Check, X, UserPlus, Inbox } from "lucide-react";

export default function NotificationsPage() {
  const { getToken } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/connections/notifications`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
      setIsLoading(false);
    };
    fetchNotifications();
  }, [getToken]);

  const handleResponse = async (
    connectionId: number,
    action: "accept" | "reject",
  ) => {
    const token = await getToken();

    toast.promise(
      (async () => {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/connections/${connectionId}/${action}`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!response.ok) {
          throw new Error(`Failed to ${action} request`);
        }

        // Remove the handled notification from the list
        setNotifications((prev) =>
          prev.filter((notif) => notif.id !== connectionId),
        );
      })(),
      {
        loading: `${action === "accept" ? "Accepting" : "Rejecting"} request...`,
        success: `Request ${action === "accept" ? "accepted" : "rejected"} successfully!`,
        error: (err) => err.message || "Failed to process request",
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading notifications...</p>
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
            <Bell className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Connection Requests
            </h1>
          </div>
          <p className="text-gray-600">
            Manage your incoming connection requests
          </p>
        </div>

        {/* Notifications Count Badge */}
        {notifications.length > 0 && (
          <div className="mb-6">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
              {notifications.length} pending{" "}
              {notifications.length === 1 ? "request" : "requests"}
            </span>
          </div>
        )}

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <Inbox className="w-20 h-20 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No pending requests
            </h3>
            <p className="text-gray-500">
              You're all caught up! New connection requests will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar/Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserPlus className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-grow">
                    <p className="text-gray-800 leading-relaxed">
                      <span className="font-semibold text-gray-900">
                        {notif.requester.generatedUsername}
                      </span>{" "}
                      wants to connect about your post:{" "}
                      <span className="font-semibold text-blue-600">
                        "{notif.skillPost.title}"
                      </span>
                    </p>

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleResponse(notif.id, "accept")}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm"
                      >
                        <Check className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleResponse(notif.id, "reject")}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
