"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { toast } from "sonner";
import SkillCard from "./skillCard/SkillCard";

export default function NearbySkills({ skills, isLoading, user }) {
  const { getToken } = useAuth();
  const [selectedSkill, setSelectedSkill] = useState<any | null>(null);

  const handleRequestConnection = async (skillId: number) => {
    const token = await getToken();
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/connections`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ skillPostId: skillId }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to send request.");
      }

      toast.success("Request sent successfully!");
      setSelectedSkill(null); // close modal after request
    } catch (error: any) {
      console.error("Connection request failed:", error);
      toast.error(error.message || "Failed to send connection request");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 text-lg">Discovering nearby skills...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-10">
        {/* ---------- OFFERS ---------- */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Skills Offered</h2>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {
                skills.filter(
                  (skill) =>
                    skill.type === "OFFER" &&
                    skill.archived === false &&
                    user?.id !== skill.author.clerkUserId,
                ).length
              }
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {skills
              .filter(
                (skill) =>
                  skill.type === "OFFER" &&
                  skill.archived === false &&
                  user?.id !== skill.author.clerkUserId,
              )
              .map((skill: any) => (
                <div
                  key={skill.id}
                  onClick={() => setSelectedSkill(skill)}
                  className="cursor-pointer transform transition-transform duration-200 hover:scale-105"
                >
                  <SkillCard
                    skill={skill}
                    user={user}
                    handleRequestConnection={() =>
                      handleRequestConnection(skill.id)
                    }
                  />
                </div>
              ))}
          </div>

          {skills.filter(
            (skill) =>
              skill.type === "OFFER" &&
              skill.archived === false &&
              user?.id !== skill.author.clerkUserId,
          ).length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No offers available nearby
            </p>
          )}
        </section>

        {/* ---------- REQUESTS ---------- */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-3xl font-bold text-gray-800">
              Skills Requested
            </h2>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              {
                skills.filter(
                  (skill) =>
                    skill.type === "ASK" &&
                    skill.archived === false &&
                    user?.id !== skill.author.clerkUserId,
                ).length
              }
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {skills
              .filter(
                (skill) =>
                  skill.type === "ASK" &&
                  skill.archived === false &&
                  user?.id !== skill.author.clerkUserId,
              )
              .map((skill: any) => (
                <div
                  key={skill.id}
                  onClick={() => setSelectedSkill(skill)}
                  className="cursor-pointer transform transition-transform duration-200 hover:scale-105"
                >
                  <SkillCard
                    skill={skill}
                    user={user}
                    handleRequestConnection={() =>
                      handleRequestConnection(skill.id)
                    }
                  />
                </div>
              ))}
          </div>

          {skills.filter(
            (skill) =>
              skill.type === "ASK" &&
              skill.archived === false &&
              user?.id !== skill.author.clerkUserId,
          ).length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No requests available nearby
            </p>
          )}
        </section>
      </div>

      {/* ---------- MODAL ---------- */}
      {selectedSkill && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4"
          onClick={() => setSelectedSkill(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-64 overflow-hidden">
              <img
                className="w-full h-full object-cover"
                src={
                  selectedSkill.posterImageUrl || "https://placehold.co/600x400"
                }
                alt={selectedSkill.title}
              />
              <div className="absolute top-4 right-4">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedSkill.type === "OFFER"
                      ? "bg-blue-500 text-white"
                      : "bg-green-500 text-white"
                  }`}
                >
                  {selectedSkill.type === "OFFER" ? "Offer" : "Request"}
                </span>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedSkill.title}
              </h3>
              <p className="text-gray-600 mb-4">{selectedSkill.description}</p>
              <div className="flex items-center gap-2 mb-6">
                <span className="text-sm font-medium text-gray-700">
                  Posted by:
                </span>
                <span className="text-sm text-gray-900 font-semibold">
                  {selectedSkill.author?.username}
                </span>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setSelectedSkill(null)}
                  className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleRequestConnection(selectedSkill.id)}
                  className={`px-5 py-2 rounded-lg text-white font-medium transition-colors ${
                    selectedSkill.type === "OFFER"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  Request Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
