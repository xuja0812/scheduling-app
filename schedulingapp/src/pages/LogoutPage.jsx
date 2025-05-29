// src/pages/LogoutPage.jsx
import { Box, Typography, Button, Paper } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';

const LogoutPage = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:4000/logout', {
        method: 'GET',
        credentials: 'include',
      });
      console.log("logged out");
      // navigate('/'); 
      window.location.href="/";
    } catch (error) {
      console.error('Logout failed:', error);
    }
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
          Log out
        </Typography>
        <Typography
          variant="body1"
          sx={{
            mb: 4,
            color: '#475569',
          }}
        >
          Click below to securely log out of your account.
        </Typography>
        <Button
          variant="contained"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          fullWidth
          sx={{
            backgroundColor: '#ef4444',
            color: '#ffffff',
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '1rem',
            py: 1.5,
            borderRadius: 2,
            '&:hover': {
              backgroundColor: '#dc2626',
            },
          }}
        >
          Log Out
        </Button>
      </Paper>
    </Box>
  );
};

export default LogoutPage;
