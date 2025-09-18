"use client";

import { useAuth } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Box, TextField, Button, Typography, Paper } from "@mui/material";

export default function ChatPage() {
  const { getToken } = useAuth();
  const params = useParams();
  const connectionId = params.connectionId as string;
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    if (!connectionId) return;

    const fetchMessages = async () => {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/connections/${connectionId}/messages`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        setMessages(await response.json());
      }
    };

    fetchMessages();
    // Implement WebSockets to get new messages in real-time
  }, [connectionId, getToken]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await getToken();
    await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/connections/${connectionId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMessage }),
      },
    );
    setNewMessage("");
    // Re-fetch messages after sending
    // (This is where real-time updates would be better)
  };

  return (
    <Box>
      <Typography variant="h5">Chat</Typography>
      <Paper sx={{ p: 2, my: 2, height: "60vh", overflowY: "auto" }}>
        {messages.map((msg) => (
          <Box key={msg.id} sx={{ mb: 1 }}>
            <strong>{msg.sender.generatedUsername}:</strong> {msg.content}
          </Box>
        ))}
      </Paper>
      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{ display: "flex" }}
      >
        <TextField
          fullWidth
          variant="outlined"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <Button type="submit" variant="contained">
          Send
        </Button>
      </Box>
    </Box>
  );
}
