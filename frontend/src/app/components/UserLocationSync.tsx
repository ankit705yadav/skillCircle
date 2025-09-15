"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect } from "react";

export default function UserLocationSync() {
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (!isSignedIn) return;

    const syncUser = async () => {
      // 1. Get location from the browser
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // 2. Get auth token from Clerk
          const token = await getToken();

          // 3. Send data to your backend's sync endpoint
          await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/sync`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                latitude: latitude,
                longitude: longitude,
              }),
            },
          );
        },
        (error) => {
          console.error("Geolocation Error:", error);
          // Handle cases where the user denies location access
        },
      );
    };

    syncUser();
  }, [isSignedIn, getToken]);

  return null; // This component doesn't render anything
}
