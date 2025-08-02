const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("./auth");
const cookieParser = require("cookie-parser");
const { pool } = require("./db");
const { v4: uuidv4 } = require("uuid");
const http = require("http");
const jwt = require("jsonwebtoken");
const WebSocket = require("ws");
const ScheduleOptimizer = require("./services/scheduleOptimizer");
require("dotenv").config();

const app = express();
const port = 4000;

/**
 * CORS configuration
 */
const allowedOrigins = [
  "http://localhost:81",
  "http://frontend:81",
  "https://scheduler-two-rho.vercel.app",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.set("trust proxy", 1);

app.use(passport.initialize());

/**
 * Standardized logging structure
 */
function logReq(req) {
  console.log(
    `Request: ${req.method} ${req.originalUrl} - User: ${
      req.user ? req.user.email : "Not authenticated"
    }`
  );
}

/**
 * JWT middleware
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = (authHeader && authHeader.split(" ")[1]) || req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    req.user = user;
    next();
  });
};

/**
 * Creating WebSockets server and connections
 */
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const rooms = new Map();

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", (message) => {
    console.log("Received:", message.toString());

    try {
      const { type } = JSON.parse(message.toString());
      /**
       * Open a new room (when a counselor edits a student's
       * schedule or a student edits their own schedules)
       */
      if (type === "join-student-room") {
        const { data } = JSON.parse(message.toString());
        const { studentId, userId, userType } = data;
        rooms.forEach((clients, roomId) => {
          clients.delete(ws);
          if (clients.size === 0) rooms.delete(roomId);
        });
        if (!rooms.has(studentId)) {
          rooms.set(studentId, new Set());
        }
        rooms.get(studentId).add(ws);
        ws.studentId = studentId;
        ws.userId = userId;
        ws.userType = userType;

        console.log(`${userType} ${userId} joined room ${studentId}`);
        console.log(
          `Room ${studentId} now has ${rooms.get(studentId).size} clients`
        );
        ws.send(
          JSON.stringify({
            type: "room-joined",
            data: { studentId, userType, userId },
          })
        );
      } else if (type === "chat-message") {
        /**
         * Chat message (TESTING ONLY)
         */
        console.log(
          `Chat message from ${ws.userType} ${ws.userId} in room ${ws.studentId}`
        );
        if (ws.studentId && rooms.has(ws.studentId)) {
          const roomClients = rooms.get(ws.studentId);
          console.log(
            `Room ${ws.studentId} has ${roomClients.size} total clients`
          );

          const parsedMessage = JSON.parse(message.toString());

          let messagesSent = 0;
          roomClients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "chat-message",
                  message: parsedMessage.message,
                  sender: parsedMessage.sender,
                  timestamp: parsedMessage.timestamp,
                })
              );
              messagesSent++;
              console.log(
                `Sent message to ${client.userType} ${client.userId}`
              );
            }
          });

          console.log(
            `Message sent to ${messagesSent} other clients in room ${ws.studentId}`
          );
        }
      } else if (type === "plans-update") {
        /**
         * Update a plan by adding a course or something else
         */
        const parsedMessage = JSON.parse(message.toString());
        if (ws.studentId && rooms.has(ws.studentId)) {
          const roomClients = rooms.get(ws.studentId);
          console.log(
            `Room ${ws.studentId} has ${roomClients.size} total clients`
          );
          roomClients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "plans-update",
                  plans: parsedMessage.plans,
                  sender: parsedMessage.sender,
                })
              );
              console.log(`Sent plans to ${client.userType} ${client.userId}`);
            }
          });
        }
      } else if (type === "comments-update") {
        /**
         * Update a plan's comments
         */
        const parsedMessage = JSON.parse(message.toString());
        if (ws.studentId && rooms.has(ws.studentId)) {
          const roomClients = rooms.get(ws.studentId);
          console.log(
            `Room ${ws.studentId} has ${roomClients.size} total clients`
          );
          roomClients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({
                  type: "comments-update",
                  comments: parsedMessage.comments,
                  sender: parsedMessage.sender,
                })
              );
              console.log(
                `Sent comments to ${client.userType} ${client.userId}`
              );
            }
          });
        }
      } else {
        ws.send(`Server received: ${message}`);
      }
    } catch (error) {
      console.error("Error parsing message:", error);
      ws.send(`Server received: ${message}`);
    }
  });

  ws.on("close", () => {
    if (ws.studentId) {
      const room = rooms.get(ws.studentId);
      if (room) {
        room.delete(ws);
        if (room.size === 0) {
          rooms.delete(ws.studentId);
        }
        console.log(`Client left room ${ws.studentId}`);
      }
    }
    console.log("Client disconnected");
  });
});

module.exports = { app, pool };

/**
 * COUNSELOR GET
 *
 * Allows the counselor to see all current student plans
 */
app.get("/api/admin/all-plans", authenticateToken, async (req, res) => {
  logReq(req);

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
    rows.forEach((row) => {
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
    res.json(allPlans);
  } catch (err) {
    console.error("Error fetching all plans:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ALL GET
 *
 * Authenticate user
 */
app.get(
  "/auth/google",
  (req, res, next) => {
    logReq(req);
    next();
  },
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false
  })
);

/**
 * ALL GET
 *
 * Auth callback
 */
app.get(
  "/auth/google/callback",
  (req, res, next) => {
    logReq(req);
    next();
  },
  // TODO: put redirect URLs as env variables
  passport.authenticate("google", {
    // failureRedirect: 'http://localhost:5173/login',
    failureRedirect: "https://scheduler-two-rho.vercel.app",
    session: false
  }),
  (req, res) => {
    const { token } = req.user;
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.redirect(`https://scheduler-two-rho.vercel.app/dashboard`);
    // res.redirect("http://localhost:81/dashboard");
  }
);

/**
 * ALL GET
 *
 * Logs user out
 */
app.get("/logout", (req, res) => {
  logReq(req);
  req.logout(() => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
        return res.status(500).json({ error: "Failed to log out" });
      }
      console.log("User logged out");
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out successfully" });
    });
  });
});

/**
 * ALL GET
 *
 * Retrieves current user's info
 */
app.get("/me", authenticateToken, (req, res) => {
  logReq(req);
  console.log(`Current user: ${req.user.email}`);
  res.json({ user: req.user });
});

/**
 * COUNSELOR GET
 *
 * Retrieves all schedules for a student based on their email
 * Does not rely on sessions
 */
app.get("/api/admin/plans", authenticateToken, async (req, res) => {
  logReq(req);
  try {
    const email = req.get("student-email");
    if (!email) {
      return res.status(400).json({ error: "Email header required" });
    }
    const idResult = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (idResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = idResult.rows[0].id;
    const result = await pool.query("SELECT * FROM plans WHERE user_id = $1", [
      userId,
    ]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching plans:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * STUDENT GET
 *
 * Retrieves all schedules for the current student
 * Relies on session
 */
app.get("/api/plans", authenticateToken, async (req, res) => {
  logReq(req);
  try {
    const result = await pool.query("SELECT * FROM plans WHERE user_id = $1", [
      req.user.id,
    ]);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching plans:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ALL GET
 *
 * Retrieves a certain plan based on planId
 */
app.get("/api/plans/:planId", authenticateToken, async (req, res) => {
  logReq(req);
  const { planId } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM plan_courses WHERE plan_id = $1",
      [planId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching plan courses:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * STUDENT POST
 *
 * Adds a new plan for a student
 */
app.post("/api/plans", authenticateToken, async (req, res) => {
  logReq(req);
  const { name, courses } = req.body;
  const planId = uuidv4();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      "INSERT INTO plans (id, user_id, name) VALUES ($1, $2, $3)",
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

    await client.query("COMMIT");
    res.json({ message: "Plan created successfully", planId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error inserting plan and courses:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

/**
 * COUNSELOR PUT
 *
 * Updates a plan for a student when they're in
 * the same WebSockets room
 */
app.put("/api/admin/plans/:planId", authenticateToken, async (req, res) => {
  logReq(req);
  const { planId } = req.params;
  const { name } = req.body;
  try {
    const email = req.get("student-email");
    if (!email) {
      return res.status(400).json({ error: "Email header required" });
    }
    const idResult = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (idResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = idResult.rows[0].id;
    const result = await pool.query(
      "UPDATE plans SET name = $1 WHERE id = $2 AND user_id = $3",
      [name, planId, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Plan not found or unauthorized" });
    }

    res.json({ message: "Plan name updated" });
  } catch (err) {
    console.error("Error updating plans:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * STUDENT PUT
 *
 * Updates a student's own schedule
 */
app.put("/api/plans/:planId", authenticateToken, async (req, res) => {
  logReq(req);
  const { planId } = req.params;
  const { name } = req.body;

  try {
    const result = await pool.query(
      "UPDATE plans SET name = $1 WHERE id = $2 AND user_id = $3",
      [name, planId, req.user.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Plan not found or unauthorized" });
    }

    res.json({ message: "Plan name updated" });
  } catch (err) {
    console.error("Error updating plan name:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * COUNSELOR PUT
 *
 * Updates a plan's courses for a student when they're
 * in the same WebSockets room
 */
app.put(
  "/api/admin/plans/:planId/courses",
  authenticateToken,
  async (req, res) => {
    logReq(req);
    const { planId } = req.params;
    const { courses, name } = req.body;
    try {
      const email = req.get("student-email");
      if (!email) {
        return res.status(400).json({ error: "Email header required" });
      }
      const idResult = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );
      if (idResult.rows.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }
      const userId = idResult.rows[0].id;
      const planResult = await pool.query(
        "SELECT * FROM plans WHERE id = $1 AND user_id = $2",
        [planId, userId]
      );
      if (planResult.rowCount === 0) {
        return res
          .status(404)
          .json({ error: "Plan not found or unauthorized" });
      }
      await pool.query("DELETE FROM plan_courses WHERE plan_id = $1", [planId]);

      await pool.query("BEGIN");
      for (const course of courses) {
        await pool.query(
          `INSERT INTO plan_courses (plan_id, class_code, year, semester) 
         VALUES ($1, $2, $3, $4)`,
          [planId, course.class_code, course.year, course.semester]
        );
      }
      await pool.query("UPDATE plans SET name = $1 WHERE id = $2", [
        name,
        planId,
      ]);

      await pool.query("COMMIT");

      res.json({ message: "Plan courses updated successfully" });
    } catch (err) {
      console.error("Error fetching courses:", err.message);
      res.status(500).json({ error: err });
    }
  }
);

/**
 * STUDENT PUT
 *
 * Updates a student's scheduled plans
 */
app.put("/api/plans/:planId/courses", authenticateToken, async (req, res) => {
  logReq(req);
  const { planId } = req.params;
  const { courses, name } = req.body;

  try {
    const planResult = await pool.query(
      "SELECT * FROM plans WHERE id = $1 AND user_id = $2",
      [planId, req.user.id]
    );
    if (planResult.rowCount === 0) {
      return res.status(404).json({ error: "Plan not found or unauthorized" });
    }
    await pool.query("DELETE FROM plan_courses WHERE plan_id = $1", [planId]);

    await pool.query("BEGIN");
    for (const course of courses) {
      await pool.query(
        `INSERT INTO plan_courses (plan_id, class_code, year, semester) 
         VALUES ($1, $2, $3, $4)`,
        [planId, course.class_code, course.year, course.semester]
      );
    }
    await pool.query("UPDATE plans SET name = $1 WHERE id = $2", [
      name,
      planId,
    ]);

    await pool.query("COMMIT");

    res.json({ message: "Plan courses updated successfully" });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Error updating plan courses:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * COUNSELOR DELETE
 *
 * Deletes a plan based on planId for a certain student email
 * Does not rely on sessions
 */
app.delete("/api/admin/plans/:planId", authenticateToken, async (req, res) => {
  logReq(req);
  const { planId } = req.params;

  try {
    const email = req.get("student-email");
    if (!email) {
      return res.status(400).json({ error: "Email header required" });
    }
    const idResult = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (idResult.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const userId = idResult.rows[0].id;
    const planResult = await pool.query(
      "SELECT * FROM plans WHERE id = $1 AND user_id = $2",
      [planId, userId]
    );
    if (planResult.rowCount === 0) {
      return res.status(404).json({ error: "Plan not found or unauthorized" });
    }

    await pool.query("BEGIN");
    await pool.query("DELETE FROM comments WHERE plan_id = $1", [planId]);
    await pool.query("DELETE FROM plan_courses WHERE plan_id = $1", [planId]);
    await pool.query("DELETE FROM plans WHERE id = $1", [planId]);
    await pool.query("COMMIT");

    res.json({ message: "Plan deleted successfully" });
  } catch (err) {
    console.error("Error deleting plan:", err.message);
    res.status(500).json({ error: err });
  }
});

/**
 * STUDENT DELETE
 *
 * Deletes a student's plan based on planId
 * Relies on sessions
 */
app.delete("/api/plans/:planId", authenticateToken, async (req, res) => {
  logReq(req);
  const { planId } = req.params;

  try {
    const planResult = await pool.query(
      "SELECT * FROM plans WHERE id = $1 AND user_id = $2",
      [planId, req.user.id]
    );
    if (planResult.rowCount === 0) {
      return res.status(404).json({ error: "Plan not found or unauthorized" });
    }

    await pool.query("BEGIN");
    await pool.query("DELETE FROM comments WHERE plan_id = $1", [planId]);
    await pool.query("DELETE FROM plan_courses WHERE plan_id = $1", [planId]);
    await pool.query("DELETE FROM plans WHERE id = $1", [planId]);
    await pool.query("COMMIT");

    res.json({ message: "Plan deleted successfully" });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error("Error deleting plan:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * COUNSELOR POST
 *
 * Adds a comment to a plan from the admin page
 */
app.post("/api/admin/comment", authenticateToken, async (req, res) => {
  logReq(req);

  const { planId, comment } = req.body;
  if (!planId || !comment) {
    return res.status(400).json({ error: "Missing planId or comment" });
  }

  try {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO comments (id, plan_id, user_id, text) VALUES ($1, $2, $3, $4)`,
      [id, planId, req.user.id, comment]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Error saving comment:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * COUNSELOR GET
 *
 * Retrieves commments for the counselor's admin page for a schedule
 */
app.get("/api/admin/comments/:planId", authenticateToken, async (req, res) => {
  logReq(req);

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
    console.error("Error fetching comments:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * ALL GET
 *
 * Gets all comments for a plan
 */
app.get("/api/plans/:planId/comments", authenticateToken, async (req, res) => {
  logReq(req);

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
    console.error("Error fetching comments with authors:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ALL POST
 *
 * Adds a comment to a certain plan
 */
app.post("/api/plans/:planId/comments", authenticateToken, async (req, res) => {
  logReq(req);

  const { planId } = req.params;
  const { text } = req.body;
  const userId = req.user.id;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Comment text is required" });
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
    console.error("Error inserting comment:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ONGOING: conflict checking
 */
app.post("/check-conflicts", authenticateToken, async (req, res) => {
  try {
    const { courses } = req.body;
    const optimizer = new ScheduleOptimizer();
    const conflicts = optimizer.detectConflicts(courses);
    const suggestions = optimizer.suggestResolution(conflicts);
    res.json({
      hasConflicts: conflicts.length > 0,
      conflicts: suggestions,
    });
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

/**
 * ONGOING: analytics
 */
app.get("/analytics", authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        class_code,
        COUNT(*) as enrollment_count
      FROM plan_courses
      GROUP BY class_code
      ORDER BY enrollment_count DESC;
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
