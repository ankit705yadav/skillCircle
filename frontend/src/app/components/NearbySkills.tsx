"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from "@mui/material";

interface Skill {
  id: number;
  title: string;
  description: string;
  type: "OFFER" | "ASK";
  author: {
    username: string;
  };
}

export default function NearbySkills() {
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn } = useUser();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // The "Guard Clause": Do nothing if Clerk is not ready or the user is not signed in.
    if (!isLoaded || !isSignedIn) {
      return;
    }

    const fetchSkills = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const token = await getToken();

          // Another guard: if for some reason token is null, don't fetch
          if (!token) {
            setIsLoading(false);
            return;
          }

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/skills/nearby?lat=${latitude}&lon=${longitude}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          if (response.ok) {
            const data = await response.json();
            console.log("KKR:", data);
            setSkills(data);
          }
          setIsLoading(false); // Stop loading after fetch completes
        },
        (error) => {
          console.error("Geolocation error:", error);
          setIsLoading(false); // Stop loading on error
        },
      );
    };

    fetchSkills();
  }, [isLoaded, isSignedIn, getToken]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>
          Waiting for location and skills...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Typography variant="h4">Nearby Skills</Typography>
      <div
        style={{
          border: "4px solid green",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          gap: 2,
          flexWrap: "wrap",
        }}
      >
        {/* Your JSX for Offers and Asks remains the same */}
        {/* ---------- OFFERS ---------- */}
        <Box
          sx={{
            borderWidth: 1,
            borderColor: "primary.main",
            borderStyle: "solid",
            padding: 2,
            margin: 2,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 2,
          }}
        >
          <Typography variant="h6">Offers</Typography>
          {skills
            .filter((skill) => skill.type === "OFFER")
            .map((skill: any) => (
              <Card
                key={skill.id}
                sx={{ my: 2, backgroundColor: "#f5f5f5", maxWidth: "200px" }}
                variant="outlined"
              >
                <CardContent>
                  <Typography variant="h6">{skill.title}</Typography>
                  <Typography>{skill.description}</Typography>
                  <Typography variant="caption">{skill?.type}</Typography>
                </CardContent>
              </Card>
            ))}
        </Box>

        {/* ---------- ASKS ---------- */}
        <Box
          sx={{
            borderWidth: 1,
            borderColor: "primary.main",
            borderStyle: "solid",
            padding: 2,
            margin: 2,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: 2,
          }}
        >
          <Typography variant="h6">ASKS</Typography>
          {skills
            .filter((skill) => skill.type === "ASK")
            .map((skill: any) => (
              <Card
                key={skill.id}
                sx={{ my: 2, backgroundColor: "#f5f5f5", maxWidth: "200px" }}
                variant="outlined"
              >
                <CardContent>
                  <Typography variant="h6">{skill.title}</Typography>
                  <Typography>{skill.description}</Typography>
                  <Typography variant="caption">{skill?.type}</Typography>
                </CardContent>
              </Card>
            ))}
        </Box>
      </div>
    </>
  );
}
