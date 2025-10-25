"use client";

import { useRouter } from "next/navigation";
import PostForm from "../components/postForm/PostForm";

export default function CreatePostPage() {
  const router = useRouter();

  const handlePostSuccess = () => {
    // Redirect to home page after successful post creation
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Share Your Skills
          </h1>
          <p className="text-gray-600">
            Create a post to offer your skills or request help from the community
          </p>
        </div>

        <PostForm onPostSuccess={handlePostSuccess} />
      </div>
    </div>
  );
}
