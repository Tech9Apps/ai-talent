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
      const defaultQuestion = "How can I improve my CV to better match the job descriptions available in the system? What skills or experience am I missing?";
      navigate(`/cv/${cvFile.id}?q=${encodeURIComponent(defaultQuestion)}`);
    }
  };

  if (filesLoading || !cvFile) {
    return null;
  }

  return (
    <Card
      sx={{
        cursor: "pointer",
        border: "1px solid",
        borderColor: "divider",
        backgroundColor: "white",
        transition: "all 0.3s ease-in-out",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(102, 126, 234, 0.15), 0 2px 10px rgba(118, 75, 162, 0.1)",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57, #ff9ff3, #54a0ff)",
          backgroundSize: "400% 400%",
          animation: "gradientShift 3s ease infinite",
          opacity: 0,
          zIndex: 0,
        },
        "&:hover": {
          boxShadow: "0 8px 30px rgba(255, 107, 107, 0.2), 0 4px 15px rgba(78, 205, 196, 0.15), 0 2px 10px rgba(69, 183, 209, 0.1)",
          "&::before": {
            opacity: 0.05,
          },
        },
        "@keyframes gradientShift": {
          "0%": {
            backgroundPosition: "0% 50%",
          },
          "50%": {
            backgroundPosition: "100% 50%",
          },
          "100%": {
            backgroundPosition: "0% 50%",
          },
        },
      }}
      onClick={handleAnalysisClick}
    >
      <CardActionArea>
        <CardContent sx={{ p: 3, position: "relative", zIndex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Box
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
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
              <Typography variant="body2" sx={{ opacity: 0.7, mb: 1, color: "text.secondary" }}>
                Analyze your resume: {cvFile.fileName}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.6, color: "text.secondary" }}>
                Discover how to optimize your profile for job descriptions in the system
              </Typography>
            </Box>

            <ArrowForward sx={{ color: "primary.main", fontSize: 24 }} />
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};