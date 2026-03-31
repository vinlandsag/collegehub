const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/status', (req, res) => res.json({ status: 'ok', version: '0.1.0' }));

app.get('/api/events', (req, res) => {
  const filterType = req.query.type;
  let sql = 'SELECT e.*, c.name AS college_name, c.district FROM events e JOIN colleges c ON e.host_college_id = c.id';

  if (filterType) sql += ' WHERE e.type = @filterType';
  const rows = db.prepare(sql).all({ filterType });
  res.json(rows);
});

app.get('/api/events/:id', (req, res) => {
  const event = db.prepare('SELECT e.*, c.name AS college_name, c.district FROM events e JOIN colleges c ON e.host_college_id = c.id WHERE e.id = ?').get(req.params.id);
  if (!event) return res.status(404).json({ message: 'Event not found' });
  res.json(event);
});

app.post('/api/register', (req, res) => {
  const { name, email, phone, college } = req.body;
  if (!name || !email || !phone || !college) return res.status(400).json({ message: 'Missing fields' });

  let collegeRow = db.prepare('SELECT * FROM colleges WHERE name = ?').get(college);
  if (!collegeRow) {
    const insertCollege = db.prepare('INSERT INTO colleges (name) VALUES (?)');
    const info = insertCollege.run(college);
    collegeRow = { id: info.lastInsertRowid, name: college };
  }

  const exists = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ message: 'Already registered' });

  const insertUser = db.prepare('INSERT INTO users (name, email, phone, college_id) VALUES (?, ?, ?, ?)');
  const userInfo = insertUser.run(name, email, phone, collegeRow.id);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userInfo.lastInsertRowid);
  res.json({ user, message: 'Registered successfully' });
});

app.post('/api/login', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const user = db.prepare('SELECT u.id, u.name, u.email, u.phone, c.name as college FROM users u JOIN colleges c ON u.college_id = c.id WHERE u.email = ?').get(email);
  if (!user) return res.status(404).json({ message: 'User not found' });

  res.json({ user, message: 'Login successful' });
});

app.post('/api/event-registration', (req, res) => {
  const { userId, eventId } = req.body;
  if (!userId || !eventId) return res.status(400).json({ message: 'Missing fields' });

  const exists = db.prepare('SELECT * FROM registrations WHERE user_id = ? AND event_id = ?').get(userId, eventId);
  if (exists) return res.status(409).json({ message: 'Already registered for this event' });

  const insert = db.prepare('INSERT INTO registrations (user_id, event_id) VALUES (?, ?)');
  const info = insert.run(userId, eventId);

  const registration = db.prepare('SELECT * FROM registrations WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(registration);
});

app.get('/api/my-events/:userId', (req, res) => {
  const events = db.prepare('SELECT ev.*, r.status, r.registered_at FROM registrations r JOIN events ev ON r.event_id = ev.id WHERE r.user_id = ?').all(req.params.userId);
  res.json(events);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Backend API running on http://localhost:${PORT}`));
