// src/pages/LoginPage.jsx
import { Box, Typography, Button, Paper } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

const LoginPage = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
  const handleLogin = () => {
    window.location.href = `${backendUrl}/auth/google`;
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a, #1e3a8a)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 6,
          borderRadius: 4,
          maxWidth: 420,
          width: '100%',
          textAlign: 'center',
          backgroundColor: '#ffffff',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            mb: 2,
            fontWeight: 700,
            color: '#1e293b',
          }}
        >
          Welcome Back
        </Typography>
        <Typography
          variant="body1"
          sx={{
            mb: 4,
            color: '#475569',
          }}
        >
          Sign in to access your schedules
        </Typography>
        <Button
          variant="contained"
          startIcon={<GoogleIcon />}
          onClick={handleLogin}
          fullWidth
          sx={{
            backgroundColor: '#4285F4',
            color: '#ffffff',
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '1rem',
            py: 1.5,
            borderRadius: 2,
            '&:hover': {
              backgroundColor: '#357ae8',
            },
          }}
        >
          Sign in with Google
        </Button>
      </Paper>
    </Box>
  );
};

export default LoginPage; 