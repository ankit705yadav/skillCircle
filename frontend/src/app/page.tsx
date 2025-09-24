"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

import PostForm from "./components/postForm/PostForm";
import NearbySkills from "./components/NearbySkills";
import StatsShowcase from "./components/statsShowcase/StatsShowcase";

interface Skill {
  id: number;
  title: string;
  description: string;
  type: "OFFER" | "ASK";
  author: {
    username: string;
  };
}

export default function Home() {
  const { getToken } = useAuth();
  const { user, isLoaded, isSignedIn } = useUser();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // The data fetching logic now lives in the parent component
  const fetchSkills = async () => {
    if (!isLoaded || !isSignedIn) return;

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/skills/nearby?lat=${latitude}&lon=${longitude}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.ok) {
        const data = await response.json();
        setSkills(data);
      }
      setIsLoading(false);
    });
  };

  // Fetch skills when the component initially loads
  useEffect(() => {
    fetchSkills();
  }, [isLoaded, isSignedIn]); // Dependency on auth state

  return (
    <div>
      <StatsShowcase />
      <NearbySkills skills={skills} isLoading={isLoading} user={user} />
      <PostForm onPostSuccess={fetchSkills} />
    </div>
  );
}
