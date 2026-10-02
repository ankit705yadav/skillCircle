"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import NearbySkills from "./components/NearbySkills";
import StatsShowcase from "./components/statsShowcase/StatsShowcase";
import { useAuth } from "@/lib/contexts/AuthContext";
import { fetchNearbyPosts, type SkillPost } from "@/lib/supabase/queries";

export default function Home() {
  const { user } = useAuth();
  const userId = user?.id;
  const [skills, setSkills] = useState<SkillPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch nearby skills once the user is signed in
  useEffect(() => {
    if (!userId) return;

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          setSkills(await fetchNearbyPosts(coords.latitude, coords.longitude));
        } catch (error: any) {
          toast.error(error.message);
        } finally {
          setIsLoading(false);
        }
      },
      () => setIsLoading(false),
    );
  }, [userId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <StatsShowcase />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <NearbySkills skills={skills} isLoading={isLoading} />
      </div>
    </div>
  );
}
