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
  Alert,
  Skeleton,
} from "@mui/material";
import {
  Description,
  Schedule,
  CheckCircle,
  Warning,
  Error,
  Person,
} from "@mui/icons-material";
import type { UserFileRecord } from "../../../shared/types/fileTypes";
import { useCVAnalysis } from "../../hooks";

interface CVFileSummaryProps {
  file: UserFileRecord;
}

export const CVFileSummary: React.FC<CVFileSummaryProps> = ({ file }) => {
  const { analysis, loading: loadingAnalysis } = useCVAnalysis(file.id || "");

  console.log(file.id)

  const getStatusColor = (
    status: string
  ): "success" | "warning" | "error" | "default" => {
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

  const getFileExtension = (fileName: string): string => {
    return fileName.split(".").pop()?.toUpperCase() || "Unknown";
  };

  // Analysis progress based on actual data
  const analysisProgress = {
    textExtraction:
      file.status === "completed" ? 100 : file.status === "processing" ? 60 : 0,
    structureAnalysis:
      file.status === "completed" ? 100 : file.status === "processing" ? 40 : 0,
    skillsDetection:
      file.status === "completed" ? 100 : file.status === "processing" ? 20 : 0,
    aiInsights: file.status === "completed" ? 100 : 0,
  };


  console.log(analysis)
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
            <Box>{getStatusIcon(file.status)}</Box>
          </Box>

          <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
            <Chip
              label={file.status}
              color={getStatusColor(file.status)}
              size="small"
              variant="outlined"
            />
            <Chip label={file.fileType} size="small" variant="outlined" />
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {analysis?.summary}
          </Typography>
        </CardContent>
      </Card>

      {/* Analysis Progress */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 500, mb: 2 }}>
            Analysis Progress
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
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
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
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
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
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
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
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

      {/* Profile Information - Only show if analysis is available */}
      {file.status === "completed" && (
        <>
          {loadingAnalysis ? (
            <Card>
              <CardContent>
                <Skeleton variant="text" width="60%" height={32} />
                <Skeleton variant="text" width="40%" height={24} />
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={100}
                  sx={{ mt: 2 }}
                />
              </CardContent>
            </Card>
          ) : analysis ? (
            <>
              {/* Summary */}
              {analysis.summary && (
                <Card>
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
                        Professional Summary
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1.6 }}
                    >
                      {analysis.summary}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Warnings */}
              {analysis.warnings && analysis.warnings.length > 0 && (
                <Card>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 2,
                      }}
                    >
                      <Warning color="warning" />
                      <Typography variant="h6" sx={{ fontWeight: 500 }}>
                        Analysis Warnings
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 2 }} />
                    <Alert severity="warning" sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        The following issues were detected during analysis:
                      </Typography>
                    </Alert>

                    <List dense>
                      {analysis.warnings.map(
                        (warning: string, index: number) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <Warning fontSize="small" color="warning" />
                            </ListItemIcon>
                            <ListItemText primary={warning} />
                          </ListItem>
                        )
                      )}
                    </List>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </>
      )}
    </Box>
  );
};
