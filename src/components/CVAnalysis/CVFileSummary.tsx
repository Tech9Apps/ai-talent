import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  Description,
  Schedule,
  CheckCircle,
  Warning,
  Error,
  InsertDriveFile,
  CloudDone,
} from "@mui/icons-material";
import type { UserFileRecord } from "../../../shared/types/fileTypes";

interface CVFileSummaryProps {
  file: UserFileRecord;
}

export const CVFileSummary: React.FC<CVFileSummaryProps> = ({ file }) => {
  const getStatusColor = (status: string): "success" | "warning" | "error" | "default" => {
    switch (status) {
      case "completed":
        return "success";
      case "processing":
        return "warning";
      case "error":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle color="success" />;
      case "processing":
        return <Schedule color="warning" />;
      case "error":
        return <Error color="error" />;
      default:
        return <Warning color="action" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileExtension = (fileName: string): string => {
    return fileName.split('.').pop()?.toUpperCase() || 'Unknown';
  };

  // Sample analysis data - in real app this would come from the file analysis
  const analysisProgress = {
    textExtraction: file.status === "completed" ? 100 : file.status === "processing" ? 60 : 0,
    structureAnalysis: file.status === "completed" ? 100 : file.status === "processing" ? 40 : 0,
    skillsDetection: file.status === "completed" ? 100 : file.status === "processing" ? 20 : 0,
    aiInsights: file.status === "completed" ? 100 : 0,
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* File Information */}
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Description sx={{ color: "primary.main", fontSize: 32 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 500, mb: 0.5 }}>
                {file.fileName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getFileExtension(file.fileName)} Document
              </Typography>
            </Box>
            <Box>
              {getStatusIcon(file.status)}
            </Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <Chip
              label={file.status}
              color={getStatusColor(file.status)}
              size="small"
              variant="outlined"
            />
            <Chip
              label={file.fileType}
              size="small"
              variant="outlined"
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          <List dense>
            <ListItem>
              <ListItemIcon>
                <InsertDriveFile fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="File size"
                secondary={file.size ? formatFileSize(file.size) : 'Unknown'}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Schedule fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Upload date"
                secondary={file.uploadedAt.toDate().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CloudDone fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Storage location"
                secondary="Firebase Cloud Storage"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Analysis Progress */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 500, mb: 2 }}>
            Analysis Progress
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="body2">Text Extraction</Typography>
              <Typography variant="body2" color="text.secondary">
                {analysisProgress.textExtraction}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={analysisProgress.textExtraction}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="body2">Structure Analysis</Typography>
              <Typography variant="body2" color="text.secondary">
                {analysisProgress.structureAnalysis}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={analysisProgress.structureAnalysis}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="body2">Skills Detection</Typography>
              <Typography variant="body2" color="text.secondary">
                {analysisProgress.skillsDetection}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={analysisProgress.skillsDetection}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>

          <Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="body2">AI Insights</Typography>
              <Typography variant="body2" color="text.secondary">
                {analysisProgress.aiInsights}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={analysisProgress.aiInsights}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 500, mb: 2 }}>
            Quick Insights
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            <Box sx={{ textAlign: "center", p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 500 }}>
                {file.status === "completed" ? "85" : "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overall Score
              </Typography>
            </Box>
            
            <Box sx={{ textAlign: "center", p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 500 }}>
                {file.status === "completed" ? "12" : "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Skills Found
              </Typography>
            </Box>

            <Box sx={{ textAlign: "center", p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 500 }}>
                {file.status === "completed" ? "3" : "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Improvements
              </Typography>
            </Box>

            <Box sx={{ textAlign: "center", p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 500 }}>
                {file.status === "completed" ? "95%" : "—"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Match Score
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};