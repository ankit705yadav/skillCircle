"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, MessageSquare, Star, PlusCircle, LogOut } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRealtime } from "@/lib/contexts/RealtimeContext";

export default function Header() {
  const { user, profile, signOut } = useAuth();
  const { unreadCount, unreadMessagesCount } = useRealtime();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="flex items-center justify-between bg-white border border-gray-200 rounded-xl shadow-md px-6 py-3 mb-6 mt-4">
      {/* Logo */}
      <Link
        href="/"
        className="text-xl font-bold text-gray-800 hover:text-blue-600 transition"
      >
        Skill Circle
      </Link>

      {/* Navigation */}
      <nav className="flex items-center gap-6">
        <Link
          href="/create-post"
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="hidden sm:inline">Create Post</span>
        </Link>

        <Link
          href="/notifications"
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition relative"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="hidden sm:inline">Notifications</span>
        </Link>

        <Link
          href="/chats"
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition relative"
        >
          <MessageSquare className="w-5 h-5" />
          {unreadMessagesCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
            </span>
          )}
          <span className="hidden sm:inline">Chats</span>
        </Link>

        <Link
          href="/my-skills"
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
        >
          <Star className="w-5 h-5" />
          <span className="hidden sm:inline">My Skills</span>
        </Link>
      </nav>

      {/* Auth */}
      <div>
        {user ? (
          <div className="flex items-center gap-3">
            {profile?.username && (
              <span className="text-sm font-medium text-gray-700">
                {profile.username}
              </span>
            )}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        ) : (
          <Link
            href="/sign-in"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium shadow transition"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
