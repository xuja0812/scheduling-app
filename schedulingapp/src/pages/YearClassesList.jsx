import React, { useState } from 'react';
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Divider,
  Collapse,
  IconButton,
} from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';

const businessCourses = [
  {
    id: 'BU526014',
    name: 'College Personal Finance - CAPP (H)',
    credit: 0.5,
    duration: '1 Trimester',
    gradeLevel: '9-12',
    prerequisite: 'None',
    dualCredit: true,
    department: 'Business',
    description: `A study of the major financial decisions encountered by individuals. Subjects covered are budgeting, use of credit, insurance, taxes, retirement planning, and investments. Each subject is analyzed within the context of a comprehensive framework of personal financial planning. It provides students with essential skills for managing their finances and making informed financial decisions. The course typically covers budgeting, saving, investing, and understanding credit. Students learn how to create and maintain a budget, the importance of building an emergency fund, the basics of investing in stocks and bonds, and the impact of credit scores on financial health. Additionally, the curriculum often includes practical lessons on managing debt, maintaining a checking account, understanding taxes, planning for future financial goals, and preparing students to navigate the financial aspects of adult life with confidence and responsibility. This course meets Wisconsin’s ACT 60 legislation - making this course or its on-level counterpart (Personal Finance) a graduation requirement. Additionally, dual credit can be earned with successful completion of this course. *Fee applicable for dual credit recognition.`,
  },
  {
    id: 'BU501004',
    name: 'Employability Skills',
    credit: 0.5,
    duration: '1 Trimester',
    gradeLevel: '9-12',
    prerequisite: 'None',
    dualCredit: false,
    department: 'Business',
    description: `This course focuses on developing general employability competencies for all students--the college-bound student seeking a professional career as well as the student entering the work force upon graduation. Emphasis is given to career exploration, attitude, motivation, leadership, and human relations relating to job/career success. Steps in finding a job will be examined, job exploration will be performed as well as job applications completed and mock interviews conducted.`,
  },
  {
    id: 'BU511014',
    name: 'Introduction to Business',
    credit: 0.5,
    duration: '1 Trimester',
    gradeLevel: '9-12',
    prerequisite: 'None',
    dualCredit: true,
    department: 'Business',
    description: `The course is designed as an introductory course for all students interested in learning more about business. Students will be exposed to many different aspects of the world of business. A primary objective of the course is to broaden both the interests and horizons of early level university students toward understanding the dynamics of business and business careers. Lectures, readings, presentations by guest speakers, and videos are included.`,
  },
];

export default function ClassesCatalog() {
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        pt: '96px',
        pb: 8,
        px: 4,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Typography
        variant="h4"
        sx={{
          mb: 6,
          fontWeight: 600,
          textAlign: 'center',
          color: '#f8fafc',
          mt: 8,
        }}
      >
        Course Catalog
      </Typography>

      <Paper
        elevation={3}
        sx={{
          maxWidth: '1000px',
          mx: 'auto',
          mb: 6,
          px: 3,
          py: 2,
          borderRadius: 3,
          backgroundColor: '#ffffff',
          boxShadow: '0px 4px 12px rgba(0,0,0,0.2)',
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            mb: 2,
            color: '#1e293b',
          }}
        >
          Business
        </Typography>

        <Divider sx={{ mb: 2, borderColor: '#cbd5e1' }} />

        <TableContainer>
          <Table sx={{ tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Course Title</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Credits</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Grade Level</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Dual Credit Option</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Prerequisites</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {businessCourses.map((course) => (
                <React.Fragment key={course.id}>
                  <TableRow
                    hover
                    onClick={() => toggleExpand(course.id)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#f1f5f9' },
                    }}
                  >
                    <TableCell sx={{ color: '#334155' }}>{course.name}</TableCell>
                    <TableCell sx={{ color: '#334155' }}>{course.credit}</TableCell>
                    <TableCell sx={{ color: '#334155' }}>{course.gradeLevel}</TableCell>
                    <TableCell sx={{ color: '#334155' }}>{course.dualCredit ? 'Yes' : 'No'}</TableCell>
                    <TableCell sx={{ color: '#334155' }}>{course.duration}</TableCell>
                    <TableCell sx={{ color: '#334155' }}>{course.prerequisite}</TableCell>
                    <TableCell>
                      <IconButton size="small">
                        {expandedId === course.id ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
                      <Collapse in={expandedId === course.id} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, backgroundColor: '#f8fafc' }}>
                          <Typography variant="body2" sx={{ color: '#475569', whiteSpace: 'pre-line' }}>
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
    </Box>
  );
}
