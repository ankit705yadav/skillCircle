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
    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/skills`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title, description, type: "ASK" }),
        },
      );

      if (!response.ok) {
        // Try to decode error response from the server
        let errorMsg = "Failed to create offer.";
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorMsg = `Error: ${errorData.message}`;
          }
        } catch (err) {
          // Could not parse JSON, keep generic error
        }
        alert(errorMsg);
        return;
      }

      alert("Offer created successfully!");
      setTitle("");
      setDescription("");
    } catch (error: any) {
      // Network errors or unexpected errors
      alert(
        `Network error, please try again later. Details: ${error?.message || error}`,
      );
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        mt: 4,
        backgroundColor: "#f2f2f2",
        padding: 2,
        borderRadius: 2,
        boxShadow: 2,
        border: 1,
        borderColor: "#ccc",
        borderWidth: 1,
        borderStyle: "solid",
        borderRightWidth: 2,
        borderLeftWidth: 2,
        borderRightColor: "#ccc",
        borderLeftColor: "#ccc",
        borderRightStyle: "solid",
        borderLeftStyle: "solid",
      }}
    >
      <Typography variant="h5">Request a Skill</Typography>
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
        Post Ask
      </Button>
    </Box>
  );
}
