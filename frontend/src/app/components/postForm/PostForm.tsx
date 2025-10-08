"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { toast } from "sonner";
import ImageUpload from "../imageUpload/ImageUpload";

export default function CreateOfferForm({ onPostSuccess }) {
  const { getToken } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posterImageUrl, setPosterImageUrl] = useState<string | null>(null);
  const [type, setType] = useState<"OFFER" | "ASK">("OFFER"); // default OFFER

  const [imageUploadKey, setImageUploadKey] = useState(Date.now());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

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
            type,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "An error occurred on the server.");
      }

      toast.success(`${type === "OFFER" ? "Offer" : "Request"} created successfully!`);
      setTitle("");
      setDescription("");
      setPosterImageUrl(null);
      setType("OFFER"); // reset to default
      setImageUploadKey(Date.now());
      onPostSuccess();
    } catch (error: any) {
      console.error("Submission failed:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-200"
      onSubmit={handleSubmit}
    >
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <h2 className="text-3xl font-bold text-gray-900 mb-6">
        Create a Post
      </h2>

      {/* Radio Buttons for Post Type */}
      <fieldset className="mb-6 p-4 border border-gray-300 rounded-lg">
        <legend className="text-sm font-bold text-gray-700 px-2">
          Post Type
        </legend>
        <div className="flex gap-6 mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="OFFER"
              checked={type === "OFFER"}
              onChange={(e) => setType(e.target.value as "OFFER" | "ASK")}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-gray-700 font-medium">Offer</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="ASK"
              checked={type === "ASK"}
              onChange={(e) => setType(e.target.value as "OFFER" | "ASK")}
              className="w-4 h-4 text-green-600 focus:ring-green-500"
            />
            <span className="text-gray-700 font-medium">Request</span>
          </label>
        </div>
      </fieldset>

      <ImageUpload
        key={imageUploadKey}
        onUploadSuccess={(url) => setPosterImageUrl(url)}
      />

      {/* Title Input */}
      <div className="mb-6">
        <label
          htmlFor="skill-title"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Skill Title
        </label>
        <input
          id="skill-title"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
          type="text"
          placeholder="e.g., Web Development, Guitar Lessons, etc."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {/* Description Textarea */}
      <div className="mb-6">
        <label
          htmlFor="skill-description"
          className="block text-sm font-semibold text-gray-700 mb-2"
        >
          Description
        </label>
        <textarea
          id="skill-description"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow min-h-[120px] resize-y"
          placeholder="Describe your skill in detail..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <button
        type="submit"
        className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : type === "OFFER"
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-green-600 hover:bg-green-700"
        }`}
        disabled={isLoading}
      >
        {isLoading
          ? "Posting..."
          : `Post ${type === "OFFER" ? "Offer" : "Request"}`}
      </button>
    </form>
  );
}
