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
  Card,
  CardContent,
} from "@mui/material";
import { ArrowBack, Description, Work } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
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
  {
    field: "name",
    headerName: "Name",
    width: 200,
    renderCell: (params) => (
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Description sx={{ mr: 1, color: "primary.main" }} />
        {params.value}
      </Box>
    ),
  },
  {
    field: "location",
    headerName: "Location",
    width: 150,
  },
  {
    field: "experienceYears",
    headerName: "Experience",
    type: "number",
    width: 120,
    renderCell: (params) => (params.value ? `${params.value} years` : " "),
  },
  {
    field: "technologies",
    headerName: "Technologies",
    flex: 1,
    renderCell: (params) => (
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 0.5,
          alignItems: "center",
          height: "100%",
          py: 0.5,
        }}
      >
        {params.value?.map((tech: string, index: number) => (
          <Chip key={index} label={tech} size="small" variant="outlined" />
        ))}
      </Box>
    ),
  },
];

// Column definitions for Jobs DataGrid
const jobColumns: GridColDef[] = [
  {
    field: "title",
    headerName: "Job Title",
    width: 200,
    renderCell: (params) => (
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Work sx={{ mr: 1, color: "primary.main" }} />
        {params.value}
      </Box>
    ),
  },
  {
    field: "company",
    headerName: "Company",
    width: 150,
  },
  {
    field: "location",
    headerName: "Location",
    width: 150,
  },
  {
    field: "requiredSkills",
    headerName: "Required Skills",
    flex: 1,

    renderCell: (params) => (
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 0.5,
          alignItems: "center",
          height: "100%",
          py: 0.5,
        }}
      >
        {params.value?.map((skill: string, index: number) => (
          <Chip key={index} label={skill} size="small" variant="outlined" />
        ))}
      </Box>
    ),
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
      <Container sx={{ pb: 4 }}>
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
      <Container sx={{ pb: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ pb: 4 }}>
      {/* Header */}
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
          Analytics
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ fontWeight: 300, mt: 1 }}
        >
          Overview of uploaded CVs and job descriptions
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab
            icon={<Description />}
            label={`CVs (${cvs.length})`}
            iconPosition="start"
          />
          <Tab
            icon={<Work />}
            label={`Jobs (${jobs.length})`}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* CV DataGrid */}
      <Card>
        <CardContent>
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ width: "100%" }}>
              <DataGrid
                rowHeight={60}
                rows={cvs}
                columns={cvColumns}
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 10,
                    },
                  },
                }}
                pageSizeOptions={[5, 10, 25]}
                checkboxSelection
                disableRowSelectionOnClick
                sx={{
                  "& .MuiDataGrid-cell": {
                    borderBottom: "1px solid rgba(224, 224, 224, 1)",
                  },
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                    fontWeight: "bold",
                  },
                }}
              />
            </Box>
          </TabPanel>

          {/* Jobs DataGrid */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ width: "100%" }}>
              <DataGrid
                rows={jobs}
                columns={jobColumns}
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 10,
                    },
                  },
                }}
                rowHeight={60}
                pageSizeOptions={[5, 10, 25]}
                checkboxSelection
                disableRowSelectionOnClick
                sx={{
                  "& .MuiDataGrid-cell": {
                    borderBottom: "1px solid rgba(224, 224, 224, 1)",
                  },
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: "rgba(0, 0, 0, 0.04)",
                    fontWeight: "bold",
                  },
                }}
              />
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </Container>
  );
};
