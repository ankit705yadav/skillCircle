"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import ImageUpload from "../imageUpload/ImageUpload";
import "./postForm.css";

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

      alert(`${type === "OFFER" ? "Offer" : "Request"} created successfully!`);
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
    <form className="form-container" onSubmit={handleSubmit}>
      {error && <div className="form-error-alert">{error}</div>}

      <h2 className="form-title">Create a Post</h2>

      {/* Radio Buttons for Post Type */}
      <fieldset className="form-radio-group">
        <legend className="form-radio-legend">Post Type</legend>
        <div className="form-radio-options">
          <label className="form-radio-label">
            <input
              type="radio"
              value="OFFER"
              checked={type === "OFFER"}
              onChange={(e) => setType(e.target.value as "OFFER" | "ASK")}
            />
            Offer
          </label>
          <label className="form-radio-label">
            <input
              type="radio"
              value="ASK"
              checked={type === "ASK"}
              onChange={(e) => setType(e.target.value as "OFFER" | "ASK")}
            />
            Request
          </label>
        </div>
      </fieldset>

      <ImageUpload
        key={imageUploadKey}
        onUploadSuccess={(url) => setPosterImageUrl(url)}
      />

      {/* Title Input */}
      <div className="form-input-group">
        <label htmlFor="skill-title" className="form-label">
          Skill Title
        </label>
        <input
          id="skill-title"
          className="form-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {/* Description Textarea */}
      <div className="form-input-group">
        <label htmlFor="skill-description" className="form-label">
          Description
        </label>
        <textarea
          id="skill-description"
          className="form-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="form-submit-button" disabled={isLoading}>
        {isLoading
          ? "Posting..."
          : `Post ${type === "OFFER" ? "Offer" : "Request"}`}
      </button>
    </form>
  );
}
