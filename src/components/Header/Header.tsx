import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Button,
  Chip,
  InputBase,
  alpha,
} from '@mui/material';
import {
  SmartToy,
  Notifications,
  Dashboard,
  Search,
  Apps,
} from '@mui/icons-material';
import type { User, NotificationItem } from '../../types';
import { useThemeContext } from '../../contexts/hooks/useThemeContext';

interface HeaderProps {
  user: User | null;
  notifications?: NotificationItem[];
}

export const Header: React.FC<HeaderProps> = ({ 
  user, 
  notifications = [] 
}) => {
  const { mode } = useThemeContext();
  const navigate = useNavigate();
  
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [appsAnchor, setAppsAnchor] = useState<null | HTMLElement>(null);
  const unreadNotifications = notifications.filter(n => n && !n.read).length;

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleAppsOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAppsAnchor(event.currentTarget);
  };

  const handleAppsClose = () => {
    setAppsAnchor(null);
  };

  const handleNavigateToAnalytics = () => {
    navigate('/analytics');
    handleAppsClose();
  };

  const handleNavigateHome = () => {
    navigate('/');
  };

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        color: 'text.primary'
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: 3 }}>
        {/* Left side - Logo and brand */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton 
            onClick={handleNavigateHome}
            sx={{ p: 0.5, mr: 1 }}
          >
            <SmartToy sx={{ color: 'primary.main', fontSize: 32 }} />
          </IconButton>
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              fontWeight: 400,
              cursor: 'pointer',
              color: 'text.primary',
              '&:hover': { color: 'primary.main' }
            }}
            onClick={handleNavigateHome}
          >
            AI-Talent
          </Typography>
          <Chip 
            label="BETA" 
            size="small" 
            color="primary" 
            variant="outlined"
            sx={{ ml: 1, fontSize: '0.7rem', height: 20 }}
          />
        </Box>

        {/* Center - Search bar (only show when user is logged in) */}
        {user && (
          <Box
            sx={{
              position: 'relative',
              borderRadius: 1,
              backgroundColor: alpha(mode === 'light' ? '#000' : '#fff', 0.05),
              '&:hover': {
                backgroundColor: alpha(mode === 'light' ? '#000' : '#fff', 0.08),
              },
              marginLeft: 0,
              width: '100%',
              maxWidth: 600,
              mx: 3,
            }}
          >
            <Box
              sx={{
                padding: '0 16px',
                height: '100%',
                position: 'absolute',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Search sx={{ color: 'text.secondary' }} />
            </Box>
            <InputBase
              placeholder="Search projects and files…"
              sx={{
                color: 'inherit',
                width: '100%',
                '& .MuiInputBase-input': {
                  padding: '8px 16px 8px 56px',
                  fontSize: '0.875rem',
                },
              }}
            />
          </Box>
        )}

        {/* Right side - User actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {user ? (
            <>
              {/* Apps menu */}
              <IconButton onClick={handleAppsOpen} size="small" sx={{ color: 'text.secondary' }}>
                <Apps />
              </IconButton>

              <Menu
                anchorEl={appsAnchor}
                open={Boolean(appsAnchor)}
                onClose={handleAppsClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleNavigateToAnalytics}>
                  <ListItemIcon>
                    <Dashboard fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Analytics</ListItemText>
                </MenuItem>
              </Menu>

              {/* Notifications */}
              <IconButton onClick={handleNotificationOpen} size="small" sx={{ color: 'text.secondary' }}>
                <Badge badgeContent={unreadNotifications} color="error">
                  <Notifications />
                </Badge>
              </IconButton>

              <Menu
                anchorEl={notificationAnchor}
                open={Boolean(notificationAnchor)}
                onClose={handleNotificationClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  sx: { maxWidth: 300, minWidth: 280 }
                }}
              >
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notification) => (
                    <MenuItem key={notification.id} onClick={handleNotificationClose}>
                      <Typography variant="body2" color="text.secondary">
                        {notification.message}
                      </Typography>
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem onClick={handleNotificationClose}>
                    <Typography variant="body2" color="text.secondary">
                      No new notifications
                    </Typography>
                  </MenuItem>
                )}
              </Menu>
            </>
          ) : (
            /* Sign In button when user is not authenticated */
            <Button
              variant="contained"
              size="small"
              sx={{ ml: 2 }}
              onClick={() => navigate('/auth')}
            >
              Sign In
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};