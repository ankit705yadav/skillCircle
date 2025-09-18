"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Divider,
} from "@mui/material";

interface Author {
  clerkUserId: string;
  username: string;
}
interface SkillPost {
  title: string;
}
interface Connection {
  id: number;
  skillPost: SkillPost;
  requester: Author;
  approver: Author;
}

export default function ChatsPage() {
  const { getToken } = useAuth();
  const { user } = useUser(); // Get the current logged-in user
  const router = useRouter();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActiveConnections = async () => {
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/connections/active`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (response.ok) {
          const data = await response.json();
          setConnections(data);
        }
      } catch (error) {
        console.error("Failed to fetch active connections:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveConnections();
  }, [getToken]);

  const handleConnectionClick = (connectionId: number) => {
    router.push(`/chats/${connectionId}`);
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
        Your Active Conversations
      </Typography>
      {connections.length === 0 ? (
        <Typography>You have no active conversations yet.</Typography>
      ) : (
        <List sx={{ bgcolor: "background.paper" }}>
          {connections.map((connection) => {
            // Logic to determine who the "other person" in the chat is
            const otherUser =
              user?.id === connection.requester.clerkUserId
                ? connection.approver
                : connection.requester;

            return (
              <div key={connection.id}>
                <ListItem disablePadding>
                  <ListItemButton
                    onClick={() => handleConnectionClick(connection.id)}
                  >
                    <ListItemText
                      primary={`Chat with ${otherUser.username}`}
                      secondary={`Regarding: ${connection.skillPost.title}`}
                    />
                  </ListItemButton>
                </ListItem>
                <Divider />
              </div>
            );
          })}
        </List>
      )}
    </Box>
  );
}
