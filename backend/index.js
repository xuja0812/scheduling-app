const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./auth');
const cookieParser = require('cookie-parser');
const { db, initDB } = require('./db');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const port = 4000;

initDB();

app.use(cors({
  origin: 'http://localhost:5173',
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

app.get('/my-schedules', (req, res) => {
  logReq(req);
  if (!req.isAuthenticated()) {
    console.log('User not authenticated for /my-schedules');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json([
    { year: '2025', semester: 'Fall', class_code: 'MATH101' },
    { year: '2025', semester: 'Fall', class_code: 'ENG202' },
  ]);
});

app.get('/all-schedules', (req, res) => {
  logReq(req);
  if (!req.isAuthenticated() || req.user.role !== 'admin') {
    console.log('Unauthorized access attempt to /all-schedules');
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json([
    { year: '2025', semester: 'Fall', name: 'Jasmine', class_code: 'MATH101' },
    { year: '2025', semester: 'Fall', name: 'Alex', class_code: 'BIO104' },
  ]);
});

app.get('/api/admin/all-plans', (req, res) => {
    logReq(req);
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      console.log('Unauthorized access attempt to /api/admin/all-plans');
      return res.status(403).json({ error: 'Forbidden' });
    }
  
    const query = 
      `SELECT plans.id as plan_id, plans.name as plan_name, users.email as student_email,
             plan_courses.class_code, plan_courses.year, plan_courses.semester
      FROM plans
      JOIN users ON plans.user_id = users.id
      LEFT JOIN plan_courses ON plans.id = plan_courses.plan_id
      ORDER BY users.email, plans.name, plan_courses.year, plan_courses.semester`
    ;
  
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error('Error fetching all plans:', err.message);
        return res.status(500).json({ error: err.message });
      }
  
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
    });
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
    failureRedirect: 'http://localhost:5173/login',
  }),
  (req, res) => {
    console.log(`User logged in: ${req.user.email}`);
    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err);
        return res.redirect('http://localhost:5173/login');
      }
      res.redirect('http://localhost:5173/dashboard');
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

const gradePoints = {
  'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0,
  'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'F': 0
};

app.post('/graduation-progress', (req, res) => {
  logReq(req);
  const { takenClasses } = req.body;

  db.all("SELECT * FROM classes", [], (err, allClasses) => {
    if (err) {
      console.error('Error fetching classes:', err.message);
      return res.status(500).json({ error: err.message });
    }

    const taken = allClasses.filter(c => takenClasses.includes(c.code));
    const remaining = allClasses.filter(c => !takenClasses.includes(c.code));
    const creditsTaken = taken.reduce((sum, c) => sum + c.credits, 0);
    const totalCredits = allClasses.reduce((sum, c) => sum + c.credits, 0);

    res.json({
      takenClasses: taken,
      remainingClasses: remaining,
      creditsTaken,
      totalCredits,
      progressPercent: ((creditsTaken / totalCredits) * 100).toFixed(1),
    });
  });
});

app.post('/gpa-calc', (req, res) => {
  logReq(req);
  const { grades } = req.body;
  if (!grades || grades.length === 0) {
    console.log('No grades provided for GPA calculation');
    return res.json({ weightedGPA: 0, unweightedGPA: 0 });
  }

  let totalWeightedPoints = 0;
  let totalUnweightedPoints = 0;
  let totalClasses = grades.length;

  grades.forEach(({ grade, weighted }) => {
    let baseGPA = gradePoints[grade.toUpperCase()] ?? 0;
    totalUnweightedPoints += baseGPA;
    totalWeightedPoints += weighted ? Math.min(baseGPA + 1.0, 5.0) : baseGPA;
  });

  res.json({
    weightedGPA: (totalWeightedPoints / totalClasses).toFixed(2),
    unweightedGPA: (totalUnweightedPoints / totalClasses).toFixed(2),
  });
});

app.post('/track-advisor', (req, res) => {
  logReq(req);
  const { subject, takenClasses } = req.body;

  db.all('SELECT * FROM track_requirements WHERE subject = ?', [subject], (err, requirements) => {
    if (err) {
      console.error('Error fetching track requirements:', err.message);
      return res.status(500).json({ error: err.message });
    }

    const trackLevels = ['regular', 'advanced'];
    const qualifiedTracks = trackLevels.filter(track =>
      requirements.filter(r => r.track_level === track)
        .every(r => takenClasses.includes(r.required_class_code))
    );

    const userTrack = qualifiedTracks.length > 0
      ? qualifiedTracks[qualifiedTracks.length - 1]
      : 'none';

    const reqClasses = requirements.filter(r => r.track_level === userTrack);
    const remainingClasses = reqClasses
      .filter(r => !takenClasses.includes(r.required_class_code))
      .map(r => r.required_class_code);

    res.json({ trackLevel: userTrack, requiredRemainingClasses: remainingClasses });
  });
});

app.get('/api/plans', (req, res) => {
  logReq(req);
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  db.all('SELECT * FROM plans WHERE user_id = ?', [req.user.id], (err, rows) => {
    if (err) {
      console.error('Error fetching plans:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(rows);
    res.json(rows);
  });
});

app.get('/api/plans/:planId', (req, res) => {
  logReq(req);
  const { planId } = req.params;
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  db.all('SELECT * FROM plan_courses WHERE plan_id = ?', [planId], (err, courses) => {
    if (err) {
      console.error('Error fetching plan courses:', err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(courses);
  });
});

app.post('/api/plans', (req, res) => {
  logReq(req);
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { name, courses } = req.body;
  const planId = uuidv4();

  db.run('INSERT INTO plans (id, user_id, name) VALUES (?, ?, ?)', [planId, req.user.id, name], (err) => {
    if (err) {
      console.error('Error inserting plan:', err.message);
      return res.status(500).json({ error: err.message });
    }

    const insertStmt = db.prepare('INSERT INTO plan_courses (plan_id, class_code, year, semester) VALUES (?, ?, ?, ?)');
    for (const course of courses) {
      insertStmt.run(planId, course.class_code, course.year, course.semester);
    }
    insertStmt.finalize((err) => {
      if (err) {
        console.error('Error inserting plan courses:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Plan created successfully', planId });
    });
  });
});

app.put('/api/plans/:planId', (req, res) => {
  logReq(req);
  const { planId } = req.params;
  const { name } = req.body;
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  console.log("The name is: ", name);

  db.run('UPDATE plans SET name = ? WHERE id = ? AND user_id = ?', [name, planId, req.user.id], function (err) {
    if (err) {
      console.error('Error updating plan name:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Plan not found or unauthorized' });
    }
    res.json({ message: 'Plan name updated' });
  });
});

app.put('/api/plans/:planId/courses', (req, res) => {
  logReq(req);
  const { planId } = req.params;
  const { courses, name } = req.body;

  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  db.get('SELECT * FROM plans WHERE id = ? AND user_id = ?', [planId, req.user.id], (err, plan) => {
    if (err) {
      console.error('Error fetching plan:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found or unauthorized' });
    }

    db.run('DELETE FROM plan_courses WHERE plan_id = ?', [planId], (err) => {
      if (err) {
        console.error('Error deleting old plan courses:', err.message);
        return res.status(500).json({ error: err.message });
      }

      const insertStmt = db.prepare('INSERT INTO plan_courses (plan_id, class_code, year, semester) VALUES (?, ?, ?, ?)');
      for (const course of courses) {
        insertStmt.run(planId, course.class_code, course.year, course.semester);
      }
      insertStmt.finalize((err) => {
        if (err) {
          console.error('Error inserting new plan courses:', err.message);
          return res.status(500).json({ error: err.message });
        }

        db.run('UPDATE plans SET name = ? WHERE id = ?', [name, planId], (err) => {
          if (err) {
            console.error('Error updating plan name:', err.message);
            return res.status(500).json({ error: err.message });
          }
          res.json({ message: 'Plan courses updated successfully' });
        });
      });
    });
  });
});

app.delete('/api/plans/:planId', (req, res) => {
  logReq(req);
  const { planId } = req.params;
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Verify ownership
  db.get('SELECT * FROM plans WHERE id = ? AND user_id = ?', [planId, req.user.id], (err, plan) => {
    if (err) {
      console.error('Error fetching plan for deletion:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found or unauthorized' });
    }

    // Delete courses first (foreign key constraints assumed)
    db.run('DELETE FROM plan_courses WHERE plan_id = ?', [planId], (err) => {
      if (err) {
        console.error('Error deleting plan courses:', err.message);
        return res.status(500).json({ error: err.message });
      }
      // Delete plan itself
      db.run('DELETE FROM plans WHERE id = ?', [planId], (err) => {
        if (err) {
          console.error('Error deleting plan:', err.message);
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Plan deleted successfully' });
      });
    });
  });
});

// Add a comment to a plan
app.post('/api/admin/comment', (req, res) => {
    logReq(req);
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
  
    const { planId, comment } = req.body;
    if (!planId || !comment) {
      return res.status(400).json({ error: 'Missing planId or comment' });
    }
  
    const id = uuidv4();
    db.run(
      `INSERT INTO comments (id, plan_id, user_id, text) VALUES (?, ?, ?, ?)`,
      [id, planId, req.user.id, comment],
      (err) => {
        if (err) {
          console.error('Error saving comment:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        res.json({ success: true });
      }
    );
  });
  
  // Get all comments for a plan
  app.get('/api/admin/comments/:planId', (req, res) => {
    logReq(req);
    if (!req.isAuthenticated() || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
  
    const { planId } = req.params;
    db.all(
      `SELECT comments.id, comments.text, comments.created_at, users.name AS author
       FROM comments
       JOIN users ON comments.user_id = users.id
       WHERE plan_id = ?
       ORDER BY comments.created_at DESC`,
      [planId],
      (err, rows) => {
        if (err) {
          console.error('Error fetching comments:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        res.json(rows);
      }
    );
  });

  app.get('/api/plans/:planId/comments', (req, res) => {
    logReq(req);
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
  
    const { planId } = req.params;
  
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
      WHERE comments.plan_id = ?
      ORDER BY comments.created_at ASC
    `;
  
    db.all(query, [planId], (err, rows) => {
      if (err) {
        console.error('Error fetching comments with authors:', err.message);
        return res.status(500).json({ error: err.message });
      }
  
      res.json(rows);
    });
  });
  

  app.post('/api/plans/:planId/comments', (req, res) => {
    logReq(req);
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
  
    const { planId } = req.params;
    const { text } = req.body;
    const userId = req.user.id; // or req.user.email, depending on your schema
  
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }
  
    const query = `INSERT INTO comments (plan_id, user_id, text, created_at) VALUES (?, ?, ?, datetime('now'))`;
  
    db.run(query, [planId, userId, text.trim()], function (err) {
      if (err) {
        console.error('Error inserting comment:', err.message);
        return res.status(500).json({ error: err.message });
      }
  
      res.status(201).json({ 
        id: this.lastID, 
        plan_id: planId, 
        user_id: userId, 
        text, 
        created_at: new Date().toISOString() 
      });
    });
  });
  
  
  

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
