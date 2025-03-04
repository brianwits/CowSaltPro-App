import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Avatar,
  Grid,
} from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const DEFAULT_BANNER = './assets/default-banner.jpg';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const bannerImage = localStorage.getItem('bannerImage') || DEFAULT_BANNER;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (username === 'admin' && password === 'admin123') {
        login();
        navigate('/');
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('An error occurred during login');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: 'primary.main',
      }}
    >
      <Grid container>
        {/* Login Form - Left Side */}
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
            }}
          >
            <Paper
              elevation={3}
              sx={{
                p: 4,
                width: '100%',
                maxWidth: 400,
                borderRadius: 2,
              }}
            >
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    margin: '0 auto 16px',
                    backgroundColor: 'primary.main',
                  }}
                >
                  <LockIcon fontSize="large" />
                </Avatar>
                <Typography variant="h5" component="h1" gutterBottom>
                  CowSalt Pro
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Sign in to continue
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleLogin}>
                <TextField
                  fullWidth
                  label="Username"
                  variant="outlined"
                  margin="normal"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  variant="outlined"
                  margin="normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  type="submit"
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                >
                  Sign In
                </Button>
              </form>
            </Paper>
          </Box>
        </Grid>

        {/* Welcome Banner - Right Side */}
        <Grid
          item
          md={6}
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              height: '100vh',
              backgroundImage: `url(${bannerImage || DEFAULT_BANNER})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
              },
            }}
          >
            <Box
              sx={{
                position: 'relative',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                textAlign: 'center',
                p: 4,
              }}
            >
              <Typography variant="h3" gutterBottom fontWeight="bold">
                Welcome to CowSalt Pro
              </Typography>
              <Typography variant="h6" sx={{ maxWidth: 500, opacity: 0.9 }}>
                Your Complete ERP & POS Solution for Cow Salt Production
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Login; 