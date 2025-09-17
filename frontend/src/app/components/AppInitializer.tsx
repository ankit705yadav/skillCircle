"use client";

import { useUserSetup } from "@/lib/hooks/useUserSetup";
import UsernameSelectionModal from "./UsernameSelectionModal";
import { Box, CircularProgress } from "@mui/material";

export default function AppInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSetupRequired, isLoading } = useUserSetup();

  if (isLoading) {
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

  return (
    <>
      <UsernameSelectionModal open={isSetupRequired} />
      {!isSetupRequired && children}
    </>
  );
}
