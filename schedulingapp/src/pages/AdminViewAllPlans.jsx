import { useEffect, useState } from 'react';
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
  Typography
} from '@mui/material';

export default function AdminViewAllPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [adminComment, setAdminComment] = useState('');
  const [commentStatus, setCommentStatus] = useState(null);
  const [comments, setComments] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  useEffect(() => {
    fetch(`${backendURL}/api/admin/all-plans`, {
      credentials: 'include',
    })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch plans');
        return res.json();
      })
      .then(data => {
        setPlans(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const fetchComments = async (planId) => {
    setComments([]);
    try {
      const res = await fetch(`${backendURL}/api/admin/comments/${planId}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error(err);
      setComments([]);
    }
  };

  const handleCommentSubmit = async () => {
    if (!adminComment.trim()) return;

    try {
      const res = await fetch(`${backendURL}/api/admin/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          planId: selectedPlan.planId,
          comment: adminComment,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit comment');

      setCommentStatus('Comment saved!');
      setAdminComment('');
      fetchComments(selectedPlan.planId);
    } catch (err) {
      console.error(err);
      setCommentStatus('Error saving comment.');
    }
  };

  const groupedPlans = plans.reduce((acc, plan) => {
    if (!acc[plan.studentEmail]) {
      acc[plan.studentEmail] = [];
    }
    acc[plan.studentEmail].push(plan);
    return acc;
  }, {});

  if (loading) return <div className="text-center mt-10 text-white font-semibold">Loading...</div>;
  if (error) return <div className="text-center mt-10 text-red-400 font-semibold">Error: {error}</div>;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: 2,
        py: 8,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Typography
        variant="h4"
        sx={{
          mb: 4,
          color: '#ffffff',
          fontWeight: 700,
          textAlign: 'center',
          mt: 12,
        }}
      >
        All Student Plans
      </Typography>

      <Stack spacing={2} sx={{ width: '100%', maxWidth: 600 }}>
        {Object.entries(groupedPlans).map(([email]) => (
          <Paper
            key={email}
            elevation={4}
            onClick={() => setSelectedEmail(email)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderRadius: 3,
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              border: '1px solid #334155',
              cursor: 'pointer',
              transition: '0.2s ease',
              '&:hover': {
                backgroundColor: '#334155',
              },
            }}
          >
            <Avatar sx={{ bgcolor: '#0ea5e9', fontWeight: 'bold' }}>
              {email.charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {email}
            </Typography>
          </Paper>
        ))}
      </Stack>

      <Dialog
        open={Boolean(selectedEmail)}
        onClose={() => {
          setSelectedEmail(null);
          setSelectedPlan(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
          Plans by {selectedEmail}
        </DialogTitle>
        <DialogContent dividers>
          {selectedEmail && groupedPlans[selectedEmail].map(plan => (
            <Paper
              key={plan.planId}
              elevation={2}
              onClick={() => {
                setSelectedPlan(plan);
                setAdminComment('');
                setCommentStatus(null);
                fetchComments(plan.planId);
              }}
              sx={{
                mb: 2,
                p: 2,
                borderRadius: 2,
                backgroundColor: '#f1f5f9',
                '&:hover': {
                  backgroundColor: '#e2e8f0',
                },
                cursor: 'pointer',
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                {plan.planName}
              </Typography>
              <ul style={{ marginTop: 4, color: '#475569', paddingLeft: '1rem' }}>
                {plan.courses.map((course, idx) => (
                  <li key={idx}>
                    {course.class_code} - {course.year} {course.semester}
                  </li>
                ))}
              </ul>
            </Paper>
          ))}
          <Button
            variant="outlined"
            fullWidth
            onClick={() => {
              setSelectedEmail(null);
              setSelectedPlan(null);
            }}
            sx={{
              mt: 2,
              borderRadius: 9999,
              textTransform: 'none',
            }}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedPlan)}
        onClose={() => setSelectedPlan(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem' }}>
          {selectedPlan?.planName}{' '}
          <Typography component="span" sx={{ fontSize: '0.9rem', color: 'gray', fontWeight: 400 }}>
            (by {selectedPlan?.studentEmail})
          </Typography>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column' }}>
          <ul style={{ color: '#475569', marginBottom: '1rem', paddingLeft: '1rem', lineHeight: 1.6 }}>
            {selectedPlan?.courses.map((course, idx) => (
              <li key={idx}>
                {course.class_code} - {course.year} {course.semester}
              </li>
            ))}
          </ul>

          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            Comments:
          </Typography>

          <Box
            sx={{
              backgroundColor: '#f8fafc',
              padding: 2,
              borderRadius: 2,
              border: '1px solid #cbd5e1',
              mb: 2,
              maxHeight: 200,
              overflowY: 'auto',
            }}
          >
            {comments.length === 0 ? (
              <Typography variant="body2" color="textSecondary" fontStyle="italic">
                No comments yet.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {comments.map(comment => (
                  <Paper
                    key={comment.id}
                    elevation={0}
                    sx={{
                      padding: 2,
                      display: 'flex',
                      gap: 2,
                      borderRadius: 2,
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <Avatar sx={{ bgcolor: '#0f766e', fontWeight: 'bold' }}>
                      {comment.author?.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                      <Typography variant="subtitle2" sx={{ color: '#1e293b', fontWeight: 600 }}>
                        {comment.author}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#475569', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                        {comment.text}
                      </Typography>
                    </div>
                  </Paper>
                ))}
              </Stack>
            )}
          </Box>

          <TextField
            label="Leave a comment for this plan..."
            multiline
            rows={4}
            fullWidth
            value={adminComment}
            onChange={e => setAdminComment(e.target.value)}
            margin="normal"
            sx={{
              '& .MuiInputBase-root': {
                borderRadius: 2,
              },
            }}
          />

          <Button
            variant="contained"
            onClick={handleCommentSubmit}
            fullWidth
            sx={{
              mt: 1,
              borderRadius: 9999,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Comment
          </Button>

          <Button
            variant="outlined"
            fullWidth
            sx={{ mt: 4, borderRadius: 9999, textTransform: 'none' }}
            onClick={() => setSelectedPlan(null)}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
