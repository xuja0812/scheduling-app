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
import { keyframes } from '@mui/system';

const subtleGlow = keyframes`
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const courseData = {
  Business: {
    color: '#3b82f6',
    courses: [
      {
        id: 'BU526014',
        name: 'College Personal Finance - CAPP (H)',
        credit: 0.5,
        duration: '1 Trimester',
        gradeLevel: '9-12',
        prerequisite: 'None',
        dualCredit: true,
        department: 'Business',
        description: 'Comprehensive introduction to personal financial management including budgeting, investing, insurance, and retirement planning.'
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
        description: 'Essential workplace skills including communication, teamwork, problem-solving, and professional etiquette.'
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
        description: 'Foundational course covering basic business principles, entrepreneurship, marketing, management, and economics.'
      }
    ]
  },
  Mathematics: {
    color: '#10b981',
    courses: [
      {
        id: 'MA401001',
        name: 'Algebra I',
        credit: 1.0,
        duration: '2 Trimesters',
        gradeLevel: '9-10',
        prerequisite: 'Pre-Algebra or placement test',
        dualCredit: false,
        department: 'Mathematics',
        description: 'Introduction to algebraic concepts including linear equations, inequalities, polynomials, and factoring.'
      },
      {
        id: 'MA402001',
        name: 'Geometry',
        credit: 1.0,
        duration: '2 Trimesters',
        gradeLevel: '9-11',
        prerequisite: 'Algebra I',
        dualCredit: false,
        department: 'Mathematics',
        description: 'Study of geometric principles, proofs, area, volume, and coordinate geometry.'
      },
      {
        id: 'MA404001',
        name: 'AP Calculus AB',
        credit: 1.0,
        duration: '3 Trimesters',
        gradeLevel: '11-12',
        prerequisite: 'Pre-Calculus',
        dualCredit: true,
        department: 'Mathematics',
        description: 'Advanced placement course covering differential and integral calculus concepts.'
      }
    ]
  },
  Science: {
    color: '#8b5cf6',
    courses: [
      {
        id: 'SC301001',
        name: 'Biology I',
        credit: 1.0,
        duration: '3 Trimesters',
        gradeLevel: '9-10',
        prerequisite: 'None',
        dualCredit: false,
        department: 'Science',
        description: 'Introduction to biological concepts including cell biology, genetics, evolution, and ecology.'
      },
      {
        id: 'SC302001',
        name: 'Chemistry I',
        credit: 1.0,
        duration: '3 Trimesters',
        gradeLevel: '10-12',
        prerequisite: 'Algebra I',
        dualCredit: false,
        department: 'Science',
        description: 'Study of chemical principles, atomic structure, bonding, and chemical reactions.'
      },
      {
        id: 'SC303001',
        name: 'AP Physics C',
        credit: 1.0,
        duration: '3 Trimesters',
        gradeLevel: '11-12',
        prerequisite: 'Calculus',
        dualCredit: true,
        department: 'Science',
        description: 'Advanced placement physics covering mechanics and electricity & magnetism with calculus.'
      }
    ]
  },
  English: {
    color: '#f59e0b',
    courses: [
      {
        id: 'EN101001',
        name: 'English I',
        credit: 1.0,
        duration: '3 Trimesters',
        gradeLevel: '9',
        prerequisite: 'None',
        dualCredit: false,
        department: 'English',
        description: 'Foundational course in literature analysis, composition, and communication skills.'
      },
      {
        id: 'EN104001',
        name: 'AP English Literature',
        credit: 1.0,
        duration: '3 Trimesters',
        gradeLevel: '11-12',
        prerequisite: 'English II',
        dualCredit: true,
        department: 'English',
        description: 'Advanced study of literature with emphasis on critical analysis and college-level writing.'
      }
    ]
  }
};

const DepartmentTable = ({ department, departmentData, expandedId, setExpandedId }) => {
  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <Paper
      elevation={0}
      sx={{
        maxWidth: '1200px',
        mx: 'auto',
        mb: 6,
        px: 4,
        py: 3,
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: `${fadeIn} 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: '600',
          mb: 3,
          color: '#ffffff',
          fontSize: '1.25rem',
          letterSpacing: '-0.025em',
          position: 'relative',
          paddingLeft: '16px',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: '4px',
            height: '20px',
            background: `linear-gradient(180deg, ${departmentData.color}, ${departmentData.color}dd)`,
            borderRadius: '2px',
          },
        }}
      >
        {department}
      </Typography>

      <Divider
        sx={{
          mb: 3,
          borderColor: 'rgba(148, 163, 184, 0.2)',
          '&::before, &::after': {
            borderColor: 'rgba(148, 163, 184, 0.2)',
          },
        }}
      />

      <TableContainer
        sx={{
          borderRadius: '12px',
          overflow: 'hidden',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(148, 163, 184, 0.1)',
        }}
      >
        <Table sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow
              sx={{
                background: `${departmentData.color}20`,
                '& .MuiTableCell-head': {
                  borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
                },
              }}
            >
              <TableCell sx={{
                fontWeight: '600',
                color: '#ffffff',
                fontSize: '0.875rem',
                letterSpacing: '0.025em',
                textTransform: 'uppercase',
              }}>
                Course Title
              </TableCell>
              <TableCell sx={{
                fontWeight: '600',
                color: '#ffffff',
                fontSize: '0.875rem',
                letterSpacing: '0.025em',
                textTransform: 'uppercase',
              }}>
                Credits
              </TableCell>
              <TableCell sx={{
                fontWeight: '600',
                color: '#ffffff',
                fontSize: '0.875rem',
                letterSpacing: '0.025em',
                textTransform: 'uppercase',
              }}>
                Grade Level
              </TableCell>
              <TableCell sx={{
                fontWeight: '600',
                color: '#ffffff',
                fontSize: '0.875rem',
                letterSpacing: '0.025em',
                textTransform: 'uppercase',
              }}>
                Dual Credit
              </TableCell>
              <TableCell sx={{
                fontWeight: '600',
                color: '#ffffff',
                fontSize: '0.875rem',
                letterSpacing: '0.025em',
                textTransform: 'uppercase',
              }}>
                Duration
              </TableCell>
              <TableCell sx={{
                fontWeight: '600',
                color: '#ffffff',
                fontSize: '0.875rem',
                letterSpacing: '0.025em',
                textTransform: 'uppercase',
              }}>
                Prerequisites
              </TableCell>
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
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    animation: `${fadeIn} 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s both`,
                    '&:hover': {
                      backgroundColor: `${departmentData.color}10`,
                      transform: 'translateX(4px)',
                    },
                    '& .MuiTableCell-body': {
                      borderBottom: 'none',
                    },
                  }}
                >
                  <TableCell sx={{
                    color: '#f1f5f9',
                    fontWeight: '500',
                    fontSize: '0.875rem',
                  }}>
                    {course.name}
                  </TableCell>
                  <TableCell sx={{
                    color: '#cbd5e1',
                    fontSize: '0.875rem',
                  }}>
                    {course.credit}
                  </TableCell>
                  <TableCell sx={{
                    color: '#cbd5e1',
                    fontSize: '0.875rem',
                  }}>
                    {course.gradeLevel}
                  </TableCell>
                  <TableCell sx={{
                    color: course.dualCredit ? departmentData.color : '#94a3b8',
                    fontSize: '0.875rem',
                    fontWeight: course.dualCredit ? '500' : '400',
                  }}>
                    {course.dualCredit ? 'Yes' : 'No'}
                  </TableCell>
                  <TableCell sx={{
                    color: '#cbd5e1',
                    fontSize: '0.875rem',
                  }}>
                    {course.duration}
                  </TableCell>
                  <TableCell sx={{
                    color: '#cbd5e1',
                    fontSize: '0.875rem',
                  }}>
                    {course.prerequisite}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      sx={{
                        color: '#94a3b8',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          color: departmentData.color,
                          backgroundColor: `${departmentData.color}20`,
                          transform: 'scale(1.1)',
                        },
                      }}
                    >
                      {expandedId === course.id ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    colSpan={7}
                    sx={{
                      p: 0,
                      border: 0,
                      borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                    }}
                  >
                    <Collapse in={expandedId === course.id} timeout="auto" unmountOnExit>
                      <Box sx={{
                        p: 3,
                        background: `${departmentData.color}10`,
                        borderTop: `1px solid ${departmentData.color}30`,
                        borderRadius: '0 0 8px 8px',
                        margin: '0 16px 16px 16px',
                      }}>
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#e2e8f0',
                            whiteSpace: 'pre-line',
                            lineHeight: 1.6,
                            fontSize: '0.875rem',
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

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0f172a 0%, #1c2333 100%)',
        pt: '96px',
        pb: 8,
        px: 4,
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <Typography
        variant="h4"
        sx={{
          mb: 6,
          fontWeight: '700',
          textAlign: 'center',
          color: '#ffffff',
          mt: 8,
          fontSize: '2.5rem',
          letterSpacing: '-0.025em',
          animation: `${fadeIn} 0.8s cubic-bezier(0.4, 0, 0.2, 1)`,
          position: 'relative',
        }}
      >
        Course Catalog
      </Typography>

      {Object.entries(courseData).map(([department, departmentData]) => (
        <DepartmentTable
          key={department}
          department={department}
          departmentData={departmentData}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
        />
      ))}
    </Box>
  );
}