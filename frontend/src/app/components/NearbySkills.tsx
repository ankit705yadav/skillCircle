"use client";

import { useAuth } from "@clerk/nextjs";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  CardActions,
  Button,
} from "@mui/material";

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
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1.5 }}
                  >
                    by {skill.author.username}
                  </Typography>
                  <Typography>{skill.description}</Typography>
                  <Typography variant="caption">{skill?.type}</Typography>
                </CardContent>
                {/* Conditional rendering for the button */}
                {user?.id !== skill.author.clerkUserId && (
                  <CardActions>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleRequestConnection(skill.id)}
                    >
                      {skill.type === "OFFER" ? "Request Help" : "Offer Help"}
                    </Button>
                  </CardActions>
                )}
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
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1.5 }}
                  >
                    by {skill.author.username}
                  </Typography>
                  <Typography>{skill.description}</Typography>
                  <Typography variant="caption">{skill?.type}</Typography>
                </CardContent>
                {/* Conditional rendering for the button */}
                {user?.id !== skill.author.clerkUserId && (
                  <CardActions>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleRequestConnection(skill.id)}
                    >
                      {skill.type === "OFFER" ? "Request Help" : "Offer Help"}
                    </Button>
                  </CardActions>
                )}
              </Card>
            ))}
        </Box>
      </div>
    </>
  );
}
