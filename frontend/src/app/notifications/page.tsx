"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";

export default function NotificationsPage() {
  const { getToken } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/connections/notifications`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
      setIsLoading(false);
    };
    fetchNotifications();
  }, [getToken]);

  const handleResponse = async (
    connectionId: number,
    action: "accept" | "reject",
  ) => {
    const token = await getToken();
    await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/connections/${connectionId}/${action}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    // Remove the handled notification from the list
    setNotifications((prev) =>
      prev.filter((notif) => notif.id !== connectionId),
    );
  };

  if (isLoading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Your Requests
      </Typography>
      {notifications.length === 0 ? (
        <Typography>No pending requests.</Typography>
      ) : (
        notifications.map((notif) => (
          <Card key={notif.id} sx={{ mb: 2 }}>
            <CardContent>
              <Typography>
                User <strong>{notif.requester.generatedUsername}</strong> wants
                to connect about your post:{" "}
                <strong>"{notif.skillPost.title}"</strong>.
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleResponse(notif.id, "accept")}
                >
                  Accept
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  sx={{ ml: 1 }}
                  onClick={() => handleResponse(notif.id, "reject")}
                >
                  Reject
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
}
