import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  People,
  Assignment,
  CheckCircle,
} from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, subtitle }) => (
  <Box sx={{ p: 2, borderRadius: 1, bgcolor: 'background.paper' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
      <Box sx={{ color, mr: 1 }}>
        {icon}
      </Box>
      <Typography variant="body2" color="text.secondary">
        {title}
      </Typography>
    </Box>
    <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
      {value}
    </Typography>
    {subtitle && (
      <Typography variant="caption" color="text.secondary">
        {subtitle}
      </Typography>
    )}
  </Box>
);

interface ProgressItemProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

const ProgressItem: React.FC<ProgressItemProps> = ({ label, value, total, color }) => (
  <Box sx={{ mb: 2 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
      <Typography variant="body2">{label}</Typography>
      <Typography variant="body2" color="text.secondary">
        {value}/{total}
      </Typography>
    </Box>
    <LinearProgress 
      variant="determinate" 
      value={(value / total) * 100} 
      sx={{
        height: 6,
        borderRadius: 3,
        bgcolor: 'grey.200',
        '& .MuiLinearProgress-bar': {
          bgcolor: color,
          borderRadius: 3,
        },
      }}
    />
  </Box>
);

export const AnalyticsChart: React.FC = () => {
  // Sample data - in real app this would come from props or API
  const stats = [
    { title: 'Total Uploads', value: 142, icon: <Assignment />, color: '#1976d2' },
    { title: 'Successful Matches', value: 89, icon: <CheckCircle />, color: '#2e7d32' },
    { title: 'Active Users', value: '24', icon: <People />, color: '#ed6c02' },
    { title: 'Growth', value: '+12%', icon: <TrendingUp />, color: '#9c27b0' },
  ];

  const progressData = [
    { label: 'CV Processing', value: 45, total: 50, color: '#1976d2' },
    { label: 'Job Matching', value: 32, total: 45, color: '#2e7d32' },
    { label: 'Interviews Scheduled', value: 18, total: 32, color: '#ed6c02' },
    { label: 'Successful Placements', value: 12, total: 18, color: '#9c27b0' },
  ];

  const recentActivity = [
    { action: 'CV uploaded', time: '2 minutes ago', status: 'success' },
    { action: 'Job match found', time: '15 minutes ago', status: 'info' },
    { action: 'Interview scheduled', time: '1 hour ago', status: 'success' },
    { action: 'Profile updated', time: '2 hours ago', status: 'default' },
  ];

  return (
    <Card sx={{ height: 'fit-content' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, mb: 3 }}>
          Analytics Overview
        </Typography>
        
        {/* Stats Grid */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: 2, 
          mb: 3 
        }}>
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Progress Section */}
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>
          Pipeline Progress
        </Typography>
        
        {progressData.map((item, index) => (
          <ProgressItem key={index} {...item} />
        ))}

        <Divider sx={{ my: 3 }} />

        {/* Recent Activity */}
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 500, mb: 2 }}>
          Recent Activity
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {recentActivity.map((activity, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2">
                {activity.action}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  size="small" 
                  label={activity.time} 
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};