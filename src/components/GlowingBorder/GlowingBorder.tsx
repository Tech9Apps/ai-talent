import { type PropsWithChildren } from "react";
import "./GlowingBorder.css";
import { Box, useTheme } from "@mui/material";

export const GlowingBorder = ({
  children,
  border,
}: PropsWithChildren<{ border: number }>) => {
  const theme = useTheme();
  const backgroundColor = theme.palette.background.paper;
  
  const gradient = `conic-gradient(
    from var(--angle),
    ${backgroundColor},
    #7C3AED,
    #10B981,
    #EF4444,
    #3B82F6,
    ${backgroundColor},
    ${backgroundColor},
    ${backgroundColor},
    ${backgroundColor}
  )`;

  return (
    <Box
      className="glowing-border-wrapper"
      sx={{
        borderRadius: `${border}px`,
        "&::before": { 
          borderRadius: `${border}px`,
          background: gradient,
        },
        "&::after": { 
          borderRadius: `${border}px`,
          background: gradient,
        },
      }}
    >
      {children}
    </Box>
  );
};
