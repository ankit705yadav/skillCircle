"use client";

import { useState, useEffect } from "react";
import * as nsfwjs from "nsfwjs";
import { useAuth } from "@clerk/nextjs";
import "./ImageUpload.css";

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
    <div className="image-upload-container">
      <label className="image-upload-label">Add a Poster (Optional)</label>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={status === "moderating" || status === "uploading"}
      />

      {/* Show loader during moderation OR upload */}
      {(status === "moderating" || status === "uploading") && (
        <div className="loader-container">
          <div className="loader"></div>
          <p>{status === "moderating" ? "Analyzing..." : "Uploading..."}</p>
        </div>
      )}

      {preview && <img src={preview} alt="Preview" className="image-preview" />}

      {/* Show Upload button only when moderation is done and successful */}
      {file && status === "idle" && (
        <button type="button" className="upload-button" onClick={handleUpload}>
          Upload Image
        </button>
      )}

      {status === "success" && (
        <div className="alert alert-success">Image attached!</div>
      )}
      {error && <div className="alert alert-error">{error}</div>}
    </div>
  );
}
