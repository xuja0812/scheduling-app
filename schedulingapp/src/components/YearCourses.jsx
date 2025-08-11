import React from "react";
import { Box, Typography, Divider, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const YearCourses = React.memo(({ year, courses, handleCourseRemove }) => (
  <Box sx={{ mb: 4 }}>
    <Typography
      variant="h6"
      sx={{
        mb: 2,
        color: "#ffffff",
        fontWeight: "600",
      }}
    >
      {year}
    </Typography>
    <Divider sx={{ mb: 2, borderColor: "rgba(148, 163, 184, 0.2)" }} />

    {courses.length === 0 ? (
      <Typography color="text.secondary" sx={{ fontStyle: "italic", color: "#94a3b8" }}>
        No courses added.
      </Typography>
    ) : (
      courses.map((course, idx) => (
        <Box
          key={course.id || idx} // better if course has unique id
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 1,
            p: 2,
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            borderRadius: "8px",
            border: "1px solid rgba(148, 163, 184, 0.1)",
          }}
        >
          <Typography sx={{ flexGrow: 1, color: "#ffffff" }}>{course.name || course}</Typography>
          <IconButton
            aria-label="delete"
            size="small"
            onClick={() => handleCourseRemove(year, idx)}
            sx={{
              color: "#f87171",
              "&:hover": { backgroundColor: "rgba(248, 113, 113, 0.1)" },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ))
    )}
  </Box>
));

export default YearCourses;
