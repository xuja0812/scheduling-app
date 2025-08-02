import { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { keyframes } from "@mui/system";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const subtleGlow = keyframes`
  0%, 100% { opacity: 0.9; }
  50% { opacity: 1; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// IN PROGRESS
export default function Analytics() {
  const [classes, setClasses] = useState([]);

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  useEffect(() => {
    fetch(`${backendUrl}/analytics`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch analytics");
        return res.json();
      })
      .then((data) => {
        setClasses(data);
      });
  }, []);
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
          maxWidth: "720px",
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
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={classes}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="class_code"
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="enrollment_count" fill="white" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}
