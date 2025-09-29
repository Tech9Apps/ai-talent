import React from "react";
import { Container, Typography, Box, Button, Grid } from "@mui/material";
import { ArrowBack, SmartToy } from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { useUserFiles } from "../contexts/hooks/useUserFiles";
import { CVChatInterface } from "../components/CVAnalysis/CVChatInterface";
import { CVFileSummary } from "../components/CVAnalysis/CVFileSummary";

export const CVAnalysisPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { cvFile, loading } = useUserFiles();

  const handleBackClick = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  if (!cvFile || cvFile.id !== id) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Resume not found
        </Typography>
        <Button onClick={handleBackClick} startIcon={<ArrowBack />}>
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      {/* Header with back button */}
      <Box sx={{ mb: 6 }}>
        <Button
          onClick={handleBackClick}
          startIcon={<ArrowBack />}
          sx={{ mb: 2 }}
        >
          Back to Dashboard
        </Button>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 500,
            color: "#EA8600",
            fontSize: { xs: "2rem", md: "2.5rem" },
          }}
        >
          CV Analysis Chat
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ fontWeight: 300, mt: 1 }}
        >
          Ask questions about this resume: {cvFile.fileName}
        </Typography>
      </Box>

      <Grid container spacing={8}>
        {/* Left side - Chat Interface */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <SmartToy sx={{ color: "primary.main" }} />
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              AI Assistant
            </Typography>
          </Box>
          <CVChatInterface fileId={cvFile.id!} fileName={cvFile.fileName} />
        </Grid>

        {/* Right side - File Summary */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ position: "sticky", top: 24 }}>
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              File Summary
            </Typography>
            <CVFileSummary file={cvFile} />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};
