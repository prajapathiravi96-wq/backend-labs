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

    // Seed 10 rows only when table is empty
    const { count } = await db.get('SELECT COUNT(*) AS count FROM book');
    if (count === 0) {
      await db.run(`
        INSERT INTO book (title, author, price, pages) VALUES
          ('The Pragmatic Programmer',     'David Thomas',          4000, 352),
          ('Clean Code',                   'Robert C. Martin',      3500, 464),
          ('You Don''t Know JS',           'Kyle Simpson',          2500, 278),
          ('Eloquent JavaScript',          'Marijn Haverbeke',      2000, 472),
          ('Node.js Design Patterns',      'Mario Casciaro',        4500, 660),
          ('Learning SQL',                 'Alan Beaulieu',         3000, 388),
          ('Database Internals',           'Alex Petrov',           5000, 372),
          ('Designing Data-Intensive Apps','Martin Kleppmann',      5500, 616),
          ('HTTP: The Definitive Guide',   'David Gourley',         3200, 656),
          ('RESTful Web APIs',             'Leonard Richardson',     2800, 408)
      `);
      console.log('✅  Database seeded with 10 books.');
    }

    const PORT = process.env.PORT || 3002;
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
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} → ${res.statusCode}`);
    return originalSend(body);
  };
  next();
});

// ─── GET /books - Search, Filter, Sort, Paginate ─────────────────────────────
// Supports query params:
//   - search_q: partial title match (LIKE) [default: ""]
//   - order_by: column to order by (id, title, author, price, pages) [default: "id"]
//   - order: sort direction (ASC, DESC) [default: "ASC"]
//   - limit: max number of books [default: 10]
//   - offset: pagination offset [default: 0]
//   - min_price & max_price: price range filter
const handleGetBooks = async (req, res) => {
  try {
    const {
      search_q = '',
      order_by = 'id',
      order = 'ASC',
      limit = '10',
      offset = '0',
      min_price,
      max_price,
    } = req.query;

    // Whitelist allowed sort columns and sort orders to prevent SQL injection
    const allowedColumns = ['id', 'title', 'author', 'price', 'pages'];
    const safeOrderBy = allowedColumns.includes(order_by.toLowerCase())
      ? order_by.toLowerCase()
      : 'id';

    const safeOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Parse and validate pagination
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      return res.status(400).json({ message: 'limit must be a positive integer' });
    }
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({ message: 'offset must be a non-negative integer' });
    }

    // Build parameterized query dynamically
    const conditions = [];
    const params = [];

    // Title search using LIKE
    if (search_q.trim() !== '') {
      conditions.push('title LIKE ?');
      params.push(`%${search_q.trim()}%`);
    }

    // Price range filters
    if (min_price !== undefined && max_price !== undefined) {
      const min = Number(min_price);
      const max = Number(max_price);
      if (isNaN(min) || isNaN(max)) {
        return res.status(400).json({ message: 'min_price and max_price must be valid numbers' });
      }
      conditions.push('price BETWEEN ? AND ?');
      params.push(min, max);
    } else if (min_price !== undefined) {
      const min = Number(min_price);
      if (isNaN(min)) {
        return res.status(400).json({ message: 'min_price must be a valid number' });
      }
      conditions.push('price >= ?');
      params.push(min);
    } else if (max_price !== undefined) {
      const max = Number(max_price);
      if (isNaN(max)) {
        return res.status(400).json({ message: 'max_price must be a valid number' });
      }
      conditions.push('price <= ?');
      params.push(max);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `
      SELECT * FROM book
      ${whereClause}
      ORDER BY ${safeOrderBy} ${safeOrder}
      LIMIT ? OFFSET ?
    `;
    params.push(parsedLimit, parsedOffset);

    const books = await db.all(query, params);
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

app.get('/books', handleGetBooks);
app.get('/books/', handleGetBooks);

// ─── GET /books/:bookId - Retrieve Single Book ───────────────────────────────
const handleGetSingleBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const book = await db.get('SELECT * FROM book WHERE id = ?', [bookId]);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.status(200).json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

app.get('/books/:bookId', handleGetSingleBook);
app.get('/books/:bookId/', handleGetSingleBook);

// ─── POST /books - Create a New Book with Validation ─────────────────────────
const handleCreateBook = async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;

    // Validate required fields
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ message: 'title is required and must be a non-empty string' });
    }
    if (!author || typeof author !== 'string' || author.trim() === '') {
      return res.status(400).json({ message: 'author is required and must be a non-empty string' });
    }
    if (price === undefined || typeof price !== 'number' || isNaN(price) || price < 0) {
      return res.status(400).json({ message: 'price is required and must be a non-negative number' });
    }
    if (pages === undefined || typeof pages !== 'number' || isNaN(pages) || pages < 1) {
      return res.status(400).json({ message: 'pages is required and must be a positive integer' });
    }

    const result = await db.run(
      'INSERT INTO book (title, author, price, pages) VALUES (?, ?, ?, ?)',
      [title.trim(), author.trim(), price, Math.floor(pages)]
    );

    res.status(201).json({
      id: result.lastID,
      message: 'Book created successfully',
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

app.post('/books', handleCreateBook);
app.post('/books/', handleCreateBook);

// ─── PUT /books/:bookId - Update a Book ──────────────────────────────────────
const handleUpdateBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const existing = await db.get('SELECT * FROM book WHERE id = ?', [bookId]);
    if (!existing) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const { title, author, price, pages } = req.body;

    // Validation for any provided fields
    if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
      return res.status(400).json({ message: 'title must be a non-empty string' });
    }
    if (author !== undefined && (typeof author !== 'string' || author.trim() === '')) {
      return res.status(400).json({ message: 'author must be a non-empty string' });
    }
    if (price !== undefined && (typeof price !== 'number' || isNaN(price) || price < 0)) {
      return res.status(400).json({ message: 'price must be a non-negative number' });
    }
    if (pages !== undefined && (typeof pages !== 'number' || isNaN(pages) || pages < 1)) {
      return res.status(400).json({ message: 'pages must be a positive integer' });
    }

    const updatedTitle = title !== undefined ? title.trim() : existing.title;
    const updatedAuthor = author !== undefined ? author.trim() : existing.author;
    const updatedPrice = price !== undefined ? price : existing.price;
    const updatedPages = pages !== undefined ? Math.floor(pages) : existing.pages;

    await db.run(
      'UPDATE book SET title = ?, author = ?, price = ?, pages = ? WHERE id = ?',
      [updatedTitle, updatedAuthor, updatedPrice, updatedPages, bookId]
    );

    res.status(200).json({ message: 'Book updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

app.put('/books/:bookId', handleUpdateBook);
app.put('/books/:bookId/', handleUpdateBook);

// ─── DELETE /books/:bookId - Remove a Book ───────────────────────────────────
const handleDeleteBook = async (req, res) => {
  try {
    const { bookId } = req.params;
    const existing = await db.get('SELECT * FROM book WHERE id = ?', [bookId]);
    if (!existing) {
      return res.status(404).json({ message: 'Book not found' });
    }

    await db.run('DELETE FROM book WHERE id = ?', [bookId]);
    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

app.delete('/books/:bookId', handleDeleteBook);
app.delete('/books/:bookId/', handleDeleteBook);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    message: `The path '${req.path}' does not exist on this server.`,
  });
});

// ─── Boot ─────────────────────────────────────────────────────────────────────
initializeDBAndServer();
