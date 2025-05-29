import { useState, useEffect } from 'react';
import {
  Button,
  TextField,
  MenuItem,
  Typography,
  Paper,
  Tabs,
  Tab,
  Box,
  IconButton,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const defaultYears = ['9th Grade', '10th Grade', '11th Grade', '12th Grade'];

const semesterToGrade = (year, semester) => {
  const currentYear = 2025;
  const yearDiff = currentYear - parseInt(year);
  if (semester.toLowerCase() === 'fall' || semester.toLowerCase() === 'spring') {
    if (yearDiff === 0) return '12th Grade';
    if (yearDiff === 1) return '11th Grade';
    if (yearDiff === 2) return '10th Grade';
    if (yearDiff === 3) return '9th Grade';
  }
  return '12th Grade';
};

export default function FourYearPlanner() {
  const [plans, setPlans] = useState([]);
  const [activePlanIndex, setActivePlanIndex] = useState(0);
  const [newCourse, setNewCourse] = useState({
    year: '9th Grade',
    name: '',
    credits: 1,
  });
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetch('http://localhost:4000/api/plans', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch plans');
        return res.json();
      })
      .then((plansData) => {
        if (plansData.length === 0) {
          setPlans([]);
          return;
        }

        Promise.all(
          plansData.map((plan) =>
            fetch(`http://localhost:4000/api/plans/${plan.id}`, { credentials: 'include' })
              .then((r) => r.json())
              .then((courses) => {
                const yearsGrouped = {
                  '9th Grade': [],
                  '10th Grade': [],
                  '11th Grade': [],
                  '12th Grade': [],
                };
                courses.forEach(({ class_code, year }) => {
                  if (yearsGrouped[year]) {
                    yearsGrouped[year].push(class_code);
                  } else {
                    yearsGrouped['9th Grade'].push(class_code);
                  }
                });
                return { ...plan, years: yearsGrouped };
              })
          )
        ).then((plansWithCourses) => {
          setPlans(plansWithCourses);

          plansWithCourses.forEach((plan) => {
            fetch(`http://localhost:4000/api/plans/${plan.id}/comments`, { credentials: 'include' })
              .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch comments');
                return res.json();
              })
              .then((commentsData) => {
                setComments((prev) => ({ ...prev, [plan.id]: commentsData }));
              })
              .catch(() => {
                setComments((prev) => ({ ...prev, [plan.id]: [] }));
              });
          });
        });
      })
      .catch(console.error);
  }, []);

  const fetchComments = (planId) => {
    fetch(`http://localhost:4000/api/plans/${planId}/comments`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        setComments((prev) => ({ ...prev, [planId]: data }));
      });
  };

  const handleAddComment = () => {
    const planId = plans[activePlanIndex]?.id;
    if (!planId || !newComment.trim()) return;

    fetch(`http://localhost:4000/api/plans/${planId}/comments`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newComment.trim() }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to post comment');
        setNewComment('');
        fetchComments(planId);
      })
      .catch(console.error);
  };

  const handleAddCourse = () => {
    if (!newCourse.name.trim()) return;
    const updatedPlans = [...plans];
    updatedPlans[activePlanIndex].years[newCourse.year].push(newCourse.name.trim());
    setPlans(updatedPlans);
    setNewCourse({ ...newCourse, name: '' });
  };

  const flattenCourses = (yearsObj) => {
    const courses = [];
    for (const [year, classes] of Object.entries(yearsObj)) {
      classes.forEach((class_code) => {
        courses.push({
          class_code,
          year,
          semester: 'fall',
        });
      });
    }
    return courses;
  };

  const handleSaveCourses = () => {
    const activePlan = plans[activePlanIndex];
    const coursesFlat = flattenCourses(activePlan.years);

    if (!activePlan.id) {
      fetch('http://localhost:4000/api/plans', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: activePlan.name, courses: coursesFlat }),
      })
        .then((res) => res.json())
        .then(({ planId }) => {
          const updatedPlans = [...plans];
          updatedPlans[activePlanIndex].id = planId;
          setPlans(updatedPlans);
          alert('Plan created successfully');
        })
        .catch(console.error);
    } else {
      fetch(`http://localhost:4000/api/plans/${activePlan.id}/courses`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courses: coursesFlat, name: activePlan.name }),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to update plan courses');
          alert('Courses updated successfully');
        })
        .catch((err) => {
          alert(err.message);
        });
    }
  };

  const handleUpdatePlanName = () => {
    const activePlan = plans[activePlanIndex];
    if (!activePlan.id) {
      alert('Please save the plan before updating its name.');
      return;
    }

    fetch(`http://localhost:4000/api/plans/${activePlan.id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: activePlan.name }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to update plan name');
        alert('Plan name updated');
      })
      .catch((err) => alert(err.message));
  };

  const handleDeletePlan = () => {
    const activePlan = plans[activePlanIndex];
    if (!activePlan.id) {
      alert('Plan not saved yet');
      return;
    }
    fetch(`http://localhost:4000/api/plans/${activePlan.id}`, {
      method: 'DELETE',
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to delete plan');
        const updatedPlans = plans.filter((_, i) => i !== activePlanIndex);
        setPlans(updatedPlans);
        setActivePlanIndex(Math.max(0, activePlanIndex - 1));
        alert('Plan deleted');
      })
      .catch(console.error);
  };

  const handleNameChange = (e) => {
    const updatedPlans = [...plans];
    updatedPlans[activePlanIndex].name = e.target.value;
    setPlans(updatedPlans);
  };

  const handleCourseRemove = (year, idx) => {
    const updatedPlans = [...plans];
    updatedPlans[activePlanIndex].years[year].splice(idx, 1);
    setPlans(updatedPlans);
  };

  const handleAddPlan = () => {
    setPlans((prev) => [
      ...prev,
      {
        name: '',
        years: {
          '9th Grade': [],
          '10th Grade': [],
          '11th Grade': [],
          '12th Grade': [],
        },
      },
    ]);
    setActivePlanIndex(plans.length);
  };

  const renderComments = () => {
    const planId = plans[activePlanIndex]?.id;
    if (!planId || !comments[planId])
      return <Typography color="text.secondary">No comments yet.</Typography>;
  
    const planComments = comments[planId];
    console.log(planComments);
    if (planComments.length === 0)
      return <Typography color="text.secondary">No comments yet.</Typography>;
  
    return (
      <Box
        component="ul"
        sx={{
          listStyle: 'none',
          p: 0,
          maxHeight: 180,
          overflowY: 'auto',
          border: '1px solid #ddd',
          borderRadius: 1,
          backgroundColor: '#fafafa',
        }}
      >
        {planComments.slice().reverse().map((comment) => (
          <li
            key={comment.id}
            style={{ padding: '8px 12px', borderBottom: '1px solid #eee' }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 500, color: 'gray' }}>
              {comment.author}
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
              {comment.text}
            </Typography>
            {comment.created_at && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.3 }}>
                {new Date(comment.created_at).toLocaleString()}
              </Typography>
            )}
          </li>
        ))}
      </Box>
    );
  };
  

  return (
    <Paper sx={{ p: 3, maxWidth: 900, margin: 'auto', mt: '160px' }}>
      <Typography variant="h4" gutterBottom>
        Class Planner
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activePlanIndex}
          onChange={(_, newIndex) => setActivePlanIndex(newIndex)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {plans.map((plan, idx) => (
            <Tab
              key={idx}
              label={plan.name || `Plan ${idx + 1}`}
              sx={{ minWidth: 120 }}
            />
          ))}
          <Button
            onClick={handleAddPlan}
            size="small"
            variant="outlined"
            sx={{ ml: 1, textTransform: 'none', fontWeight: 'bold' }}
          >
            + New
          </Button>
        </Tabs>
      </Box>

      {plans.length === 0 ? (
        <Typography sx={{ mt: 3 }}>No plans found. Create one!</Typography>
      ) : (
        <>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="Plan Name"
              value={plans[activePlanIndex].name}
              onChange={handleNameChange}
              size="small"
              sx={{ mb: 2, width: '100%' }}
              placeholder="Enter a plan name"
            />
            <Button
              variant="contained"
              onClick={handleUpdatePlanName}
              sx={{ mb: 2 }}
              disabled={!plans[activePlanIndex].name.trim()}
            >
              Save Plan Name
            </Button>

            {defaultYears.map((year) => (
              <Box key={year} sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {year}
                </Typography>
                <Divider sx={{ mb: 1 }} />
                {plans[activePlanIndex].years[year].length === 0 ? (
                  <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No courses added.
                  </Typography>
                ) : (
                  plans[activePlanIndex].years[year].map((course, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mb: 0.7,
                      }}
                    >
                      <Typography sx={{ flexGrow: 1 }}>{course}</Typography>
                      <IconButton
                        aria-label="delete"
                        size="small"
                        onClick={() => handleCourseRemove(year, idx)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))
                )}
              </Box>
            ))}

            <Box
              sx={{
                display: 'flex',
                gap: 1,
                alignItems: 'center',
                mb: 2,
                flexWrap: 'wrap',
              }}
            >
              <TextField
                select
                label="Year"
                value={newCourse.year}
                onChange={(e) =>
                  setNewCourse((prev) => ({ ...prev, year: e.target.value }))
                }
                size="small"
                sx={{ minWidth: 140 }}
              >
                {defaultYears.map((year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Course Name"
                value={newCourse.name}
                onChange={(e) =>
                  setNewCourse((prev) => ({ ...prev, name: e.target.value }))
                }
                size="small"
                sx={{ flexGrow: 1, minWidth: 200 }}
              />
              <Button variant="outlined" onClick={handleAddCourse} size="small">
                Add Course
              </Button>
              <Button variant="contained" onClick={handleSaveCourses} size="small">
                Save Courses
              </Button>
              <Button variant="outlined" color="error" onClick={handleDeletePlan} size="small">
                Delete Plan
              </Button>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Comments
              </Typography>
              {renderComments()}
              <TextField
                label="Add Comment"
                multiline
                fullWidth
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                sx={{ mt: 2, mb: 1 }}
              />
              <Button
                variant="outlined"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
              >
                Post Comment
              </Button>
            </Box>
          </Box>
        </>
      )}
    </Paper>
  );
}
