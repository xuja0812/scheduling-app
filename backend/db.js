const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const initDB = () => {
  db.serialize(() => {
    // users
    db.run(`CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      google_id TEXT UNIQUE NOT NULL,
      name TEXT,
      email TEXT,
      role TEXT CHECK(role IN ('student', 'admin')) NOT NULL DEFAULT 'student'
    )`);

    const users = [
      ['google-id-1', 'Alice Admin', 'alice@school.edu', 'admin'],
      ['google-id-2', 'Bob Student', 'bob@school.edu', 'student']
    ];

    const userStmt = db.prepare(`INSERT INTO users (google_id, name, email, role) VALUES (?, ?, ?, ?)`);
    for (const u of users) userStmt.run(...u);
    userStmt.finalize();

    // classes
    db.run(`CREATE TABLE classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT,
      name TEXT,
      subject TEXT,
      track_level TEXT,
      credits INTEGER
    )`);

    const classes = [
      ['ENG101', 'English I', 'English', 'regular', 1],
      ['ENG201', 'English II', 'English', 'advanced', 1],
      ['MATH101', 'Algebra I', 'Math', 'regular', 1],
      ['MATH201', 'Geometry', 'Math', 'advanced', 1],
      ['SCI101', 'Biology', 'Science', 'regular', 1],
      ['SCI201', 'Chemistry', 'Science', 'advanced', 1],
    ];

    const stmt = db.prepare("INSERT INTO classes (code, name, subject, track_level, credits) VALUES (?, ?, ?, ?, ?)");
    for (const c of classes) stmt.run(...c);
    stmt.finalize();

    // tracks (not using anymore)
    db.run(`CREATE TABLE track_requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      subject TEXT,
      track_level TEXT,
      required_class_code TEXT
    )`);

    const trackReqs = [
      ['English', 'regular', 'ENG101'],
      ['English', 'advanced', 'ENG201'],
      ['Math', 'regular', 'MATH101'],
      ['Math', 'advanced', 'MATH201'],
      ['Science', 'regular', 'SCI101'],
      ['Science', 'advanced', 'SCI201'],
    ];

    const trStmt = db.prepare("INSERT INTO track_requirements (subject, track_level, required_class_code) VALUES (?, ?, ?)");
    for (const tr of trackReqs) trStmt.run(...tr);
    trStmt.finalize();

    // grades
    db.run(`CREATE TABLE grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_code TEXT,
      grade TEXT,
      weighted BOOLEAN
    )`);

    // plans
    db.run(`CREATE TABLE plans (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // plan courses
    db.run(`CREATE TABLE plan_courses (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      class_code TEXT NOT NULL,
      year TEXT NOT NULL,
      semester TEXT NOT NULL,
      FOREIGN KEY(plan_id) REFERENCES plans(id)
    )`);

    // comments
    db.run(`CREATE TABLE comments (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(plan_id) REFERENCES plans(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);
  });
};

module.exports = { db, initDB };
