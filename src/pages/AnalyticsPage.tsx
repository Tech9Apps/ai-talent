import React from 'react';
import { Container, Typography, Card, CardContent, Box } from '@mui/material';
import { Construction } from '@mui/icons-material';

export const AnalyticsPage: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Construction sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 400 }}>
          Analytics Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Advanced analytics and reporting features coming soon
        </Typography>
        
        <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              What's Coming
            </Typography>
            <Box sx={{ textAlign: 'left' }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Detailed CV analysis reports
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Job matching success rates
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                • Performance metrics and trends
              </Typography>
              <Typography variant="body2">
                • Export capabilities and integrations
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};