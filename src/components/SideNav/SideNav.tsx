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
} from '@mui/material';
import {
  DarkMode,
  LightMode,
  Logout,
  AccountCircle,
} from '@mui/icons-material';
import type { User } from '../../types';
import { useThemeContext } from '../../contexts/hooks/useThemeContext';

interface SideNavProps {
  user: User | null;
  onLogout: () => void;
}

export const SideNav: React.FC<SideNavProps> = ({ user, onLogout }) => {
  const { mode, toggleTheme } = useThemeContext();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    handleMenuClose();
    onLogout();
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
        borderLeft: '1px solid',
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 2,
        zIndex: 1200,
      }}
    >
      {/* Top section - User Avatar (if logged in) */}
      <Box sx={{ flexGrow: 0, mb: 'auto' }}>
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
          </>
        ) : null}
      </Box>

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