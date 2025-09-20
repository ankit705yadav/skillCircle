"use client";

import { useState, useEffect } from "react";
import * as nsfwjs from "nsfwjs";
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Button,
} from "@mui/material";
import { useAuth } from "@clerk/nextjs";

interface ImageUploadProps {
  onUploadSuccess: (url: string) => void;
}

let modelPromise: Promise<nsfwjs.NSFWJS>;
function loadModel() {
  if (!modelPromise) {
    modelPromise = nsfwjs.load();
  }
  return modelPromise;
}

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

export default function ImageUpload({ onUploadSuccess }: ImageUploadProps) {
  const { getToken } = useAuth();
  const [status, setStatus] = useState<
    "idle" | "moderating" | "uploading" | "success"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    loadModel();
  }, []);

  const authenticator = async () => {
    const token = await getToken();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/imagekit/auth`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!response.ok) throw new Error("Authentication failed");
    return response.json();
  };

  const handleFileSelect = async (evt: React.ChangeEvent<HTMLInputElement>) => {
    const f = evt.target.files?.[0];
    if (!f) return;

    setError(null);
    setStatus("moderating");
    const objectUrl = URL.createObjectURL(f);
    setPreview(objectUrl);
    setFile(f);

    try {
      const img = await loadImage(objectUrl);
      const model = await loadModel();
      const predictions = await model.classify(img);
      URL.revokeObjectURL(objectUrl);

      const inappropriate = predictions.find(
        (p) =>
          (p.className === "Porn" || p.className === "Hentai") &&
          p.probability > 0.7,
      );

      if (inappropriate) {
        setError("Image rejected: Inappropriate content detected.");
        setStatus("idle");
        setPreview(null);
        setFile(null);
        return;
      }

      setStatus("idle"); // ready to upload
    } catch (err) {
      setError("Content moderation failed. Please try again.");
      setStatus("idle");
      setPreview(null);
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus("uploading");
    try {
      const auth = await authenticator();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", "poster.jpg");
      formData.append(
        "publicKey",
        process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
      );
      formData.append("signature", auth.signature);
      formData.append("expire", auth.expire);
      formData.append("token", auth.token);

      const res = await fetch(
        "https://upload.imagekit.io/api/v1/files/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      setStatus("success");
      onUploadSuccess(data.url);
    } catch (err) {
      console.error("Upload error:", err);
      setError("Upload failed. Please try again.");
      setStatus("idle");
    }
  };

  return (
    <Box my={2}>
      <Typography variant="subtitle1">Add a Poster (Optional)</Typography>

      <input type="file" accept="image/*" onChange={handleFileSelect} />

      {status === "moderating" && (
        <CircularProgress size={20} sx={{ display: "block", mt: 1, mb: 1 }} />
      )}
      {preview && (
        <img
          src={preview}
          alt="Preview"
          width={200}
          style={{ marginTop: "10px" }}
        />
      )}

      {file && status === "idle" && (
        <Button variant="contained" onClick={handleUpload} sx={{ mt: 1 }}>
          Upload
        </Button>
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
