import React from "react";
import {
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
} from "@mui/material";
import { Psychology, ArrowForward } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import type { UserFileRecord } from "../../../shared/types/fileTypes";
import { GlowingBorder } from "../GlowingBorder/GlowingBorder";

interface CVAnalysisCardProps {
  cvFile: UserFileRecord;
  filesLoading?: boolean;
}

export const CVAnalysisCard: React.FC<CVAnalysisCardProps> = ({
  cvFile,
  filesLoading = false,
}) => {
  const navigate = useNavigate();

  const handleAnalysisClick = () => {
    if (cvFile?.id) {
      const defaultQuestion =
        "How can I improve my CV to better match the job descriptions available in the system? What skills or experience am I missing?";
      navigate(`/cv/${cvFile.id}?q=${encodeURIComponent(defaultQuestion)}`);
    }
  };

  if (filesLoading || !cvFile) {
    return null;
  }

  return (
    <GlowingBorder border={8}>
      <Card onClick={handleAnalysisClick}>
        <CardActionArea sx={{ position: "relative", zIndex: 1 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Box
                sx={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  borderRadius: 2,
                  p: 1.5,
                  backdropFilter: "blur(10px)",
                }}
              >
                <Psychology sx={{ fontSize: 32, color: "white" }} />
              </Box>

              <Box sx={{ flexGrow: 1, color: "text.primary" }}>
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{ fontWeight: 600, mb: 0.5 }}
                >
                  Want to know how to get more opportunities?
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ opacity: 0.7, mb: 1, color: "text.secondary" }}
                >
                  Analyze your resume: {cvFile.fileName}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.6, color: "text.secondary" }}
                >
                  Discover how to optimize your profile for job descriptions in
                  the system
                </Typography>
              </Box>

              <ArrowForward sx={{ color: "primary.main", fontSize: 24 }} />
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    </GlowingBorder>
  );
};
