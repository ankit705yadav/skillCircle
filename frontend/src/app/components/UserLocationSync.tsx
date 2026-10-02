"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { setMyLocation } from "@/lib/supabase/queries";

export default function UserLocationSync() {
  const { user } = useAuth();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setMyLocation(coords.latitude, coords.longitude).catch((error) =>
          console.error("Location sync failed:", error),
        );
      },
      (error) => {
        console.error("Geolocation Error:", error);
        // Handle cases where the user denies location access
      },
    );
  }, [userId]);

  return null; // This component doesn't render anything
}
