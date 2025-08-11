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
  Chip,
  IconButton,
  DialogActions,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
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
import { keyframes } from "@mui/system";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SchoolIcon from "@mui/icons-material/School";
import SaveIcon from "@mui/icons-material/Save";
import FlowChart from "../components/FlowChart";

const subtleGlow = keyframes`
  0%, 100% { opacity: 0.9; }
  50% { opacity: 1; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

export default function Account() {
  const [completedClasses, setCompletedClasses] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [eligibleClasses, setEligibleClasses] = useState([]);

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  const yearOptions = ["9th", "10th", "11th", "12th"];

  useEffect(() => {
    fetchCompletedClasses();
    fetchAvailableClasses();
    fetchEligibleClasses();
  }, []);

  const fetchEligibleClasses = async () => {
    try {
        const response = await fetch(`${backendUrl}/api/eligible-courses`, {
            credentials: "include",
          });
        if (response.ok) {
            const eligible = await response.json();
            setEligibleClasses(eligible);
        }
      } catch (error) {
        console.error("Failed to fetch eligible classes:", error);
      } finally {
        setLoading(false);
      }
  }

  const fetchCompletedClasses = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/completed-courses`, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        console.log("completed classes:",data);
        setCompletedClasses(data);
      }
    } catch (error) {
      console.error("Failed to fetch completed classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableClasses = async () => {
    try {
      const response = await fetch(`${backendUrl}/api/classes`, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        console.log("data:",data);
        setAvailableClasses(
          data.map((item, i) => {
            return item.name;
          })
        );
      }
    } catch (error) {
      console.error("Failed to fetch available classes:", error);
    }
  };

  const handleAddClass = async () => {
    if (!selectedClass || !selectedYear) return;

    try {
      const response = await fetch(`${backendUrl}/api/completed-courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          className: selectedClass,
          year: selectedYear,
        }),
      });

      if (response.ok) {
        const newClass = await response.json();
        console.log("new class:",newClass);
        setCompletedClasses((prev) => [...prev, newClass]);
        handleCloseDialog();
        // update eligible courses
        const eligibleRes = await fetch(`${backendUrl}/api/eligible-courses`, {
          credentials: "include",
        });
        const eligible = await eligibleRes.json();
        setEligibleClasses(eligible);
      }
    } catch (error) {
      console.error("Failed to add completed class:", error);
    }
  };

  const handleRemoveClass = async (courseId) => {
    console.log('course id trying to delete:',courseId);
    try {
      const response = await fetch(
        `${backendUrl}/api/completed-courses/${courseId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      const data = await response.json();
      console.log("deleting data:",data);
      if (response.ok) {
        setCompletedClasses((prev) =>
          prev.filter((cls) => cls.class_name !== data.class_name)
        );
        const eligibleRes = await fetch(`${backendUrl}/api/eligible-courses`, {
            credentials: "include",
          });
          const eligible = await eligibleRes.json();
          setEligibleClasses(eligible);
      }
    } catch (error) {
      console.error("Failed to remove completed class:", error);
    }
  };

  const handleOpenDialog = () => {
    setAddDialogOpen(true);
    setSelectedClass(null);
    setSelectedYear("");
  };

  const handleCloseDialog = () => {
    setAddDialogOpen(false);
    setSelectedClass(null);
    setSelectedYear("");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f172a 0%, #1c2333 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        px: 2,
        py: 4,
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        position: "relative",
      }}
    >
      {/* Main Course Entry Section */}
      <Paper
        elevation={0}
        sx={{
          p: 8,
          borderRadius: "20px",
          maxWidth: "720px",
          width: "60%",
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(148, 163, 184, 0.1)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          animation: `${fadeIn} 0.6s ease-out`,
          position: "relative",
          transition: "all 0.2s ease-out",
          mb: 4,
          mt: 16
        }}
      >
        <Box sx={{ mb: 6, textAlign: "center" }}>
          <Typography
            variant="h3"
            sx={{
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              fontWeight: "700",
              fontSize: "2rem",
              color: "#ffffff",
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
            My Completed Courses
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "#cbd5e1",
              fontSize: "1rem",
              mt: 2,
            }}
          >
            Track the classes you've already completed
          </Typography>
        </Box>
  
        <Box sx={{ mb: 4, textAlign: "center" }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
            sx={{
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              color: "#ffffff",
              textTransform: "none",
              fontWeight: "500",
              fontSize: "1rem",
              py: 1.5,
              px: 4,
              borderRadius: "12px",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              transition: "all 0.2s ease-out",
              "&:hover": {
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                transform: "translateY(-1px)",
              },
            }}
          >
            Add Course
          </Button>
        </Box>
  
        <Box sx={{ mb: 6 }}>
          {loading ? (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <Typography sx={{ color: "#cbd5e1" }}>
                Loading your completed courses...
              </Typography>
            </Box>
          ) : completedClasses.length === 0 ? (
            <Box
              sx={{
                textAlign: "center",
                py: 6,
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "12px",
                border: "1px solid rgba(148, 163, 184, 0.1)",
              }}
            >
              <SchoolIcon sx={{ fontSize: "3rem", color: "#64748b", mb: 2 }} />
              <Typography
                variant="h6"
                sx={{ color: "#cbd5e1", mb: 1, fontWeight: "500" }}
              >
                No completed courses yet
              </Typography>
              <Typography sx={{ color: "#64748b" }}>
                Add your first course to get started
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {completedClasses.map((course) => (
                <Paper
                  key={course.id}
                  elevation={0}
                  sx={{
                    p: 3,
                    background: "rgba(255, 255, 255, 0.03)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(148, 163, 184, 0.1)",
                    borderRadius: "12px",
                    transition: "all 0.2s ease-out",
                    "&:hover": {
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          color: "#ffffff",
                          fontWeight: "600",
                          mb: 0.5,
                        }}
                      >
                        {course.class_name}
                      </Typography>
                    </Box>
                    <IconButton
                      onClick={() => handleRemoveClass(course.id)}
                      sx={{
                        color: "#ef4444",
                        "&:hover": {
                          background: "rgba(239, 68, 68, 0.1)",
                        },
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}
        </Box>
  
        <Box
          sx={{
            position: "absolute",
            top: -1,
            left: -1,
            right: -1,
            height: "2px",
            background: "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.5), transparent)",
            borderRadius: "20px 20px 0 0",
          }}
        />
      </Paper>
  
      {/* FlowChart Section */}
      {completedClasses.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            borderRadius: "20px",
            maxWidth: "1200px",
            width: "70%",
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(148, 163, 184, 0.1)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
            position: "relative",
            transition: "all 0.2s ease-out",
          }}
        >
          <Box sx={{ mb: 4, textAlign: "center" }}>
            <Typography
              variant="h4"
              sx={{
                fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                fontWeight: "700",
                fontSize: "1.75rem",
                color: "#ffffff",
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
                  background: "linear-gradient(90deg, #10b981, #34d399)",
                  borderRadius: "2px",
                },
              }}
            >
              Available Next Courses
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: "#cbd5e1",
                fontSize: "1rem",
                mt: 2,
              }}
            >
              Based on your completed courses, here's what you can take next
            </Typography>
          </Box>
  
          <FlowChart
            eligibleClasses={eligibleClasses}
            completedClasses={completedClasses}
          />
  
          <Box
            sx={{
              position: "absolute",
              top: -1,
              left: -1,
              right: -1,
              height: "2px",
              background: "linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.5), transparent)",
              borderRadius: "20px 20px 0 0",
            }}
          />
        </Paper>
      )}
  
      {/* Dialog remains the same */}
      <Dialog
        open={addDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(148, 163, 184, 0.1)",
            borderRadius: "16px",
            color: "#ffffff",
          },
        }}
      >
        <DialogTitle
          sx={{
            color: "#ffffff",
            fontWeight: "600",
            fontSize: "1.5rem",
            pb: 1,
          }}
        >
          Add Completed Course
        </DialogTitle>
        <DialogContent sx={{ mt: 4 }}>
          <Stack spacing={3}>
            <Autocomplete
              options={availableClasses}
              getOptionLabel={(option) => `${option}`}
              value={selectedClass}
              onChange={(event, newValue) => setSelectedClass(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Course"
                  variant="outlined"
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "#ffffff",
                      "& fieldset": {
                        borderColor: "rgba(148, 163, 184, 0.3)",
                      },
                      "&:hover fieldset": {
                        borderColor: "rgba(148, 163, 184, 0.5)",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#3b82f6",
                      },
                    },
                    "& .MuiInputLabel-root": {
                      color: "#cbd5e1",
                    },
                  }}
                />
              )}
              sx={{
                "& .MuiAutocomplete-paper": {
                  background: "rgba(15, 23, 42, 0.95)",
                  color: "#ffffff",
                },
              }}
            />
  
            <FormControl fullWidth>
              <InputLabel
                sx={{
                  color: "#cbd5e1",
                  "&.Mui-focused": {
                    color: "#3b82f6",
                  },
                }}
              >
                Year Completed
              </InputLabel>
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                label="Year Completed"
                sx={{
                  color: "#ffffff",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(148, 163, 184, 0.3)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(148, 163, 184, 0.5)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#3b82f6",
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      background: "rgba(15, 23, 42, 0.95)",
                      color: "#ffffff",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(148, 163, 184, 0.1)",
                    },
                  },
                }}
              >
                {yearOptions.map((year) => (
                  <MenuItem key={year} value={year} sx={{ color: "#ffffff" }}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              color: "#cbd5e1",
              textTransform: "none",
              "&:hover": {
                background: "rgba(148, 163, 184, 0.1)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddClass}
            variant="contained"
            disabled={!selectedClass || !selectedYear}
            sx={{
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              textTransform: "none",
              fontWeight: "500",
              "&:disabled": {
                background: "rgba(148, 163, 184, 0.2)",
                color: "rgba(255, 255, 255, 0.3)",
              },
            }}
          >
            Add Course
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
