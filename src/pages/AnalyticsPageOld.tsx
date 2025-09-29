import React, { useState } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import {
  ArrowBack,
  Description,
  Work,
} from "@mui/icons-material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useNavigate } from "react-router-dom";
import { useAnalyticsData } from "../hooks/useAnalyticsData";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// Column definitions for CVs DataGrid
const cvColumns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90 },
  { 
    field: 'name', 
    headerName: 'Name', 
    width: 200,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Description sx={{ mr: 1, color: 'primary.main' }} />
        {params.value}
      </Box>
    )
  },
  { 
    field: 'experienceYears', 
    headerName: 'Experience', 
    type: 'number', 
    width: 120,
    renderCell: (params) => `${params.value} years`
  },
  { 
    field: 'technologies', 
    headerName: 'Technologies', 
    width: 300,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {params.value?.slice(0, 3).map((tech: string, index: number) => (
          <Chip key={index} label={tech} size="small" variant="outlined" />
        ))}
        {params.value?.length > 3 && (
          <Chip label={`+${params.value.length - 3} more`} size="small" />
        )}
      </Box>
    )
  },
  { 
    field: 'warnings', 
    headerName: 'Warnings', 
    width: 120,
    renderCell: (params) => (
      <Chip 
        label={params.value?.length || 0} 
        color={params.value?.length > 0 ? 'warning' : 'success'}
        size="small"
      />
    )
  },
  { 
    field: 'email', 
    headerName: 'Email', 
    width: 200
  },
  { 
    field: 'location', 
    headerName: 'Location', 
    width: 150
  },
];

// Column definitions for Jobs DataGrid
const jobColumns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 90 },
  { 
    field: 'title', 
    headerName: 'Job Title', 
    width: 200,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Work sx={{ mr: 1, color: 'primary.main' }} />
        {params.value}
      </Box>
    )
  },
  { 
    field: 'company', 
    headerName: 'Company', 
    width: 150
  },
  { 
    field: 'experienceRequired', 
    headerName: 'Experience Required', 
    type: 'number', 
    width: 160,
    renderCell: (params) => `${params.value} years`
  },
  { 
    field: 'requiredSkills', 
    headerName: 'Required Skills', 
    width: 300,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {params.value?.slice(0, 3).map((skill: string, index: number) => (
          <Chip key={index} label={skill} size="small" variant="outlined" />
        ))}
        {params.value?.length > 3 && (
          <Chip label={`+${params.value.length - 3} more`} size="small" />
        )}
      </Box>
    )
  },
  { 
    field: 'location', 
    headerName: 'Location', 
    width: 150
  },
  { 
    field: 'salary', 
    headerName: 'Salary', 
    width: 120
  },
  { 
    field: 'warnings', 
    headerName: 'Warnings', 
    width: 120,
    renderCell: (params) => (
      <Chip 
        label={params.value?.length || 0} 
        color={params.value?.length > 0 ? 'warning' : 'success'}
        size="small"
      />
    )
  },
];

export const AnalyticsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const { cvs, jobs, loading, error } = useAnalyticsData();

  const handleBackClick = () => {
    navigate("/");
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Container sx={{ py: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "50vh",
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
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
          Analytics Dashboard
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ fontWeight: 300, mt: 1 }}
        >
          Overview all the CVs and Job Descriptions
        </Typography>
      </Box>

      {/* Main Analytics Card */}
      <Box mb={2}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="analytics tabs"
          sx={{ px: 3, pt: 2 }}
        >
          <Tab
            icon={<Description />}
            label={`CVs (${cvs.length})`}
            iconPosition="start"
            sx={{ textTransform: "none", fontWeight: 500 }}
          />
          <Tab
            icon={<Work />}
            label={`Jobs (${jobs.length})`}
            iconPosition="start"
            sx={{ textTransform: "none", fontWeight: 500 }}
          />
        </Tabs>
      </Box>
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 0 }}>
          {/* CVs Tab Panel */}
          <TabPanel value={tabValue} index={0}>
            {cvs.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Description
                  sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  No CVs analyzed yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upload and analyze CVs to see them here
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {cvs.map((cv) => (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={cv.id}>
                    <Card
                      sx={{
                        height: "100%",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        "&:hover": {
                          boxShadow: 2,
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 2,
                          }}
                        >
                          <Person color="primary" />
                          <Typography variant="h6" sx={{ fontWeight: 500 }}>
                            {cv.name || "Unknown"}
                          </Typography>
                        </Box>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {cv.summary || "No summary available"}
                        </Typography>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Experience: {cv.experienceYears} years
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 0.5,
                            mb: 2,
                          }}
                        >
                          {cv.technologies.slice(0, 3).map((tech, index) => (
                            <Chip
                              key={index}
                              label={tech}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          ))}
                          {cv.technologies.length > 3 && (
                            <Chip
                              label={`+${cv.technologies.length - 3} more`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>

                        {cv.warnings && cv.warnings.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Chip
                              label={`${cv.warnings.length} warnings`}
                              color="warning"
                              size="small"
                            />
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          {/* Jobs Tab Panel */}
          <TabPanel value={tabValue} index={1}>
            {jobs.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Business
                  sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  No Job Descriptions analyzed yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Upload and analyze job descriptions to see them here
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {jobs.map((job) => (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={job.id}>
                    <Card
                      sx={{
                        height: "100%",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        "&:hover": {
                          boxShadow: 2,
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 2,
                          }}
                        >
                          <Business color="primary" />
                          <Typography variant="h6" sx={{ fontWeight: 500 }}>
                            {job.title}
                          </Typography>
                        </Box>

                        {job.company && (
                          <Typography
                            variant="subtitle2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                          >
                            {job.company}
                          </Typography>
                        )}

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {job.description}
                        </Typography>

                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Experience Required: {job.experienceRequired} years
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 0.5,
                            mb: 2,
                          }}
                        >
                          {job.requiredSkills
                            .slice(0, 3)
                            .map((skill, index) => (
                              <Chip
                                key={index}
                                label={skill}
                                size="small"
                                variant="outlined"
                                color="secondary"
                              />
                            ))}
                          {job.requiredSkills.length > 3 && (
                            <Chip
                              label={`+${job.requiredSkills.length - 3} more`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>

                        {job.location && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mb: 1 }}
                          >
                            📍 {job.location}
                          </Typography>
                        )}

                        {job.warnings && job.warnings.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Chip
                              label={`${job.warnings.length} warnings`}
                              color="warning"
                              size="small"
                            />
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>
        </CardContent>
      </Card>
    </Container>
  );
};
