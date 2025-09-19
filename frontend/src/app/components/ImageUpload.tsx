"use client";

import { useState, useRef } from "react";
import * as nsfwjs from "nsfwjs";
import { Box, Typography, Alert, CircularProgress } from "@mui/material";
import { IKContext, IKUpload } from "imagekitio-react";
import { useAuth } from "@clerk/nextjs";

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
}

// Pre-load the model once to make moderation faster after the first time.
let modelPromise: Promise<nsfwjs.NSFWJS>;
function loadModel() {
  if (!modelPromise) {
    modelPromise = nsfwjs.load();
  }
  return modelPromise;
}

export default function ImageUpload({ onUploadSuccess }: ImageUploadProps) {
  const { getToken } = useAuth();
  const [status, setStatus] = useState<
    "idle" | "moderating" | "uploading" | "success"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null); // To hold the upload controller

  const authenticator = async () => {
    try {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/imagekit/auth`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!response.ok) throw new Error("Authentication failed");
      return await response.json();
    } catch (err) {
      console.error("Authentication request failed:", err);
      throw err;
    }
  };

  // ✅ This function is now the main trigger
  const handleFileSelect = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const file = evt.target.files?.[0];
    if (!file) return;

    setError(null);
    setStatus("moderating");
    setPreview(URL.createObjectURL(file));

    moderateImage(file);
  };

  const moderateImage = async (file: File) => {
    try {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file); // Create object URL from the correct file object
      await img.decode();

      const model = await loadModel();
      const predictions = await model.classify(img);

      const inappropriate = predictions.find(
        (p) =>
          (p.className === "Porn" || p.className === "Hentai") &&
          p.probability > 0.7,
      );

      if (inappropriate) {
        // If inappropriate, abort the upload if it has started
        xhrRef.current?.abort();
        setError("Image rejected: Inappropriate content detected.");
        setStatus("idle");
        setPreview(null);
      } else {
        // If safe, we just let the upload continue. We can update the status.
        setStatus("uploading");
      }
    } catch (err) {
      xhrRef.current?.abort();
      setError("Content moderation failed. Please try again.");
      setStatus("idle");
      setPreview(null);
    }
  };

  const handleSuccess = (res: any) => {
    setStatus("success");
    onUploadSuccess(res.url);
  };

  const handleError = (err: any) => {
    // This will also catch the "abort" error, so we only show our custom message.
    if (status !== "idle") {
      console.error("Upload error:", err);
      setError("Upload failed. Please try again.");
      setStatus("idle");
    }
  };

  return (
    <Box my={2}>
      <Typography variant="subtitle1">Add a Poster (Optional)</Typography>

      <IKContext
        publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY}
        urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}
        authenticator={authenticator}
      >
        <IKUpload
          fileName="poster.jpg"
          onChange={handleFileSelect} // Use onChange to get the file
          onUploadStart={(evt) =>
            (xhrRef.current = evt.target as XMLHttpRequest)
          } // Use onUploadStart to get the controller
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </IKContext>

      {status === "moderating" && (
        <CircularProgress size={20} sx={{ display: "block", mt: 1, mb: 1 }} />
      )}
      {preview && status !== "idle" && (
        <img
          src={preview}
          alt="Preview"
          width={200}
          style={{ marginTop: "10px" }}
        />
      )}

      {status === "success" && (
        <Alert severity="success" sx={{ mt: 1 }}>
          Image attached!
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
