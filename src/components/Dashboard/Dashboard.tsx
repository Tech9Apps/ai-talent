import React from "react";
import {
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
  Fade,
} from "@mui/material";
import { CloudUpload, Person, Business, TrendingUp } from "@mui/icons-material";
import { GoogleAuthButton } from "../Auth/GoogleAuthButton";
import { FileUploadCard } from "../FileUpload/FileUploadCard";
import { CVAnalysisCard } from "../CVAnalysis/CVAnalysisCard";
import { FileStatsChart } from "../Charts/FileStatsChart";
import { useUserFiles } from "../../contexts/hooks/useUserFiles";
import type { User } from "../../types";
import type { UserFileRecord } from "../../../shared/types/fileTypes";

interface WelcomeSectionProps {
  user: User | null;
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ user }) => {
  const getGreeting = () => {
    if (user) {
      const name = user.displayName || user.email?.split("@")[0] || "there";
      return `Hello ${name}`;
    }
    return "Welcome to AI-Talent";
  };

  const getDescription = () => {
    if (user) {
      return "Continue building your AI-powered career journey";
    }
    return "Revolutionize your hiring process with AI-powered talent matching and smart CV analysis";
  };

  return (
    <Box sx={{ mb: 6 }}>
      <Typography
        variant="h3"
        component="h1"
        sx={{
          fontWeight: 500,
          color: "#EA8600",
          fontSize: { xs: "2rem", md: "2.5rem" },
        }}
      >
        {getGreeting()}
      </Typography>
      <Typography
        variant="h6"
        color="text.secondary"
        sx={{
          fontWeight: 400,
          lineHeight: 1.5,
          maxWidth: "600px",
        }}
      >
        {getDescription()}
      </Typography>
    </Box>
  );
};

interface GetStartedSectionProps {
  user: User | null;
  onAuthSuccess?: () => void;
  onAuthError?: (error: string) => void;
  cvFile?: UserFileRecord | null;
  jobDescriptionsCount?: number;
  filesLoading?: boolean;
}

const GetStartedSection: React.FC<GetStartedSectionProps> = ({
  user,
  onAuthSuccess,
  onAuthError,
  cvFile,
  jobDescriptionsCount,
  filesLoading,
}) => {
  if (!user) {
    return (
      <Box>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 500, mb: 3 }}>
          Get Started
        </Typography>
        <Card sx={{ p: 4, textAlign: "center", maxWidth: 400, mx: "auto" }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sign in to continue
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Get access to AI-powered talent matching and CV analysis tools
            </Typography>
            <GoogleAuthButton
              onSuccess={onAuthSuccess}
              onError={onAuthError}
              fullWidth
            />
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
        Get Started
      </Typography>
      <Grid container spacing={1}>
        <Grid size={12}>
          <FileUploadCard
            type="cv"
            title="Upload Resume"
            description="Upload your resume to get AI-powered job matching and optimization suggestions"
            icon={<Person sx={{ fontSize: 40, color: "#1976d2" }} />}
            cvFile={cvFile}
            filesLoading={filesLoading}
          />
        </Grid>
        <Grid size={12}>
          <FileUploadCard
            type="jobDescription"
            title="Upload Job Description"
            description="Upload job descriptions to find the best matching candidates from your talent pool"
            icon={<Business sx={{ fontSize: 40, color: "#1976d2" }} />}
            jobDescriptionsCount={jobDescriptionsCount}
            filesLoading={filesLoading}
          />
        </Grid>

        {/* CV Analysis Card - Only show if user has a CV */}
        <Fade in={Boolean(cvFile && !filesLoading)} timeout={250}>
          <Box>
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{ mb: 1, mt: 4 }}
            >
              CV Analysis
            </Typography>
            <Grid size={12}>
              {cvFile && (
                <CVAnalysisCard cvFile={cvFile} filesLoading={filesLoading} />
              )}
            </Grid>
          </Box>
        </Fade>
      </Grid>
    </Box>
  );
};

interface DashboardProps {
  user: User | null;
  onAuthSuccess?: () => void;
  onAuthError?: (error: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onAuthSuccess,
  onAuthError,
}) => {
  // Get user files data
  const { cvFile, jobDescriptionFiles, loading: filesLoading } = useUserFiles();
  const jobDescriptionsCount = jobDescriptionFiles?.length || 0;

  return (
    <Container sx={{ py: 4 }}>
      <WelcomeSection user={user} />
      <Grid container spacing={8}>
        {/* Main content area */}
        <Grid size={{ xs: 12, md: 6 }}>
          <GetStartedSection
            user={user}
            onAuthSuccess={onAuthSuccess}
            onAuthError={onAuthError}
            cvFile={cvFile}
            jobDescriptionsCount={jobDescriptionsCount}
            filesLoading={filesLoading}
          />

          {/* Sample projects section (similar to Firebase console) */}
          {!user && (
            <Box sx={{ mb: 6 }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ fontWeight: 500, mb: 3 }}
              >
                Try a sample app
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card
                    sx={{
                      p: 3,
                      cursor: "pointer",
                      "&:hover": { boxShadow: 2 },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <TrendingUp sx={{ mr: 2, color: "primary.main" }} />
                      <Typography variant="h6">
                        Try a talent matching demo
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Experience AI-powered talent matching with sample data and
                      explore the interface
                    </Typography>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card
                    sx={{
                      p: 3,
                      cursor: "pointer",
                      "&:hover": { boxShadow: 2 },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <CloudUpload sx={{ mr: 2, color: "primary.main" }} />
                      <Typography variant="h6">Upload sample CV</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Test our CV analysis features with pre-loaded sample
                      resumes
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </Grid>

        {/* Right sidebar - Projects list like Firebase */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ position: "sticky", top: 24 }}>
            <Typography
              variant="subtitle1"
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              Statistics
            </Typography>
            <Grid container spacing={1}>
              <Grid size={12}>
                <FileStatsChart />
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};
