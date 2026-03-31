const path = require('path');
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, 'kerala-events.db');
const db = new Database(dbPath);

function migrate() {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS colleges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      district TEXT,
      latitude REAL,
      longitude REAL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      college_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(college_id) REFERENCES colleges(id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      date TEXT NOT NULL,
      host_college_id INTEGER NOT NULL,
      registration_link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(host_college_id) REFERENCES colleges(id)
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      event_id INTEGER NOT NULL,
      registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'confirmed',
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(event_id) REFERENCES events(id)
    );
  `);

  const collegeCount = db.prepare('SELECT COUNT(*) AS c FROM colleges').get().c;
  if (collegeCount === 0) {
    const insertCollege = db.prepare('INSERT INTO colleges (name, district, latitude, longitude) VALUES (?, ?, ?, ?)');
    insertCollege.run('College of Engineering Trivandrum', 'Thiruvananthapuram', 8.5276, 76.9366);
    insertCollege.run('Government Engineering College Thrissur', 'Thrissur', 10.5211, 76.2239);
    insertCollege.run('Rajagiri School of Engineering & Technology', 'Ernakulam', 10.0043, 76.3165);
  }

  const eventCount = db.prepare('SELECT COUNT(*) AS c FROM events').get().c;
  if (eventCount === 0) {
    const insertEvent = db.prepare('INSERT INTO events (title, type, description, date, host_college_id, registration_link) VALUES (?, ?, ?, ?, ?, ?)');
    insertEvent.run('Code Wars 2.0', 'hackathon', 'A 24-hour coding event.', '2024-08-25', 1, 'https://example.com/register-codewars');
    insertEvent.run('AI/ML Bootcamp', 'workshop', 'A beginner-friendly ML workshop.', '2024-09-02', 3, 'https://example.com/register-aiml');
    insertEvent.run('Flutter Fest', 'workshop', 'Build cross-platform apps with Flutter.', '2024-08-30', 1, 'https://example.com/register-flutter');
  }
}

migrate();

module.exports = db;
