import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
const PORT = 3001;

// 1. Allow connection from ANYWHERE (Fixes connection issues)
app.use(cors({ origin: '*' }));

// 2. Handle large file uploads (for images/PDFs stored as base64)
app.use(express.json({ limit: '50mb' }));

// 3. Log every request to the console (For debugging)
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

// Database Setup
let db;
(async () => {
  try {
    // Open (or create) the database file
    db = await open({
      filename: './study.db',
      driver: sqlite3.Database
    });

    // Create the table if it doesn't exist
    await db.exec(`
      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        lessons TEXT
      )
    `);
    console.log('✅ Connected to SQLite database: study.db');
  } catch (error) {
    console.error('❌ Database failed to start:', error);
  }
})();

// --- API Routes ---

// GET: Fetch all courses
app.get('/courses', async (req, res) => {
  try {
    const courses = await db.all('SELECT * FROM courses');
    // Parse the 'lessons' JSON string back into an array
    const parsedCourses = courses.map(c => ({
      ...c,
      lessons: JSON.parse(c.lessons || '[]')
    }));
    res.json(parsedCourses);
  } catch (err) {
    console.error("GET Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST: Create a new course
app.post('/courses', async (req, res) => {
  try {
    const { id, title, description, lessons } = req.body;
    await db.run(
      'INSERT INTO courses (id, title, description, lessons) VALUES (?, ?, ?, ?)',
      id, title, description, JSON.stringify(lessons || [])
    );
    console.log(`Created course: ${title}`);
    res.status(201).json({ success: true });
  } catch (err) {
    console.error("POST Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH: Update a course (including adding lessons)
app.patch('/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Get current data first
    const current = await db.get('SELECT * FROM courses WHERE id = ?', id);
    if (!current) return res.status(404).json({ error: 'Course not found' });

    const currentLessons = JSON.parse(current.lessons || '[]');
    
    // Determine new values (use existing if not provided in update)
    const newTitle = updates.title !== undefined ? updates.title : current.title;
    const newDesc = updates.description !== undefined ? updates.description : current.description;
    const newLessons = updates.lessons !== undefined ? updates.lessons : currentLessons;

    await db.run(
      'UPDATE courses SET title = ?, description = ?, lessons = ? WHERE id = ?',
      newTitle, newDesc, JSON.stringify(newLessons), id
    );
    console.log(`Updated course: ${id}`);
    res.json({ success: true });
  } catch (err) {
    console.error("PATCH Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE: Remove a course
app.delete('/courses/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM courses WHERE id = ?', req.params.id);
    console.log(`Deleted course: ${req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`
  🚀 SERVER RUNNING!
  ---------------------------------------
  📡 Listening on: http://localhost:${PORT}
  📁 Database:     study.db
  ---------------------------------------
  `);
});