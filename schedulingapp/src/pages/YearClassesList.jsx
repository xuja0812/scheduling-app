import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Card,
  CardContent,
  Chip,
  Collapse,
  IconButton,
  InputAdornment,
  Stack,
  Badge,
  Slider,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Search,
  ExpandMore,
  ExpandLess,
  School,
  Star,
} from "@mui/icons-material";

const fadeIn = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

// Custom styled select component
const CustomSelect = ({ value, onChange, options, placeholder }) => {
  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          height: "60px",
          padding: "1rem 1.25rem",
          backgroundColor: "rgba(30, 41, 59, 0.6)",
          border: "1px solid rgba(148, 163, 184, 0.2)",
          borderRadius: "8px",
          color: "#f1f5f9",
          fontSize: "1rem",
          fontFamily:
            '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          outline: "none",
          cursor: "pointer",
          appearance: "none",
          transition: "border-color 0.2s ease",
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: "right 1rem center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "1.25rem",
          paddingRight: "3rem",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#64748b";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "rgba(148, 163, 184, 0.2)";
        }}
        onMouseEnter={(e) => {
          if (e.target !== document.activeElement) {
            e.target.style.borderColor = "rgba(148, 163, 184, 0.3)";
          }
        }}
        onMouseLeave={(e) => {
          if (e.target !== document.activeElement) {
            e.target.style.borderColor = "rgba(148, 163, 184, 0.2)";
          }
        }}
      >
        <option
          value=""
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            color: "#f1f5f9",
          }}
        >
          {placeholder}
        </option>
        {options.map((option) => (
          <option
            key={option}
            value={option}
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              color: "#f1f5f9",
            }}
          >
            {option}
          </option>
        ))}
      </select>
    </Box>
  );
};

const CourseCard = ({ course, isExpanded, onToggle }) => {
  return (
    <Card
      sx={{
        mb: 2,
        background: "rgba(30, 41, 59, 0.4)",
        border: "1px solid rgba(148, 163, 184, 0.15)",
        borderRadius: "8px",
        transition: "all 0.2s ease",
        "&:hover": {
          border: "1px solid rgba(148, 163, 184, 0.25)",
          background: "rgba(30, 41, 59, 0.5)",
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box
          onClick={onToggle}
          sx={{
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  color: "#e2e8f0",
                  fontWeight: "600",
                  mr: 2,
                  fontSize: "1.1rem",
                }}
              >
                {course.code}
              </Typography>
              {course.required_for_grad && (
                <Chip
                  // icon={<Star sx={{ fontSize: 16 }} />}
                  label="Required"
                  size="small"
                  sx={{
                    backgroundColor: "rgba(59, 130, 246, 0.2)",
                    color: "#93c5fd",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    height: "24px",
                    "& .MuiChip-icon": { color: "#cbd5e1" },
                  }}
                />
              )}
            </Box>

            <Typography
              variant="body1"
              sx={{
                color: "#f1f5f9",
                fontWeight: "500",
                mb: 2,
                fontSize: "1rem",
              }}
            >
              {course.name}
            </Typography>

            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Chip
                label={course.category}
                size="small"
                sx={{
                  backgroundColor: "rgba(100, 116, 139, 0.15)",
                  color: "#94a3b8",
                  border: "1px solid rgba(100, 116, 139, 0.25)",
                  height: "28px",
                }}
              />
              <Chip
                label={`${course.credits} credits`}
                size="small"
                sx={{
                  backgroundColor: "rgba(100, 116, 139, 0.15)",
                  color: "#94a3b8",
                  border: "1px solid rgba(100, 116, 139, 0.25)",
                  height: "28px",
                }}
              />
            </Box>
          </Box>

          <IconButton
            sx={{
              color: "#94a3b8",
              "&:hover": { backgroundColor: "rgba(148, 163, 184, 0.1)" },
            }}
          >
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={isExpanded} timeout={300}>
          <Box
            sx={{
              mt: 3,
              pt: 2,
              borderTop: "1px solid rgba(148, 163, 184, 0.1)",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "#cbd5e1",
                lineHeight: 1.6,
                fontSize: "0.95rem",
              }}
            >
              {course.description}
            </Typography>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default function CourseCatalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [creditRange, setCreditRange] = useState([0, 1.5]);
  const [showRequiredOnly, setShowRequiredOnly] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [sampleCourses, setSampleCourses] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [categories, setCategories] = useState([])

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  useEffect(() => {
    fetch(`${backendUrl}/api/classes`, { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch classes");
        return res.json();
      })
      .then((data) => {
        const processedData = data.map(course => ({
          ...course,
          credits: parseFloat(course.credits)
        }));
        setSampleCourses(processedData);
        setTracks([...new Set(data.map((course) => course.track))]);
        setCategories([...new Set(data.map((course) => course.category))]);
      })
      .catch((err) => console.error("Error when fetching classes:",err));
  }, []);

  useEffect(() => {
  }, [sampleCourses]);

  const filteredCourses = useMemo(() => {
    return sampleCourses.filter((course) => {
      const matchesSearch =
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTrack = !selectedTrack || course.track === selectedTrack;
      const matchesCategory =
        !selectedCategory || course.category === selectedCategory;
      const matchesCredits =
        course.credits >= creditRange[0] && course.credits <= creditRange[1];
      const matchesRequired = !showRequiredOnly || course.required_for_grad;

      return (
        matchesSearch &&
        matchesTrack &&
        matchesCategory &&
        matchesCredits &&
        matchesRequired
      );
    });
  }, [
    sampleCourses,
    searchTerm,
    selectedTrack,
    selectedCategory,
    creditRange,
    showRequiredOnly,
  ]);
  const coursesByTrack = useMemo(() => {
    const grouped = {};
    filteredCourses.forEach((course) => {
      if (!grouped[course.track]) {
        grouped[course.track] = [];
      }
      grouped[course.track].push(course);
    });
    return grouped;
  }, [filteredCourses]);

  const handleCourseToggle = (courseId) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };

  if (sampleCourses.length === 0) {
    return (
      <Box>
        <style>{fadeIn}</style>
        <Box
          sx={{
            minHeight: "100vh",
            background: "linear-gradient(180deg, #0f172a 0%, #1c2333 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          <Typography sx={{ color: '#f1f5f9', fontSize: '1.2rem' }}>
            Loading courses...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <style>{fadeIn}</style>
      <Box
        sx={{
          minHeight: "100vh",
          background: "linear-gradient(180deg, #0f172a 0%, #1c2333 100%)",
          pt: "96px",
          pb: 8,
          px: 4,
          fontFamily:
            '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            mb: 6,
            fontWeight: "600",
            textAlign: "center",
            color: "#ffffff",
            mt: 8,
            fontSize: "2.25rem",
            letterSpacing: "-0.025em",
            animation: `fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1)`,
          }}
        >
          Course Catalog
        </Typography>
        <Box
          sx={{
            maxWidth: 1200,
            mx: "auto",
            mb: 4,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "2fr 1fr 1fr 1fr 1fr",
              },
              gap: 3,
              alignItems: "center",
            }}
          >
            {/* Search Input */}
            <TextField
              fullWidth
              placeholder="Search courses by name, code, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "#94a3b8" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(30, 41, 59, 0.6)",
                  border: "1px solid rgba(148, 163, 184, 0.2)",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                  minHeight: "48px",
                  transition: "border-color 0.2s ease",
                  "&:hover": {
                    border: "1px solid rgba(148, 163, 184, 0.3)",
                  },
                  "&.Mui-focused": {
                    border: "1px solid #64748b",
                    boxShadow: "none",
                  },
                  "& fieldset": { border: "none" },
                  "& input": {
                    padding: "1rem 1.25rem",
                  },
                },
                "& .MuiOutlinedInput-input::placeholder": {
                  color: "#94a3b8",
                },
              }}
            />

            {/* Track Filter */}
            <CustomSelect
              value={selectedTrack}
              onChange={setSelectedTrack}
              options={tracks}
              placeholder="All Tracks"
            />

            {/* Category Filter */}
            <CustomSelect
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={categories}
              placeholder="All Categories"
            />

            {/* Credits Filter */}
            <Box sx={{ px: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  color: "#94a3b8",
                  mb: 1,
                  fontSize: "0.85rem",
                  textAlign: "center",
                }}
              >
                Credits: {creditRange[0]} - {creditRange[1]}
              </Typography>
              <Slider
                value={creditRange}
                onChange={(e, newValue) => setCreditRange(newValue)}
                valueLabelDisplay="auto"
                min={0}
                max={1.5}
                step={0.5}
                sx={{
                  color: "#64748b",
                  height: 6,
                  "& .MuiSlider-thumb": {
                    height: 18,
                    width: 18,
                    backgroundColor: "#64748b",
                    border: "2px solid rgba(255, 255, 255, 0.1)",
                    "&:hover": {
                      boxShadow: "0 0 0 8px rgba(100, 116, 139, 0.16)",
                    },
                  },
                  "& .MuiSlider-track": {
                    backgroundColor: "#64748b",
                    border: "none",
                    height: 6,
                  },
                  "& .MuiSlider-rail": {
                    backgroundColor: "rgba(148, 163, 184, 0.3)",
                    height: 6,
                  },
                  "& .MuiSlider-valueLabel": {
                    backgroundColor: "#1e293b",
                    color: "#f1f5f9",
                    fontSize: "0.75rem",
                  },
                }}
              />
            </Box>

            {/* Required Filter */}
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showRequiredOnly}
                    onChange={(e) => setShowRequiredOnly(e.target.checked)}
                    sx={{
                      color: "#94a3b8",
                      "&.Mui-checked": {
                        color: "#64748b",
                      },
                      "& .MuiSvgIcon-root": {
                        fontSize: 20,
                      },
                    }}
                  />
                }
                label={
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#94a3b8",
                      fontSize: "0.85rem",
                      fontWeight: "500",
                    }}
                  >
                    Required Only
                  </Typography>
                }
                sx={{ margin: 0 }}
              />
            </Box>
          </Box>
        </Box>
        <Box sx={{ maxWidth: 1200, mx: "auto", mb: 3 }}>
          <Typography
            variant="body2"
            sx={{
              color: "#94a3b8",
              textAlign: "center",
              fontSize: "0.9rem",
            }}
          >
            {filteredCourses.length} course
            {filteredCourses.length !== 1 ? "s" : ""} found
          </Typography>
        </Box>
        <Box sx={{ maxWidth: 1200, mx: "auto" }}>
          {Object.entries(coursesByTrack).map(([track, courses]) => (
            <Box key={track} sx={{ mb: 6 }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <School sx={{ color: "#64748b", mr: 2, fontSize: 28 }} />
                <Typography
                  variant="h5"
                  sx={{
                    color: "#f1f5f9",
                    fontWeight: "600",
                    fontSize: "1.5rem",
                  }}
                >
                  {track}
                </Typography>
                <Badge
                  badgeContent={courses.length}
                  sx={{
                    ml: 2,
                    "& .MuiBadge-badge": {
                      backgroundColor: "#64748b",
                      color: "#ffffff",
                      fontSize: "0.75rem",
                    },
                  }}
                >
                  <Box />
                </Badge>
              </Box>

              <Stack spacing={0}>
                {courses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    isExpanded={expandedCourse === course.id}
                    onToggle={() => handleCourseToggle(course.id)}
                  />
                ))}
              </Stack>
            </Box>
          ))}

          {filteredCourses.length === 0 && (
            <Box sx={{ textAlign: "center", py: 8 }}>
              <Typography
                variant="h6"
                sx={{
                  color: "#94a3b8",
                  mb: 2,
                }}
              >
                No courses found
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#64748b",
                }}
              >
                Try adjusting your search criteria or filters
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
