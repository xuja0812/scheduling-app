import React, { useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Collapse,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Autocomplete,
} from "@mui/material";
import {
  ExpandMore,
  ExpandLess,
  Search,
  FilterList,
  Clear,
} from "@mui/icons-material";
import { keyframes } from "@mui/system";

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Sample course data structure
const courseData = {
  "Computer Science": {
    color: "#3b82f6",
    courses: [
      {
        id: "cs101",
        name: "Introduction to Programming",
        credit: 1.0,
        duration: "Full Year",
        gradeLevel: "9-12",
        prerequisite: "None",
        dualCredit: false,
        department: "Computer Science",
        description:
          "Learn the fundamentals of programming using Python. Topics include variables, loops, functions, and basic data structures.",
      },
      {
        id: "cs201",
        name: "Advanced Programming & Data Structures",
        credit: 1.0,
        duration: "Full Year",
        gradeLevel: "10-12",
        prerequisite: "Introduction to Programming",
        dualCredit: true,
        department: "Computer Science",
        description:
          "Advanced programming concepts including object-oriented programming, algorithms, and complex data structures.",
      },
    ],
  },
  Mathematics: {
    color: "#10b981",
    courses: [
      {
        id: "math101",
        name: "Algebra I",
        credit: 1.0,
        duration: "Full Year",
        gradeLevel: "9-10",
        prerequisite: "Pre-Algebra",
        dualCredit: false,
        department: "Mathematics",
        description:
          "Foundation course in algebraic thinking, linear equations, and problem-solving strategies.",
      },
      {
        id: "math301",
        name: "AP Calculus",
        credit: 1.5,
        duration: "Full Year",
        gradeLevel: "11-12",
        prerequisite: "Pre-Calculus",
        dualCredit: true,
        department: "Mathematics",
        description:
          "Advanced placement calculus covering limits, derivatives, integrals, and applications.",
      },
    ],
  },
  Business: {
    color: "#f59e0b",
    courses: [
      {
        id: "bus101",
        name: "Business Fundamentals",
        credit: 0.5,
        duration: "Semester",
        gradeLevel: "9-12",
        prerequisite: "None",
        dualCredit: false,
        department: "Business",
        description:
          "Introduction to basic business concepts, entrepreneurship, and economic principles.",
      },
      {
        id: "bus201",
        name: "Marketing & Finance",
        credit: 1.0,
        duration: "Full Year",
        gradeLevel: "10-12",
        prerequisite: "Business Fundamentals",
        dualCredit: true,
        department: "Business",
        description:
          "Comprehensive study of marketing strategies and financial management for businesses.",
      },
    ],
  },
};

const SmartSearch = ({ onFiltersChange, totalCourses, filteredCount }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedGradeLevels, setSelectedGradeLevels] = useState([]);
  const [selectedDurations, setSelectedDurations] = useState([]);
  const [dualCreditOnly, setDualCreditOnly] = useState(false);
  const [creditRange, setCreditRange] = useState("");

  // Extract unique values for filter options
  const allCourses = Object.values(courseData).flatMap((dept) => dept.courses);
  const departments = Object.keys(courseData);
  const gradeLevels = [
    ...new Set(allCourses.map((course) => course.gradeLevel)),
  ];
  const durations = [...new Set(allCourses.map((course) => course.duration))];
  const creditOptions = ["0.5", "1.0", "1.5+"];

  React.useEffect(() => {
    onFiltersChange({
      searchTerm,
      selectedDepartments,
      selectedGradeLevels,
      selectedDurations,
      dualCreditOnly,
      creditRange,
    });
  }, [
    searchTerm,
    selectedDepartments,
    selectedGradeLevels,
    selectedDurations,
    dualCreditOnly,
    creditRange,
  ]);

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedDepartments([]);
    setSelectedGradeLevels([]);
    setSelectedDurations([]);
    setDualCreditOnly(false);
    setCreditRange("");
  };

  const hasActiveFilters =
    searchTerm ||
    selectedDepartments.length ||
    selectedGradeLevels.length ||
    selectedDurations.length ||
    dualCreditOnly ||
    creditRange;

  return (
    <Paper
      elevation={0}
      sx={{
        maxWidth: "1200px",
        mx: "auto",
        mb: 4,
        p: 3,
        borderRadius: "16px",
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(148, 163, 184, 0.1)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ color: "#ffffff", fontWeight: "600" }}>
          Search & Filter Courses
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2" sx={{ color: "#94a3b8" }}>
            Showing {filteredCount} of {totalCourses} courses
          </Typography>
          {hasActiveFilters && (
            <IconButton
              onClick={clearAllFilters}
              size="small"
              sx={{
                color: "#ef4444",
                "&:hover": { backgroundColor: "rgba(239, 68, 68, 0.1)" },
              }}
            >
              <Clear />
            </IconButton>
          )}
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search courses by name, description, or prerequisites..."
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
              color: "#ffffff",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
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
            "& .MuiInputBase-input::placeholder": {
              color: "#94a3b8",
              opacity: 1,
            },
          }}
        />
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={6}>
          <Autocomplete
            multiple
            options={departments}
            value={selectedDepartments}
            onChange={(event, newValue) => setSelectedDepartments(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Departments"
                variant="outlined"
                size="small"
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  key={option}
                  label={option}
                  size="small"
                  {...getTagProps({ index })}
                  sx={{
                    backgroundColor: courseData[option]?.color + "40",
                    color: "#ffffff",
                    "& .MuiChip-deleteIcon": { color: "#ffffff" },
                  }}
                />
              ))
            }
            sx={{
              minWidth: "220px",
              "& .MuiOutlinedInput-root": {
                color: "#ffffff",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                "& fieldset": { borderColor: "rgba(148, 163, 184, 0.3)" },
                "&:hover fieldset": { borderColor: "rgba(148, 163, 184, 0.5)" },
                "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
              },
              "& .MuiInputLabel-root": { color: "#94a3b8" },
              "& .MuiInputLabel-root.Mui-focused": { color: "#3b82f6" },
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={6}>
          <FormControl fullWidth size="small">
            <InputLabel
              sx={{ color: "#94a3b8", "&.Mui-focused": { color: "#3b82f6" } }}
            >
              Grade Level
            </InputLabel>
            <Select
              multiple
              value={selectedGradeLevels}
              onChange={(e) => setSelectedGradeLevels(e.target.value)}
              label="Grade Level"
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip
                      key={value}
                      label={value}
                      size="small"
                      sx={{ color: "#ffffff", backgroundColor: "#374151" }}
                    />
                  ))}
                </Box>
              )}
              sx={{
                minWidth: "180px",
                color: "#ffffff",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                "& fieldset": { borderColor: "rgba(148, 163, 184, 0.3)" },
                "&:hover fieldset": { borderColor: "rgba(148, 163, 184, 0.5)" },
                "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                "& .MuiSelect-icon": { color: "#94a3b8" },
              }}
            >
              {gradeLevels.map((grade) => (
                <MenuItem key={grade} value={grade}>
                  <Checkbox checked={selectedGradeLevels.indexOf(grade) > -1} />
                  {grade}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={8}>
          <FormControl fullWidth size="small">
            <InputLabel
              sx={{ color: "#94a3b8", "&.Mui-focused": { color: "#3b82f6" } }}
            >
              Duration
            </InputLabel>
            <Select
              multiple
              value={selectedDurations}
              onChange={(e) => setSelectedDurations(e.target.value)}
              label="Duration"
              renderValue={(selected) => (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip
                      key={value}
                      label={value}
                      size="small"
                      sx={{ color: "#ffffff", backgroundColor: "#374151" }}
                    />
                  ))}
                </Box>
              )}
              sx={{
                minWidth: "250px",
                color: "#ffffff",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                "& fieldset": { borderColor: "rgba(148, 163, 184, 0.3)" },
                "&:hover fieldset": { borderColor: "rgba(148, 163, 184, 0.5)" },
                "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                "& .MuiSelect-icon": { color: "#94a3b8" },
              }}
            >
              {durations.map((duration) => (
                <MenuItem key={duration} value={duration}>
                  <Checkbox
                    checked={selectedDurations.indexOf(duration) > -1}
                  />
                  {duration}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel
              sx={{ color: "#94a3b8", "&.Mui-focused": { color: "#3b82f6" } }}
            >
              Credits
            </InputLabel>
            <Select
              value={creditRange}
              onChange={(e) => setCreditRange(e.target.value)}
              label="Credits"
              sx={{
                minWidth: "140px",
                color: "#ffffff",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                "& fieldset": { borderColor: "rgba(148, 163, 184, 0.3)" },
                "&:hover fieldset": { borderColor: "rgba(148, 163, 184, 0.5)" },
                "&.Mui-focused fieldset": { borderColor: "#3b82f6" },
                "& .MuiSelect-icon": { color: "#94a3b8" },
              }}
            >
              <MenuItem value="">All</MenuItem>
              {creditOptions.map((credit) => (
                <MenuItem key={credit} value={credit}>
                  {credit} credits
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6} md={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={dualCreditOnly}
                onChange={(e) => setDualCreditOnly(e.target.checked)}
                sx={{
                  color: "#94a3b8",
                  "&.Mui-checked": { color: "#3b82f6" },
                }}
              />
            }
            label="Dual Credit Only"
            sx={{ color: "#ffffff", height: "40px" }}
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

const DepartmentTable = ({
  department,
  departmentData,
  expandedId,
  setExpandedId,
}) => {
  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <Paper
      elevation={0}
      sx={{
        maxWidth: "1200px",
        mx: "auto",
        mb: 6,
        px: 4,
        py: 3,
        borderRadius: "16px",
        background: "rgba(255, 255, 255, 0.05)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(148, 163, 184, 0.1)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        animation: `${fadeIn} 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both`,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: "600",
          mb: 3,
          color: "#ffffff",
          fontSize: "1.25rem",
          letterSpacing: "-0.025em",
          position: "relative",
          paddingLeft: "16px",
          "&::before": {
            content: '""',
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: "4px",
            height: "20px",
            background: `linear-gradient(180deg, ${departmentData.color}, ${departmentData.color}dd)`,
            borderRadius: "2px",
          },
        }}
      >
        {department} ({departmentData.courses.length} courses)
      </Typography>

      <Divider
        sx={{
          mb: 3,
          borderColor: "rgba(148, 163, 184, 0.2)",
          "&::before, &::after": {
            borderColor: "rgba(148, 163, 184, 0.2)",
          },
        }}
      />

      <TableContainer
        sx={{
          borderRadius: "12px",
          overflowX: "auto", // key for horizontal scroll
          background: "rgba(255, 255, 255, 0.02)",
          border: "1px solid rgba(148, 163, 184, 0.1)",
          width: "100%",
        }}
      >
        <Table
          sx={{
            tableLayout: { xs: "auto", sm: "fixed" }, // allow auto layout on mobile
            minWidth: "600px", // force scroll on very small screens
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                background: `${departmentData.color}20`,
                "& .MuiTableCell-head": {
                  borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
                },
              }}
            >
              {[
                "Course Title",
                "Credits",
                "Grade Level",
                "Dual Credit",
                "Duration",
                "Prerequisites",
              ].map((header) => (
                <TableCell
                  key={header}
                  sx={{
                    fontWeight: 600,
                    color: "#ffffff",
                    fontSize: { xs: "0.65rem", sm: "0.6rem" },
                    letterSpacing: "0.025em",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {header}
                </TableCell>
              ))}
              <TableCell />
            </TableRow>
          </TableHead>

          <TableBody>
            {departmentData.courses.map((course, index) => (
              <React.Fragment key={course.id}>
                <TableRow
                  hover
                  onClick={() => toggleExpand(course.id)}
                  sx={{
                    cursor: "pointer",
                    borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    animation: `${fadeIn} 0.6s ease ${index * 0.1}s both`,
                    "&:hover": {
                      backgroundColor: `${departmentData.color}10`,
                      transform: "translateX(4px)",
                    },
                    "& .MuiTableCell-body": {
                      borderBottom: "none",
                    },
                  }}
                >
                  <TableCell
                    sx={{
                      color: "#f1f5f9",
                      fontWeight: 500,
                      fontSize: "0.75rem",
                      whiteSpace: "normal",
                    }}
                  >
                    {course.name}
                  </TableCell>
                  <TableCell sx={{ color: "#cbd5e1", fontSize: "0.7rem" }}>
                    {course.credit}
                  </TableCell>
                  <TableCell sx={{ color: "#cbd5e1", fontSize: "0.7rem" }}>
                    {course.gradeLevel}
                  </TableCell>
                  <TableCell
                    sx={{
                      color: course.dualCredit
                        ? departmentData.color
                        : "#94a3b8",
                      fontWeight: course.dualCredit ? 500 : 400,
                      fontSize: "0.7rem",
                    }}
                  >
                    {course.dualCredit ? "Yes" : "No"}
                  </TableCell>
                  <TableCell sx={{ color: "#cbd5e1", fontSize: "0.7rem" }}>
                    {course.duration}
                  </TableCell>
                  <TableCell sx={{ color: "#cbd5e1", fontSize: "0.7rem" }}>
                    {course.prerequisite}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      sx={{
                        color: "#94a3b8",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          color: departmentData.color,
                          backgroundColor: `${departmentData.color}20`,
                          transform: "scale(1.1)",
                        },
                      }}
                    >
                      {expandedId === course.id ? (
                        <ExpandLess />
                      ) : (
                        <ExpandMore />
                      )}
                    </IconButton>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell
                    colSpan={7}
                    sx={{
                      p: 0,
                      border: 0,
                      borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
                    }}
                  >
                    <Collapse
                      in={expandedId === course.id}
                      timeout="auto"
                      unmountOnExit
                    >
                      <Box
                        sx={{
                          p: { xs: 2, sm: 3 },
                          background: `${departmentData.color}10`,
                          borderTop: `1px solid ${departmentData.color}30`,
                          borderRadius: "0 0 8px 8px",
                          m: "0 16px 16px 16px",
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#e2e8f0",
                            whiteSpace: "pre-line",
                            lineHeight: 1.6,
                            fontSize: "0.7rem",
                          }}
                        >
                          {course.description}
                        </Typography>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default function ClassesCatalog() {
  const [expandedId, setExpandedId] = useState(null);
  const [filters, setFilters] = useState({
    searchTerm: "",
    selectedDepartments: [],
    selectedGradeLevels: [],
    selectedDurations: [],
    dualCreditOnly: false,
    creditRange: "",
  });

  const filteredCourseData = useMemo(() => {
    const filtered = {};

    Object.entries(courseData).forEach(([department, departmentData]) => {
      const filteredCourses = departmentData.courses.filter((course) => {
        // Search term filter (searches name, description, prerequisites)
        const searchMatch =
          !filters.searchTerm ||
          course.name
            .toLowerCase()
            .includes(filters.searchTerm.toLowerCase()) ||
          course.description
            .toLowerCase()
            .includes(filters.searchTerm.toLowerCase()) ||
          course.prerequisite
            .toLowerCase()
            .includes(filters.searchTerm.toLowerCase());

        // Department filter
        const deptMatch =
          filters.selectedDepartments.length === 0 ||
          filters.selectedDepartments.includes(department);

        // Grade level filter
        const gradeMatch =
          filters.selectedGradeLevels.length === 0 ||
          filters.selectedGradeLevels.includes(course.gradeLevel);

        // Duration filter
        const durationMatch =
          filters.selectedDurations.length === 0 ||
          filters.selectedDurations.includes(course.duration);

        // Dual credit filter
        const dualCreditMatch = !filters.dualCreditOnly || course.dualCredit;

        // Credit range filter
        const creditMatch =
          !filters.creditRange ||
          (filters.creditRange === "0.5" && course.credit === 0.5) ||
          (filters.creditRange === "1.0" && course.credit === 1.0) ||
          (filters.creditRange === "1.5+" && course.credit >= 1.5);

        return (
          searchMatch &&
          deptMatch &&
          gradeMatch &&
          durationMatch &&
          dualCreditMatch &&
          creditMatch
        );
      });

      if (filteredCourses.length > 0) {
        filtered[department] = {
          ...departmentData,
          courses: filteredCourses,
        };
      }
    });

    return filtered;
  }, [filters]);

  const totalCourses = Object.values(courseData).reduce(
    (sum, dept) => sum + dept.courses.length,
    0
  );
  const filteredCount = Object.values(filteredCourseData).reduce(
    (sum, dept) => sum + dept.courses.length,
    0
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0f172a 0%, #1c2333 100%)",
        pt: "96px",
        pb: 8,
        px: 4,
        fontFamily:
          '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <Typography
        variant="h4"
        sx={{
          mb: 6,
          fontWeight: "700",
          textAlign: "center",
          color: "#ffffff",
          mt: 8,
          fontSize: "2.5rem",
          letterSpacing: "-0.025em",
          animation: `${fadeIn} 0.8s cubic-bezier(0.4, 0, 0.2, 1)`,
          position: "relative",
        }}
      >
        Course Catalog
      </Typography>

      <SmartSearch
        onFiltersChange={setFilters}
        totalCourses={totalCourses}
        filteredCount={filteredCount}
      />

      {Object.keys(filteredCourseData).length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            maxWidth: "1200px",
            mx: "auto",
            p: 4,
            borderRadius: "16px",
            background: "rgba(255, 255, 255, 0.05)",
            textAlign: "center",
          }}
        >
          <Typography variant="h6" sx={{ color: "#94a3b8", mb: 2 }}>
            No courses found
          </Typography>
          <Typography variant="body2" sx={{ color: "#64748b" }}>
            Try adjusting your search criteria or clearing some filters.
          </Typography>
        </Paper>
      ) : (
        Object.entries(filteredCourseData).map(
          ([department, departmentData]) => (
            <DepartmentTable
              key={department}
              department={department}
              departmentData={departmentData}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
            />
          )
        )
      )}
    </Box>
  );
}
