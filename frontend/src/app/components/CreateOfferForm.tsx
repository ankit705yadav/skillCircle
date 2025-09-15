"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { TextField, Button, Box, Typography } from "@mui/material";

export default function CreateOfferForm() {
  const { getToken } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = await getToken();

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/skills`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, type: "OFFER" }),
      },
    );

    if (response.ok) {
      alert("Offer created successfully!");
      // Optionally, clear form or redirect
      setTitle("");
      setDescription("");
    } else {
      alert("Failed to create offer.");
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
      <Typography variant="h5">Share a Skill</Typography>
      <TextField
        fullWidth
        label="Skill Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        margin="normal"
        required
      />
      <TextField
        fullWidth
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        margin="normal"
        multiline
        rows={4}
        required
      />
      <Button type="submit" variant="contained" sx={{ mt: 2 }}>
        Create Offer
      </Button>
    </Box>
  );
}
