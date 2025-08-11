const { Pool } = require("pg");

const pool = new Pool({
  connectionString:
    "postgresql://postgres.vbzymcqmyslgvucgigqg:vsX%26Mc%2A%23u79wYQQ@aws-0-us-east-2.pooler.supabase.com:6543/postgres",
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

async function initDB() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    console.log("Beginning seeding...");

    // Drop old tables
    await client.query(`
      DROP TABLE IF EXISTS comments CASCADE;
      DROP TABLE IF EXISTS plan_courses CASCADE;
      DROP TABLE IF EXISTS plans CASCADE;
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
        course_id INT NOT NULL REFERENCES courses(id)
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

    // // --- Test query BEFORE index ---
    // console.log("\n=== BEFORE INDEX ===");
    // console.time("Query time before index");
    // await client.query(`SELECT * FROM plans WHERE user_id = 1 LIMIT 10`);
    // console.timeEnd("Query time before index");

    // console.log("EXPLAIN ANALYZE output before index:");
    // let res = await client.query(
    //   `EXPLAIN ANALYZE SELECT * FROM plans WHERE user_id = 1 LIMIT 10`
    // );
    // console.log(res.rows.map((r) => r["QUERY PLAN"]).join("\n"));

    // Create index
    // console.log("\nCreating index on plans.user_id...");
    await client.query(`CREATE INDEX idx_plans_user_id ON plans(user_id)`);

    // --- Test query AFTER index ---
    // console.log("\n=== AFTER INDEX ===");
    // console.time("Query time after index");
    // await client.query(`SELECT * FROM plans WHERE user_id = 1 LIMIT 10`);
    // console.timeEnd("Query time after index");

    // console.log("EXPLAIN ANALYZE output after index:");
    // res = await client.query(
    //   `EXPLAIN ANALYZE SELECT * FROM plans WHERE user_id = 1 LIMIT 10`
    // );
    // console.log(res.rows.map((r) => r["QUERY PLAN"]).join("\n"));

    await client.query("COMMIT");
    console.log("\nDatabase initialized successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error initializing database:", err);
    throw err;
  } finally {
    client.release();
  }
}

async function migration() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    console.log("Beginning seeding...");

    // Drop in correct order due to FK constraints
    await client.query(`DROP TABLE IF EXISTS user_courses CASCADE`);
    await client.query(`DROP TABLE IF EXISTS prereq_group_members CASCADE`);
    await client.query(`DROP TABLE IF EXISTS prereq_groups CASCADE`);
    await client.query(`DROP TABLE IF EXISTS courses CASCADE`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        track TEXT,
        credits DECIMAL NOT NULL,
        category TEXT NOT NULL,
        required_for_grad BOOLEAN DEFAULT FALSE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS prereq_groups (
        id SERIAL PRIMARY KEY,
        course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS prereq_group_members (
        group_id INT NOT NULL REFERENCES prereq_groups(id) ON DELETE CASCADE,
        prerequisite_id INT NOT NULL REFERENCES courses(id),
        PRIMARY KEY (group_id, prerequisite_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS user_courses (
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        course_id INT NOT NULL REFERENCES courses(id),
        PRIMARY KEY (user_id, course_id)
      );
    `);

    const courses = [
      [
        "CS100004",
        "Contemporary Computing",
        "Computer Science",
        0.5,
        "Elective",
        true,
      ],
      [
        "CS310001",
        "Cybersecurity 1",
        "Computer Science",
        0.5,
        "Elective",
        false,
      ],
      [
        "CS310002",
        "Cybersecurity 2",
        "Computer Sciecne",
        0.5,
        "Elective",
        false,
      ],
      ["CS510000", "Multimedia 1", "Computer Science", 0.5, "Elective", false],
      ["CS510004", "Programming 1", "Computer Science", 0.5, "Elective", false],
      [
        "CS580020",
        "AP Computer Science Principles",
        "Computer Science",
        1.0,
        "Elective",
        false,
      ],
      [
        "CS504000",
        "AP Computer Science A",
        "Computer Science",
        1.0,
        "Elective",
        false,
      ],
      ["MA400021", "AP Calculus AB", "Math", 1.0, "Math", false],
      ["MA305001", "Intro to Statistics", "Math", 0.5, "Math", false],
      ["EN200001", "American Literature", "English", 1.0, "English", false],
    ];

    const courseIdMap = {}; // Map course code → ID

    for (const [code, name, track, credits, category, required] of courses) {
      console.log("category:", category);
      const res = await client.query(
        `INSERT INTO courses (code, name, track, credits, category, required_for_grad)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (code) DO NOTHING
         RETURNING id`,
        [code, name, track, credits, category, required]
      );
      if (res.rows[0]) courseIdMap[code] = res.rows[0].id;
    }

    // Setup prerequisite groups for CS310002 (Cybersecurity 2)
    // Path A: CS310001 (Cybersecurity 1) AND CS100004 (Contemporary Computing)
    // Path B: CS580020 (AP CSP)

    // Group A
    const groupA = await client.query(
      `
      INSERT INTO prereq_groups (course_id)
      VALUES ($1) RETURNING id
    `,
      [courseIdMap["CS310002"]]
    );
    const groupAId = groupA.rows[0].id;

    await client.query(
      `
      INSERT INTO prereq_group_members (group_id, prerequisite_id)
      VALUES ($1, $2), ($1, $3)
    `,
      [groupAId, courseIdMap["CS310001"], courseIdMap["CS100004"]]
    );

    // Group B
    const groupB = await client.query(
      `
      INSERT INTO prereq_groups (course_id)
      VALUES ($1) RETURNING id
    `,
      [courseIdMap["CS310002"]]
    );
    const groupBId = groupB.rows[0].id;

    await client.query(
      `
      INSERT INTO prereq_group_members (group_id, prerequisite_id)
      VALUES ($1, $2)
    `,
      [groupBId, courseIdMap["CS580020"]]
    );

    const calcGroup = await client.query(
      `
      INSERT INTO prereq_groups (course_id)
      VALUES ($1) RETURNING id
    `,
      [courseIdMap["MA400021"]] // AP Calculus AB
    );
    const calcGroupId = calcGroup.rows[0].id;

    // Add "Intro to Statistics" as the only member of that group
    await client.query(
      `
      INSERT INTO prereq_group_members (group_id, prerequisite_id)
      VALUES ($1, $2)
    `,
      [calcGroupId, courseIdMap["MA305001"]] // Intro to Statistics
    );

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

module.exports = { pool, initDB, migration };
