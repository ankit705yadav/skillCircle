"use client";

import { useState, useEffect } from "react";
import * as nsfwjs from "nsfwjs";
import { useAuth } from "@clerk/nextjs";
import { Upload, Image as ImageIcon, CheckCircle, Loader2, X } from "lucide-react";

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
    <div className="mb-6">
      <label className="block text-sm font-semibold text-gray-700 mb-3">
        Add a Poster (Optional)
      </label>

      {/* Custom File Input Button */}
      <div className="relative">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={status === "moderating" || status === "uploading"}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className={`flex items-center justify-center gap-3 w-full px-6 py-4 border-2 border-dashed rounded-lg transition-all cursor-pointer ${
            status === "moderating" || status === "uploading"
              ? "border-gray-300 bg-gray-50 cursor-not-allowed"
              : preview
                ? "border-green-400 bg-green-50 hover:bg-green-100"
                : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"
          }`}
        >
          {preview ? (
            <>
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="text-green-700 font-medium">Image Selected</span>
            </>
          ) : (
            <>
              <ImageIcon className="w-6 h-6 text-gray-500" />
              <span className="text-gray-600 font-medium">
                Choose an image or drag and drop
              </span>
            </>
          )}
        </label>
      </div>

      {/* Show loader during moderation OR upload */}
      {(status === "moderating" || status === "uploading") && (
        <div className="flex items-center justify-center gap-3 mt-4 p-4 bg-blue-50 rounded-lg">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <p className="text-blue-700 font-medium">
            {status === "moderating" ? "Analyzing image..." : "Uploading..."}
          </p>
        </div>
      )}

      {/* Image Preview */}
      {preview && (
        <div className="mt-4 relative rounded-lg overflow-hidden border-2 border-gray-200 max-w-md">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-auto object-cover"
          />
          {file && status === "idle" && (
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setFile(null);
              }}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Show Upload button only when moderation is done and successful */}
      {file && status === "idle" && (
        <button
          type="button"
          className="mt-4 flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          onClick={handleUpload}
        >
          <Upload className="w-5 h-5" />
          Upload Image
        </button>
      )}

      {/* Success Message */}
      {status === "success" && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-800 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="font-medium">Image attached successfully!</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg">
          <X className="w-5 h-5 text-red-600" />
          <span className="font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}
