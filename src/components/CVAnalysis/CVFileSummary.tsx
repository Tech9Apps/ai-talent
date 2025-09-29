import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
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
  Warning,
  Person,
} from "@mui/icons-material";
import type { UserFileRecord } from "../../../shared/types/fileTypes";
import { useCVAnalysis } from "../../hooks";

interface CVFileSummaryProps {
  file: UserFileRecord;
}

export const CVFileSummary: React.FC<CVFileSummaryProps> = ({ file }) => {
  const { analysis, loading: loadingAnalysis } = useCVAnalysis(file.id || "");


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

  const getFileExtension = (fileName: string): string => {
    return fileName.split(".").pop()?.toUpperCase() || "Unknown";
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

      {/* Warnings Card - Show if analysis is complete and warnings exist */}
      {analysis && analysis.warnings && analysis.warnings.length > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <Warning color="warning" />
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                Analysis Warnings ({analysis.warnings.length})
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                The following issues were detected during analysis:
              </Typography>
            </Alert>

            <List dense>
              {analysis.warnings.map((warning: string, index: number) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Warning fontSize="small" color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body2" color="text.secondary">
                        {warning}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

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
