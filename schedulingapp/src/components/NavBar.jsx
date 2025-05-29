import React, { useEffect, useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { keyframes } from '@mui/system';

const gradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

export default function NavBar() {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
    fetch(`${backendUrl}/me`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Not signed in');
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  const navItems = user
    ? [
        { label: 'Class Planner', to: '/planner' },
        { label: 'Class Catalog', to: '/classes' },
        { label: 'My Dashboard', to: '/dashboard' },
        ...(user.role === 'admin' ? [{ label: 'All Schedules', to: '/all' }] : []),
        { label: 'Log Out', to: '/leave' },
      ]
    : [{ label: 'Log In', to: '/' }];

  return (
    <AppBar
      position="fixed"
      sx={{
        background: `linear-gradient(270deg, #3a4f7a, #2a65a0, #5a7dbf, #4271af, #2d5493)`,
        backgroundSize: '1000% 1000%',
        animation: `${gradientAnimation} 40s ease infinite`,
        boxShadow: '0 3px 10px rgba(0,0,0,0.15)',
        zIndex: 1300,
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          px: 3,
          py: 1,
        }}
      >
        <Typography
          variant="h5"
          component={Link}
          to="/dashboard"
          sx={{
            fontWeight: '700',
            color: 'white',
            textDecoration: 'none',
            letterSpacing: 1.2,
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'color 0.3s ease',
            '&:hover': {
              color: '#4db6ac',
            },
          }}
        >
          Class Scheduler
        </Typography>

        <Box
          component="nav"
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            justifyContent: { xs: 'center', sm: 'flex-end' },
            mt: { xs: 1, sm: 0 },
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          {navItems.map(({ label, to }) => {
            const isActive = location.pathname === to;
            return (
              <Button
                key={to}
                component={Link}
                to={to}
                size="small"
                sx={{
                  color: isActive ? '#4db6ac' : 'white',
                  fontWeight: isActive ? '600' : '400',
                  textTransform: 'none',
                  transition: 'color 0.3s ease',
                  position: 'relative',
                  '&:hover': {
                    color: '#4db6ac',
                    transform: 'none',
                    textShadow: 'none',
                  },
                  '&::after': isActive
                    ? {
                        content: '""',
                        position: 'absolute',
                        bottom: -3,
                        left: 0,
                        width: '100%',
                        height: 2,
                        backgroundColor: '#4db6ac',
                        borderRadius: 1,
                      }
                    : {},
                }}
              >
                {label}
              </Button>
            );
          })}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
