"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Alert,
  Chip,
} from "@mui/material";
// import ArchiveIcon from '@mui/icons-material/Archive';

// Define the Skill type to match your DTO
interface Skill {
  id: number;
  title: string;
  description: string;
  type: "OFFER" | "ASK";
  posterImageUrl?: string; // Optional image URL
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
    if (
      !window.confirm(
        "Are you sure you want to archive this post? It will be hidden from public view.",
      )
    ) {
      return;
    }

    const token = await getToken();
    try {
      // ✅ Use the new POST endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/skills/${skillId}/archive`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        // ✅ Update the post's state instead of removing it
        setMySkills((prevSkills) =>
          prevSkills.map((skill) =>
            skill.id === skillId ? { ...skill, archived: true } : skill,
          ),
        );
      } else {
        const errData = await response.json();
        alert(`Failed to archive post: ${errData.error}`);
      }
    } catch (err) {
      alert("An error occurred. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Skill Posts
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {mySkills.length === 0 && !isLoading && (
        <Typography>You haven't posted any skills yet.</Typography>
      )}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
        {mySkills.map((skill) => (
          // ✅ Visually change the card if it's archived
          <Card
            key={skill.id}
            sx={{
              width: 250,
              display: "flex",
              flexDirection: "column",
              opacity: skill.archived ? 0.6 : 1,
            }}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="h6">{skill.title}</Typography>
                {/* ✅ Show an "Archived" chip */}
                {skill.archived && <Chip label="Archived" size="small" />}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {skill.type}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {skill.description}
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: "flex-end" }}>
              {/* ✅ Show the archive button only if the post is not already archived */}
              {!skill.archived && (
                <IconButton
                  aria-label="archive"
                  onClick={() => handleArchive(skill.id)}
                >
                  {/*<ArchiveIcon />*/}
                  <h5>Archive</h5>
                </IconButton>
              )}
            </CardActions>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
