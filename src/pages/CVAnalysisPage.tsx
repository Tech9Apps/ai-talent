import React from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Button,
  Grid,
  Paper,
} from "@mui/material";
import {
  Psychology,
  Description,
  TrendingUp,
  ArrowBack,
  Person,
  Business,
  School,
  Work,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { useUserFiles } from "../contexts/hooks/useUserFiles";

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
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          onClick={handleBackClick}
          startIcon={<ArrowBack />}
          sx={{ mb: 2 }}
          variant="outlined"
        >
          Back to Dashboard
        </Button>
        
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 500 }}>
          Resume Analysis
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          Discover how to optimize your professional profile
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* CV Information */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                <Description sx={{ color: "primary.main", fontSize: 32 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Your Resume
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {cvFile.fileName}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Processing status
                </Typography>
                <Chip 
                  label={cvFile.status} 
                  color={cvFile.status === 'completed' ? 'success' : 'primary'}
                  size="small"
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Upload date
                </Typography>
                <Typography variant="body2">
                  {cvFile.uploadedAt.toDate().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  File format
                </Typography>
                <Typography variant="body2">
                  {cvFile.fileName.split('.').pop()?.toUpperCase() || 'Unknown'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Analysis and Recommendations */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* AI Analysis Card */}
            <Card
              sx={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                position: "relative",
                overflow: "hidden",
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
                  opacity: 0.1,
                  zIndex: 0,
                },
                "@keyframes gradientShift": {
                  "0%": { backgroundPosition: "0% 50%" },
                  "50%": { backgroundPosition: "100% 50%" },
                  "100%": { backgroundPosition: "0% 50%" },
                },
              }}
            >
              <CardContent sx={{ position: "relative", zIndex: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                  <Psychology sx={{ fontSize: 32 }} />
                  <Typography variant="h5" sx={{ fontWeight: 500 }}>
                    AI Analysis of your Resume
                  </Typography>
                </Box>
                <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
                  Our artificial intelligence system has analyzed your resume and can help you 
                  improve your professional profile to get more job opportunities.
                </Typography>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.2)",
                    backdropFilter: "blur(10px)",
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.3)",
                    },
                  }}
                  startIcon={<TrendingUp />}
                >
                  View Detailed Recommendations
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Person sx={{ fontSize: 32, color: "primary.main", mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Profile
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Complete
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Work sx={{ fontSize: 32, color: "success.main", mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Experience
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Analyzed
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <School sx={{ fontSize: 32, color: "info.main", mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Education
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Verified
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper sx={{ p: 2, textAlign: "center" }}>
                  <Business sx={{ fontSize: 32, color: "warning.main", mb: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 500 }}>
                    Matches
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    In progress
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Recommendations Preview */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 500 }}>
                  Recommendations to improve
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ p: 2, bgcolor: "background.paper", borderRadius: 1, border: "1px solid", borderColor: "divider" }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      💡 Keyword optimization
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Include more relevant keywords for your industry to appear in more searches.
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: "background.paper", borderRadius: 1, border: "1px solid", borderColor: "divider" }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      📈 Quantify your achievements
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Add specific numbers and metrics to highlight the impact of your work.
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: "background.paper", borderRadius: 1, border: "1px solid", borderColor: "divider" }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      🎯 Industry adaptation
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Customize your resume according to the most common job descriptions in your area.
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};