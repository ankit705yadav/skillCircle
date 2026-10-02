"use client";

import { useAuth } from "@/lib/contexts/AuthContext";
import UsernameSelectionModal from "./UsernameSelectionModal";
import { Box, CircularProgress } from "@mui/material";

export default function AppInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Signed-in users must claim a generated username before using the app.
  const isSetupRequired = !!user && !profile?.username;

  return (
    <>
      <UsernameSelectionModal open={isSetupRequired} />
      {!isSetupRequired && children}
    </>
  );
}
