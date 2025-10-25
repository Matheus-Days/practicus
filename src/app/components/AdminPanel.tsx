'use client';

import React from 'react';
import { User } from 'firebase/auth';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  CssBaseline,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import {
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useFirebase } from '../hooks/firebase';
import { UserData } from '../hooks/firebase';
import { AdminProvider, useAdminContext } from '../contexts/AdminContext';
import EventsList from './admin/EventsList';
import EventDetails from './admin/EventDetails';

// Tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

interface AdminPanelContentProps {
  user: User;
  userData: UserData;
}

function AdminPanelContent({ user, userData }: AdminPanelContentProps) {
  const { auth } = useFirebase();
  const { currentView } = useAdminContext();

  const handleSignOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Header */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Painel Administrativo
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="body2" color="inherit">
              Olá, {userData.displayName || user.email}
            </Typography>
            <Button
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={handleSignOut}
              sx={{ textTransform: 'none' }}
            >
              Sair
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ flexGrow: 1, py: 3 }}>
        {currentView === 'events-list' && <EventsList />}
        {currentView === 'event-details' && <EventDetails />}
      </Container>
    </Box>
  );
}

interface AdminPanelProps {
  user: User;
  userData: UserData;
}

export default function AdminPanel({ user, userData }: AdminPanelProps) {
  return (
    <ThemeProvider theme={theme}>
      <AdminProvider user={user}>
        <AdminPanelContent user={user} userData={userData} />
      </AdminProvider>
    </ThemeProvider>
  );
} 