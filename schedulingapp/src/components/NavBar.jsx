import React, { useEffect, useState } from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';
import { keyframes } from '@mui/system';

const subtleGlow = keyframes`
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
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
      { label: 'Schedule', to: `/planner?studentId=${user.email}` },
      { label: 'Catalog', to: '/classes' },
      { label: 'Dashboard', to: '/dashboard' },
      ...(user.role === 'admin' ? [{ label: 'Admin', to: '/all' }, { label: 'Analytics', to: '/analytics' }] : []),
      // { label: 'Resolve Conflicts', to: '/conflicts' },
      { label: 'Account', to: '/account'},
      { label: 'Sign out', to: '/leave' },
    ]
    : [{ label: 'Sign in', to: '/' }];

  return (
    <AppBar
      position="fixed"
      sx={{
        background: 'linear-gradient(180deg, #0f172a 0%, #1c2333 100%)',
        boxShadow: 'none',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        zIndex: 1300,
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          px: { xs: 3, sm: 6 },
          py: 2,
          minHeight: '72px',
        }}
      >
        <Typography
          variant="h5"
          component={Link}
          to="/dashboard"
          sx={{
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontWeight: '700',
            fontSize: '1.5rem',
            color: '#ffffff',
            textDecoration: 'none',
            letterSpacing: '-0.025em',
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            '&:hover': {
              color: '#60a5fa',
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -2,
              left: '50%',
              transform: 'translateX(-50%) scaleX(0)',
              width: '100%',
              height: '2px',
              background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
              borderRadius: '1px',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            },
            '&:hover::after': {
              transform: 'translateX(-50%) scaleX(1)',
            },
          }}
        >
          ClassSync
        </Typography>

        <Box
          component="nav"
          sx={{
            display: 'flex',
            gap: 0.5,
            alignItems: 'center',
          }}
        >
          {navItems.map(({ label, to }, index) => {
            const isActive = location.pathname === to;
            const isSignOut = label === 'Sign out';

            return (
              <Button
                key={to}
                component={Link}
                to={to}
                sx={{
                  color: isActive ? '#ffffff' : '#94a3b8',
                  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '0.875rem',
                  textTransform: 'none',
                  borderRadius: '8px',
                  px: 3,
                  py: 1.5,
                  minWidth: 'auto',
                  position: 'relative',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: isActive
                    ? 'rgba(59, 130, 246, 0.1)'
                    : 'transparent',
                  border: isActive
                    ? '1px solid rgba(59, 130, 246, 0.2)'
                    : '1px solid transparent',
                  '&:hover': {
                    color: isSignOut ? '#f87171' : '#ffffff',
                    background: isSignOut
                      ? 'rgba(248, 113, 113, 0.05)'
                      : isActive
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'rgba(148, 163, 184, 0.05)',
                    border: isSignOut
                      ? '1px solid rgba(248, 113, 113, 0.1)'
                      : '1px solid rgba(148, 163, 184, 0.1)',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                  ...(isActive && {
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: 8,
                      transform: 'translateY(-50%)',
                      width: '3px',
                      height: '16px',
                      background: 'linear-gradient(180deg, #3b82f6, #60a5fa)',
                      borderRadius: '2px',
                      animation: `${subtleGlow} 2s ease-in-out infinite`,
                    },
                  }),
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