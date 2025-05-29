import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const navigate = useNavigate();

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  useEffect(() => {
    fetch(`${backendUrl}/me`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        const route = '/api/plans';
        return fetch(`${backendUrl}${route}`, { credentials: 'include' });
      })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch schedules');
        return res.json();
      })
      .then((data) => setSchedules(data))
      .catch(() => setUser(null));
  }, []);

  if (!user) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          pt: '96px',
          backgroundColor: '#0f172a',
          px: 4,
          color: '#f8fafc',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <Typography variant="h6" align="center">
          Please sign in
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        pt: '96px',
        pb: 8,
        px: 4,
        mt: 8,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Typography
        variant="h4"
        sx={{
          mb: 6,
          fontWeight: 600,
          textAlign: 'center',
          color: '#f8fafc',
        }}
      >
        Dashboard
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4 }}>
        <Button
          variant="contained"
          onClick={() => navigate('/classes')}
          sx={{
            color: '#fff',
          }}
        >
          View Classes
        </Button>
        <Button
          variant="contained"
          onClick={() => navigate('/planner')}
          sx={{
            color: '#fff',
          }}
        >
          Go to Planner
        </Button>
      </Box>

      <Paper
        elevation={3}
        sx={{
          maxWidth: '800px',
          mx: 'auto',
          px: 3,
          py: 3,
          borderRadius: 3,
          backgroundColor: '#ffffff',
          boxShadow: '0px 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1e293b' }}>
          Welcome, {user.name} ({user.role})
        </Typography>
        <Divider sx={{ mb: 2, borderColor: '#cbd5e1' }} />
        <Typography variant="subtitle1" sx={{ mb: 2, color: '#334155' }}>
          Your Schedules:
        </Typography>
        {schedules.length > 0 ? (
          <List>
            {schedules.map((s, i) => (
              <ListItem key={i} disablePadding>
                <ListItemText
                  primary={s.name}
                  primaryTypographyProps={{ color: '#0f172a' }}
                  secondaryTypographyProps={{ color: '#475569' }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            No schedules found.
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default Dashboard;
