import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { AppBar, Toolbar, Typography, Box } from "@mui/material";
import { SmartToy } from "@mui/icons-material";
import type { User } from "../../types";

interface HeaderProps {
  user: User | null;
}

export const Header: React.FC<HeaderProps> = ({ user }) => {
  const navigate = useNavigate();

  const handleNavigateHome = () => {
    navigate("/");
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: "transparent",
        borderBottom: "0",
        color: "text.primary",
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", px: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <SmartToy />
          <Typography
            variant="h6"
            component="p"
            sx={{
              fontWeight: 400,
              cursor: "pointer",
              color: "text.primary",
              "&:hover": { color: "primary.main" },
            }}
            onClick={handleNavigateHome}
          >
            AI-Talent
          </Typography>

          {user && (
            <Link
              to="/analytics"
              style={{
                marginLeft: 32,
                color: "inherit",
                textDecoration: "none",
                fontSize: "0.875rem",
              }}
            >
              <Typography
                variant="body2"
                component="span"
                sx={{
                  color: "text.primary",
                  fontSize: "0.875rem",
                  "&:hover": {
                    color: "primary.main",
                    textDecoration: "underline",
                  },
                }}
              >
                Analytics
              </Typography>
            </Link>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};
