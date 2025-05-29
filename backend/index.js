const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./auth');
const cookieParser = require('cookie-parser');
const { pool } = require('./db');  
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const port = 4000;

const allowedOrigins = [
  'http://localhost:5173',
  'https://scheduler-two-rho.vercel.app'
]

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
  }
}));

app.use(passport.initialize());
app.use(passport.session());

function logReq(req) {
  console.log(`Request: ${req.method} ${req.originalUrl} - User: ${req.user ? req.user.email : 'Not authenticated'}`);
}

module.exports = { app, pool };

app.get('/api/admin/all-plans', async (req, res) => {
  logReq(req);

  if (!req.isAuthenticated() || req.user.role !== 'admin') {
    console.log('Unauthorized access attempt to /api/admin/all-plans');
    return res.status(403).json({ error: 'Forbidden' });
  }

  const query = `
    SELECT plans.id as plan_id, plans.name as plan_name, users.email as student_email,
           plan_courses.class_code, plan_courses.year, plan_courses.semester
    FROM plans
    JOIN users ON plans.user_id = users.id
    LEFT JOIN plan_courses ON plans.id = plan_courses.plan_id
    ORDER BY users.email, plans.name, plan_courses.year, plan_courses.semester
  `;

  try {
    const { rows } = await pool.query(query);

    const plansMap = {};
    rows.forEach(row => {
      if (!plansMap[row.plan_id]) {
        plansMap[row.plan_id] = {
          planId: row.plan_id,
          planName: row.plan_name,
          studentEmail: row.student_email,
          courses: [],
        };
      }
      if (row.class_code) {
        plansMap[row.plan_id].courses.push({
          class_code: row.class_code,
          year: row.year,
          semester: row.semester,
        });
      }
    });

    const allPlans = Object.values(plansMap);
    console.log("All plans:", allPlans);
    res.json(allPlans);

  } catch (err) {
    console.error('Error fetching all plans:', err.message);
    res.status(500).json({ error: err.message });
  }
});


app.get('/auth/google', (req, res, next) => {
  logReq(req);
  next();
}, passport.authenticate('google', {
  scope: ['profile', 'email']
}));

app.get('/auth/google/callback',
  (req, res, next) => {
    logReq(req);
    next();
  },
  passport.authenticate('google', {
    // failureRedirect: 'http://localhost:5173/login',
    failureRedirect: 'https://scheduler-two-rho.vercel.app',
  }),
  (req, res) => {
    console.log(`User logged in: ${req.user.email}`);
    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err);
        return res.redirect('https://scheduler-two-rho.vercel.app');
      }
      res.redirect('https://scheduler-two-rho.vercel.app/dashboard');
    });
  }
);

app.get('/logout', (req, res) => {
  logReq(req);
  req.logout(() => {
    req.session.destroy(err => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ error: 'Failed to log out' });
      }
      console.log('User logged out');
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  });
});

app.get('/me', (req, res) => {
  logReq(req);
  if (req.isAuthenticated()) {
    console.log(`Current user: ${req.user.email}`);
    res.json({ user: req.user });
  } else {
    console.log('User not authenticated for /me');
    res.status(401).json({ error: 'Not authenticated' });
  }
});

app.get('/api/plans', async (req, res) => {
  logReq(req);
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const result = await pool.query('SELECT * FROM plans WHERE user_id = $1', [req.user.id]);
    console.log(result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching plans:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/plans/:planId', async (req, res) => {
  logReq(req);
  const { planId } = req.params;

  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM plan_courses WHERE plan_id = $1',
      [planId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching plan courses:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/plans', async (req, res) => {
  logReq(req);

  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { name, courses } = req.body;
  const planId = uuidv4();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'INSERT INTO plans (id, user_id, name) VALUES ($1, $2, $3)',
      [planId, req.user.id, name]
    );

    const insertCourseText = `
      INSERT INTO plan_courses (plan_id, class_code, year, semester)
      VALUES ($1, $2, $3, $4)
    `;
    for (const course of courses) {
      await client.query(insertCourseText, [
        planId,
        course.class_code,
        course.year,
        course.semester,
      ]);
    }

    await client.query('COMMIT');
    res.json({ message: 'Plan created successfully', planId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error inserting plan and courses:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});


app.put('/api/plans/:planId', async (req, res) => {
  logReq(req);
  const { planId } = req.params;
  const { name } = req.body;

  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  console.log("The name is: ", name);

  try {
    const result = await pool.query(
      'UPDATE plans SET name = $1 WHERE id = $2 AND user_id = $3',
      [name, planId, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Plan not found or unauthorized' });
    }

    res.json({ message: 'Plan name updated' });
  } catch (err) {
    console.error('Error updating plan name:', err.message);
    res.status(500).json({ error: err.message });
  }
});


app.put('/api/plans/:planId/courses', async (req, res) => {
  logReq(req);
  const { planId } = req.params;
  const { courses, name } = req.body;

  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Check if plan exists and belongs to user
    const planResult = await pool.query(
      'SELECT * FROM plans WHERE id = $1 AND user_id = $2',
      [planId, req.user.id]
    );
    if (planResult.rowCount === 0) {
      return res.status(404).json({ error: 'Plan not found or unauthorized' });
    }

    // Delete old plan courses
    await pool.query('DELETE FROM plan_courses WHERE plan_id = $1', [planId]);

    await pool.query('BEGIN');
    for (const course of courses) {
      await pool.query(
        `INSERT INTO plan_courses (plan_id, class_code, year, semester) 
         VALUES ($1, $2, $3, $4)`,
        [planId, course.class_code, course.year, course.semester]
      );
    }

    // Update plan name
    await pool.query('UPDATE plans SET name = $1 WHERE id = $2', [name, planId]);

    await pool.query('COMMIT');

    res.json({ message: 'Plan courses updated successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error updating plan courses:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/plans/:planId', async (req, res) => {
  logReq(req);
  const { planId } = req.params;

  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const planResult = await pool.query(
      'SELECT * FROM plans WHERE id = $1 AND user_id = $2',
      [planId, req.user.id]
    );
    if (planResult.rowCount === 0) {
      return res.status(404).json({ error: 'Plan not found or unauthorized' });
    }

    await pool.query('BEGIN');
    await pool.query('DELETE FROM plan_courses WHERE plan_id = $1', [planId]);
    await pool.query('DELETE FROM plans WHERE id = $1', [planId]);
    await pool.query('COMMIT');

    res.json({ message: 'Plan deleted successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error deleting plan:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/comment', async (req, res) => {
  logReq(req);
  if (!req.isAuthenticated() || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { planId, comment } = req.body;
  if (!planId || !comment) {
    return res.status(400).json({ error: 'Missing planId or comment' });
  }

  try {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO comments (id, plan_id, user_id, text) VALUES ($1, $2, $3, $4)`,
      [id, planId, req.user.id, comment]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving comment:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/admin/comments/:planId', async (req, res) => {
  logReq(req);
  if (!req.isAuthenticated() || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { planId } = req.params;
  try {
    const result = await pool.query(
      `SELECT comments.id, comments.text, comments.created_at, users.name AS author
       FROM comments
       JOIN users ON comments.user_id = users.id
       WHERE plan_id = $1
       ORDER BY comments.created_at DESC`,
      [planId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching comments:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/plans/:planId/comments', async (req, res) => {
  logReq(req);
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { planId } = req.params;

  try {
    const query = `
      SELECT 
        comments.id,
        comments.plan_id,
        comments.user_id,
        comments.text,
        comments.created_at,
        users.name AS author,
        users.email AS author_email,
        users.role AS author_role
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE comments.plan_id = $1
      ORDER BY comments.created_at ASC
    `;

    const result = await pool.query(query, [planId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching comments with authors:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/plans/:planId/comments', async (req, res) => {
  logReq(req);
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { planId } = req.params;
  const { text } = req.body;
  const userId = req.user.id;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Comment text is required' });
  }

  try {
    const insertQuery = `
      INSERT INTO comments (plan_id, user_id, text, created_at) 
      VALUES ($1, $2, $3, NOW())
      RETURNING id, plan_id, user_id, text, created_at
    `;

    const result = await pool.query(insertQuery, [planId, userId, text.trim()]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting comment:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
