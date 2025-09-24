"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
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

      alert("Request sent successfully!");
      setSelectedSkill(null); // close modal after request
    } catch (error: any) {
      console.error("Connection request failed:", error);
      alert(error.message);
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 10,
          alignItems: "center",
        }}
      >
        <p>Waiting for location and skills...</p>
      </div>
    );
  }

  return (
    <>
      <h2> Nearby Skills</h2>

      {/* ---------- OFFERS ---------- */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 20,
          flexWrap: "wrap",
          rowGap: 20,
        }}
      >
        {skills
          .filter(
            (skill) =>
              skill.type === "OFFER" &&
              skill.archived === false &&
              user?.id !== skill.author.clerkUserId,
          )
          .map((skill: any) => (
            <div key={skill.id} onClick={() => setSelectedSkill(skill)}>
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

      {/* ---------- REQUESTS ---------- */}
      <div
        style={{
          marginTop: 30,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 20,
          flexWrap: "wrap",
          rowGap: 20,
        }}
      >
        {skills
          .filter(
            (skill) =>
              skill.type === "ASK" &&
              skill.archived === false &&
              user?.id !== skill.author.clerkUserId,
          )
          .map((skill: any) => (
            <div key={skill.id} onClick={() => setSelectedSkill(skill)}>
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

      {/* ---------- SIMPLE MODAL ---------- */}
      {selectedSkill && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            width: "100vw",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setSelectedSkill(null)} // close on backdrop click
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              width: "400px",
              maxWidth: "90%",
            }}
            onClick={(e) => e.stopPropagation()} // prevent modal close on content click
          >
            <img
              style={{ width: "100%" }}
              src={
                selectedSkill.posterImageUrl || "https://placehold.co/600x400"
              }
              alt={selectedSkill.title}
            />
            <h3>{selectedSkill.title}</h3>
            <p>{selectedSkill.description}</p>
            <p>
              <strong>Posted by:</strong> {selectedSkill.author?.username}
            </p>
            <div
              style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button onClick={() => setSelectedSkill(null)}>Close</button>
              <button
                onClick={() => handleRequestConnection(selectedSkill.id)}
                style={{
                  backgroundColor: "#0070f3",
                  color: "white",
                  padding: "6px 12px",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Request Connection
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
