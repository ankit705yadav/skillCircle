"use client";

import { useAuth } from "@clerk/nextjs";
import SkillCard from "./skillCard/SkillCard";

export default function NearbySkills({ skills, isLoading, user }) {
  const { getToken } = useAuth();

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
      // Optionally, you could disable the button after a successful request
    } catch (error) {
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
          .filter((skill) => skill.type === "OFFER")
          .map((skill: any) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              user={user}
              handleRequestConnection={() => handleRequestConnection(skill.id)}
            />
          ))}
      </div>

      {/* ---------- ASKS ---------- */}
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
          .filter((skill) => skill.type === "ASK")
          .map((skill: any) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              user={user}
              handleRequestConnection={() => handleRequestConnection(skill.id)}
            />
          ))}
      </div>
    </>
  );
}
