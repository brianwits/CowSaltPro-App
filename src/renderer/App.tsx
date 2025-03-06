import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container } from '@mui/material';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import theme from './theme';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import DebugPanel from './components/DebugPanel';
import QuickActions from './components/QuickActions';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth guard component to protect routes
const AuthGuard = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Check role requirement if specified
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

// Simple placeholder for UserManagement component
const UserManagementPlaceholder: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>User Management</h1>
      <p>The User Management module is currently being loaded or unavailable.</p>
      <p>Please check back later or contact your administrator.</p>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [debugState] = useState({
    version: '1.0.0',
    environment: process.env.NODE_ENV,
    platform: process.platform,
  });

  const debugActions: { name: string; handler: () => void }[] = [
    {
      name: 'Toggle Theme',
      handler: () => {
        // Theme toggle logic will be implemented later
        console.log('Theme toggle clicked');
      },
    },
    {
      name: 'Clear Cache',
      handler: () => {
        localStorage.clear();
        console.log('Cache cleared');
      },
    },
    {
      name: 'Reload App',
      handler: () => {
        window.location.reload();
      },
    },
  ];

  return (
    <>
      {isAuthenticated && <Navigation />}
      <Container 
        component="main" 
        maxWidth={false} 
        sx={{ 
          mt: isAuthenticated ? 8 : 0, 
          mb: 4, 
          p: isAuthenticated ? 2 : 0,
          height: !isAuthenticated ? '100vh' : undefined
        }}
      >
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <AuthGuard>
              <Dashboard />
            </AuthGuard>
          } />
          
          <Route path="/inventory" element={
            <AuthGuard>
              <Inventory />
            </AuthGuard>
          } />
          
          <Route path="/pos" element={
            <AuthGuard>
              <POS />
            </AuthGuard>
          } />
          
          <Route path="/reports" element={
            <AuthGuard>
              <Reports />
            </AuthGuard>
          } />
          
          <Route path="/settings" element={
            <AuthGuard>
              <Settings />
            </AuthGuard>
          } />
          
          <Route path="/user-management" element={
            <AuthGuard requiredRole="admin">
              <UserManagementPlaceholder />
            </AuthGuard>
          } />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        {process.env.NODE_ENV === 'development' && (
          <DebugPanel
            componentName="App"
            state={debugState}
            actions={debugActions}
          />
        )}
      </Container>
      
      {/* Add global quick actions (only when authenticated) */}
      {isAuthenticated && 
        <QuickActions 
          // Hide on the settings page since it has its own QuickActions
          // with specific actions related to settings
          showHelp={window.location.pathname.indexOf('/settings') === -1}
          position={window.location.pathname.indexOf('/settings') === -1 ? 'bottom-right' : 'custom'}
          customPosition={{ bottom: -100, right: -100 }} // Hide it off-screen on settings page
        />
      }
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotificationProvider>
        <Router>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  );
};

export default App;
 