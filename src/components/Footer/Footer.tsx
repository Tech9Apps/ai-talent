import React from "react";
import { Box, Container, Typography, Link } from "@mui/material";

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        mt: "auto",
        py: 2,
      }}
    >
      <Container>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", gap: 3 }}>
            <Link
              href="https://www.tech9.com/"
              target="_blank"
              rel="noopener noreferrer"
              color="text.secondary"
              underline="hover"
              sx={{ typography: "caption" }}
            >
              Hackathon - Tech9 2025
            </Link>
          </Box>

          <Typography variant="caption" color="text.secondary">
            AI-Talent - © {currentYear} Jason Hume. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};
