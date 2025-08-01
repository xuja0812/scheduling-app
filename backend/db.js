const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("Database pool error:", err);
});

/*
 *  Error handling for database connection issues
 */
pool.on("connect", (client) => {
  client.on("error", (err) => {
    console.error("Database client error:", err);
  });
});

console.log("Postgres Pool Config:", {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? "enabled" : "disabled",
});

async function initDB() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    console.log("Beginning seeding...");

    await client.query(`
      DROP TABLE IF EXISTS comments CASCADE;
      DROP TABLE IF EXISTS plan_courses CASCADE;
      DROP TABLE IF EXISTS plans CASCADE;
      DROP TABLE IF EXISTS grades CASCADE;
      DROP TABLE IF EXISTS track_requirements CASCADE;
      DROP TABLE IF EXISTS classes CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Create users table
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        google_id TEXT UNIQUE NOT NULL,
        name TEXT,
        email TEXT,
        role TEXT CHECK(role IN ('student', 'admin')) NOT NULL DEFAULT 'student'
      );
    `);

    console.log("Inserting users...");

    // Insert users
    const users = [
      ["google-id-1", "Alice Admin", "alice@school.edu", "admin"],
      ["google-id-2", "Bob Student", "bob@school.edu", "student"],
    ];

    for (const [google_id, name, email, role] of users) {
      await client.query(
        `INSERT INTO users (google_id, name, email, role) VALUES ($1, $2, $3, $4)`,
        [google_id, name, email, role]
      );
    }

    // Create classes table
    await client.query(`
      CREATE TABLE classes (
        id SERIAL PRIMARY KEY,
        code TEXT,
        name TEXT,
        subject TEXT,
        track_level TEXT,
        credits INTEGER
      );
    `);

    // Insert classes
    const classes = [
      ["ENG101", "English I", "English", "regular", 1],
      ["ENG201", "English II", "English", "advanced", 1],
      ["MATH101", "Algebra I", "Math", "regular", 1],
      ["MATH201", "Geometry", "Math", "advanced", 1],
      ["SCI101", "Biology", "Science", "regular", 1],
      ["SCI201", "Chemistry", "Science", "advanced", 1],
    ];

    for (const [code, name, subject, track_level, credits] of classes) {
      await client.query(
        `INSERT INTO classes (code, name, subject, track_level, credits) VALUES ($1, $2, $3, $4, $5)`,
        [code, name, subject, track_level, credits]
      );
    }

    // Create track_requirements table
    await client.query(`
      CREATE TABLE track_requirements (
        id SERIAL PRIMARY KEY,
        subject TEXT,
        track_level TEXT,
        required_class_code TEXT
      );
    `);

    // Insert track requirements
    const trackReqs = [
      ["English", "regular", "ENG101"],
      ["English", "advanced", "ENG201"],
      ["Math", "regular", "MATH101"],
      ["Math", "advanced", "MATH201"],
      ["Science", "regular", "SCI101"],
      ["Science", "advanced", "SCI201"],
    ];

    for (const [subject, track_level, required_class_code] of trackReqs) {
      await client.query(
        `INSERT INTO track_requirements (subject, track_level, required_class_code) VALUES ($1, $2, $3)`,
        [subject, track_level, required_class_code]
      );
    }

    // Create grades table
    await client.query(`
      CREATE TABLE grades (
        id SERIAL PRIMARY KEY,
        class_code TEXT,
        grade TEXT,
        weighted BOOLEAN
      );
    `);

    console.log();

    // Create plans table
    await client.query(`
      CREATE TABLE plans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER NOT NULL REFERENCES users(id),
        name TEXT NOT NULL
      );
    `);

    // Create plan_courses table
    await client.query(`
      CREATE TABLE plan_courses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        plan_id UUID NOT NULL REFERENCES plans(id),
        class_code TEXT NOT NULL,
        year TEXT NOT NULL,
        semester TEXT NOT NULL
      );
    `);

    // Create comments table
    await client.query(`
      CREATE TABLE comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        plan_id UUID NOT NULL REFERENCES plans(id),
        user_id INTEGER NOT NULL REFERENCES users(id),
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query("COMMIT");

    pool.query("SELECT NOW()", (err, res) => {
      if (err) {
        console.error("Error connecting to Postgres:", err);
      } else {
        console.log("Postgres connection test OK, server time:", res.rows[0]);
      }
    });

    console.log("Database initialized successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error initializing database:", err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
