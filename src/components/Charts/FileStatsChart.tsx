import React from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  ArrowDownward,
  ArrowUpward,
  Remove,
  TrendingUp,
} from "@mui/icons-material";
import { useFileStats } from "../../contexts/hooks/useFileStats";
import { BarChart } from "@mui/x-charts/BarChart";

export const FileStatsChart: React.FC = () => {
  const { stats, loading, error } = useFileStats();

  if (loading) {
    return (
      <Card sx={{ height: "100%" }}>
        <CardContent
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 300,
          }}
        >
          <CircularProgress />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ height: "100%" }}>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals from all intervals
  const totalCVs = stats.reduce((sum, stat) => sum + stat.cvs, 0);
  const totalJobs = stats.reduce((sum, stat) => sum + stat.jobs, 0);

  console.log("Stats data:", stats);
  console.log("Total CVs:", totalCVs);
  console.log("Total Jobs:", totalJobs);

  // If no real data, show sample data
  const hasData = totalCVs > 0 || totalJobs > 0;

  let finalTotalCVs, finalTotalJobs;

  if (!hasData) {
    return (
      <Card sx={{ py: 4 }}>
        <Alert severity="info" sx={{ m: 2 }}>
          Start uploading files to see your totals
        </Alert>
      </Card>
    );
  } else {
    finalTotalCVs = totalCVs;
    finalTotalJobs = totalJobs;
  }

  // Calculate percentage difference (Jobs compared to CVs)
  const getPercentageDifference = (): {
    percentage: number;
    isMore: boolean;
    isEqual: boolean;
  } => {
    if (finalTotalCVs === 0 && finalTotalJobs === 0) {
      return { percentage: 0, isMore: false, isEqual: true };
    }
    if (finalTotalCVs === 0) {
      return { percentage: 100, isMore: true, isEqual: false };
    }

    const difference = ((finalTotalJobs - finalTotalCVs) / finalTotalCVs) * 100;
    return {
      percentage: Math.abs(Math.round(difference)),
      isMore: difference > 0,
      isEqual: Math.abs(difference) < 1,
    };
  };

  const { percentage, isMore, isEqual } = getPercentageDifference();

  return (
    <Card sx={{ height: "100%", border: "1px solid", borderColor: "divider" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <TrendingUp sx={{ mr: 1, color: "primary.main" }} />
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            Opportunities Comparison
          </Typography>
        </Box>
        <Box sx={{ display: "flex", mb: 2, ml: 2 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 1,
              color: isEqual
                ? "text.secondary"
                : isMore
                ? "success.dark"
                : "error.dark",
            }}
          >
            {isEqual ? (
              <Remove sx={{ fontSize: 20 }} />
            ) : isMore ? (
              <ArrowUpward sx={{ fontSize: 20 }} color="success" />
            ) : (
              <ArrowDownward sx={{ fontSize: 20 }} color="error" />
            )}
            <Typography variant="caption" sx={{ fontWeight: 500 }}>
              {isEqual
                ? "Jobs and CVs are balanced"
                : `${percentage}% ${
                    isMore ? "more" : "fewer"
                  } job positions available`}
            </Typography>
          </Box>
        </Box>

        {!hasData && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Start uploading files to see your totals
          </Typography>
        )}

        <Box sx={{ width: "100%", height: 300 }}>
          <BarChart
            series={[
              {
                data: [finalTotalCVs],
                label: "CVs",
                color: "#1976d2",
              },
              {
                data: [finalTotalJobs],
                label: "Jobs",
                color: "#ed6c02",
              },
            ]}
            xAxis={[
              {
                scaleType: "band",
                data: ["Total"],

                tickLabelStyle: {
                  fontSize: 12,
                },
              },
            ]}
            yAxis={[
              {
                tickLabelStyle: {
                  fontSize: 12,
                },
                max: Math.max(finalTotalCVs, finalTotalJobs) + 1,
                valueFormatter: (value: number) => Math.round(value).toString(),
              },
            ]}
            grid={{ horizontal: true, vertical: false }}
          />
        </Box>
      </CardContent>
    </Card>
  );
};
