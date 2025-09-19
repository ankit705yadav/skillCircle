"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { TextField, Button, Box, Typography, Alert } from "@mui/material";
import ImageUpload from "./ImageUpload";

export default function CreateOfferForm({ onPostSuccess }) {
  const { getToken } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posterImageUrl, setPosterImageUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null); // Clear previous errors at the start

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
          body: JSON.stringify({
            title,
            description,
            posterImageUrl,
            type: "ASK",
          }),
        },
      );

      // If the server responds with an error (e.g., 400 for moderation)
      if (!response.ok) {
        // Get the error message from the backend's JSON response
        const errorData = await response.json();
        // Throw an error to be caught by the catch block
        throw new Error(errorData.error || "An error occurred on the server.");
      }

      // This part only runs if the response was successful
      alert("Offer created successfully!");
      setTitle("");
      setDescription("");
      onPostSuccess();
    } catch (error: any) {
      // This catches both network errors (from fetch) and the API errors we throw
      console.error("Submission failed:", error);
      setError(error.message); // Set the error state to display in the UI's <Alert>
    } finally {
      // This block runs ALWAYS, whether the try succeeded or the catch was triggered
      setIsLoading(false); // Ensure the loading spinner is always turned off
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
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      <Typography variant="h5">Request a Skill</Typography>
      <ImageUpload onUploadSuccess={(url) => setPosterImageUrl(url)} />
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
