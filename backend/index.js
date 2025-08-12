process.setMaxListeners(0);

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
const Redis = require("ioredis");
const rateLimit = require("express-rate-limit");
const { emitWarning } = require("process");
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

/**
 * Rate limiting setup
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000000000,
  message: "Too many requests from this IP",
});

app.use("/api/", limiter);

/**
 * Auth rate limiting
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000000,
});

app.use("/auth/", authLimiter);

/**
 * Express app setup
 */
app.use(express.json());
app.use(cookieParser());
app.set("trust proxy", 1);
app.use(passport.initialize());

/**
 * Redis configuration
 */
const redis = new Redis({
  port: 6379,
  host: process.env.REDIS_HOST || "127.0.0.1",
});

redis.on("connect", () => {
  console.log("Connected to Redis");
});

redis.on("error", (err) => {
  console.error("Redis error: " + err);
});

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
  // const authHeader = req.headers["authorization"];
  // const token = (authHeader && authHeader.split(" ")[1]) || req.cookies?.token;

  // if (!token) {
  //   return res.status(401).json({ error: "Access token required" });
  // }

  // jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
  //   if (err) {
  //     return res.status(403).json({ error: "Invalid or expired token" });
  //   }

  //   req.user = user;
    next();
  // });
};

/**
 * Redis cache middleware
 */
const cache = (duration, key) => {
  return async (req, res, next) => {
    try {
      const cached = await redis.get(key);
      if (cached) {
        console.log(`Cache hit for key: ${key}`);
        return res.json(JSON.parse(cached));
      } else {
        console.log(`Cache miss for key: ${key}`);
      }
      const originalJson = res.json;
      res.json = function (data) {
        redis.setex(key, duration, JSON.stringify(data));
        return originalJson.call(this, data);
      };
      next();
    } catch (err) {
      console.error("Cache error:", err);
      next();
    }
  };
};

/**
 * Metrics tracking
 */
const metrics = {
  requests: 0,
  websocketConnections: 0,
  redisMessages: 0,
  errors: 0,
  responseTime: [],
};

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    metrics.responseTime.push(duration);
    if (metrics.responseTime.length > 100) metrics.responseTime.shift();
  });
  next();
});

/**
 * Request tracking middleware
 */
app.use((req, res, next) => {
  metrics.requests++;
  next();
});

/**
 * Error tracking middleware
 */
app.use((err, req, res, next) => {
  metrics.errors++;
  console.error(`Error: ${err.message}`);
  res.status(500).json({ error: "Internal server error" });
});

/**
 * Creating WebSockets server and connections
 */
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const rooms = new Map();

/**
 * Circuit breaker logic
 */

const circuitBreaker = {
  failures: 0,
  threshold: 5,
  cooldown: 30000,
  open: false,
  nextAttempt: 0,
};

/**
 * Check if Redis is healthy
 */
function canUseRedis() {
  if (!circuitBreaker.open) return true;
  if (Date.now() > circuitBreaker.nextAttempt) {
    circuitBreaker.open = false;
    circuitBreaker.failures = 0;
    return true;
  }
  return false;
}

/**
 * Safely publishes message to Redis instance
 */
async function safePublish(channel, message) {
  if (!canUseRedis()) {
    console.warn("Circuit open - skipping Redis publish");
    return;
  }
  try {
    await safePublish(channel, message);
    circuitBreaker.failures = 0;
  } catch (err) {
    handleRedisFailure(err);
  }
}

let failures = 0;
let open = false;
let nextAttempt = 0;
const FAILURE_THRESHOLD = 5;
const COOLDOWN = 30000; // 30 sec

async function safePublish(channel, message) {
  if (open && Date.now() < nextAttempt) {
    console.log("Circuit open — skipping Redis publish");
    return;
  }

  try {
    await pubRedis.publish(channel, message);
    failures = 0; // reset on success
    open = false;
  } catch (err) {
    failures++;
    if (failures >= FAILURE_THRESHOLD) {
      open = true;
      nextAttempt = Date.now() + COOLDOWN;
      console.log("Circuit opened, pausing Redis calls");
    }
    console.error("Redis publish failed", err);
  }
}

function handleRedisFailure(err) {
  circuitBreaker.failures++;
  console.error("Redis error:", err.message);

  if (circuitBreaker.failures >= circuitBreaker.threshold) {
    console.warn("Opening Redis circuit breaker");
    circuitBreaker.open = true;
    circuitBreaker.nextAttempt = Date.now() + circuitBreaker.cooldown;
  }
}

/**
 * Redis pub/sub configuration with ioredis
 */
const pubRedis = new Redis({
  port: 6379,
  host: process.env.REDIS_HOST || "127.0.0.1",
});

const subRedis = new Redis({
  port: 6379,
  host: process.env.REDIS_HOST || "127.0.0.1",
});

const presenceRedis = new Redis({
  port: 6379,
  host: process.env.REDIS_HOST || "127.0.0.1",
});

const addUserToPresence = async (studentId, userId, userName, userType) => {
  const presenceKey = `presence:${studentId}`;
  const userObj = {
    id: userId,
    name: userName,
    type: userType,
    joinedAt: Date.now(),
  };

  await presenceRedis.hset(presenceKey, userId, JSON.stringify(userObj));
  await presenceRedis.expire(presenceKey, 3600); // Expire in 1 hour

  return userObj;
};

const removeUserFromPresence = async (studentId, userId) => {
  const presenceKey = `presence:${studentId}`;
  await presenceRedis.hdel(presenceKey, userId);
};

const getAllUsersInRoom = async (studentId) => {
  const presenceKey = `presence:${studentId}`;
  const allUserObjs = await presenceRedis.hgetall(presenceKey);
  return Object.values(allUserObjs).map((userStr) => JSON.parse(userStr));
};

// Subscribe to channels
subRedis.subscribe(
  "chat-message",
  "plans-update",
  "comments-update",
  "presence-update"
);

const presenceCounts = {};

subRedis.on("message", (channel, message) => {
  metrics.redisMessages++;
  try {
    const { studentId, data } = JSON.parse(message);
    if (rooms.has(studentId)) {
      const clients = rooms.get(studentId);
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    }
  } catch (err) {
    console.error("Error parsing Redis message:", err);
  }
});

subRedis.on("error", (err) => {
  handleRedisFailure(err);
});

pubRedis.on("error", (err) => {
  handleRedisFailure(err);
});

wss.on("connection", (ws, req) => {
  metrics.websocketConnections++;

  function getTokenFromCookie(cookieHeader) {
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    for (const cookie of cookies) {
      const [key, val] = cookie.split("=");
      if (key === "token") return decodeURIComponent(val);
    }
    return null;
  }

  // Extract token from sec-websocket-protocol or query param
  let token = getTokenFromCookie(req.headers.cookie);

  if (!token) {
    ws.close(1008, "Access token required");
    return;
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      ws.close(1008, "Invalid or expired token");
      return;
    }
    ws.user = user;
    ws.userId = user.id;
    ws.userType = user.type;

    ws.on("message", async (message) => {
      let parsed;
      try {
        parsed = JSON.parse(message.toString());
      } catch {
        ws.send(JSON.stringify({ error: "Invalid JSON format" }));
        return;
      }

      const { type, data } = parsed;

      // Just handle your existing message types with minimal changes:
      try {
        if (type === "join-student-room") {
          const { studentId, userId, userType } = data;

          rooms.forEach((clients, roomId) => {
            clients.delete(ws);
            if (clients.size === 0) rooms.delete(roomId);
          });

          if (!rooms.has(studentId)) rooms.set(studentId, new Set());
          rooms.get(studentId).add(ws);

          await addUserToPresence(studentId, userId);

          const result = await pool.query(
            "SELECT name FROM users WHERE id = $1",
            [ws.userId]
          );
          const name = result.rows[0]?.name || "Unknown";
          await addUserToPresence(studentId, userId, name, userType);
          const allUsers = await getAllUsersInRoom(studentId);

          ws.studentId = studentId;
          ws.userId = userId;
          ws.userType = userType;

          await safePublish(
            "presence-update",
            JSON.stringify({
              studentId: studentId,
              data: {
                type: "presence-update",
                action: "join",
                users: allUsers,
              },
            })
          );

          ws.send(
            JSON.stringify({
              type: "room-joined",
              data: { studentId, userType, userId },
            })
          );
        } else if (type === "chat-message") {
          await safePublish(
            "chat-message",
            JSON.stringify({
              studentId: ws.studentId,
              data: {
                type: "chat-message",
                message: parsed.message,
                sender: parsed.sender,
                timestamp: parsed.timestamp,
              },
            })
          );
        } else if (type === "plans-update") {
          await safePublish(
            "plans-update",
            JSON.stringify({
              studentId: ws.studentId,
              data: {
                type: "plans-update",
                plans: parsed.plans,
                sender: parsed.sender,
              },
            })
          );
        } else if (type === "comments-update") {
          await safePublish(
            "comments-update",
            JSON.stringify({
              studentId: ws.studentId,
              data: {
                type: "comments-update",
                comments: parsed.comments,
                sender: parsed.sender,
              },
            })
          );
        } else {
          ws.send(
            JSON.stringify({ info: `Server received unknown type: ${type}` })
          );
        }
      } catch (error) {
        console.error("Error handling WS message:", error);
        ws.send(JSON.stringify({ error: "Internal server error" }));
      }
    });

    ws.on("close", async () => {
      await handleUserDisconnect(ws);
    });

    ws.on("error", async (error) => {
      console.error("WebSocket error:", error);
      await handleUserDisconnect(ws);
    });
  });
});
module.exports = { app, pool };

const handleUserDisconnect = async (ws) => {
  if (ws.studentId && ws.userId) {
    try {
      // Remove from Redis presence
      await removeUserFromPresence(ws.studentId, ws.userId);

      // Remove from local room
      if (rooms.has(ws.studentId)) {
        rooms.get(ws.studentId).delete(ws);
        if (rooms.get(ws.studentId).size === 0) {
          rooms.delete(ws.studentId);
        }
      }

      // Get updated user list and broadcast
      const remainingUsers = await getAllUsersInRoom(ws.studentId);

      await safePublish(
        "presence-update",
        JSON.stringify({
          studentId: ws.studentId,
          data: {
            type: "presence-update",
            action: "sync",
            users: remainingUsers,
          },
        })
      );

      console.log(
        `${ws.userName} (${ws.userId}) left room for student ${ws.studentId}`
      );
      console.log(
        `Room now has ${remainingUsers.length} users:`,
        remainingUsers.map((u) => u.name)
      );
    } catch (error) {
      console.error("Error handling disconnect:", error);
    }
  }
};

/**
 * ALL GET
 *
 * Metrics endpoint
 */
app.get("/api/metrics", (req, res) => {
  res.json({
    ...metrics,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.send("Hello from backend!");
});

app.get("/admin/dashboard", (req, res) => {
  res.send(`
    <html>
    <head><title>System Dashboard</title></head>
    <body style="font-family: monospace; background: #1a1a1a; color: #00ff00; padding: 20px;">
      <h1>🚀 System Status Dashboard</h1>
      <div id="metrics"></div>
      <script>
        const ws = new WebSocket('ws://localhost:8080');
        setInterval(() => {
          fetch('/api/metrics').then(r => r.json()).then(data => {
            document.getElementById('metrics').innerHTML = 
              '<pre>' + JSON.stringify({
                ...data,
                timestamp: new Date().toLocaleString(),
                status: data.errors < 10 ? '✅ HEALTHY' : '⚠️  DEGRADED'
              }, null, 2) + '</pre>';
          });
        }, 2000);
      </script>
    </body>
    </html>
  `);
});

/**
 * COUNSELOR GET
 *
 * Allows the counselor to see all current student plans
 *
 * Caching strategy:
 * Keep the key as the original URL, since all counselors across
 * the school will see the same schedule.
 */
app.get("/api/admin/all-plans", authenticateToken, async (req, res) => {
  logReq(req);

  const query = `
    SELECT plans.id as plan_id, plans.name as plan_name, users.email as student_email, users.id as id,
           plan_courses.class_code, plan_courses.year
    FROM plans
    JOIN users ON plans.user_id = users.id
    LEFT JOIN plan_courses ON plans.id = plan_courses.plan_id
    ORDER BY users.email, plans.name, plan_courses.year
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
          studentId: row.id,
          courses: [],
        };
      }
      if (row.class_code) {
        plansMap[row.plan_id].courses.push({
          class_code: row.class_code,
          year: row.year,
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
 * Logging middleware
 */

/**
 * ALL GET
 *
 * Authenticate user
 */
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

/**
 * ALL GET
 *
 * Auth callback
 */
app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
    session: false,
  }),
  (req, res) => {
    if (!req.user?.token) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/login?error=auth_failed`
      );
    }

    res.cookie("token", req.user.token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

/**
 * ALL GET
 *
 * Logs user out
 */
app.get("/api/logout", (req, res) => {
  logReq(req);
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });

  console.log("User logged out");
  res.json({ message: "Logged out successfully" });
});

/**
 * ALL GET
 *
 * Retrieves current user's info
 *
 * Caching strategy:
 * Since the data returned is small in size
 * and is accessed infrequently, there's no need to cache it.
 */
app.get("/api/me", authenticateToken, (req, res) => {
  logReq(req);
  res.json({ user: req.user });
});

/**
 * COUNSELOR GET
 *
 * Retrieves all schedules for a student based on their email
 * Does not rely on sessions
 */
app.get(
  "/api/admin/plans/:studentId",
  authenticateToken,
  (req, res, next) => {
    logReq(req);
    const studentId = req.params.studentId;
    if (!studentId) {
      return res.status(400).json({ error: "studentId parameter required" });
    } // set userId from route param
    next();
  },
  (req, res, next) =>
    cache(30, `plans_${req.params.studentId}`)(req, res, next),
  async (req, res) => {
    const result = await pool.query("SELECT * FROM plans WHERE user_id = $1", [
      req.params.studentId,
    ]);
    res.json(result.rows);
  }
);

/**
 * STUDENT GET
 *
 * Retrieves all schedules for the current student
 * Relies on session
 */
app.get(
  "/api/plans",
  authenticateToken,
  (req, res, next) => cache(30, `plans_${req.user.id}`)(req, res, next), // cache middleware
  async (req, res) => {
    logReq(req);
    try {
      const result = await pool.query(
        "SELECT * FROM plans WHERE user_id = $1",
        [req.user.id]
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching plans:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

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
 * COUNSELOR POST
 *
 * Adds a plan for a student on the counselor's side
 */
app.post("/api/admin/plans/:studentId", authenticateToken, async (req, res) => {
  logReq(req);
  const { name, courses } = req.body;
  const planId = uuidv4();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      "INSERT INTO plans (id, user_id, name) VALUES ($1, $2, $3)",
      [planId, req.params.studentId, name]
    );

    const insertCourseText = `
      INSERT INTO plan_courses (plan_id, class_code, year, course_id)
      VALUES ($1, $2, $3, $4)
    `;
    for (const course of courses) {
      await client.query(insertCourseText, [
        planId,
        course.class_code,
        course.year,
        course.course_id,
      ]);
      console.log("course being inserted:", course);
    }

    await client.query("COMMIT");

    // Invalidate cache for this user's plans list
    await redis.del(`plans_${req.params.studentId}`);

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
      INSERT INTO plan_courses (plan_id, class_code, year, course_id)
      VALUES ($1, $2, $3, $4)
    `;
    for (const course of courses) {
      await client.query(insertCourseText, [
        planId,
        course.class_code,
        course.year,
        course.course_id,
      ]);
      console.log("course being inserted:", course);
    }

    await client.query("COMMIT");

    // Invalidate cache for this user's plans list
    await redis.del(`plans_${req.user.id}`);

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
    const result = await pool.query(
      "UPDATE plans SET name = $1 WHERE id = $2",
      [name, planId]
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
  "/api/admin/plans/:planId/courses/:studentId",
  authenticateToken,
  async (req, res) => {
    logReq(req);
    const { planId } = req.params;
    const { courses, name } = req.body;
    try {
      const planResult = await pool.query("SELECT * FROM plans WHERE id = $1", [
        planId,
      ]);
      if (planResult.rowCount === 0) {
        return res
          .status(404)
          .json({ error: "Plan not found or unauthorized" });
      }
      await pool.query("DELETE FROM plan_courses WHERE plan_id = $1", [planId]);

      await pool.query("BEGIN");
      for (const course of courses) {
        await pool.query(
          `INSERT INTO plan_courses (plan_id, class_code, year, course_id) 
         VALUES ($1, $2, $3, $4)`,
          [planId, course.class_code, course.year, course.course_id]
        );
      }
      await pool.query("UPDATE plans SET name = $1 WHERE id = $2", [
        name,
        planId,
      ]);
      await redis.del(`plans_${req.params.studentId}`);

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
        `INSERT INTO plan_courses (plan_id, class_code, year, course_id) 
         VALUES ($1, $2, $3, $4)`,
        [planId, course.class_code, course.year, course.course_id]
      );
    }
    await pool.query("UPDATE plans SET name = $1 WHERE id = $2", [
      name,
      planId,
    ]);
    await redis.del(`plans_${req.user.id}`);

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
 */
app.delete(
  "/api/admin/plans/:planId/:studentId",
  authenticateToken,
  async (req, res) => {
    logReq(req);
    const { planId } = req.params;

    try {
      const planResult = await pool.query("SELECT * FROM plans WHERE id = $1", [
        planId,
      ]);
      if (planResult.rowCount === 0) {
        return res
          .status(404)
          .json({ error: "Plan not found or unauthorized" });
      }

      await pool.query("BEGIN");
      await pool.query("DELETE FROM comments WHERE plan_id = $1", [planId]);
      await pool.query("DELETE FROM plan_courses WHERE plan_id = $1", [planId]);
      await pool.query("DELETE FROM plans WHERE id = $1", [planId]);
      await pool.query("COMMIT");
      await redis.del(`plans_${req.params.studentId}`);
      res.json({ message: "Plan deleted successfully" });
    } catch (err) {
      console.error("Error deleting plan:", err.message);
      res.status(500).json({ error: err });
    }
  }
);

/**
 * STUDENT DELETE
 *
 * Deletes a student's plan based on planId
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
    await redis.del(`plans_${req.user.id}`);

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
 * ONGOING: analytics
 */
app.get(
  "/api/analytics/popular-classes",
  authenticateToken,
  async (req, res) => {
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
      console.log("result from query FUCK:", result);
      res.json(result.rows);
    } catch (err) {
      console.log("popular classes err:", err);
      res.status(500).json({ error: err });
    }
  }
);

app.get(
  "/api/analytics/high-credit-plans",
  authenticateToken,
  async (req, res) => {
    try {
      const query = `
      SELECT u.name as user_name, p.name, pc.year, SUM(c.credits) as year_credits 
      FROM users u 
      JOIN plans p ON u.id = p.user_id 
      JOIN plan_courses pc ON p.id = pc.plan_id 
      JOIN courses c ON pc.course_id = c.id 
      GROUP BY u.id, u.name, p.name, pc.year 
      HAVING SUM(c.credits) > 6
      ORDER BY year_credits DESC;
    `;

      const result = await pool.query(query);
      console.log("result from query:", result.rows);
      res.json(result.rows);
    } catch (err) {
      console.log("error:", err);
      res.status(500).json({ error: err });
    }
  }
);

app.get("/api/analytics/no-plans", authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT u.name, u.email
      FROM users u 
      LEFT JOIN plans p ON u.id = p.user_id 
      WHERE p.id IS NULL AND u.role = 'student';
    `;

    const result = await pool.query(query);
    console.log("result from no plans query:", result.rows);
    res.json(result.rows);
  } catch (err) {
    console.log("error:", err);
    res.status(500).json({ error: err });
  }
});

app.get("/health", (req, res) => res.sendStatus(200));

const PORT = process.env.PORT || 4000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});

/**
 * ONGOING: account info for classes students have already taken
 */

/**
 * ALL GET
 *
 * Retrieve all available past classes
 */
app.get("/api/classes", authenticateToken, async (req, res) => {
  try {
    const query = `
    SELECT 
        id,
        name,
        credits
      FROM courses
    `;
    const result = await pool.query(query);
    // console.log("result:",result);
    res.json(result.rows);
  } catch (err) {
    // console.log("err:",err);
    res.status(500).json({ error: err });
  }
});

/**
 * ALL POST
 *
 * Add a completed course for a user
 */
app.post("/api/completed-courses", authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { className, year } = req.body;
  const client = await pool.connect();
  try {
    const courseRes = await client.query(
      `SELECT id FROM courses WHERE name = $1`,
      [className]
    );
    const courseId = courseRes.rows[0]?.id;
    if (!courseId) res.status(404).json({ error: "Course not found " });

    await client.query(
      `
        INSERT INTO user_courses (user_id, course_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `,
      [userId, courseId]
    );
    console.log(
      "returned after posting to completed courses:",
      className + " " + courseId
    );
    res.json({ class_name: className, id: courseId });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err });
  }
});

/**
 * ALL GET
 *
 * Returns all eligible courses for a user to take next
 */
app.get("/api/eligible-courses", authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized: missing user" });
    }

    const userId = req.user.id;
    // console.log("Authenticated user:", userId);

    // 1. Get list of completed course IDs
    const completedRes = await pool.query(
      `SELECT course_id FROM user_courses WHERE user_id = $1`,
      [userId]
    );
    const completed = completedRes.rows.map((r) => r.course_id);
    const completedSet = new Set(completed);
    // console.log("✅ User completed course IDs:", Array.from(completedSet));

    // 2. Get all courses + their prerequisite groups and members
    const prereqRes = await pool.query(`
      SELECT 
        c.id AS course_id, c.code, c.name, c.track,
        pg.id AS group_id,
        pgm.prerequisite_id,
        cp.code AS prerequisite_code,
        cp.name AS prerequisite_name
      FROM courses c
      LEFT JOIN prereq_groups pg ON c.id = pg.course_id
      LEFT JOIN prereq_group_members pgm ON pg.id = pgm.group_id
      LEFT JOIN courses cp ON pgm.prerequisite_id = cp.id
      ORDER BY c.id, pg.id
    `);

    // console.log("✅ Raw prerequisite data:", prereqRes.rows);

    // 3. Restructure into usable format
    const courseMap = {}; // course_id → course data w/ prereqs

    for (const row of prereqRes.rows) {
      const {
        course_id,
        code,
        name,
        track,
        group_id,
        prerequisite_id,
        prerequisite_code,
        prerequisite_name,
      } = row;

      if (!courseMap[course_id]) {
        courseMap[course_id] = {
          id: course_id,
          code,
          name,
          track,
          prereq_groups: [], // Will be array of arrays
        };
      }

      // If there's a prerequisite group
      if (group_id) {
        // Find existing group or create new one
        let existingGroup = courseMap[course_id].prereq_groups.find(
          (g) => g.group_id === group_id
        );

        if (!existingGroup) {
          existingGroup = {
            group_id: group_id,
            prerequisites: [],
          };
          courseMap[course_id].prereq_groups.push(existingGroup);
        }

        // Add prerequisite to this group if it exists
        if (prerequisite_id) {
          existingGroup.prerequisites.push({
            id: prerequisite_id,
            code: prerequisite_code,
            name: prerequisite_name,
          });
        }
      }
    }

    // console.log("✅ Structured course map:", JSON.stringify(courseMap, null, 2));

    // 4. Determine eligibility
    const eligible = [];

    for (const courseId in courseMap) {
      const course = courseMap[courseId];
      const courseIdNum = parseInt(courseId);

      // Skip if already completed
      if (completedSet.has(courseIdNum)) {
        // console.log(`⏭️ Skipping ${course.code} - already completed`);
        continue;
      }

      // Check eligibility
      let isEligible = false;

      // If no prerequisite groups, course is eligible by default
      if (course.prereq_groups.length === 0) {
        // console.log(`✅ ${course.code} is eligible - no prerequisites`);
        isEligible = true;
      } else {
        // Check if ANY prerequisite group is satisfied
        for (const group of course.prereq_groups) {
          const groupSatisfied = group.prerequisites.every((prereq) => {
            const hasPrereq = completedSet.has(prereq.id);
            // console.log(`  Checking prereq ${prereq.code} (ID: ${prereq.id}): ${hasPrereq ? 'COMPLETED' : 'NOT COMPLETED'}`);
            return hasPrereq;
          });

          // console.log(`  Group ${group.group_id} for ${course.code}: ${groupSatisfied ? 'SATISFIED' : 'NOT SATISFIED'}`);

          if (groupSatisfied) {
            isEligible = true;
            break;
          }
        }
      }

      // console.log(`📊 ${course.code} eligibility: ${isEligible}`);

      if (isEligible) {
        // Format prereq_groups for frontend consumption (array of arrays)
        const formattedPrereqGroups = course.prereq_groups.map((group) =>
          group.prerequisites.map((prereq) => ({
            id: prereq.id,
            code: prereq.code,
            name: prereq.name,
          }))
        );

        eligible.push({
          id: course.id,
          code: course.code,
          name: course.name,
          track: course.track,
          prereq_groups: formattedPrereqGroups,
        });
      }
    }

    // console.log("✅ Final eligible courses:", eligible);
    res.json(eligible);
  } catch (err) {
    // console.error("❌ Error fetching eligible courses:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * ALL DELETE
 *
 * Delete a completed course for a user
 */
app.delete(
  "/api/completed-courses/:id",
  authenticateToken,
  async (req, res) => {
    const user_id = req.user.id;
    const { id } = req.params;
    console.log("the course Id I'm trying to delete:", id);
    // This assumes that you can only take a class once a year
    try {
      const classNameResponse = await pool.query(
        `SELECT name FROM courses WHERE id = $1`,
        [id]
      );
      const className = classNameResponse.rows[0].name;
      const query = `
      DELETE FROM user_courses WHERE user_id = $1 AND course_id = $2
    `;
      await pool.query("BEGIN");
      const result = await pool.query(query, [user_id, id]);
      await pool.query("COMMIT");
      res.json({ class_name: className });
    } catch (err) {
      console.error("error when deleting:", err);
      res.status(500).json({ error: err });
    }
  }
);

/**
 * ALL GET
 *
 * Retrieve all completed courses for a user
 */
app.get("/api/completed-courses", authenticateToken, async (req, res) => {
  const user_id = req.user.id;
  try {
    const query = `
      SELECT * FROM user_courses WHERE user_id = $1
    `;
    const result = await pool.query(query, [user_id]);
    const ans = [];
    for (const course of result.rows) {
      const courseResult = await pool.query(
        `SELECT name FROM courses WHERE id = $1`,
        [course.course_id]
      );
      ans.push({
        class_name: courseResult.rows[0].name,
        id: course.course_id,
      });
    }
    // console.log("\n\nresult from getting completed-courses:", ans);
    res.json(ans);
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

/**
 * ALL GET
 *
 * Retrieve all course information for all the courses
 * a user has completed so far
 */
app.get("/api/prereqs", authenticateToken, async (req, res) => {
  const user = req.user;
  const user_id = user.id;
  const query = `
    SELECT 
      * 
    FROM courses JOIN user_courses ON
    courses.id = user_courses.course_id
    WHERE user_courses.user_id = $1
  `;
  try {
    const response = await pool.query(query, [user_id]);
    const processedRows = response.rows.map((row) => ({
      ...row,
      credits: parseFloat(row.credits),
    }));
    res.json(processedRows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
});
