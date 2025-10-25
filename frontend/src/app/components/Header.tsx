"use client";

import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { Bell, MessageSquare, Star, PlusCircle } from "lucide-react";
import { useWebSocket } from "@/lib/contexts/WebSocketContext";

export default function Header() {
  const { unreadCount } = useWebSocket();
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
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
        >
          <MessageSquare className="w-5 h-5" />
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
        <SignedOut>
          <SignInButton mode="modal">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium shadow transition">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </header>
  );
}
