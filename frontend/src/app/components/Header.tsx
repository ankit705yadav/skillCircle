import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { Bell, MessageSquare, Star } from "lucide-react";

export default function Header() {
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
          href="/notifications"
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600 transition"
        >
          <Bell className="w-5 h-5" />
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
