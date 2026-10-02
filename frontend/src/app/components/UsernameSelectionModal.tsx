"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { claimUsername, generateUsernames } from "@/lib/supabase/queries";
import {
  Modal,
  Box,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";

// Style for the modal box
const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
  textAlign: "center",
};

export default function UsernameSelectionModal({ open }: { open: boolean }) {
  const { refreshProfile } = useAuth();
  const [usernames, setUsernames] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const fetchUsernames = async () => {
      setIsLoading(true);
      setError(null);
      try {
        setUsernames(await generateUsernames());
      } catch {
        setError("Could not load username options. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsernames();
  }, [open]);

  const handleClaimUsername = async () => {
    if (!selected) return;
    setIsLoading(true);
    setError(null);

    try {
      await claimUsername(selected);
      // The profile now has a username, which closes the setup flow.
      await refreshProfile();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal open={open}>
      <Box sx={style}>
        <Typography variant="h5" component="h2">
          Welcome! Choose Your Username
        </Typography>
        <Typography sx={{ mt: 2, mb: 2 }}>
          This will be your anonymous name on the platform.
        </Typography>
        {isLoading && <CircularProgress />}

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            justifyContent: "center",
            my: 2,
          }}
        >
          {!isLoading &&
            usernames.map((name) => (
              <Chip
                key={name}
                label={name}
                onClick={() => setSelected(name)}
                color={selected === name ? "primary" : "default"}
                variant="outlined"
              />
            ))}
        </Box>

        <Button
          variant="contained"
          onClick={handleClaimUsername}
          disabled={!selected || isLoading}
        >
          Claim Username
        </Button>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </Box>
    </Modal>
  );
}
