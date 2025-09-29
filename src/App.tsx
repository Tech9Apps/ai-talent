import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Box, Alert, Snackbar, CircularProgress } from "@mui/material";

// Components
import { Header } from "./components/Header/Header";
import { Footer } from "./components/Footer/Footer";
import { SideNav } from "./components/SideNav/SideNav";
import { CustomThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";

// Pages
import { HomePage } from "./pages/HomePage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { CVAnalysisPage } from "./pages/CVAnalysisPage";

// Hooks
import { useAuthContext } from "./contexts/hooks/useAuthContext";

// Types
import type { NotificationItem } from "./types";

function AppContent() {
  const { user, loading } = useAuthContext();
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "1",
      message: "Welcome to AI-Talent!",
      timestamp: new Date(),
      read: false,
      type: "info",
    },
    {
      id: "2",
      message: "CV processing completed",
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
      read: false,
      type: "success",
    },
    {
      id: "3",
      message: "New job matches found",
      timestamp: new Date(Date.now() - 900000), // 15 minutes ago
      read: true,
      type: "info",
    },
  ]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "warning" | "info";
  }>({
    open: false,
    message: "",
    severity: "info",
  });

  const showSnackbar = (
    message: string,
    severity: "success" | "error" | "warning" | "info"
  ) => {
    setSnackbar({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleAuthSuccess = () => {
    showSnackbar("Successfully signed in!", "success");
    // Add welcome notification
    setNotifications((prev) => [
      {
        id: Date.now().toString(),
        message: "Welcome back! You can now upload CVs and job descriptions.",
        timestamp: new Date(),
        read: false,
        type: "success",
      },
      ...prev,
    ]);
  };

  const handleAuthError = (error: string) => {
    showSnackbar(error, "error");
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <CircularProgress size={60} />
        <div>Loading AI-Talent...</div>
      </Box>
    );
  }

  return (
    <Router>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "background.default",
          paddingRight: "64px", // Space for right sidebar
        }}
      >
        <Header />

        <SideNav notifications={notifications} />

        <Box sx={{ flexGrow: 1 }}>
          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  user={user}
                  onAuthSuccess={handleAuthSuccess}
                  onAuthError={handleAuthError}
                />
              }
            />
            <Route
              path="/analytics"
              element={
                user ? (
                  <AnalyticsPage />
                ) : (
                  <HomePage
                    user={user}
                    onAuthSuccess={handleAuthSuccess}
                    onAuthError={handleAuthError}
                  />
                )
              }
            />
            <Route
              path="/cv/:id"
              element={
                user ? (
                  <CVAnalysisPage />
                ) : (
                  <HomePage
                    user={user}
                    onAuthSuccess={handleAuthSuccess}
                    onAuthError={handleAuthError}
                  />
                )
              }
            />
          </Routes>
        </Box>

        <Footer />

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Router>
  );
}

function App() {
  return (
    <CustomThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </CustomThemeProvider>
  );
}

export default App;
