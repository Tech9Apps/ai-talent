import React, { useRef, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';

interface FileUploadCardProps {
  type: 'cv' | 'jobDescription';
  title: string;
  description: string;
  acceptedFiles: string;
  icon: React.ReactNode;
}

export const FileUploadCard: React.FC<FileUploadCardProps> = ({
  type,
  title,
  description,
  acceptedFiles,
  icon,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Convert file to base64 for Firebase Functions
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Call Firebase Function
      const processFile = httpsCallable(functions, 'processUploadedFile');
      const result = await processFile({
        fileData,
        fileName: file.name,
        fileType: file.type,
        uploadType: type,
      });

      console.log('File processed:', result.data);
      setSuccess(`${file.name} uploaded successfully!`);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: unknown) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        cursor: loading ? 'not-allowed' : 'pointer',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 'none',
        '&:hover': {
          boxShadow: 1,
          borderColor: 'primary.main',
        },
        transition: 'all 0.2s ease-in-out',
      }}
      onClick={!loading ? handleFileSelect : undefined}
    >
      <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
        <Box sx={{ color: 'primary.main', mb: 2 }}>
          {icon}
        </Box>
        
        <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 500 }}>
          {title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {description}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }}>
            {success}
          </Alert>
        )}

        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
          disabled={loading}
          onClick={handleFileSelect}
          sx={{ mt: 'auto' }}
        >
          {loading ? 'Uploading...' : 'Choose File'}
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFiles}
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
      </CardContent>
    </Card>
  );
};