import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Badge,
} from '@mui/material';
import {
  DarkMode,
  LightMode,
  Logout,
  AccountCircle,
  Notifications,
} from '@mui/icons-material';
import type { NotificationItem } from '../../types';
import { useThemeContext } from '../../contexts/hooks/useThemeContext';
import { useAuthContext } from '../../contexts/hooks/useAuthContext';

interface SideNavProps {
  notifications?: NotificationItem[];
}

export const SideNav: React.FC<SideNavProps> = ({ notifications = [] }) => {
  const { mode, toggleTheme } = useThemeContext();
  const { user, logout } = useAuthContext();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);

  const unreadNotifications = notifications.filter((n) => n && !n.read).length;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogoutClick = async () => {
    handleMenuClose();
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        right: 0,
        top: 0,
        height: '100vh',
        width: 64,
        backgroundColor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 2,
        zIndex: 1200,
      }}
    >
      {/* Top section - User Avatar and Notifications (if logged in) */}
      <Box sx={{ flexGrow: 0 }}>
        {user ? (
          <>
            <IconButton 
              onClick={handleMenuOpen}
              sx={{ mb: 1 }}
            >
              <Avatar
                sx={{ width: 40, height: 40 }}
                src={user.photoURL || undefined}
                alt={user.displayName || user.email || 'User'}
              >
                {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
              PaperProps={{
                sx: { minWidth: 200 }
              }}
            >
              <MenuItem onClick={handleMenuClose}>
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                <ListItemText>
                  <Typography variant="body2">{user.email}</Typography>
                </ListItemText>
              </MenuItem>
              <MenuItem onClick={handleLogoutClick}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                <ListItemText>Sign Out</ListItemText>
              </MenuItem>
            </Menu>

            {/* Notifications right below avatar */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <IconButton
                onClick={handleNotificationOpen}
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  }
                }}
              >
                <Badge badgeContent={unreadNotifications} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Box>

            <Menu
              anchorEl={notificationAnchor}
              open={Boolean(notificationAnchor)}
              onClose={handleNotificationClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'left', vertical: 'top' }}
              PaperProps={{
                sx: { maxWidth: 300, minWidth: 280 },
              }}
            >
              {notifications.length > 0 ? (
                notifications.slice(0, 5).map((notification) => (
                  <MenuItem
                    key={notification.id}
                    onClick={handleNotificationClose}
                  >
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
        ) : null}
      </Box>

      {/* Spacer to push theme button to bottom */}
      <Box sx={{ flexGrow: 1 }} />

      {/* Bottom section - Theme toggle */}
      <Box sx={{ flexGrow: 0 }}>
        <IconButton 
          onClick={toggleTheme} 
          sx={{ 
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'action.hover',
            }
          }}
        >
          {mode === 'dark' ? <LightMode /> : <DarkMode />}
        </IconButton>
      </Box>
    </Box>
  );
};