"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

// Define a type for the user data we expect from our backend
interface UserProfile {
  clerkUserId: string;
  generatedUsername: string | null;
}

export function useUserSetup() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [isSetupRequired, setIsSetupRequired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Don't run the check until Clerk has loaded and confirmed the user is signed in
    if (!isLoaded || !isSignedIn) {
      setIsLoading(false);
      return;
    }

    const checkUserStatus = async () => {
      const token = await getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.ok) {
          const user: UserProfile = await response.json();
          // If the username field is null or empty, they need to complete the setup
          if (!user.generatedUsername) {
            setIsSetupRequired(true);
          }
        }
      } catch (error) {
        console.error("Failed to check user status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, [isSignedIn, isLoaded, getToken]);

  return { isSetupRequired, isLoading };
}
