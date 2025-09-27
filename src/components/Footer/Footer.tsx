import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
} from '@mui/material';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box 
      component="footer" 
      sx={{ 
        mt: 'auto', 
        py: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Container maxWidth="xl">
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link 
              href="#" 
              color="text.secondary" 
              sx={{ 
                textDecoration: 'none',
                fontSize: '0.8rem',
                '&:hover': { color: 'primary.main' }
              }}
            >
              Help
            </Link>
            <Link 
              href="#" 
              color="text.secondary" 
              sx={{ 
                textDecoration: 'none',
                fontSize: '0.8rem',
                '&:hover': { color: 'primary.main' }
              }}
            >
              Privacy & Terms
            </Link>
            <Link 
              href="#" 
              color="text.secondary" 
              sx={{ 
                textDecoration: 'none',
                fontSize: '0.8rem',
                '&:hover': { color: 'primary.main' }
              }}
            >
              Support
            </Link>
            <Link 
              href="#" 
              color="text.secondary" 
              sx={{ 
                textDecoration: 'none',
                fontSize: '0.8rem',
                '&:hover': { color: 'primary.main' }
              }}
            >
              Contact
            </Link>
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
            © {currentYear} AI-Talent. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};