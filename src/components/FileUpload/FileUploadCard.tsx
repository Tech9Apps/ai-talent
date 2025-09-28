import React, { useRef, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  CardActionArea,
} from "@mui/material";
import { CloudUpload, CheckCircle } from "@mui/icons-material";
import { uploadFile, processFileWithAI, findJobMatches, FunctionsError, getFriendlyErrorMessage, validateFile } from "../../utils/functions";
import { SUPPORTED_FILE_TYPES } from "../../../shared";

type ProcessStep = {
  id: number;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'warning' | 'error';
  message?: string;
};

interface FileUploadCardProps {
  type: "cv" | "jobDescription";
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const FileUploadCard: React.FC<FileUploadCardProps> = ({
  type,
  title,
  description,
  icon,
}) => {
  // Get accepted file types from shared constants
  const acceptedFiles = SUPPORTED_FILE_TYPES[type].join(',');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [steps, setSteps] = useState<ProcessStep[]>([
    { id: 1, name: "Uploading file", status: 'pending' },
    { id: 2, name: "Analyzing with AI", status: 'pending' },
    { id: 3, name: "Finding matches", status: 'pending' }
  ]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStep = (stepId: number, status: ProcessStep['status'], message?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, message } : step
    ));
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    
    // Reset all steps
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending' as const })));

    try {
      // Validate file first using shared validation
      validateFile(file, type);
      
      // Step 1: Upload file
      updateStep(1, 'processing', 'Uploading your file...');
      const result = await uploadFile(file, type);
      updateStep(1, 'completed', 'File uploaded successfully');
      
      // Step 2: AI Analysis
      updateStep(2, 'processing', 'Analyzing with AI...');
      const aiResult = await processFileWithAI(result.fileId, type);
      const hasAIWarnings = aiResult.warnings && aiResult.warnings.length > 0;
      updateStep(2, hasAIWarnings ? 'warning' : 'completed', 
        hasAIWarnings 
          ? `AI analysis completed with ${aiResult.warnings.length} warnings`
          : 'AI analysis completed'
      );
      
      // Step 3: Find matches (only for CVs)
      updateStep(3, 'processing', 'Finding job matches...');
      if (type === 'cv') {
        const matchResult = await findJobMatches(result.fileId);
        updateStep(3, 'completed', `Found ${matchResult.totalMatches || 0} job matches`);
      } else {
        // For job descriptions, just mark as completed without actual matching
        await new Promise(resolve => setTimeout(resolve, 1000));
        updateStep(3, 'completed', 'Job description processed');
      }
      
      console.log("Full process completed:", result);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: unknown) {
      console.error("Upload error:", error);
      
      // Find which step is currently processing and mark it as error
      const processingStep = steps.find(step => step.status === 'processing');
      if (processingStep) {
        updateStep(processingStep.id, 'error', `${processingStep.name} failed`);
      }
      
      // Use improved error handling with more context
      let errorMessage: string;
      
      if (error instanceof FunctionsError) {
        errorMessage = error.message;
      } else {
        errorMessage = getFriendlyErrorMessage(error);
      }
      
      // Add context about what failed if it's a generic error
      if (errorMessage === "An unexpected error occurred") {
        errorMessage = `Failed to upload ${file.name}. Please check your file and try again.`;
      } else if (errorMessage === "Server error occurred. Please try again later") {
        errorMessage = `Failed to process ${file.name}. The file may be corrupted or the server is experiencing issues. Please try again later.`;
      }
      
      setError(errorMessage);
      
      // Reset file input on error
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        cursor: isProcessing ? "not-allowed" : "pointer",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "none",
        transition: "all 0.2s ease-in-out",
      }}
      onClick={!isProcessing ? handleFileSelect : undefined}
    >
      <CardActionArea>
        <CardContent
          sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}
        >
          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Box sx={{ color: "primary.main", minWidth: "auto" }}>{icon}</Box>
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="h6"
                component="h2"
                gutterBottom
                sx={{ fontWeight: 500, mb: 0.5 }}
              >
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            </Box>

            <Box sx={{ minWidth: "auto" }}>
              {isProcessing ? (
                <CircularProgress size={24} color="primary" />
              ) : (
                <CloudUpload sx={{ color: "primary.main", fontSize: 24 }} />
              )}
            </Box>
          </Box>

          {/* Process Steps */}
          {(isProcessing || steps.some(step => step.status === 'completed' || step.status === 'warning')) && (
            <Box sx={{ mt: 2 }}>
              {steps.map((step) => (
                <Box key={step.id} sx={{ mb: 1 }}>
                  {step.status === 'processing' && (
                    <Alert 
                      severity="info" 
                      sx={{ 
                        alignItems: 'center',
                        '& .MuiAlert-message': { 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1 
                        }
                      }}
                    >
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      {step.message || step.name}
                    </Alert>
                  )}
                  {step.status === 'completed' && (
                    <Alert 
                      severity="success"
                      icon={<CheckCircle />}
                    >
                      {step.message || `${step.name} completed`}
                    </Alert>
                  )}
                  {step.status === 'warning' && (
                    <Alert 
                      severity="warning"
                      icon={<CheckCircle />}
                    >
                      {step.message || `${step.name} completed with warnings`}
                    </Alert>
                  )}
                  {step.status === 'error' && (
                    <Alert severity="error">
                      {step.name} failed
                    </Alert>
                  )}
                </Box>
              ))}
            </Box>
          )}

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFiles}
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
