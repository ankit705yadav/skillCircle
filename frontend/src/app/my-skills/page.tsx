"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, Archive, Inbox, Loader2 } from "lucide-react";

interface Skill {
  id: number;
  title: string;
  description: string;
  type: "OFFER" | "ASK";
  posterImageUrl?: string;
  archived: boolean;
}

export default function MySkillsPage() {
  const { getToken } = useAuth();
  const [mySkills, setMySkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMySkills = async () => {
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/skills/my-skills`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (response.ok) {
          const data = await response.json();
          setMySkills(data);
        } else {
          setError("Failed to load your skills.");
        }
      } catch (err) {
        setError("An error occurred while fetching your skills.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMySkills();
  }, [getToken]);

  const handleArchive = async (skillId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to archive this post? It will be hidden from public view.",
    );

    if (!confirmed) {
      return;
    }

    const token = await getToken();

    toast.promise(
      (async () => {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/skills/${skillId}/archive`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to archive post");
        }

        // ✅ Update the post's state instead of removing it
        setMySkills((prevSkills) =>
          prevSkills.map((skill) =>
            skill.id === skillId ? { ...skill, archived: true } : skill,
          ),
        );
      })(),
      {
        loading: "Archiving post...",
        success: "Post archived successfully!",
        error: (err) => err.message || "An error occurred. Please try again.",
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading your posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">My Skill Posts</h1>
          </div>
          <p className="text-gray-600">Manage your offers and requests</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg">
            {error}
          </div>
        )}

        {/* Posts Count Badge */}
        {mySkills.length > 0 && (
          <div className="mb-6 flex gap-3">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
              {mySkills.filter((s) => !s.archived).length} active
            </span>
            {mySkills.filter((s) => s.archived).length > 0 && (
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
                {mySkills.filter((s) => s.archived).length} archived
              </span>
            )}
          </div>
        )}

        {/* Empty State */}
        {mySkills.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <Inbox className="w-20 h-20 text-gray-300" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No posts yet
            </h3>
            <p className="text-gray-500">
              You haven't posted any skills yet. Create your first post to get
              started!
            </p>
          </div>
        ) : (
          /* Posts Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...mySkills]
              .sort((a, b) => (a.archived === b.archived ? 0 : a.archived ? 1 : -1))
              .map((skill) => (
              <div
                key={skill.id}
                className={`bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col ${
                  skill.archived ? "opacity-60" : ""
                }`}
              >
                {/* Image */}
                {skill.posterImageUrl && (
                  <div className="h-40 overflow-hidden bg-gray-100">
                    <img
                      src={skill.posterImageUrl}
                      alt={skill.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="p-4 flex-grow">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {skill.title}
                    </h3>
                  </div>

                  {/* Tags */}
                  <div className="flex gap-2 mb-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                        skill.type === "OFFER"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {skill.type}
                    </span>
                    {skill.archived && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800">
                        Archived
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-3">
                    {skill.description}
                  </p>
                </div>

                {/* Actions */}
                {!skill.archived && (
                  <div className="p-4 pt-0">
                    <button
                      onClick={() => handleArchive(skill.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      <Archive className="w-4 h-4" />
                      Archive
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
