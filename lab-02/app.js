const express = require('express');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');
const path = require('path');

const app = express();
app.use(express.json());

const DB_PATH = path.join(__dirname, 'books.db');
let db;

// ─── Initialize DB and Start Server ──────────────────────────────────────────
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database,
    });

    // Create table if it doesn't already exist
    await db.run(`
      CREATE TABLE IF NOT EXISTS book (
        id     INTEGER PRIMARY KEY AUTOINCREMENT,
        title  TEXT    NOT NULL,
        author TEXT    NOT NULL,
        price  INTEGER NOT NULL,
        pages  INTEGER NOT NULL
      )
    `);

    // Seed 10 rows only when the table is empty
    const { count } = await db.get('SELECT COUNT(*) AS count FROM book');
    if (count === 0) {
      await db.run(`
        INSERT INTO book (title, author, price, pages) VALUES
          ('The Pragmatic Programmer',    'David Thomas',          4000, 352),
          ('Clean Code',                  'Robert C. Martin',      3500, 464),
          ('You Don''t Know JS',          'Kyle Simpson',          2500, 278),
          ('Eloquent JavaScript',         'Marijn Haverbeke',      2000, 472),
          ('Node.js Design Patterns',     'Mario Casciaro',        4500, 660),
          ('Learning SQL',                'Alan Beaulieu',         3000, 388),
          ('Database Internals',          'Alex Petrov',           5000, 372),
          ('Designing Data-Intensive Apps','Martin Kleppmann',     5500, 616),
          ('HTTP: The Definitive Guide',  'David Gourley',         3200, 656),
          ('RESTful Web APIs',            'Leonard Richardson',    2800, 408)
      `);
      console.log('✅  Database seeded with 10 books.');
    }

    const PORT = process.env.PORT || 3001;
    const host = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    app.listen(PORT, () => {
      console.log(`✅  Server running on ${host}`);
    });
  } catch (err) {
    console.error('❌  DB init error:', err.message);
    process.exit(1);
  }
};

// ─── Request Logger ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const originalSend = res.send.bind(res);
  res.send = function (body) {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} → ${res.statusCode}`
    );
    return originalSend(body);
  };
  next();
});

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /books/  →  Return all books
app.get('/books/', async (req, res) => {
  try {
    const books = await db.all('SELECT * FROM book ORDER BY id');
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /books/:bookId/  →  Return a single book
app.get('/books/:bookId/', async (req, res) => {
  try {
    const book = await db.get(
      'SELECT * FROM book WHERE id = ?',
      [req.params.bookId]
    );
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.status(200).json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /books/  →  Add a new book
app.post('/books/', async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;
    if (!title || !author || price === undefined || pages === undefined) {
      return res
        .status(400)
        .json({ error: 'title, author, price and pages are required' });
    }
    const result = await db.run(
      'INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)',
      [title, author, price, pages]
    );
    res.status(201).json({ id: result.lastID, message: 'Book added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /books/:bookId/  →  Update a book
app.put('/books/:bookId/', async (req, res) => {
  try {
    const existing = await db.get(
      'SELECT * FROM book WHERE id = ?',
      [req.params.bookId]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Book not found' });
    }
    const {
      title  = existing.title,
      author = existing.author,
      price  = existing.price,
      pages  = existing.pages,
    } = req.body;

    await db.run(
      'UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?',
      [title, author, price, pages, req.params.bookId]
    );
    res.status(200).json({ message: 'Book updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /books/:bookId/  →  Remove a book
app.delete('/books/:bookId/', async (req, res) => {
  try {
    const existing = await db.get(
      'SELECT * FROM book WHERE id = ?',
      [req.params.bookId]
    );
    if (!existing) {
      return res.status(404).json({ error: 'Book not found' });
    }
    await db.run('DELETE FROM book WHERE id = ?', [req.params.bookId]);
    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    error: 'Not Found',
    message: `The path '${req.path}' does not exist on this server.`,
  });
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
initializeDBAndServer();

