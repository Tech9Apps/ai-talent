import React, { useRef, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  CardActionArea,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import { CloudUpload, CheckCircle, Description } from "@mui/icons-material";
import { uploadFile, processFileWithAI, findJobMatches, deleteCV, FunctionsError, getFriendlyErrorMessage, validateFile } from "../../utils/functions";
import { FILE_VALIDATION_CONFIG, SUPPORTED_FILE_TYPES } from "../../../shared";
import { useUserFiles } from "../../contexts/hooks/useUserFiles";

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
  // Get user files data
  const { cvFile, loading: filesLoading } = useUserFiles();
  
  // Get accepted file types from shared constants
  const acceptedFiles = SUPPORTED_FILE_TYPES[type].join(',');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [steps, setSteps] = useState<ProcessStep[]>([]);

  // Initialize steps based on whether we need to delete existing CV
  const initializeSteps = (needsDelete = false) => {
    const baseSteps = [
      { id: 1, name: "Uploading file", status: 'pending' as const },
      { id: 2, name: "Analyzing with AI", status: 'pending' as const },
      { id: 3, name: "Finding matches", status: 'pending' as const }
    ];

    if (needsDelete && type === 'cv') {
      baseSteps.unshift({ id: 0, name: "Removing existing CV", status: 'pending' as const });
    }

    setSteps(baseSteps);
  };
  
  const [isProcessing, setIsProcessing] = useState(false);
  const currentStepRef = useRef<number | null>(null);
  
  // Dialog state for CV replacement confirmation
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const updateStep = (stepId: number, status: ProcessStep['status'], message?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, message } : step
    ));
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    forceReplace = false
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // If this is CV upload and user already has a CV, show confirmation dialog
    if (type === 'cv' && cvFile && !forceReplace) {
      setPendingFile(file);
      setShowReplaceDialog(true);
      return;
    }

    await processFileUpload(file);
  };

  const processFileUpload = async (file: File) => {

    setIsProcessing(true);
    
    // Initialize steps - add deletion step if replacing CV
    const needsDelete = type === 'cv' && !!cvFile;
    initializeSteps(needsDelete);

    try {
      // Validate file first using shared validation
      validateFile(file, type);
      if (file.size > FILE_VALIDATION_CONFIG.maxSizeBytes) {
        throw new Error(`File exceeds AI analysis limit (${Math.round(FILE_VALIDATION_CONFIG.maxSizeBytes/1024/1024)}MB)`);
      }
      
      let currentStep = needsDelete ? 0 : 1;

      // Step 0: Delete existing CV if needed
      if (needsDelete && cvFile) {
        currentStepRef.current = 0;
        updateStep(0, 'processing', 'Removing existing CV...');
        await deleteCV(cvFile.id);
        updateStep(0, 'completed', 'Existing CV removed');
        currentStep = 1;
      }
      
      // Step 1: Upload file
      currentStepRef.current = currentStep;
      updateStep(currentStep, 'processing', 'Uploading your file...');
      const result = await uploadFile(file, type);
      updateStep(currentStep, 'completed', 'File uploaded successfully');
      
      // Step 2: AI Analysis
      currentStep++;
      currentStepRef.current = currentStep;
      updateStep(currentStep, 'processing', 'Analyzing with AI...');
      const aiResult = await processFileWithAI(result.fileId, type);
      const hasAIWarnings = aiResult.warnings && aiResult.warnings.length > 0;
      updateStep(currentStep, hasAIWarnings ? 'warning' : 'completed', 
        hasAIWarnings 
          ? `AI analysis completed with ${aiResult.warnings.length} warnings`
          : 'AI analysis completed'
      );
      
      // Step 3: Find matches (only for CVs)
      currentStep++;
      currentStepRef.current = currentStep;
      updateStep(currentStep, 'processing', 'Finding job matches...');
      if (type === 'cv') {
        const matchResult = await findJobMatches(result.fileId);
        updateStep(currentStep, 'completed', `Found ${matchResult.totalMatches || 0} job matches`);
      } else {
        // For job descriptions, just mark as completed without actual matching
        await new Promise(resolve => setTimeout(resolve, 1000));
        updateStep(currentStep, 'completed', 'Job description processed');
      }
      
      console.log("Full process completed:", result);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: unknown) {
      console.error("Upload error:", error);
      
      // Mark the current step (or the last processing) as error
      const processingStep = steps.find(step => step.status === 'processing');
      const failingStepId = currentStepRef.current || processingStep?.id;
      if (failingStepId) {
        // Use improved error handling with more context
        let errorMessage: string;
        
        if (error instanceof FunctionsError) {
          errorMessage = error.message;
        } else {
          errorMessage = getFriendlyErrorMessage(error);
        }
        // Normalize internal generic codes
        if (errorMessage === 'internal') {
          errorMessage = 'AI processing failed. Please try again or use a smaller/cleaner file.';
        }
        
        // Add context about what failed if it's a generic error
        if (errorMessage === "An unexpected error occurred") {
          errorMessage = `Failed to upload ${file.name}. Please check your file and try again.`;
        } else if (errorMessage === "Server error occurred. Please try again later") {
          errorMessage = `Failed to process ${file.name}. The file may be corrupted or the server is experiencing issues. Please try again later.`;
        }
        
        updateStep(failingStepId, 'error', errorMessage);
      }
      
      // Reset file input on error
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReplace = async () => {
    if (pendingFile) {
      setShowReplaceDialog(false);
      await processFileUpload(pendingFile);
      setPendingFile(null);
    }
  };

  const handleCancelReplace = () => {
    setShowReplaceDialog(false);
    setPendingFile(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
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

          {/* Show existing CV if it exists and this is a CV upload card */}
          {type === 'cv' && cvFile && !filesLoading && (
            <Box sx={{ 
              mt: 1, 
              p: 2, 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 1,
              backgroundColor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <Description sx={{ color: 'primary.main' }} />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {cvFile.fileName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Uploaded on {cvFile.uploadedAt.toLocaleDateString()}
                </Typography>
              </Box>
              <Chip 
                label={cvFile.aiProcessed ? 'Processed' : 'Processing'} 
                color={cvFile.aiProcessed ? 'success' : 'warning'}
                size="small"
              />
            </Box>
          )}

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
                      {step.message || `${step.name} failed`}
                    </Alert>
                  )}
                </Box>
              ))}
            </Box>
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

    {/* CV Replacement Confirmation Dialog */}
    <Dialog open={showReplaceDialog} onClose={handleCancelReplace}>
      <DialogTitle>Replace Existing CV?</DialogTitle>
      <DialogContent>
        <DialogContentText>
          You already have a CV uploaded ({cvFile?.fileName}). 
          Uploading a new CV will permanently replace the existing one and remove all its associated data.
          Are you sure you want to continue?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancelReplace} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleConfirmReplace} color="error" variant="contained">
          Replace CV
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};
