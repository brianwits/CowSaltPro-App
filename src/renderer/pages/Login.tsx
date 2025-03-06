import React, { useState, useEffect } from 'react';
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
  CircularProgress,
  IconButton,
  InputAdornment,
  useTheme,
  alpha,
  Fade,
  Grow,
} from '@mui/material';
import {
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  LockOutlined,
  Person,
  Security,
  Speed,
  FlashOn
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';

// Styled components for visual enhancements
const GlowingPaper = styled(Paper)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
  backdropFilter: 'blur(10px)',
  boxShadow: `0 8px 32px 0 ${alpha(theme.palette.primary.main, 0.2)}`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(4),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: `linear-gradient(45deg, transparent, ${alpha(theme.palette.primary.main, 0.2)}, transparent)`,
    transform: 'rotate(45deg)',
    animation: 'glowingEffect 3s linear infinite',
  },
  '@keyframes glowingEffect': {
    '0%': {
      transform: 'translateX(-100%) translateY(-100%) rotate(45deg)',
    },
    '100%': {
      transform: 'translateX(100%) translateY(100%) rotate(45deg)',
    },
  },
}));

const GlowingAvatar = styled(Avatar)(({ theme }) => ({
  width: 80,
  height: 80,
  margin: '0 auto 16px',
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  boxShadow: `0 4px 20px 0 ${alpha(theme.palette.primary.main, 0.5)}`,
  animation: 'pulseEffect 2s infinite alternate',
  '@keyframes pulseEffect': {
    '0%': {
      boxShadow: `0 4px 20px 0 ${alpha(theme.palette.primary.main, 0.5)}`,
    },
    '100%': {
      boxShadow: `0 4px 30px 0 ${alpha(theme.palette.primary.main, 0.8)}`,
    },
  },
}));

const FloatingElement = styled(Box)(({ theme }) => ({
  position: 'absolute',
  borderRadius: '50%',
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.4)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
  backdropFilter: 'blur(5px)',
  animation: 'floatEffect 10s infinite ease-in-out',
  '@keyframes floatEffect': {
    '0%, 100%': {
      transform: 'translateY(0) scale(1)',
    },
    '50%': {
      transform: 'translateY(-20px) scale(1.05)',
    },
  },
}));

const HeroTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  textShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.3)}`,
  letterSpacing: '1px',
}));

// Default logo and banner paths (can be overridden by system settings)
const DEFAULT_LOGO = '../assets/images/default-logo.png';
const DEFAULT_BANNER = '../assets/images/default-banner.jpg';

const Login: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [animate, setAnimate] = useState(false);
  
  const logoImage = localStorage.getItem('logoImage') || DEFAULT_LOGO;
  const bannerImage = localStorage.getItem('bannerImage') || DEFAULT_BANNER;
  const companyName = localStorage.getItem('companyName') || 'CowSalt Pro';
  
  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await login(username, password);
      if (response.success) {
        navigate('/');
      } else {
        setError(response.error || 'Invalid username or password');
      }
    } catch (err) {
      setError('An error occurred during login');
      console.error('Login error:', err);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 35%, ${theme.palette.secondary.dark} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background elements */}
      {[...Array(5)].map((_, index) => (
        <FloatingElement
          key={index}
          sx={{
            width: `${70 + Math.random() * 100}px`,
            height: `${70 + Math.random() * 100}px`,
            left: `${Math.random() * 90}%`,
            top: `${Math.random() * 90}%`,
            animationDelay: `${index * 0.5}s`,
            opacity: 0.4 + Math.random() * 0.3,
            zIndex: 0,
          }}
        />
      ))}

      <Grid container>
        {/* Login Form - Left Side */}
        <Grid 
          item 
          xs={12} 
          md={6} 
          component={motion.div}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Box
            sx={{
              height: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: 4,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <GlowingPaper
              elevation={6}
              sx={{
                width: '100%',
                maxWidth: 450,
              }}
            >
              <Grow in={animate} timeout={800}>
                <Box sx={{ textAlign: 'center' }}>
                  <GlowingAvatar>
                    <LockIcon fontSize="large" />
                  </GlowingAvatar>
                  <Typography 
                    variant="h4" 
                    component="h1" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 'bold',
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      backgroundClip: 'text',
                      textFillColor: 'transparent',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {companyName}
                  </Typography>
                  <Typography 
                    variant="subtitle1" 
                    color="text.secondary"
                    sx={{ mb: 3 }}
                  >
                    Sign in to continue
                  </Typography>
                </Box>
              </Grow>

              {error && (
                <Fade in={!!error} timeout={500}>
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 2,
                      borderRadius: theme.shape.borderRadius * 1.5,
                      animation: 'shake 0.5s',
                      '@keyframes shake': {
                        '0%, 100%': { transform: 'translateX(0)' },
                        '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
                        '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
                      },
                    }}
                  >
                    {error}
                  </Alert>
                </Fade>
              )}

              <form onSubmit={handleLogin}>
                <TextField
                  fullWidth
                  label="Username"
                  variant="outlined"
                  margin="normal"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="primary" />
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: theme.shape.borderRadius * 1.5,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                      },
                      '&.Mui-focused': {
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                      },
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  margin="normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                          disabled={isLoading}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: theme.shape.borderRadius * 1.5,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                      },
                      '&.Mui-focused': {
                        boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                      },
                    },
                  }}
                />
                <Button
                  component={motion.button}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  fullWidth
                  variant="contained"
                  size="large"
                  type="submit"
                  disabled={isLoading}
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    borderRadius: theme.shape.borderRadius * 1.5,
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    boxShadow: `0 4px 20px 0 ${alpha(theme.palette.primary.main, 0.5)}`,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(90deg, transparent, ${alpha('#fff', 0.2)}, transparent)`,
                      transition: 'all 0.5s',
                    },
                    '&:hover::before': {
                      left: '100%',
                    },
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
              
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  mt: 4,
                  opacity: 0.9
                }}
                component={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mx: 1 }}>
                  <Security fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                  <Typography variant="caption">Secure</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mx: 1 }}>
                  <Speed fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                  <Typography variant="caption">Fast</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mx: 1 }}>
                  <FlashOn fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                  <Typography variant="caption">Powerful</Typography>
                </Box>
              </Box>
            </GlowingPaper>
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
          component={motion.div}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Box
            sx={{
              height: '100vh',
              backgroundImage: `url(${bannerImage})`,
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
                backgroundColor: alpha(theme.palette.common.black, 0.6),
                backdropFilter: 'blur(2px)',
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
              {logoImage && (
                <motion.img
                  src={logoImage}
                  alt="Company Logo"
                  style={{ 
                    width: 'auto', 
                    height: '80px', 
                    marginBottom: '24px',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                  }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                />
              )}
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
              >
                <HeroTitle variant="h3" gutterBottom>
                  Welcome to {companyName}
                </HeroTitle>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    maxWidth: 500, 
                    opacity: 0.9,
                    textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                  }}
                >
                  Your Complete ERP & POS Solution for Cow Salt Production
                </Typography>
              </motion.div>
              
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  mt: 6,
                  gap: 3
                }}
                component={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
              >
                <Box 
                  sx={{ 
                    textAlign: 'center',
                    background: alpha(theme.palette.common.white, 0.1),
                    backdropFilter: 'blur(5px)',
                    borderRadius: 2,
                    p: 2,
                    width: '120px',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                    border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                  }}
                >
                  <Typography variant="h4" fontWeight="bold">24/7</Typography>
                  <Typography variant="body2">Support</Typography>
                </Box>
                <Box 
                  sx={{ 
                    textAlign: 'center',
                    background: alpha(theme.palette.common.white, 0.1),
                    backdropFilter: 'blur(5px)',
                    borderRadius: 2,
                    p: 2,
                    width: '120px',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                    border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                  }}
                >
                  <Typography variant="h4" fontWeight="bold">99%</Typography>
                  <Typography variant="body2">Uptime</Typography>
                </Box>
                <Box 
                  sx={{ 
                    textAlign: 'center',
                    background: alpha(theme.palette.common.white, 0.1),
                    backdropFilter: 'blur(5px)',
                    borderRadius: 2,
                    p: 2,
                    width: '120px',
                    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
                    border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
                  }}
                >
                  <Typography variant="h4" fontWeight="bold">100+</Typography>
                  <Typography variant="body2">Features</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Login; 