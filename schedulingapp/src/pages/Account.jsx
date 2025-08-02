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
import { keyframes } from "@mui/system";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SchoolIcon from "@mui/icons-material/School";
import SaveIcon from "@mui/icons-material/Save";

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
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedYear, setSelectedYear] = useState("");

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  // Years dropdown options
  const yearOptions = [
    "2020", "2021", "2022", "2023", "2024", "2025"
  ];

  useEffect(() => {
    fetchCompletedClasses();
    fetchAvailableClasses();
  }, []);

  const fetchCompletedClasses = async () => {
    try {
      // TODO: Implement API call to get user's completed classes
      const response = await fetch(`${backendUrl}/api/completed-courses`, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
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
      // TODO: Implement API call to get all available classes
      const response = await fetch(`${backendUrl}/api/classes`, {
        method: "GET",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableClasses(data);
      }
    } catch (error) {
      console.error("Failed to fetch available classes:", error);
    }
  };

  const handleAddClass = async () => {
    if (!selectedClass || !selectedYear) return;

    try {
      // TODO: Implement API call to add completed class
      const response = await fetch(`${backendUrl}/api/completed-courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          classId: selectedClass.id,
          className: selectedClass.name,
          year: selectedYear,
        }),
      });

      if (response.ok) {
        const newClass = await response.json();
        setCompletedClasses(prev => [...prev, newClass]);
        handleCloseDialog();
      }
    } catch (error) {
      console.error("Failed to add completed class:", error);
    }
  };

  const handleRemoveClass = async (classId) => {
    try {
      // TODO: Implement API call to remove completed class
      const response = await fetch(`${backendUrl}/api/completed-courses/${classId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setCompletedClasses(prev => prev.filter(cls => cls.id !== classId));
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

  const handleSave = async () => {
    // TODO: Implement any final save logic if needed
    console.log("Account updated successfully");
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
        py: 4,
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
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(148, 163, 184, 0.1)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4)",
          animation: `${fadeIn} 0.6s ease-out`,
          position: "relative",
          transition: "all 0.2s ease-out",
        }}
      >
        <Box sx={{ mb: 6, textAlign: "center" }}>
          <Typography
            variant="h3"
            sx={{
              fontFamily:
                '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
            Track the classes you've already completed to better plan your future schedule
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
              boxShadow: "0 8px 25px rgba(59, 130, 246, 0.3)",
              transition: "all 0.2s ease-out",
              "&:hover": {
                background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                transform: "translateY(-1px)",
                boxShadow: "0 12px 35px rgba(59, 130, 246, 0.4)",
              },
            }}
          >
            Add Completed Course
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
                Add your first completed course to get started
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
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                      <Chip
                        label={`Completed in ${course.year}`}
                        size="small"
                        sx={{
                          background: "rgba(34, 197, 94, 0.1)",
                          color: "#22c55e",
                          border: "1px solid rgba(34, 197, 94, 0.2)",
                          fontWeight: "500",
                        }}
                      />
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
        <Box sx={{ textAlign: "center" }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            fullWidth
            sx={{
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              color: "#ffffff",
              textTransform: "none",
              fontWeight: "500",
              fontSize: "1rem",
              py: 2,
              px: 4,
              borderRadius: "12px",
              border: "1px solid rgba(34, 197, 94, 0.2)",
              boxShadow: "0 8px 25px rgba(34, 197, 94, 0.3)",
              transition: "all 0.2s ease-out",
              "&:hover": {
                background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
                transform: "translateY(-1px)",
                boxShadow: "0 12px 35px rgba(34, 197, 94, 0.4)",
              },
            }}
          >
            Save Changes
          </Button>
        </Box>
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
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            <Autocomplete
              options={availableClasses}
              getOptionLabel={(option) => `${option.code} - ${option.name}`}
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