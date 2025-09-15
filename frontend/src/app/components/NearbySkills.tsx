"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Card, CardContent, Typography } from "@mui/material";

export default function NearbySkills() {
  const { getToken } = useAuth();
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    const fetchSkills = () => {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        const token = await getToken();

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/skills/nearby?lat=${latitude}&lon=${longitude}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setSkills(data);
        }
      });
    };
    fetchSkills();
  }, [getToken]);

  return (
    <div>
      <Typography variant="h4">Nearby Skills</Typography>
      {skills.map((skill: any) => (
        <Card key={skill.id} sx={{ my: 2 }}>
          <CardContent>
            <Typography variant="h6">{skill.title}</Typography>
            <Typography>{skill.description}</Typography>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
