import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

const COLORS = [
  "#3b82f6",
  "#60a5fa",
  "#8b5cf6",
  "#a78bfa",
  "#ec4899",
  "#f472b6",
];

export default function Analytics() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unique, setUnique] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    avgEnrollment: 0,
    popularClass: "",
    overloaded: [],
    noPlans: [],
    uniquePlans: [],
  });

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  useEffect(() => {
    setLoading(true);

    Promise.all([
      fetch(`${backendUrl}/api/analytics/popular-classes`, {
        credentials: "include",
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch popular classes");
        return res.json();
      }),
      fetch(`${backendUrl}/api/analytics/high-credit-plans`, {
        credentials: "include",
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch other stats");
        return res.json();
      }),
      fetch(`${backendUrl}/api/analytics/no-plans`, {
        credentials: "include",
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch other stats");
        return res.json();
      }),
      fetch(`${backendUrl}/api/analytics/popular-classes-unique`, {
        credentials: "include",
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to fetch other stats");
        return res.json();
      }),
    ])
      .then(([popularClassesData, plansData, noPlansData, uniqueData]) => {
        setClasses(popularClassesData);
        setUnique(uniqueData);
        const totalStudents =
          popularClassesData.length > 0
            ? popularClassesData.reduce(
                (sum, cls) => sum + cls.enrollment_count,
                0
              )
            : 0;
        const totalClasses = popularClassesData.length;
        const avgEnrollment =
          totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0;
        let popularClass = "None";
        if (popularClassesData.length > 0)
          popularClass =
            popularClassesData.reduce((prev, current) =>
              prev.enrollment_count > current.enrollment_count ? prev : current
            )?.class_code || "";
        setStats({
          totalStudents,
          totalClasses,
          avgEnrollment,
          popularClass,
          overloaded: plansData, 
          noPlans: noPlansData,
          uniquePlans: uniqueData
        });

        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching analytics:", error);
        setLoading(false);
      });
  }, []);

  const StatCard = ({ icon, title, value, subtitle, delay = 0 }) => (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(148, 163, 184, 0.1)",
        borderRadius: "20px",
        padding: "2rem",
        textAlign: "center",
        position: "relative",
        transition: "all 0.3s ease-out",
        animation: `fadeIn 0.6s ease-out ${delay}ms both`,
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow =
          "0 25px 50px -12px rgba(0, 0, 0, 0.5)";
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 8px 25px rgba(0, 0, 0, 0.3)";
        e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
      }}
    >
      <div
        style={{
          fontSize: "2.5rem",
          marginBottom: "1rem",
          background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          color: "#cbd5e1",
          fontSize: "0.875rem",
          fontWeight: "500",
          marginBottom: "0.5rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {title}
      </h3>
      <div
        style={{
          color: "#ffffff",
          fontSize: "2.5rem",
          fontWeight: "700",
          marginBottom: "0.5rem",
          fontFamily:
            '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {loading ? "..." : value}
      </div>
      {subtitle && (
        <p
          style={{
            color: "#94a3b8",
            fontSize: "0.875rem",
            margin: 0,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );

  const ChartCard = ({ title, children, delay = 0 }) => (
    <div
      style={{
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(148, 163, 184, 0.1)",
        borderRadius: "20px",
        padding: "2rem",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
        animation: `fadeIn 0.8s ease-out ${delay}ms both`,
        transition: "all 0.3s ease-out",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow =
          "0 30px 60px -12px rgba(0, 0, 0, 0.5)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow =
          "0 25px 50px -12px rgba(0, 0, 0, 0.4)";
      }}
    >
      <div
        style={{
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

      <h2
        style={{
          color: "#ffffff",
          fontSize: "1.5rem",
          fontWeight: "700",
          marginBottom: "1.5rem",
          textAlign: "center",
          fontFamily:
            '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );

  const pieData = classes.slice(0, 6).map((cls, index) => ({
    name: cls.class_code,
    value: cls.enrollment_count,
  }));

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f172a 0%, #1c2333 100%)",
        padding: "3rem 1rem",
        fontFamily:
          '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes subtleGlow {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 1; }
        }
      `}</style>

      <div style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h2
          style={{
            color: "#ffffff",
            fontSize: "2.5rem",
            fontWeight: "700",
            marginBottom: "0.5rem",
            marginTop: "6rem",
            background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            animation: "subtleGlow 3s ease-in-out infinite",
          }}
        >
          Analytics Dashboard
        </h2>
        <p
          style={{
            color: "#cbd5e1",
            fontSize: "1rem",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Real-time insights into class enrollment and trends
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "1.5rem",
          marginBottom: "3rem",
          maxWidth: "1200px",
          margin: "0 auto 3rem auto",
        }}
      >
        <StatCard
          icon="📚"
          title="Active Classes"
          value={stats.totalClasses}
          subtitle="Currently present in schedules"
          delay={200}
        />
        <StatCard
          icon="🏆"
          title="Most Popular"
          value={stats.popularClass}
          delay={400}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "2rem",
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "2rem",
        }}
      >
        {(loading || classes.length > 0) && (
          <Box
            component={Paper}
            elevation={0}
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.06)",
              borderRadius: 3,
              p: 4,
              color: "white",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              "@media (max-width:768px)": {
                p: 3,
              },
            }}
          >
            <Typography
              variant="h5"
              component="h3"
              sx={{
                color: "white",
                fontWeight: 700,
                mb: 3,
                userSelect: "none",
                letterSpacing: 0.5,
              }}
            >
              Class Popularity Overview (All Plans)
            </Typography>

            {loading ? (
              <div
                style={{
                  height: "400px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#cbd5e1",
                  fontSize: "1.125rem",
                }}
              >
                Loading...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={classes}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <defs>
                    <linearGradient
                      id="colorGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148, 163, 184, 0.2)"
                  />
                  <XAxis
                    dataKey="class_code"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fill: "rgba(255, 255, 255, 0.8)", fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: "rgba(255, 255, 255, 0.8)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "12px",
                      color: "white",
                      backdropFilter: "blur(20px)",
                    }}
                  />
                  <Bar
                    dataKey="enrollment_count"
                    fill="url(#colorGradient)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>
        )}
        {(loading || classes.length > 0) && (
          <Box
            component={Paper}
            elevation={0}
            sx={{
              bgcolor: "rgba(255, 255, 255, 0.06)",
              borderRadius: 3,
              p: 4,
              color: "white",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
              "@media (max-width:768px)": {
                p: 3,
              },
            }}
          >
            <Typography
              variant="h5"
              component="h3"
              sx={{
                color: "white",
                fontWeight: 700,
                mb: 3,
                userSelect: "none",
                letterSpacing: 0.5,
              }}
            >
              Class Popularity Overview (Unique Students)
            </Typography>

            {loading ? (
              <div
                style={{
                  height: "400px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#cbd5e1",
                  fontSize: "1.125rem",
                }}
              >
                Loading...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={unique}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <defs>
                    <linearGradient
                      id="colorGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148, 163, 184, 0.2)"
                  />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fill: "rgba(255, 255, 255, 0.8)", fontSize: 12 }}
                  />
                  <YAxis tick={{ fill: "rgba(255, 255, 255, 0.8)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.95)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                      borderRadius: "12px",
                      color: "white",
                      backdropFilter: "blur(20px)",
                    }}
                  />
                  <Bar
                    dataKey="unique_student_count"
                    fill="url(#colorGradient)"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Box>
        )}
        <Box
          component={Paper}
          elevation={0}
          sx={{
            bgcolor: "rgba(255, 255, 255, 0.06)",
            borderRadius: 3,
            p: 4,
            color: "white",
            maxHeight: 300,
            overflowY: "auto",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            "@media (max-width:768px)": {
              p: 3,
              maxHeight: 250,
            },
          }}
        >
          <Typography
            variant="h5"
            component="h3"
            sx={{
              color: "white",
              fontWeight: 700,
              mb: 3,
              userSelect: "none",
              letterSpacing: 0.5,
            }}
          >
            Students with Overloaded Schedules (more than 6 credits/year)
          </Typography>

          {stats.overloaded.length === 0 ? (
            <Typography
              sx={{ color: "rgba(203, 213, 225, 0.5)", fontStyle: "italic" }}
            >
              No overloaded schedules currently.
            </Typography>
          ) : (
            <List dense disablePadding>
              {stats.overloaded.map((student, i) => (
                <ListItem
                  key={i}
                  divider
                  sx={{
                    py: 1,
                    borderColor: "rgba(203, 213, 225, 0.15)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    backgroundColor: "transparent",
                    borderRadius: "8px",
                    mb: 0.5,
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      boxShadow: "0 8px 16px rgba(0, 0, 0, 0.4)",
                      transform: "translateY(-1px)",
                    },
                    "&:focus-visible": {
                      outline: "none",
                      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)",
                    },
                  }}
                >
                  <ListItemText
                    primary={student.user_name}
                    secondary={"Plan name: " + student.name}
                    primaryTypographyProps={{
                      color: "rgba(203, 213, 225, 0.95)",
                      fontWeight: 600,
                    }}
                    secondaryTypographyProps={{
                      color: "rgba(203, 213, 225, 0.4)",
                      fontSize: "0.875rem",
                    }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
        <Box
          component={Paper}
          elevation={0}
          sx={{
            bgcolor: "rgba(255, 255, 255, 0.06)",
            borderRadius: 3,
            p: 4,
            color: "white",
            maxHeight: 300,
            overflowY: "auto",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            "@media (max-width:768px)": {
              p: 3,
              maxHeight: 250,
            },
          }}
        >
          <Typography
            variant="h5"
            component="h3"
            sx={{
              color: "white",
              fontWeight: 700,
              mb: 3,
              userSelect: "none",
              letterSpacing: 0.5,
            }}
          >
            Students with No Schedules
          </Typography>

          {stats.noPlans.length === 0 ? (
            <Typography
              sx={{ color: "rgba(203, 213, 225, 0.5)", fontStyle: "italic" }}
            >
              No students currently.
            </Typography>
          ) : (
            <List dense disablePadding>
              {stats.noPlans.map((student, i) => (
                <ListItem
                  key={i}
                  divider
                  sx={{
                    py: 1,
                    borderColor: "rgba(203, 213, 225, 0.15)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    backgroundColor: "transparent",
                    borderRadius: "8px",
                    mb: 0.5,
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.03)",
                      boxShadow: "0 8px 16px rgba(0, 0, 0, 0.4)",
                      transform: "translateY(-1px)",
                    },
                    "&:focus-visible": {
                      outline: "none",
                      boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5)",
                    },
                  }}
                >
                  <ListItemText
                    primary={student.name}
                    secondary={"Email: " + student.email}
                    primaryTypographyProps={{
                      color: "rgba(203, 213, 225, 0.95)",
                      fontWeight: 600,
                    }}
                    secondaryTypographyProps={{
                      color: "rgba(203, 213, 225, 0.4)",
                      fontSize: "0.875rem",
                    }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </div>
    </div>
  );
}
