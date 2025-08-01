import { Box, Typography, Button, Paper } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";
import { keyframes } from "@mui/system";

const subtleGlow = keyframes`
  0%, 100% { opacity: 0.9; }
  50% { opacity: 1; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const LogoutPage = () => {
  const navigate = useNavigate();
  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  const handleLogout = async () => {
    try {
      await fetch(`${backendUrl}/logout`, {
        method: "GET",
        credentials: "include",
      });
      console.log("logged out");
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f172a 0%, #1c2333 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        fontFamily:
          '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 8,
          borderRadius: "20px",
          maxWidth: "480px",
          width: "100%",
          textAlign: "center",
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(148, 163, 184, 0.1)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          animation: `${fadeIn} 0.6s ease-out`,
          position: "relative",
          transition: "all 0.2s ease-out",
        }}
      >
        <Box
          sx={{
            mb: 4,
            position: "relative",
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontFamily:
                '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontWeight: "700",
              fontSize: "2rem",
              color: "#ffffff",
              textDecoration: "none",
              mb: 1,
              position: "relative",
              "&::after": {
                content: '""',
                position: "absolute",
                bottom: -4,
                left: "50%",
                transform: "translateX(-50%)",
                width: "60px",
                height: "3px",
                background: "linear-gradient(90deg, #3b82f6, #60a5fa)",
                borderRadius: "2px",
              },
            }}
          >
            ClassSync
          </Typography>
        </Box>

        <Typography
          variant="h4"
          sx={{
            mb: 2,
            fontWeight: "600",
            color: "#ffffff",
            fontSize: "1.75rem",
            letterSpacing: "-0.025em",
          }}
        >
          Sign Out
        </Typography>

        <Typography
          variant="body1"
          sx={{
            mb: 6,
            color: "#cbd5e1",
            fontSize: "1rem",
            lineHeight: 1.6,
          }}
        >
          Click below to securely log out of your account and end your session
        </Typography>

        <Button
          variant="contained"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          fullWidth
          sx={{
            background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            color: "#ffffff",
            textTransform: "none",
            fontWeight: "500",
            fontSize: "1rem",
            py: 2,
            px: 4,
            borderRadius: "12px",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            boxShadow: "0 8px 25px rgba(239, 68, 68, 0.3)",
            transition: "all 0.2s ease-out",
            position: "relative",
            overflow: "hidden",
            "&:hover": {
              background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
              transform: "translateY(-1px)",
              boxShadow: "0 12px 35px rgba(239, 68, 68, 0.4)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
            },
            "&:active": {
              transform: "translateY(0)",
              boxShadow: "0 6px 20px rgba(239, 68, 68, 0.3)",
            },
            "& .MuiSvgIcon-root": {
              fontSize: "1.25rem",
            },
          }}
        >
          Log Out
        </Button>
        <Box
          sx={{
            position: "absolute",
            top: -1,
            left: -1,
            right: -1,
            height: "2px",
            background:
              "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent)",
            borderRadius: "20px 20px 0 0",
          }}
        />
      </Paper>
    </Box>
  );
};

export default LogoutPage;
