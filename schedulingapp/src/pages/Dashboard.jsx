import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Chip,
  Grid,
  Card,
  CardContent,
  IconButton,
} from "@mui/material";
import { keyframes } from "@mui/system";
import PieCharts from "../components/PieCharts";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [mathCredits, setMathCredits] = useState(0);
  const [englishCredits, setEnglishCredits] = useState(0);
  const [electiveCredits, setElectiveCredits] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const navigate = useNavigate();

  const ELECTIVES = 8.0;
  const MATH = 5.0;
  const ENGLISH = 5.0;

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  useEffect(() => {
    fetch(`${backendUrl}/me`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      })
      .then((data) => {
        setUser(data.user);
        const route = "/api/plans";
        return fetch(`${backendUrl}${route}`, { credentials: "include" });
      })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch schedules");
        return res.json();
      })
      .then((data) => setSchedules(data))
      .catch(() => setUser(null));
  }, []);

  const getPrereqs = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/prereqs`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (err) {
      console.error("Failed to fetch completed classes:", err);
    }
  };

  useEffect(() => {
    const calculateCredits = async () => {
      try {
        let total = 0;
        let elective = 0;
        let math = 0;
        let english = 0;

        const allCourses = await getPrereqs();

        if (allCourses) {
          allCourses.forEach((course) => {
            const credits = course.credits;
            total += credits;

            if (course.category === "Elective") {
              elective += credits;
            } else if (course.category === "Math") {
              math += credits;
            } else if (course.category === "English") {
              english += credits;
            }
          });
        }
        setTotalCredits(total);
        setElectiveCredits(elective);
        setMathCredits(math);
        setEnglishCredits(english);
      } catch (err) {
        console.error("Error calculating credits:", err);
      }
    };

    calculateCredits();
  }, []);

  if (!user) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(180deg, #0f172a 0%, #1c2333 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 4,
        }}
      >
        <Card
          sx={{
            background: "rgba(30, 41, 59, 0.8)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(148, 163, 184, 0.1)",
            borderRadius: "12px",
            p: 4,
            textAlign: "center",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: "#94a3b8",
              fontFamily:
                '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontWeight: 500,
            }}
          >
            Please sign in to continue
          </Typography>
        </Card>
      </Box>
    );
  }

  const quickActions = [
    {
      title: "Browse Classes",
      subtitle: "Explore available courses",
      action: () => navigate("/classes"),
      color: "#3b82f6",
      bgColor: "rgba(59, 130, 246, 0.1)",
    },
    {
      title: "Create Schedule",
      subtitle: "Plan your semester",
      action: () => navigate("/planner"),
      color: "#10b981",
      bgColor: "rgba(16, 185, 129, 0.1)",
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f172a 0%, #1c2333 100%)",
        pt: 25,
        pb: 8,
        px: { xs: 3, sm: 6 },
      }}
    >
      <Box
        sx={{
          maxWidth: "1200px",
          mx: "auto",
          mb: 6,
          animation: `${fadeIn} 0.6s ease-out`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 2 }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
              fontSize: "1.5rem",
              fontWeight: 700,
              fontFamily:
                '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
          >
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </Avatar>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontFamily:
                  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "-0.025em",
                mb: 0.5,
              }}
            >
              Welcome back, {user.name}
            </Typography>
            <Chip
              label={user.role === "admin" ? "Administrator" : "Student"}
              size="small"
              sx={{
                background:
                  user.role === "admin"
                    ? "rgba(248, 113, 113, 0.1)"
                    : "rgba(59, 130, 246, 0.1)",
                color: user.role === "admin" ? "#f87171" : "#60a5fa",
                border: `1px solid ${
                  user.role === "admin"
                    ? "rgba(248, 113, 113, 0.2)"
                    : "rgba(59, 130, 246, 0.2)"
                }`,
                fontFamily:
                  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                fontWeight: 500,
              }}
            />
          </Box>
        </Box>
      </Box>
      <Box sx={{ maxWidth: "1200px", mx: "auto", mb: 6 }}>
        <Typography
          variant="h6"
          sx={{
            fontFamily:
              '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontWeight: 600,
            color: "#ffffff",
            mb: 3,
          }}
        >
          Quick Actions
        </Typography>
        <Grid container spacing={3}>
          {quickActions.map((action, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  background: "rgba(30, 41, 59, 0.6)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(148, 163, 184, 0.1)",
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  animation: `${fadeIn} 0.6s ease-out ${index * 0.1}s both`,
                  "&:hover": {
                    transform: "translateY(-2px)",
                    border: `1px solid ${action.color}30`,
                    background: "rgba(30, 41, 59, 0.8)",
                  },
                }}
                onClick={action.action}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "8px",
                      background: action.bgColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        background: action.color,
                      }}
                    />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily:
                        '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                      fontWeight: 600,
                      color: "#ffffff",
                      mb: 1,
                    }}
                  >
                    {action.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily:
                        '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                      color: "#94a3b8",
                    }}
                  >
                    {action.subtitle}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      <Box sx={{ maxWidth: "1200px", mx: "auto" }}>
        <Typography
          variant="h6"
          sx={{
            fontFamily:
              '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontWeight: 600,
            color: "#ffffff",
            mb: 3,
          }}
        >
          Your Schedules
        </Typography>
        <Card
          sx={{
            background: "rgba(30, 41, 59, 0.6)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(148, 163, 184, 0.1)",
            borderRadius: "12px",
            animation: `${fadeIn} 0.6s ease-out 0.3s both`,
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {schedules.length > 0 ? (
              <List sx={{ py: 0 }}>
                {schedules.map((schedule, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      py: 2,
                      px: 3,
                      borderBottom:
                        index < schedules.length - 1
                          ? "1px solid rgba(148, 163, 184, 0.1)"
                          : "none",
                      "&:hover": {
                        background: "rgba(148, 163, 184, 0.05)",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
                        mr: 2,
                        flexShrink: 0,
                      }}
                    />
                    <ListItemText
                      primary={schedule.name}
                      primaryTypographyProps={{
                        fontFamily:
                          '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                        fontWeight: 500,
                        color: "#ffffff",
                      }}
                      secondary={`Created ${new Date().toLocaleDateString()}`}
                      secondaryTypographyProps={{
                        fontFamily:
                          '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                        color: "#94a3b8",
                        fontSize: "0.875rem",
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily:
                      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    color: "#94a3b8",
                    mb: 2,
                  }}
                >
                  No schedules yet
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => navigate("/planner")}
                  sx={{
                    borderColor: "rgba(59, 130, 246, 0.3)",
                    color: "#60a5fa",
                    fontFamily:
                      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    textTransform: "none",
                    fontWeight: 500,
                    "&:hover": {
                      borderColor: "#3b82f6",
                      background: "rgba(59, 130, 246, 0.05)",
                    },
                  }}
                >
                  Create your first schedule
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
      <PieCharts
        mathCredits={mathCredits}
        englishCredits={englishCredits}
        electiveCredits={electiveCredits}
        totalCredits={totalCredits}
      />
    </Box>
  );
};

export default Dashboard;
