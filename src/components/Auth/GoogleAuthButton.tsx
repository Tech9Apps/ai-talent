import React, { useState } from 'react';
import { Button, CircularProgress, Alert, Box } from '@mui/material';
import { Google } from '@mui/icons-material';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../firebase';

interface GoogleAuthButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({ 
  onSuccess, 
  onError,
  fullWidth = false,
  size = 'large'
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      
      const result = await signInWithPopup(auth, provider);
      
      if (result.user) {
        onSuccess?.();
      }
    } catch (error: unknown) {
      console.error('Google sign-in error:', error);
      let errorMessage = 'Failed to sign in with Google';
      
      if (error instanceof Error) {
        const firebaseError = error as { code?: string };
        if (firebaseError.code === 'auth/popup-closed-by-user') {
          errorMessage = 'Sign-in was cancelled';
        } else if (firebaseError.code === 'auth/popup-blocked') {
          errorMessage = 'Popup was blocked by browser';
        } else if (firebaseError.code === 'auth/cancelled-popup-request') {
          errorMessage = 'Sign-in was cancelled';
        }
      }
      
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Button
        variant="contained"
        size={size}
        fullWidth={fullWidth}
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Google />}
        onClick={handleGoogleSignIn}
        disabled={loading}
        sx={{
          backgroundColor: '#4285f4',
          color: 'white',
          '&:hover': {
            backgroundColor: '#3367d6',
          },
          '&:disabled': {
            backgroundColor: '#cccccc',
          },
          textTransform: 'none',
          fontWeight: 500,
          py: size === 'large' ? 1.5 : 1,
          px: 3,
        }}
      >
        {loading ? 'Signing in...' : 'Sign in with Google'}
      </Button>
    </Box>
  );
};